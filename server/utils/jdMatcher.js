exports.computeJDMatch = (resumeText, jobDescription) => {
  if (!resumeText || !jobDescription) return { score: 0, matchedKeywords: [], missingKeywords: [] };

  const resumeLower = resumeText.toLowerCase();
  const jdLower = jobDescription.toLowerCase();

  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'we', 'you', 'your', 'our', 'they', 'them', 'their', 'this', 'that', 'these', 'those',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
    'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall',
    'work', 'looking', 'strong', 'excellent', 'good', 'knowledge', 'experience', 'using',
    'including', 'such', 'related', 'field', 'years', 'year', 'etc', 'able', 'must',
    'responsible', 'understanding', 'familiar', 'preferred', 'plus', 'job', 'description'
  ]);

  const extractKeywords = (text) => {
    const words = text.match(/\b[a-zA-Z]{2,}\b/g) || [];
    const phrases = text.match(/\b(?:data\s+science|machine\s+learning|deep\s+learning|artificial\s+intelligence|computer\s+science|software\s+engineering|full\s+stack|front\s+end|back\s+end|devops|cloud\s+computing|big\s+data|business\s+intelligence|project\s+management|cross\s+functional)\b/gi) || [];
    const unique = new Set();
    words.forEach(w => { const lw = w.toLowerCase(); if (!stopWords.has(lw) && lw.length > 2) unique.add(lw); });
    phrases.forEach(p => unique.add(p.toLowerCase()));
    return Array.from(unique);
  };

  const jdKeywords = extractKeywords(jobDescription);
  if (jdKeywords.length === 0) return { score: 0, matchedKeywords: [], missingKeywords: [] };

  const matchedKeywords = [];
  const missingKeywords = [];

  for (const keyword of jdKeywords) {
    if (resumeLower.includes(keyword)) {
      matchedKeywords.push(keyword);
    } else {
      missingKeywords.push(keyword);
    }
  }

  const score = Math.round((matchedKeywords.length / jdKeywords.length) * 100);

  return {
    score,
    matchedKeywords: matchedKeywords.slice(0, 20),
    missingKeywords: missingKeywords.slice(0, 20),
    totalKeywords: jdKeywords.length,
  };
};