
exports.analyzeResume = (text) => {
  const lower = text.toLowerCase();
  let contact_structure = 0;
  const hasEmail = /[\w.-]+@[\w.-]+\.\w{2,3}/.test(text);
  const hasPhone = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(text);
  const hasLinkedInOrGithub = /linkedin\.com|github\.com/.test(lower);
  const hasEducation = /\b(education|b\.?tech|b\.?e\.|bachelor|m\.?tech|m\.?e\.|master|ph\.?d|be\s|btech)\b/i.test(text);
  const hasExperience = /\b(experience|internship|work\s*history)\b/i.test(text);
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
  const datePattern = /\b(20\d{2})\b/g;
  const dates = text.match(datePattern) || [];
  const hasCompanyName = /at\s+[A-Z][A-Za-z\s.]+|company|inc\.?|technologies|ltd\.?|pvt\.?|private\s+limited/i.test(text);
  const hasRoleTitle = /\b(software engineer|intern|developer|analyst|trainee|associate|engineer|sde|full.?stack)\b/i.test(text);
  const hasBullets = /[•\-*]\s*.+/.test(text);
  if (hasCompanyName && dates.length >= 1 && hasRoleTitle && hasBullets) {
    const entries = text.split(/\n\s*\n/).filter(block => {
      const b = block.toLowerCase();
      return (b.includes('at ') || b.includes('intern') || b.includes('engineer')) &&
             /\b(20\d{2})\b/.test(block) &&
             b.includes('-') || b.includes('•') || b.includes('*');
    });
    const entryCount = Math.min(entries.length, 2);
    experience += entryCount * 5;
    const bulletLines = text.split('\n').filter(line => /^[•\-*\s]+/.test(line.trim()));
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
  }
  let projects = 0;
  const projectSection = text.split(/\bprojects?\b/i)[1] || '';
  const projectBlocks = projectSection.split(/\n\s*\n/).filter(b => b.trim().length > 20);
  let projectCount = 0;
  const projectTitles = (projectSection.match(/\b([A-Z][A-Za-z0-9\s]+)\b(?=.*?used|.*?built|.*?developed|.*?created)/gi)) || [];
  projectCount = Math.max(projectTitles.length, projectBlocks.length > 3 ? projectBlocks.length : 0);
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
    if (regex.test(text)) {
      technologies.add(tech);
    }
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
    if (matches) {
      matches.forEach(m => foundNumbers.add(m.trim()));
    }
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
  const total_score = contact_structure + experience + projects + technical_skills + achievements + education + keyword_density;
  const improvements = [];
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
  return {
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
                  `Found internship entries with company/dates/roles, bullet quality scored ${experience - (experience > 10 ? 10 : experience)}/10 entry pts`,
      projects: projectCount === 0 ? 'No projects section detected' :
                `${projectCount} project(s) identified${!hasProjectLinks ? ', missing GitHub/link' : ''}${!hasTechStack ? ', tech stack not explicitly listed' : ''}`,
      technical_skills: `${technologies.size} distinct technologies found${hasCategories ? ', grouped into categories' : ', not grouped into categories'}`,
      achievements: numAchievements === 0 ? 'No quantifiable achievements with numbers found' :
                    `${numAchievements} numeric achievement(s) found: ${Array.from(foundNumbers).slice(0, 3).join(', ')}`,
      education: hasCGPA && hasDegree ? `CGPA found, degree + institution found` :
                 hasDegree ? 'Degree mentioned but CGPA or institution details may be missing' :
                 'Education section missing or incomplete',
      keyword_density: `${kwFound}/5 SDE keywords found: ${sdeKeywords.filter(k => lower.includes(k)).slice(0, 5).join(', ') || 'none'}`,
    },
    top_3_improvements: improvements.slice(0, 3),
  };
};
exports.parseResumeText = (fileBuffer, mimeType) => {
  if (mimeType === 'application/pdf') {
    const text = fileBuffer.toString('utf8')
      .replace(/\\n/g, ' ')
      .replace(/\\r/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return text;
  }
  return fileBuffer.toString('utf8');
};