exports.evaluateResume = (text, selectedRole = null) => {
  const role = selectedRole || 'General Software Engineer';
  const lower = text.toLowerCase();

  let contact_structure = 0;
  const contactReasoning = [];

  const nameMatch = text.match(/^([A-Z][A-Z\s.]+)/m);
  const hasName = nameMatch !== null && nameMatch[1].trim().length > 5;
  if (hasName) {
    contact_structure += 2;
    contactReasoning.push(`Name found: "${nameMatch[1].trim()}"`);
  } else {
    contactReasoning.push('Name not clearly found at top of resume');
  }

  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w{2,3}/);
  const hasEmail = emailMatch !== null;
  if (hasEmail) {
    contact_structure += 2;
    contactReasoning.push(`Email found: "${emailMatch[0]}"`);
  } else {
    contactReasoning.push('Email not found');
  }

  const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const hasPhone = phoneMatch !== null;
  if (hasPhone) {
    contact_structure += 2;
    contactReasoning.push(`Phone found: "${phoneMatch[0].trim()}"`);
  } else {
    contactReasoning.push('Phone not found');
  }

  const hasLinkedIn = /linkedin/i.test(lower);
  const hasGithub = /github/i.test(lower);
  const hasPortfolio = /portfolio/i.test(text) && (/(vercel\.com|netlify|github\.io)/i.test(lower) || /\bportfolio\b/i.test(text));
  let linkScore = 0;
  if (hasLinkedIn) linkScore += 1;
  if (hasGithub) linkScore += 1;
  if (hasPortfolio) linkScore += 1;
  contact_structure += linkScore;
  if (linkScore > 0) {
    contactReasoning.push(`Links found: ${[hasLinkedIn && 'LinkedIn', hasGithub && 'GitHub', hasPortfolio && 'Portfolio'].filter(Boolean).join(', ')}`);
  } else {
    contactReasoning.push('No profile links (LinkedIn/GitHub/Portfolio) found');
  }

  const sectionHeaders = ['experience', 'projects', 'education', 'skills', 'achievements'];
  let sectionsFound = 0;
  const foundSections = [];
  for (const section of sectionHeaders) {
    const regex = new RegExp(`\\b${section}\\b`, 'i');
    if (regex.test(text)) {
      sectionsFound++;
      foundSections.push(section.charAt(0).toUpperCase() + section.slice(1));
    }
  }
  contact_structure += Math.min(sectionsFound, 3);
  contactReasoning.push(`${sectionsFound}/5 standard sections found: ${foundSections.join(', ') || 'none'}`);

  contact_structure = Math.min(contact_structure, 10);
  const contactReasoningStr = contactReasoning.join('; ');

  let experience = 0;
  let expReasoning = [];

  const hasExpSection = /\b(experience|internship|work history|employment|professional experience)\b/i.test(text);
  
  if (!hasExpSection) {
    expReasoning.push('SECTION NOT FOUND IN TEXT: No "EXPERIENCE", "INTERNSHIP", or "WORK HISTORY" section header detected');
    experience = 0;
  } else {
    const expSectionMatch = text.match(/(?:EXPERIENCE|INTERNSHIP|WORK HISTORY|PROFESSIONAL EXPERIENCE)[\s\S]*?(?=PROJECTS|EDUCATION|TECHNICAL SKILLS|ACHIEVEMENTS|$)/i);
    const expSectionText = expSectionMatch ? expSectionMatch[0] : '';
    
    const expEntries = [];
    
    // Pattern 1: "Role | Company   Jan 2026 – Mar 2026" (role before pipe, company after pipe, then dates)
    const rolePattern = /([A-Z][A-Za-z\s.&,/]+(?:Intern|Developer|Engineer|Analyst|Trainee))\s*\|\s*([A-Za-z0-9\s.&,/]+?)\s{2,}(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})\s*[–-]/gi;
    let match2;
    while ((match2 = rolePattern.exec(text)) !== null) {
      expEntries.push({ role: match2[1].trim(), company: match2[2].trim(), dateRange: `${match2[3]} ${match2[4]}` });
    }
    
    // Pattern 2: "Company | Jan 2026 –" (company before pipe, then dates) - fallback (use if pattern 1 didn't match)
    if (expEntries.length === 0) {
      const entryPattern1 = /\|\s*([A-Za-z0-9\s.&,/]+?)\s{2,}(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})\s*[–-]/gi;
      let match1;
      while ((match1 = entryPattern1.exec(text)) !== null) {
        expEntries.push({ company: match1[1].trim(), dateRange: `${match1[2]} ${match1[3]}` });
      }
    }

    const uniqueEntries = [];
    const seen = new Set();
    for (const entry of expEntries) {
      const key = `${entry.role || ''}|${entry.company || ''}`;
      if (!seen.has(key) && (entry.role || entry.company)) {
        seen.add(key);
        uniqueEntries.push(entry);
      }
    }
    
    const entryCount = uniqueEntries.length;
    
    if (entryCount === 0) {
      const hasIntern = /\bintern\b/i.test(text);
      const hasCompany = /at\s+[A-Z][A-Za-z\s.]+/i.test(text);
      const hasDates = /\b(20\d{2})\b/g.test(text);
      
      if (hasIntern && hasCompany && hasDates) {
        expReasoning.push(`Experience section found but entries not parsed cleanly; detected intern role with company and dates`);
        experience = 10;
      } else {
        expReasoning.push('Experience section header found but no valid entries with role + company + dates detected');
        experience = 0;
      }
    } else {
      const firstEntry = uniqueEntries[0];
      const quotedPhrase = firstEntry.role ? `${firstEntry.role} | ${firstEntry.company}` : firstEntry.company;
      
      const entryBase = Math.min(entryCount, 2) * 5;
      
      const bulletLines = text.split(/[•●\u2022\u2023\u25CF\u25E6\u2043\u2219\u25D8\u25D9]/).filter(item => {
        const trimmed = item.trim();
        return trimmed.length > 15 && /[a-zA-Z]/.test(trimmed);
      });
      const actionVerbs = /\b(developed|designed|built|implemented|created|optimized|improved|reduced|led|managed|architected|engineered|deployed|integrated|automated|scaled|migrated|learned|applied)\b/i;
      const techMention = /\b(react|node|python|java|javascript|typescript|mongodb|sql|aws|docker|kubernetes|api|git|redux|css|html|django|flask|spring|next|tailwind|express|socket\.io|jwt|rest)\b/i;
      const outcomeMention = /\b(increased|decreased|reduced|improved|achieved|resulted|saved|boosted|enhanced|delivered|securing|streamlining|supporting)\b/i;
      
      let qualityScore = 0;
      let actionCount = 0;
      let techCount = 0;
      let outcomeCount = 0;
      
      for (const line of bulletLines) {
        const l = line.toLowerCase();
        const hasAction = actionVerbs.test(l);
        const hasTech = techMention.test(l);
        const hasOutcome = outcomeMention.test(l);
        
        if (hasAction) actionCount++;
        if (hasTech) techCount++;
        if (hasOutcome) outcomeCount++;
        
        if (hasAction && hasTech && hasOutcome) qualityScore += 3;
        else if (hasAction && hasTech) qualityScore += 2;
        else if (hasAction) qualityScore += 1;
      }
      
      const bulletQuality = Math.min(qualityScore, 10);
      
      const isFrontendRole = /frontend|front-end|ui|ux|react/i.test(role);
      let relevanceBonus = 0;
      if (isFrontendRole) {
        const frontendTech = /\b(react|next|tailwind|css|html|javascript|typescript|redux|responsive)\b/i;
        if (frontendTech.test(expSectionText)) relevanceBonus = 3;
      }
      
      experience = Math.min(entryBase + bulletQuality + relevanceBonus, 25);
      
      expReasoning.push(
        `Found "${quotedPhrase}" in EXPERIENCE section; ` +
        `${entryCount} entry(ies) detected, ` +
        `${actionCount} action verbs, ${techCount} tech mentions, ${outcomeCount} outcome indicators, ` +
        `bullet quality ${bulletQuality}/10`
      );
    }
  }

  const expReasoningStr = expReasoning.join('; ');

  let projects = 0;
  let projReasoning = [];

  const hasProjectsSection = /\bprojects?\b/i.test(text);
  
  if (!hasProjectsSection) {
    projReasoning.push('SECTION NOT FOUND IN TEXT: No "PROJECTS" section header detected');
    projects = 0;
  } else {
    const projSectionMatch = text.match(/(?:PROJECTS)[\s\S]*?(?=TECHNICAL SKILLS|EDUCATION|ACHIEVEMENTS|$)/i);
    const projSectionText = projSectionMatch ? projSectionMatch[0] : '';
    
    const projectEntries = [];
    const projPattern = /([A-Z][A-Za-z\s\-:]+)\s*\|\s*(GitHub|Github|Live|Demo|Link)/gi;
    let match;
    while ((match = projPattern.exec(projSectionText)) !== null) {
      projectEntries.push(match[1].trim());
    }
    
    const projBulletGroups = projSectionText.split(/\n\s*\n/).filter(b => {
      const trimmed = b.trim();
      return trimmed.length > 30 && /(built|developed|created|tech|stack)/i.test(trimmed);
    });
    
    const projectCount = Math.max(projectEntries.length, Math.min(projBulletGroups.length, 5));
    
    if (projectCount === 0) {
      projReasoning.push('PROJECTS section found but no clear project entries detected');
      projects = 0;
    } else {
      const hasGitHubLinks = /github/i.test(projSectionText);
      const hasTechStack = /\b(react|node|python|java|javascript|typescript|mongodb|sql|aws|docker|api|html|css)\b/i.test(projSectionText);
      const hasOutcomes = /\b(real-time|live|deployed|users|requests|responses|performance|optimized|integrated)\b/i.test(projSectionText);
      
      let projScore = 0;
      if (projectCount >= 3) projScore = 14;
      else if (projectCount === 2) projScore = 10;
      else if (projectCount === 1) projScore = 6;
      
      if (hasGitHubLinks) projScore += 3;
      if (hasTechStack) projScore += 2;
      if (hasOutcomes) projScore += 1;
      
      projects = Math.min(projScore, 20);
      
      projReasoning.push(
        `${projectCount} project(s) identified in PROJECTS section; ` +
        `GitHub links: ${hasGitHubLinks ? 'yes' : 'no'}, ` +
        `tech stack listed: ${hasTechStack ? 'yes' : 'no'}, ` +
        `outcomes described: ${hasOutcomes ? 'yes' : 'no'}`
      );
      
      if (projectEntries.length > 0) {
        projReasoning.push(`Quoted: "${projectEntries[0]}"`);
      }
    }
  }

  const projReasoningStr = projReasoning.join('; ');

  let technical_skills = 0;
  let techReasoning = [];

  const hasSkillsSection = /\b(skills|technical skills|technologies|tech stack)\b/i.test(text);
  
  if (!hasSkillsSection) {
    techReasoning.push('SECTION NOT FOUND IN TEXT: No "SKILLS" or "TECHNICAL SKILLS" section header detected');
    technical_skills = 0;
  } else {
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
      'socket.io', 'jwt', 'razorpay', 'cloudinary', 'vercel', 'render',
      'groq', 'llama', 'prompt engineering',
    ];
    
    const foundTech = [];
    for (const tech of techKeywords) {
      const regex = new RegExp(`\\b${tech.replace(/[+#.\-]/g, '\\$&')}\\b`, 'i');
      if (regex.test(text)) foundTech.push(tech);
    }
    
    const uniqueTechCount = new Set(foundTech).size;
    
    const hasCategories = /(languages?|programming\s*languages?):/i.test(text) && 
                         /(frameworks?|libraries?|tools?|technologies?|databases?|platforms?):/i.test(text);
    
    let roleRelevanceBonus = 0;
    if (/frontend|front-end/i.test(role)) {
      const frontendTechs = ['react', 'next', 'tailwind', 'css', 'html', 'javascript', 'typescript', 'redux', 'bootstrap'];
      const frontendFound = frontendTechs.filter(t => foundTech.includes(t)).length;
      roleRelevanceBonus = Math.min(frontendFound, 3);
    } else if (/backend|back-end/i.test(role)) {
      const backendTechs = ['node', 'express', 'django', 'flask', 'spring', 'mongodb', 'postgresql', 'mysql', 'aws', 'docker'];
      const backendFound = backendTechs.filter(t => foundTech.includes(t)).length;
      roleRelevanceBonus = Math.min(backendFound, 3);
    }
    
    let techScore = Math.min(uniqueTechCount, 10);
    if (hasCategories) techScore += 3;
    techScore += roleRelevanceBonus;
    
    technical_skills = Math.min(techScore, 15);
    
    techReasoning.push(
      `${uniqueTechCount} distinct technologies found in SKILLS section; ` +
      `categorized: ${hasCategories ? 'yes' : 'no'}; ` +
      `role relevance bonus: +${roleRelevanceBonus}`
    );
    
    const quotedTechs = foundTech.slice(0, 5).join(', ');
    techReasoning.push(`Technologies include: ${quotedTechs}${foundTech.length > 5 ? ', ...' : ''}`);
  }

  const techReasoningStr = techReasoning.join('; ');

  let achievements = 0;
  let achReasoning = [];

  const hasAchievementsSection = /\b(achievements?|accomplishments?|awards?|certifications?|honors?)\b/i.test(text);
  
  const numberPatterns = [
    /\b\d{2,3}\s*\+?\s*(problems?|questions?|challenges?|tasks?|projects?)/gi,
    /\b\d{2,3}\s*\+?\s*(students?|users?|customers?|clients?|members?)/gi,
    /\b\d{2}%|\d{3}\s*%|\d+[\.\d]*\s*(percent|%|x|times?)/gi,
    /\b(reduced|decreased|improved|increased|boosted|optimized)\s+(by\s+)?\d+/gi,
    /\b\d{2,3}\s*\+?\s*(lines?|files?|pages?|documents?)/gi,
    /\$[\d,]+(k|K|M|m|B|b)?/g,
    /\b\d{2,3}\s*\+?\s*(stars?|forks?|contributions?|commits?|prs?|pull\s*requests?)/gi,
    /\b\d{2,3}\s*\+?\s*(badges?|days?)/gi,
  ];
  
  const foundNumbers = new Set();
  for (const pattern of numberPatterns) {
    const matches = text.match(pattern);
    if (matches) matches.forEach(m => foundNumbers.add(m.trim()));
  }
  
  const numAchievements = foundNumbers.size;
  
  if (numAchievements === 0 && !hasAchievementsSection) {
    achReasoning.push('SECTION NOT FOUND IN TEXT: No "ACHIEVEMENTS" section and no quantifiable numbers detected');
    achievements = 0;
  } else if (numAchievements === 0) {
    achReasoning.push('ACHIEVEMENTS section found but no quantifiable numbers detected');
    achievements = 2;
  } else {
    if (numAchievements >= 3) achievements = 10;
    else if (numAchievements === 2) achievements = 7;
    else achievements = 4;
    
    const quotedAch = Array.from(foundNumbers).slice(0, 3).join(', ');
    achReasoning.push(`${numAchievements} quantifiable achievement(s) found: ${quotedAch}`);
  }

  const achReasoningStr = achReasoning.join('; ');

  let education = 0;
  let eduReasoning = [];

  const hasEducationSection = /\b(education|academic background|educational qualification|qualification)\b/i.test(text);
  
  if (!hasEducationSection) {
    eduReasoning.push('SECTION NOT FOUND IN TEXT: No "EDUCATION" section header detected');
    education = 0;
  } else {
    const eduSectionMatch = text.match(/(?:EDUCATION)[\s\S]*?(?=ACHIEVEMENTS|TECHNICAL SKILLS|PROJECTS|$)/i);
    const eduSectionText = eduSectionMatch ? eduSectionMatch[0] : '';
    
    const hasDegree = /\b(b\.?\.?e\.?|b\.?tech|m\.?tech|m\.?e\.|bachelor|master|ph\.?d|bca|mca|bsc|msc|bcs|mcs|be\s|me\s|b\.?com|m\.?com)\b/i.test(eduSectionText) || /\bB\.\s*E\./i.test(eduSectionText);
    
    const hasInstitution = /\b(university|college|institute|iit|nit|iiit|bits|vit|srm|amity|vtu|jntu)\b/i.test(eduSectionText);
    
    const hasCGPA = /(cgpa|gpa|percentage|aggregate|score)\s*[:]?\s*\d+[\.\d]*/i.test(eduSectionText);
    
    const hasGradYear = /\b(20\d{2})\b/.test(eduSectionText);
    
    const isTier1 = /\b(iit|nit|iiit|bits)\b/i.test(eduSectionText);
    
    let eduScore = 0;
    if (hasDegree) eduScore += 3;
    if (hasInstitution) eduScore += 2;
    if (hasCGPA) eduScore += 3;
    if (hasGradYear) eduScore += 1;
    if (isTier1) eduScore += 1;
    
    education = Math.min(eduScore, 10);
    
    eduReasoning.push(
      `Degree: ${hasDegree ? 'yes' : 'no'}, ` +
      `Institution: ${hasInstitution ? 'yes' : 'no'}, ` +
      `CGPA: ${hasCGPA ? 'yes' : 'no'}, ` +
      `Grad Year: ${hasGradYear ? 'yes' : 'no'}, ` +
      `Tier-1: ${isTier1 ? 'yes' : 'no'}`
    );
    
    const degreeMatch = eduSectionText.match(/(B\.?E\.?|B\.?Tech|M\.?Tech|Bachelor|Master)[^|]*\|[^|]*\|[^|]*/i);
    if (degreeMatch) {
      eduReasoning.push(`Quoted: "${degreeMatch[0].trim()}"`);
    }
  }

  const eduReasoningStr = eduReasoning.join('; ');

  let keyword_density = 0;
  let kwReasoning = [];

  let roleKeywords = [];
  
  if (/frontend|front-end|ui|ux/i.test(role)) {
    roleKeywords = [
      'react', 'javascript', 'typescript', 'html', 'css', 'tailwind', 'bootstrap',
      'redux', 'next', 'responsive', 'component', 'state management', 'hooks',
      'rest api', 'git', 'webpack', 'vite', 'jest', 'cypress', 'figma',
      'api integration', 'frontend', 'ui/ux', 'spa', 'single page application',
    ];
  } else if (/backend|back-end/i.test(role)) {
    roleKeywords = [
      'node', 'express', 'python', 'java', 'spring', 'django', 'flask',
      'mongodb', 'postgresql', 'mysql', 'redis', 'api', 'rest', 'graphql',
      'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'microservices',
      'authentication', 'authorization', 'jwt', 'database', 'server',
    ];
  } else if (/full.?stack|fullstack/i.test(role)) {
    roleKeywords = [
      'react', 'node', 'javascript', 'typescript', 'mongodb', 'express',
      'html', 'css', 'rest api', 'git', 'docker', 'aws', 'database',
      'frontend', 'backend', 'full stack', 'api', 'deployment',
    ];
  } else if (/data.?scientist|data.?engineer|ml|machine.?learning/i.test(role)) {
    roleKeywords = [
      'python', 'tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy',
      'sql', 'mongodb', 'aws', 'docker', 'git', 'machine learning', 'deep learning',
      'nlp', 'data', 'statistics', 'regression', 'classification', 'neural',
    ];
  } else {
    roleKeywords = [
      'dsa', 'data structures', 'algorithm', 'oop', 'object-oriented',
      'dbms', 'database', 'os', 'operating system', 'computer networks',
      'system design', 'rest api', 'git', 'agile', 'scrum', 'testing',
    ];
  }
  
  let kwFound = 0;
  const foundKeywords = [];
  for (const kw of roleKeywords) {
    const regex = new RegExp(`\\b${kw.replace(/[+\-]/g, '\\$&')}\\b`, 'i');
    if (regex.test(text)) {
      kwFound++;
      foundKeywords.push(kw);
    }
  }
  
  const totalKeywords = roleKeywords.length;
  const densityPercent = totalKeywords > 0 ? (kwFound / totalKeywords) * 100 : 0;
  
  if (densityPercent >= 50) keyword_density = 10;
  else if (densityPercent >= 35) keyword_density = 8;
  else if (densityPercent >= 25) keyword_density = 6;
  else if (densityPercent >= 15) keyword_density = 4;
  else if (densityPercent >= 5) keyword_density = 2;
  else keyword_density = 0;
  
  kwReasoning.push(
    `Role: "${role}"; ${kwFound}/${totalKeywords} role-specific keywords matched (${Math.round(densityPercent)}% density)`
  );
  if (foundKeywords.length > 0) {
    kwReasoning.push(`Matched keywords: ${foundKeywords.slice(0, 8).join(', ')}${foundKeywords.length > 8 ? ', ...' : ''}`);
  }

  const kwReasoningStr = kwReasoning.join('; ');

  const total_score = contact_structure + experience + projects + technical_skills + achievements + education + keyword_density;

  const rewriteSuggestions = [];

  const bulletLines = text.split('\n').filter(line => /^[•\-*\s]/.test(line.trim()));
  for (const line of bulletLines) {
    const trimmed = line.trim();
    const l = trimmed.toLowerCase();
    
    if (/learned\s+and\s+applied/i.test(l) && !/\b(built|developed|created|implemented|designed)\b/i.test(l)) {
      rewriteSuggestions.push({
        original: trimmed,
        improved: trimmed.replace(/Learned and applied/i, 'Built and deployed'),
        reason: '"Learned and applied" is passive; use direct action verbs like "Built" or "Developed" to show ownership'
      });
    }
    
    if (/\b(built|developed|created|implemented)\b/i.test(l) && !/\b(for|used by|serving|handling|processing|reducing|improving|with)\b/i.test(l)) {
      if (!rewriteSuggestions.some(s => s.original === trimmed)) {
        rewriteSuggestions.push({
          original: trimmed,
          improved: trimmed.replace(/\.$/, '') + ', serving [N] users and reducing [metric] by [X]%.',
          reason: 'Add measurable outcomes (user count, performance improvement, etc.) to demonstrate impact'
        });
      }
    }
  }

  if (/frontend|front-end/i.test(role) && !/typescript/i.test(text)) {
    rewriteSuggestions.push({
      original: 'JavaScript (ES6+)',
      improved: 'JavaScript (ES6+), TypeScript',
      reason: 'TypeScript is a critical skill for Frontend Developer roles; adding it significantly improves keyword match'
    });
  }

  if (/\bMini Projects?\b/i.test(text)) {
    const miniProjMatch = text.match(/Mini Projects?:[^.]*\./i);
    if (miniProjMatch) {
      rewriteSuggestions.push({
        original: miniProjMatch[0].trim(),
        improved: 'Featured Projects: Portfolio (React/Next.js), Weather App (REST API integration), Tic-Tac-Toe (minimax algorithm) — all deployed on Vercel/GitHub Pages',
        reason: '"Mini Projects" sounds less impressive; rebrand as "Featured Projects" and emphasize technical depth and deployment'
      });
    }
  }

  if (!/vercel\.com|netlify|herokuapp|firebaseapp/i.test(lower)) {
    rewriteSuggestions.push({
      original: 'GitHub',
      improved: 'GitHub | Live Demo (Vercel)',
      reason: 'Adding live demo links alongside GitHub shows deployability and gives recruiters an immediate way to see your work'
    });
  }

  return {
    total_score,
    category_scores: {
      contact_structure,
      experience,
      projects,
      technical_skills,
      achievements,
      education,
      keyword_density,
    },
    category_reasoning: {
      contact_structure: contactReasoningStr,
      experience: expReasoningStr,
      projects: projReasoningStr,
      technical_skills: techReasoningStr,
      achievements: achReasoningStr,
      education: eduReasoningStr,
      keyword_density: kwReasoningStr,
    },
    rewrite_suggestions: rewriteSuggestions,
  };
};