const { execSync } = require('child_process');
const pdfParse = require('pdf-parse');
const pdfjsLib = require('pdfjs-dist');
const mammoth = require('mammoth');
const WordExtractor = require('word-extractor');
const { createWorker } = require('tesseract.js');
const { fromPath } = require('pdf2pic');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Check for GraphicsMagick/ImageMagick (required by pdf2pic OCR fallback)
try {
  execSync('gm version', { stdio: 'ignore' });
  console.log('[PDF-LIBRARY] GraphicsMagick detected - OCR fallback available');
} catch {
  try {
    execSync('convert --version', { stdio: 'ignore' });
    console.log('[PDF-LIBRARY] ImageMagick detected - OCR fallback available');
  } catch {
    console.warn('[PDF-LIBRARY] WARNING: Neither GraphicsMagick nor ImageMagick found. PDF OCR fallback (pdf2pic) will fail on image-based PDFs. Install GraphicsMagick or use a Docker buildpack that includes it.');
  }
}

// --- Debug logging configuration ---
// Set DEBUG_PDF_EXTRACTION=1 in environment to enable verbose PDF extraction logging
const DEBUG_PDF = process.env.DEBUG_PDF_EXTRACTION === '1' || process.env.DEBUG_PDF_EXTRACTION === 'true';

const logDebug = (...args) => {
  if (DEBUG_PDF) {
    console.log('[PDF-DEBUG]', ...args);
  }
};

// Log which PDF libraries are available and their versions
const PDF_LIBRARY_INFO = {
  'pdfjs-dist': (() => { try { return require('pdfjs-dist/package.json').version; } catch { return 'unknown'; } })(),
  'pdf-parse': (() => { try { return require('pdf-parse/package.json').version; } catch { return 'unknown'; } })(),
  'pdf2pic': (() => { try { return require('pdf2pic/package.json').version; } catch { return 'unknown'; } })(),
  'tesseract.js': (() => { try { return require('tesseract.js/package.json').version; } catch { return 'unknown'; } })(),
};

console.log('[PDF-LIBRARY] Available PDF libraries and versions:', PDF_LIBRARY_INFO);

// Minimum text length threshold for valid extraction (reduced from 100 to handle short but valid resumes)
const MIN_TEXT_LENGTH = 50;

exports.analyzeResume = (text, roleRequirements = null) => {
  const lower = text.toLowerCase();

  let contact_structure = 0;
  const hasEmail = /[\w.-]+@[\w.-]+\.\w{2,3}/.test(text);
  const hasPhone = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(text);
  const hasLinkedInOrGithub = /linkedin\.com|github\.com/.test(lower);
  const hasEducation = /\b(education|academic\s*background|educational\s*qualification|qualification|b\.?tech|b\.?e\.|bachelor|m\.?tech|m\.?e\.|master|ph\.?d|be\s|btech)\b/i.test(text);
  const hasExperience = /\b(work\s*experience|professional\s*experience|internship\s*experience|experience|employment\s*history|work\s*history)\b/i.test(text);
  const hasProjects = /\b(projects?)\b/i.test(text);
  const hasSkills = /\b(skills?|technical\s*skills|technologies)\b/i.test(text);

  if (hasEmail) contact_structure += 2;
  if (hasPhone) contact_structure += 2;
  if (hasLinkedInOrGithub) contact_structure += 2;
  let sectionsFound = 0;
  if (hasEducation) sectionsFound++;
  if (hasExperience) sectionsFound++;
  if (hasProjects) sectionsFound++;
  if (hasSkills) sectionsFound++;
  contact_structure += Math.min(sectionsFound, 4);

  let experience = 0;
  const dates = text.match(/\b(20\d{2})\b/g) || [];
  const hasCompanyName = /at\s+[A-Z][A-Za-z\s.]+|company|inc\.?|technologies|ltd\.?|pvt\.?|private\s+limited/i.test(text);
  const hasRoleTitle = /\b(software engineer|intern|developer|analyst|trainee|associate|engineer|sde|full.?stack)\b/i.test(text);
  const hasBullets = /[•●\u2022\u2023\u25CF\u25E6\u2043\u2219\u25D8\u25D9\-*]\s*.+/.test(text);
  const hasExpSection = /\b(work\s*experience|professional\s*experience|internship\s*experience|experience|employment\s*history|work\s*history)\b/i.test(text);

  // If experience section header exists, give at least a base score
  if (hasExpSection) {
    experience += 5; // Base score for having the section
  }

  // Bonus for having company + role + dates + bullets (full entry structure)
  if (hasCompanyName && dates.length >= 1 && hasRoleTitle && hasBullets) {
    const entries = text.split(/[•●]/).filter(block => {
      const b = block.toLowerCase();
      return (b.includes('at ') || b.includes('intern') || b.includes('engineer') || b.includes('developer')) &&
             /\b(20\d{2})\b/.test(block) &&
             b.includes('|');
    });
    const entryCount = Math.min(entries.length, 2);
    experience += entryCount * 5;

    const bulletLines = text.split('\n').filter(line => /^[•●\u2022\u2023\u25CF\u25E6\u2043\u2219\u25D8\u25D9\-*\s]+/.test(line.trim()));
    let qualityScore = 0;
    const actionVerbs = /\b(developed|designed|built|implemented|created|optimized|improved|reduced|led|managed|architected|engineered|deployed|integrated|automated|scaled|migrated)\b/i;
    const techMention = /\b(react|node|python|java|javascript|typescript|mongodb|sql|aws|docker|kubernetes|api|git|redux|css|html|django|flask|spring)\b/i;
    const outcomeMention = /\b(increased|decreased|reduced|improved|achieved|resulted|saved|boosted|enhanced|delivered)\b/i;

    for (const line of bulletLines) {
      const l = line.toLowerCase();
      if (actionVerbs.test(l) && techMention.test(l) && outcomeMention.test(l)) {
        qualityScore += 3;
      } else if (actionVerbs.test(l) && techMention.test(l)) {
        qualityScore += 2;
      } else if (actionVerbs.test(l)) {
        qualityScore += 1;
      }
    }
    experience += Math.min(qualityScore, 10);
  } else if (hasExpSection) {
    // Section exists but entry structure not fully parsed - give partial credit
    // Check for action verbs anywhere in the text as a quality signal
    const actionVerbs = /\b(developed|designed|built|implemented|created|optimized|improved|reduced|led|managed|architected|engineered|deployed|integrated|automated|scaled|migrated)\b/gi;
    const actionMatches = text.match(actionVerbs);
    if (actionMatches) {
      experience += Math.min(actionMatches.length, 5);
    }
  }

  let projects = 0;
  const projectSection = text.split(/\bprojects?\b/i)[1] || '';
  const projectBlocks = projectSection.split(/\n\s*\n/).filter(b => b.trim().length > 20);
  const projectTitles = (projectSection.match(/\b([A-Z][A-Za-z0-9\s]+)\b(?=.*?used|.*?built|.*?developed|.*?created)/gi)) || [];
  let projectCount = Math.max(projectTitles.length, projectBlocks.length > 3 ? projectBlocks.length : 0);
  if (projectCount === 0) {
    const lines = projectSection.split('\n').filter(l => l.trim().length > 10 && l.trim().length < 80);
    projectCount = Math.min(lines.length, 5);
  }
  projectCount = Math.min(projectCount, 5);
  if (projectCount === 0) projects = 0;
  else if (projectCount === 1) projects = 8;
  else if (projectCount === 2) projects = 15;
  else if (projectCount >= 3) projects = 25;

  const hasProjectLinks = /github\.com\/(?!linkedin)|vercel\.com|netlify\.app|herokuapp|firebaseapp|gitlab/i.test(lower);
  if (!hasProjectLinks && projects > 0) projects = Math.max(projects - 5, 0);
  const hasTechStack = projectSection.match(/\b(react|node|python|java|javascript|typescript|mongodb|sql|aws|docker|kubernetes|api|git|redux|css|html|django|flask|spring|express|angular|vue)\b/i);
  if (!hasTechStack && projects > 0) projects = Math.max(projects - 5, 0);

  let technical_skills = 0;
  const technologies = new Set();
  const techKeywords = [
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin',
    'react', 'angular', 'vue', 'node', 'express', 'django', 'flask', 'spring', 'next', 'nuxt', 'svelte',
    'mongodb', 'postgresql', 'mysql', 'sqlite', 'redis', 'elasticsearch', 'firebase', 'supabase',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'terraform', 'ansible',
    'git', 'github', 'gitlab', 'jira', 'confluence',
    'html', 'css', 'sass', 'tailwind', 'bootstrap', 'material-ui', 'chakra',
    'redux', 'graphql', 'rest', 'api', 'websocket', 'grpc',
    'tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy', 'opencv',
    'linux', 'bash', 'powershell', 'nginx', 'apache', 'rabbitmq', 'kafka',
    'jest', 'mocha', 'cypress', 'selenium', 'junit', 'pytest',
  ];
  for (const tech of techKeywords) {
    const regex = new RegExp(`\\b${tech.replace(/[+#.]/g, '\\$&')}\\b`, 'i');
    if (regex.test(text)) technologies.add(tech);
  }
  technical_skills += Math.min(technologies.size, 15);
  const hasCategories = /(languages?|programming\s*languages?):.*[\s\S]{0,100}(frameworks?|libraries?|tools?|technologies?|databases?|platforms?)/i.test(text);
  if (hasCategories) technical_skills += 5;

  let achievements = 0;
  const numberPatterns = [
    /\b\d{2,3}\s*\+?\s*(problems?|questions?|challenges?|tasks?|projects?)/gi,
    /\b\d{2,3}\s*\+?\s*(students?|users?|customers?|clients?|members?)/gi,
    /\b\d{2}%|\d{3}\s*%|\d+[\.\d]*\s*(percent|%|x|times?)/gi,
    /\b(reduced|decreased|improved|increased|boosted|optimized)\s+(by\s+)?\d+/gi,
    /\b\d{2,3}\s*\+?\s*(lines?|files?|pages?|documents?)/gi,
    /\b\d[\.\d]*(x|X)\b/gi,
    /\$[\d,]+(k|K|M|m|B|b)?/g,
    /\b\d{2,3}\s*\+?\s*(stars?|forks?|contributions?|commits?|prs?|pull\s*requests?)/gi,
  ];
  const foundNumbers = new Set();
  for (const pattern of numberPatterns) {
    const matches = text.match(pattern);
    if (matches) matches.forEach(m => foundNumbers.add(m.trim()));
  }
  const numAchievements = foundNumbers.size;
  if (numAchievements === 0) achievements = 0;
  else if (numAchievements <= 2) achievements = 5;
  else achievements = 10;

  let education = 0;
  const hasCGPA = /(cgpa|gpa|percentage|aggregate|score)\s*[:]?\s*\d+[\.\d]*/i.test(text);
  const hasDegree = /\b(b\.?tech|b\.?e\.|m\.?tech|m\.?e\.|bachelor|master|ph\.?d|bca|mca|bsc|msc|bcs|mcs|be\s|me\s|b\.?com|m\.?com)\b/i.test(text);
  const hasInstitution = /\b(university|college|institute|iit|nit|iiit|bits|vit|srm|amity|vtu|jntu|pune|delhi|mumbai|kolkata)\b/i.test(lower);
  const hasGradYear = /\b(20\d{2})\b/.test(text);
  if (hasCGPA) education += 5;
  if (hasDegree && hasInstitution && hasGradYear) education += 5;
  else if (hasDegree && hasInstitution) education += 3;
  else if (hasDegree) education += 2;

  let keyword_density = 0;
  let role_fit = null;
  let missingSkills = [];
  let matchedSkills = [];
  let totalRequired = 0;
  if (roleRequirements) {
    const roleKeywords = roleRequirements.keywords || [];
    let roleKwFound = 0;
    for (const kw of roleKeywords) {
      if (lower.includes(kw.toLowerCase())) {
        roleKwFound++;
      }
    }
    const roleKeywordDensity = roleKeywords.length > 0 ? Math.round((roleKwFound / roleKeywords.length) * 100) : 0;
    matchedSkills = [];
    if (roleRequirements.requiredSkills && roleRequirements.requiredSkills.length > 0) {
      for (const req of roleRequirements.requiredSkills) {
        const found = technologies.has(req.skill.toLowerCase()) || lower.includes(req.skill.toLowerCase());
        if (found) matchedSkills.push(req.skill);
        else missingSkills.push(req.skill);
      }
    }
    const matchedCount = matchedSkills.length;
    totalRequired = roleRequirements.requiredSkills?.length || 0;
    const roleFitScore = totalRequired > 0 ? Math.round((matchedCount / totalRequired) * 100) : 0;
    role_fit = {
      score: roleFitScore,
      matchedSkills,
      missingSkills,
      keywordDensity: roleKeywordDensity,
    };
  } else {
    const sdeKeywords = ['dsa', 'data structures', 'algorithm', 'oop', 'object-oriented', 'dbms', 'database management',
                          'os', 'operating system', 'computer networks', 'cn', 'system design', 'rest api', 'restful', 'git'];
    let kwFound = 0;
    for (const kw of sdeKeywords) {
      if (lower.includes(kw)) {
        kwFound++;
        if (kwFound >= 5) break;
      }
    }
    keyword_density = kwFound;
  }

  let total_score = contact_structure + experience + projects + technical_skills + achievements + education + keyword_density;
  if (roleRequirements && role_fit) {
    total_score = Math.round(total_score * 0.7 + role_fit.score * 0.3);
  }

  const improvements = [];
  if (roleRequirements && role_fit && missingSkills && missingSkills.length > 0) {
    improvements.push(`Add key missing skills for ${roleRequirements.role}: ${missingSkills.slice(0, 3).join(', ')}`);
  }
  if (experience === 0) {
    improvements.push('Add internship/work experience section with company name, dates, role, and bullet points describing your work');
  } else if (experience < 15) {
    improvements.push('Improve bullet points under experience: use action verbs (developed, designed, optimized), mention specific technologies, and imply measurable outcomes');
  }
  if (projects < 15) {
    improvements.push('Add 2-3 more projects with distinct tech stacks and include GitHub/live demo links');
  } else if (projects < 25) {
    if (!hasProjectLinks) improvements.push('Add GitHub or live deployment links to your projects');
    if (!hasTechStack) improvements.push('Explicitly list the tech stack (languages, frameworks, tools) used for each project');
  }
  if (technical_skills < 10) {
    improvements.push('Add more in-demand technical skills (e.g., React, Node.js, Python, MongoDB, Docker, AWS) organized into categories');
  }
  if (achievements === 0) {
    improvements.push('Add quantifiable achievements with numbers: e.g., "Solved 300+ problems", "Built an app used by 200+ users", "Improved performance by 50%"');
  }
  if (education < 8) {
    improvements.push('Ensure education section clearly lists degree, institution name, graduation year, and CGPA/percentage');
  }
  if (!hasLinkedInOrGithub) {
    improvements.push('Add LinkedIn and GitHub profile links in the contact section');
  }
  if (keyword_density < 3) {
    improvements.push('Include more SDE-relevant keywords: DSA, OOP, DBMS, OS, Computer Networks, System Design, REST API, Git');
  }
  while (improvements.length < 3) {
    improvements.push('Consider getting an internship or building more projects to strengthen your resume');
  }

  const response = {
    category_scores: {
      contact_structure: contact_structure,
      experience: experience,
      projects: projects,
      technical_skills: technical_skills,
      achievements: achievements,
      education: education,
      keyword_density: keyword_density,
    },
    total_score: total_score,
    reasoning: {
      contact_structure: hasEmail && hasPhone ? `Email found, phone found${hasLinkedInOrGithub ? ', LinkedIn/GitHub found' : ''}, ${sectionsFound}/4 sections present` :
                     `Email: ${hasEmail}, Phone: ${hasPhone}, LinkedIn/GitHub: ${hasLinkedInOrGithub}, Sections: ${sectionsFound}/4`,
      experience: experience === 0 ? 'No internship/work experience section with company + dates + role + bullets detected' :
                  hasCompanyName && dates.length >= 1 && hasRoleTitle && hasBullets
                    ? `Experience section found with entries. Base score ${Math.min(experience - (experience > 10 ? 10 : Math.min(experience - 5, 5)), 10)}/10 for entry structure, quality ${Math.min(experience - (experience > 10 ? 10 : experience > 5 ? experience - 5 : 0), 10)}/10 from bullet points`
                    : `Experience section header detected with action verbs suggesting work history, scored ${experience}/20`,
      projects: projectCount === 0 ? 'No projects section detected' :
                `${projectCount} project(s) identified${!hasProjectLinks ? ', missing GitHub/link' : ''}${!hasTechStack ? ', tech stack not explicitly listed' : ''}`,
      technical_skills: `${technologies.size} distinct technologies found${hasCategories ? ', grouped into categories' : ', not grouped into categories'}`,
      achievements: numAchievements === 0 ? 'No quantifiable achievements with numbers found' :
                    `${numAchievements} numeric achievement(s) found: ${Array.from(foundNumbers).slice(0, 3).join(', ')}`,
      education: hasCGPA && hasDegree ? `CGPA found, degree + institution found` :
               hasDegree ? 'Degree mentioned but CGPA or institution details may be missing' :
               'Education section missing or incomplete',
      keyword_density: `${keyword_density}/5 SDE keywords found`,
    },
    top_3_improvements: improvements.slice(0, 3),
  };

  if (roleRequirements && role_fit) {
    response.category_scores.role_fit = role_fit.score;
    response.reasoning.role_fit = `Matched ${matchedSkills.length}/${totalRequired} required skills (${role_fit.keywordDensity}% keyword coverage for ${roleRequirements.role})`;
    response.role_fit = role_fit;
  }

  return response;
};

const extractPdfText = async (fileBuffer, originalname = 'document.pdf') => {
  const MIN_CHARS = MIN_TEXT_LENGTH || 50;

  // Strategy 1: Try pdfjs-dist first (handles multi-column/resume-exported PDFs better than pdf-parse)
  try {
    const data = new Uint8Array(fileBuffer);
    const doc = await pdfjsLib.getDocument({
      data,
      useSystemFonts: true,
      cMapUrl: undefined,
      cMapPacked: false,
    }).promise;

    let pdfText = '';
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const pageContent = await page.getTextContent();
      const pageText = pageContent.items.map(item => item.str).join(' ');
      pdfText += pageText + '\n\n';
    }
    await doc.destroy();

    const trimmedText = pdfText.trim();
    logDebug(`pdfjs-dist extracted ${trimmedText.length} chars`);
    console.log(`[pdfjs-dist] extracted ${trimmedText.length} chars`);
    if (trimmedText.length >= MIN_CHARS) {
      if (DEBUG_PDF) console.log(`[PDF-DEBUG] pdfjs-dist SUCCEEDED`);
      return trimmedText;
    }
    if (trimmedText.length > 0) {
      console.log(`[pdfjs-dist] text too short (${trimmedText.length} chars), trying pdf-parse fallback...`);
    }
  } catch (pdfjsError) {
    console.log(`[pdfjs-dist] failed:`, pdfjsError.message);
  }

  // Strategy 2: Fallback to pdf-parse
  try {
    const data = await pdfParse(fileBuffer);
    const text = data.text || '';
    const trimmedText = text.trim();
    logDebug(`pdf-parse extracted ${trimmedText.length} chars`);
    console.log(`[pdf-parse] extracted ${trimmedText.length} chars`);
    if (trimmedText.length >= MIN_CHARS) {
      if (DEBUG_PDF) console.log(`[PDF-DEBUG] pdf-parse SUCCEEDED`);
      return trimmedText;
    }
    if (trimmedText.length > 0) {
      console.log(`[pdf-parse] text too short (${trimmedText.length} chars), trying OCR fallback...`);
    }
  } catch (pdfError) {
    console.log(`[pdf-parse] failed:`, pdfError.message);
  }

  // Strategy 3: Last resort — OCR (pdf2pic + tesseract.js)
  try {
    const tempPdfPath = path.join(os.tmpdir(), `temp_${Date.now()}.pdf`);
    fs.writeFileSync(tempPdfPath, fileBuffer);
    const converter = fromPath(tempPdfPath, { density: 200, format: 'png' });
    const images = await converter(1);
    if (images && images.length > 0) {
      const imageBuffer = fs.readFileSync(images[0].path);
      const worker = await createWorker('eng');
      const result = await worker.recognize(imageBuffer);
      await worker.terminate();
      if (tempPdfPath && fs.existsSync(tempPdfPath)) fs.unlinkSync(tempPdfPath);
      if (images[0].path && fs.existsSync(images[0].path)) fs.unlinkSync(images[0].path);
      const ocrText = (result.data.text || '').trim();
      logDebug(`OCR extracted ${ocrText.length} chars, confidence: ${result.data.confidence}%`);
      console.log(`[OCR] extracted ${ocrText.length} chars, confidence: ${result.data.confidence}%`);
      if (ocrText.length >= MIN_CHARS) {
        if (DEBUG_PDF) console.log(`[PDF-DEBUG] OCR SUCCEEDED`);
        return ocrText;
      }
      console.log(`[OCR] text too short (${ocrText.length} chars)`);
    }
  } catch (ocrError) {
    console.log(`[OCR] failed:`, ocrError.message);
  }

  if (DEBUG_PDF) console.log(`[PDF-DEBUG] PDF_EXTRACTION_FAILED`);
  throw new Error('PDF_EXTRACTION_FAILED');
};

exports.extractResumeText = async (fileBuffer, mimeType, originalname) => {
  const ext = (originalname || 'file').split('.').pop().toLowerCase();
  try {
    let text = '';
    if (ext === 'pdf') {
      text = await extractPdfText(fileBuffer, originalname);
    } else if (ext === 'docx') {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      text = result.value;
      console.log(`[DOCX] extracted ${text.length} chars`);
    } else if (ext === 'doc') {
      const extractor = new WordExtractor();
      const doc = await extractor.extractBuffer(fileBuffer);
      text = doc.getBody();
      console.log(`[DOC] extracted ${text.length} chars`);
    } else if (ext === 'txt') {
      text = fileBuffer.toString('utf-8');
      console.log(`[TXT] extracted ${text.length} chars`);
    } else if (['png', 'jpg', 'jpeg'].includes(ext)) {
      const worker = await createWorker('eng');
      const result = await worker.recognize(fileBuffer);
      await worker.terminate();
      text = result.data.text;
      console.log(`[OCR] extracted ${text.length} chars, confidence: ${result.data.confidence}%`);
    } else {
      throw new Error('UNSUPPORTED_FORMAT');
    }

    const trimmedText = text.trim();
    if (!trimmedText || trimmedText.length < MIN_TEXT_LENGTH) {
      console.log(`Extraction warning: text too short (${trimmedText.length} chars)`);
      throw new Error('PARSE_FAILURE');
    }
    return trimmedText;
  } catch (error) {
    if (error.message === 'PARSE_FAILURE' || error.message === 'UNSUPPORTED_FORMAT' || error.message === 'PDF_EXTRACTION_FAILED') {
      throw error;
    }
    throw new Error('PARSE_FAILURE');
  }
};
