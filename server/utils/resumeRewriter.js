const improveBullet = (line) => {
  const l = line.toLowerCase().trim();
  const templates = [
    {
      match: /\b(worked on|helped with|did)\b/i,
      replace: (match) => {
        const verbs = ['Developed', 'Implemented', 'Contributed to', 'Executed'];
        return verbs[Math.floor(Math.random() * verbs.length)];
      },
    },
    {
      match: /\b(made|built|created)\b.*\b(small|big|good|nice|better)\b/i,
      replace: (match) => match.replace(/\b(small|big|good|nice|better)\b/i, 'impactful'),
    },
    {
      match: /\b(used|utilized)\b/i,
      replace: () => 'Leveraged',
    },
    {
      match: /\b(helped|assisted)\b/i,
      replace: () => 'Supported',
    },
    {
      match: /\b(responsible for)\b/i,
      replace: () => 'Owned',
    },
  ];

  let improved = line;
  for (const template of templates) {
    if (template.match.test(improved)) {
      improved = improved.replace(template.match, template.replace);
    }
  }

  if (!/[A-Z]/.test(improved.charAt(0))) {
    improved = improved.charAt(0).toUpperCase() + improved.slice(1);
  }

  if (!/[.!?]$/.test(improved)) {
    improved += '.';
  }

  return improved;
};

exports.generateRewriteSuggestions = (text, result) => {
  const suggestions = [];
  const lines = text.split('\n').filter((line) => line.trim().length > 10);
  const bulletLines = lines.filter((line) => /^[•\-*\s]+/.test(line.trim()));

  const weakBullets = bulletLines.filter((line) => {
    const l = line.toLowerCase();
    const hasVerb = /\b(developed|designed|built|implemented|created|optimized|improved|reduced|led|managed|architected|engineered|deployed|integrated|automated|scaled|migrated)\b/i.test(l);
    const hasTech = /\b(react|node|python|java|javascript|typescript|mongodb|sql|aws|docker|kubernetes|api|git|redux|css|html|django|flask|spring)\b/i.test(l);
    const hasOutcome = /\b(increased|decreased|reduced|improved|achieved|resulted|saved|boosted|enhanced|delivered)\b/i.test(l);
    return !hasVerb || !hasTech || !hasOutcome;
  });

  const toReview = weakBullets.slice(0, 5);
  for (const bullet of toReview) {
    const trimmed = bullet.replace(/^[•\-*\s]+/, '').trim();
    if (trimmed.length > 5) {
      suggestions.push({
        original: trimmed,
        suggested: improveBullet(trimmed),
        reason: 'Weak bullet: add stronger action verb, specific technology, and measurable outcome',
      });
    }
  }

  if (suggestions.length === 0) {
    suggestions.push({
      original: 'No significant weak bullets detected',
      suggested: 'Your bullet points look strong. Consider quantifying impact with metrics.',
      reason: 'General advice',
    });
  }

  return suggestions;
};