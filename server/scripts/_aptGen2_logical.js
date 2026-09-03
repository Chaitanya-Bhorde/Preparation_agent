const G = {};
const R = (r, a, b) => a + Math.floor(r() * (b - a + 1));
const PK = (r, arr) => arr[Math.floor(r() * arr.length)];
const NP = ['Amit', 'Bina', 'Chetan', 'Divya', 'Esha', 'Farhan', 'Gita', 'Hari', 'Isha', 'Jai'];

G['Number Series'] = (r, i, c) => {
    const TNS = [
    (r, i, c) => { const a = c.ri(r, 2, 15), d = c.ri(r, 3, 12); const s = [a, a + d, a + 2 * d, a + 3 * d, a + 4 * d]; const nx = a + 5 * d;
      return c.buildMCQ({ r, stem: 'Find the next term of the series: ' + s.join(', ') + ', ...', right: String(nx), wrong: [String(nx + d), String(nx - d), String(s[4] + 2 * d)], explanation: 'Next term = ' + nx + '.', steps: ['Differences: ' + [d, d, d, d].join(', ') + ' (constant = ' + d + ')', 'Next = ' + s[4] + ' + ' + d + ' = ' + nx] }); },
    (r, i, c) => { const a = c.ri(r, 1, 6), rr = c.pk(r, [2, 3]); const s = [a, a * rr, a * rr * rr, a * rr * rr * rr]; const nx = a * rr * rr * rr * rr;
      return c.buildMCQ({ r, stem: 'What comes next in the series: ' + s.join(', ') + ', ...?', right: String(nx), wrong: [String(nx + a), String(nx * rr - a), String(s[3] + s[2])], explanation: 'Next term = ' + nx + '.', steps: ['Each term = previous x ' + rr, 'Next = ' + s[3] + ' x ' + rr + ' = ' + nx] }); },
    (r, i, c) => { const k = c.pk(r, [1, 2]); const s = [1 * 1 + k, 2 * 2 + k, 3 * 3 + k, 4 * 4 + k, 5 * 5 + k]; const nx = 36 + k;
      return c.buildMCQ({ r, stem: 'Find the missing number: ' + s.join(', ') + ', ?', right: String(nx), wrong: [String(35 + k), String(37 + k), String(49 + k)], explanation: 'Next = ' + nx + '.', steps: ['Pattern: n^2 + ' + k, '5th term = 5^2 + ' + k + ' = ' + s[4], '6th term = 6^2 + ' + k + ' = ' + nx] }); },
    (r, i, c) => { const a = c.ri(r, 2, 9), b = a + c.ri(r, 3, 9), d1 = c.ri(r, 1, 4), d2 = d1 + c.ri(r, 1, 3); const s = [a, b, a + 2 * d1, b + 2 * d2, a + 4 * d1, b + 4 * d2]; const nx = a + 6 * d1;
      return c.buildMCQ({ r, stem: 'Find the next number: ' + s.join(', ') + ', ?', right: String(nx), wrong: [String(b + 6 * d2), String(nx + d1), String(s[5] + d2)], explanation: 'Next = ' + nx + '.', steps: ['Two alternating series: positions 1,3,5 and 2,4,6', 'Odd positions: ' + a + ', ' + s[2] + ', ' + s[4] + ' (+' + d1 + ' each)', 'Next odd-position term = ' + s[4] + ' + ' + d1 + ' = ' + nx] }); },
    (r, i, c) => { const a = c.ri(r, 2, 8), st = c.ri(r, 2, 5); const s = [a, a + st, a + 3 * st, a + 6 * st, a + 10 * st]; const nx = a + 15 * st;
      return c.buildMCQ({ r, stem: 'What is the next term: ' + s.join(', ') + ', ...?', right: String(nx), wrong: [String(s[4] + 4 * st), String(nx + st), String(s[4] + 5 * st)], explanation: 'Next = ' + nx + '.', steps: ['Differences: ' + [st, 2 * st, 3 * st, 4 * st].join(', ') + ' (increasing by ' + st + ')', 'Next difference = ' + (5 * st), 'Next term = ' + s[4] + ' + ' + (5 * st) + ' = ' + nx] }); },
    (r, i, c) => { const a = c.ri(r, 2, 7); const s = [a, 2 * a, 4 * a, 8 * a]; const miss = 16 * a, last = 32 * a;
      return c.buildMCQ({ r, stem: 'Find the missing term: ' + s.join(', ') + ', ?, ' + last + '.', right: String(miss), wrong: [String(16 * a + a), String(24 * a), String(12 * a)], explanation: 'Missing term = ' + miss + '.', steps: ['Each term = previous x 2', 'Last given = ' + last + ' = 32 x ' + a, 'Missing = ' + last + ' / 2 = ' + miss] }); },
    (r, i, c) => { const f = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89]; const st = c.ri(r, 2, 6); const s = f.slice(st, st + 5); const nx = f[st + 5];
      return c.buildMCQ({ r, stem: 'What number continues the series: ' + s.join(', ') + ', ...?', right: String(nx), wrong: [String(s[4] + s[1]), String(s[4] * 2), String(s[4] + s[2])], explanation: 'Next = ' + nx + '.', steps: ['Each term = sum of previous two', s[3] + ' + ' + s[4] + ' = ' + nx, 'So the next term is ' + nx] }); },
    (r, i, c) => {
      return c.buildMCQ({ r, stem: 'Which number comes next? 1, 8, 27, 64, 125, ?', right: '216', wrong: ['190', '224', '243'], explanation: 'Next = 216.', steps: ['Terms are cubes: 1^3, 2^3, 3^3, 4^3, 5^3', 'Next = 6^3 = 6 x 6 x 6 = 216'] }); },
    (r, i, c) => {
      return c.buildMCQ({ r, stem: 'Find the missing number: 2, 3, 5, 7, 11, ?', right: '13', wrong: ['12', '14', '15'], explanation: 'Next prime = 13.', steps: ['Terms are consecutive primes: 2, 3, 5, 7, 11', 'Next prime after 11 = 13'] }); },
    (r, i, c) => { const st = c.ri(r, 2, 6), a = c.ri(r, 1, 5); const s = [a, a * 2 + st, (a * 2 + st) * 2 + st, (a * 2 + st) * 2 + st * 2 + st]; const nx = s[3] * 2 + st;
      return c.buildMCQ({ r, stem: 'Find the next term: ' + s.join(', ') + ', ?', right: String(nx), wrong: [String(s[3] * 2), String(s[3] + st), String(nx + st)], explanation: 'Next = ' + nx + '.', steps: ['Pattern: x2 then +' + st + ' each time', s[0] + ' x 2 + ' + st + ' = ' + s[1], 'Next = ' + s[3] + ' x 2 + ' + st + ' = ' + nx] }); },
    (r, i, c) => { const st = c.ri(r, 3, 7); const s = [st, 4 * st, 9 * st, 16 * st, 25 * st]; const nx = 36 * st;
      return c.buildMCQ({ r, stem: 'Find the next term of the series: ' + s.join(', ') + ', ?', right: String(nx), wrong: [String(nx + st), String(30 * st), String(49 * st)], explanation: 'Next = ' + nx + '.', steps: ['Terms are ' + st + ' x (1, 4, 9, 16, 25) = ' + st + ' x squares', 'Next square is 36', 'Next term = ' + st + ' x 36 = ' + nx] }); },
    (r, i, c) => { const a = c.ri(r, 2, 6), d = c.ri(r, 2, 6); const s = [a, a + d, a + 3 * d, a + 6 * d, a + 10 * d]; const wrongVal = s[3] + 1; const shown = [s[0], s[1], s[2], wrongVal, s[4]];
      return c.buildMCQ({ r, stem: 'Find the WRONG term in the series: ' + shown.join(', '), right: String(wrongVal), wrong: [String(shown[1]), String(shown[2]), String(shown[4])], explanation: 'Wrong term = ' + wrongVal + ' (should be ' + s[3] + ').', steps: ['Expected differences: ' + [d, 2 * d, 3 * d, 4 * d].join(', '), 'Given differences: ' + [shown[1] - shown[0], shown[2] - shown[1], shown[3] - shown[2], shown[4] - shown[3]].join(', '), 'Break at ' + wrongVal + ': correct term = ' + s[3]] }); },
    (r, i, c) => { const a = c.ri(r, 3, 9); const s = [a, a + 3, a + 8, a + 15]; const nx = a + 24;
      return c.buildMCQ({ r, stem: 'Find the term that replaces the question mark: ' + s.join(', ') + ', ?', right: String(nx), wrong: [String(a + 22), String(a + 25), String(a + 20)], explanation: 'Next = ' + nx + '.', steps: ['Differences: 3, 5, 7 (consecutive odd numbers)', 'Next difference = 9', 'Next term = ' + s[3] + ' + 9 = ' + nx] }); },
    (r, i, c) => { const a = c.ri(r, 2, 5), d = c.ri(r, 2, 4); const s = [a, a + d, a + 3 * d, a + 7 * d]; const nx = a + 15 * d;
          return c.buildMCQ({ r, stem: 'What is the next number? ' + s.join(', ') + ', ?', right: String(nx), wrong: [String(s[3] + 8 * d), String(s[3] + 7 * d), String(s[3] + 6 * d)], explanation: 'Next = ' + nx + '.', steps: ['Differences: ' + [d, 2 * d, 4 * d].join(', ') + ' (each doubles)', 'Next difference = ' + (8 * d), 'Next term = ' + s[3] + ' + ' + (8 * d) + ' = ' + nx] }); },
  ];
  return TNS[i % TNS.length](r, i, c);
};

G['Syllogism'] = (r, i, c) => {
  const T = [
    (r, i, c) => { const p = c.pk(r, [['roses', 'flowers', 'plants'], ['dogs', 'animals', 'living beings'], ['pens', 'stationery', 'items']]);
      return c.buildMCQ({ r, stem: 'Statements: All ' + p[0] + ' are ' + p[1] + '. All ' + p[1] + ' are ' + p[2] + '. Which conclusion follows?', right: 'All ' + p[0] + ' are ' + p[2] + '.', wrong: ['Some ' + p[2] + ' are not ' + p[1] + '.', 'No ' + p[0] + ' is ' + p[2] + '.', 'Some ' + p[1] + ' are not ' + p[0] + '.'], explanation: 'All ' + p[0] + ' are ' + p[2] + ' follows.', steps: ['All ' + p[0] + ' are inside ' + p[1], 'All ' + p[1] + ' are inside ' + p[2], 'So all ' + p[0] + ' are inside ' + p[2] + ' — conclusion follows'] }); },
    (r, i, c) => { const p = c.pk(r, [['birds', 'crows', 'black things'], ['engineers', 'graduates', 'employed people'], ['singers', 'artists', 'creative people']]);
      return c.buildMCQ({ r, stem: 'Statements: Some ' + p[0] + ' are ' + p[1] + '. All ' + p[1] + ' are ' + p[2] + '. Which conclusion definitely follows?', right: 'Some ' + p[0] + ' are ' + p[2] + '.', wrong: ['All ' + p[0] + ' are ' + p[2] + '.', 'No ' + p[0] + ' is ' + p[2] + '.', 'All ' + p[2] + ' are ' + p[1] + '.'], explanation: 'Some ' + p[0] + ' are ' + p[2] + ' follows.', steps: ['Some ' + p[0] + ' overlap ' + p[1], 'All of ' + p[1] + ' is inside ' + p[2], 'So those ' + p[0] + ' that are ' + p[1] + ' are also ' + p[2], 'Conclusion: Some ' + p[0] + ' are ' + p[2]] }); },
    (r, i, c) => { const p = c.pk(r, [['cats', 'dogs'], ['tigers', 'lions'], ['trains', 'buses']]);
      return c.buildMCQ({ r, stem: 'Statements: No ' + p[0].replace(/s$/, '') + ' is a ' + p[1].replace(/s$/, '') + '. All ' + p[1] + ' are animals. Which conclusion follows?', right: 'Some animals are not ' + p[0] + '.', wrong: ['No animal is a ' + p[0].replace(/s$/, '') + '.', 'All ' + p[0] + ' are animals.', 'Some ' + p[0] + ' are ' + p[1] + '.'], explanation: 'Some animals are not ' + p[0] + '.', steps: ['No ' + p[0].replace(/s$/, '') + ' is inside ' + p[1], 'All ' + p[1] + ' are animals', 'So those ' + p[1] + ' (which are animals) are not ' + p[0], 'Conclusion: Some animals are not ' + p[0]] }); },
    (r, i, c) => { const p = c.pk(r, [['doctors', 'rich people'], ['actors', 'famous people']]);
      return c.buildMCQ({ r, stem: 'Statements: All ' + p[0] + ' are ' + p[1] + '. Some ' + p[1] + ' are intelligent. Which conclusion definitely does NOT follow?', right: 'Some ' + p[0] + ' are intelligent.', wrong: ['All ' + p[0] + ' are ' + p[1] + '.', 'Some ' + p[1] + ' are intelligent.', 'Some ' + p[1] + ' are ' + p[0] + '.'], explanation: '"Some ' + p[0] + ' are intelligent" does NOT follow.', steps: ['All ' + p[0] + ' are inside ' + p[1], 'Intelligent people only overlap ' + p[1] + ', not necessarily ' + p[0], 'So "Some ' + p[0] + ' are intelligent" is not definite'] }); },
    (r, i, c) => { const p = c.pk(r, [['banks', 'rivers'], ['shirts', 'clothes']]);
      return c.buildMCQ({ r, stem: 'Statements: Some ' + p[0] + ' are ' + p[1] + '. No ' + p[1].replace(/s$/, '') + ' is a book. Conclusions: I. Some ' + p[0] + ' are not books. II. All ' + p[0] + ' are books. Which follows?', right: 'Only conclusion I follows', wrong: ['Only conclusion II follows', 'Both I and II follow', 'Neither I nor II follows'], explanation: 'Only I follows.', steps: ['Some ' + p[0] + ' are ' + p[1] + ', and no ' + p[1].replace(/s$/, '') + ' is a book', 'So those ' + p[0] + ' cannot be books => I follows', 'II contradicts I => II does not follow'] }); },
  ];
  return T[i % T.length](r, i, c);
};

const CW = ['DELHI', 'MUMBAI', 'ORANGE', 'SILVER', 'MARKET', 'PENCIL', 'WINDOW', 'GARDEN', 'TRAVEL', 'SUMMER', 'MONDAY', 'FRIEND'];
const sh = (w, k) => w.split('').map(ch => String.fromCharCode(((ch.charCodeAt(0) - 65 + k + 26) % 26) + 65)).join('');
const rev = (w) => w.split('').reverse().join('');
const atb = (w) => w.split('').map(ch => String.fromCharCode(90 - (ch.charCodeAt(0) - 65))).join('');

G['Coding-Decoding'] = (r, i, c) => {
  const T = [
    (r, i, c) => { const k = R(r, 1, 5); const w1 = CW[i % CW.length], w2 = CW[(i + 5) % CW.length];
      return c.buildMCQ({ r, stem: 'In a certain code language, "' + w1 + '" is written as "' + sh(w1, k) + '". How will "' + w2 + '" be written in that code?', right: sh(w2, k), wrong: [sh(w2, k + 1), sh(w2, -k), rev(sh(w2, k))], explanation: 'Code = ' + sh(w2, k) + '.', steps: [w1 + ' -> ' + sh(w1, k) + ': each letter moves +' + k + ' positions', 'Apply same rule to ' + w2 + ':', w2 + ' -> ' + sh(w2, k)] }); },
    (r, i, c) => { const w1 = CW[i % CW.length], w2 = CW[(i + 4) % CW.length];
      return c.buildMCQ({ r, stem: 'In a certain code, "' + w1 + '" is coded as "' + rev(w1) + '". How is "' + w2 + '" coded in that language?', right: rev(w2), wrong: [w2, sh(w2, 1), rev(sh(w2, 1))], explanation: 'Code = ' + rev(w2) + '.', steps: [w1 + ' -> ' + rev(w1) + ': letters are written in reverse order', 'So ' + w2 + ' -> ' + rev(w2)] }); },
    (r, i, c) => { const k = R(r, 1, 4); const w1 = CW[i % CW.length], w2 = CW[(i + 7) % CW.length];
      return c.buildMCQ({ r, stem: 'If "' + w1 + '" is coded as "' + sh(w1, -k) + '", then "' + w2 + '" will be coded as:', right: sh(w2, -k), wrong: [sh(w2, k), sh(w2, -(k + 1)), rev(w2)], explanation: 'Code = ' + sh(w2, -k) + '.', steps: [w1 + ' -> ' + sh(w1, -k) + ': each letter moves -' + k + ' positions (backwards)', 'Apply to ' + w2 + ': ' + w2 + ' -> ' + sh(w2, -k)] }); },
    (r, i, c) => { const w1 = CW[i % CW.length], w2 = CW[(i + 3) % CW.length];
      return c.buildMCQ({ r, stem: 'In a certain code, letters of "' + w1 + '" are written as their opposite letters (A-Z, B-Y, ...). Using the same code, "' + w2 + '" will be written as:', right: atb(w2), wrong: [rev(atb(w2)), sh(atb(w2), 1), w2], explanation: 'Code = ' + atb(w2) + '.', steps: ['Opposite letter: A(1) <-> Z(26), B(2) <-> Y(25); new position = 27 - old', 'Apply to each letter of ' + w2, w2 + ' -> ' + atb(w2)] }); },
    (r, i, c) => { const w1 = CW[i % CW.length];
      const pos = w1.split('').map(ch => ch.charCodeAt(0) - 64); const sum = pos.reduce((a, b) => a + b, 0);
      return c.buildMCQ({ r, stem: 'If A = 1, B = 2, C = 3 ... Z = 26, what is the sum of the letter-positions of the word "' + w1 + '"?', right: String(sum), wrong: [String(sum + 1), String(sum - pos[0]), String(sum + 10)], explanation: 'Sum = ' + sum + '.', steps: ['Positions: ' + w1.split('').map((ch, j) => ch + '=' + pos[j]).join(', '), 'Sum = ' + sum] }); },
    (r, i, c) => { const k = R(r, 1, 4); const w1 = CW[i % CW.length], w2 = CW[(i + 9) % CW.length];
      return c.buildMCQ({ r, stem: 'In a code language, "' + w1 + '" is written as "' + rev(sh(w1, k)) + '". How will "' + w2 + '" be written?', right: rev(sh(w2, k)), wrong: [sh(rev(w2), k), rev(w2), sh(w2, k)], explanation: 'Code = ' + rev(sh(w2, k)) + '.', steps: [w1 + ' -> shift +' + k + ' -> ' + sh(w1, k) + ' -> reverse -> ' + rev(sh(w1, k)), 'Apply both steps to ' + w2 + ':', w2 + ' -> ' + sh(w2, k) + ' -> ' + rev(sh(w2, k))] }); },
  ];
  return T[i % T.length](r, i, c);
};

const BR = [
  ['Pointing to a photograph, Ravi said, "She is the daughter of my grandfather\'s only son." How is the girl related to Ravi?', 'Sister', 'Cousin', 'Aunt', 'Niece', 'grandfather\'s only son = Ravi\'s father; his daughter = Ravi\'s sister'],
  ['A is B\'s sister. C is B\'s mother. D is C\'s father. How is A related to D?', 'Granddaughter', 'Daughter', 'Grandmother', 'Mother', 'C is A\'s mother and D is C\'s father, so A is D\'s granddaughter'],
  ['P is the brother of Q. Q is the sister of R. R is the father of S. How is P related to S?', 'Uncle', 'Father', 'Brother', 'Grandfather', 'P is brother of Q, Q is sister of R -> P is R\'s sibling; R is S\'s father, so P is S\'s uncle'],
  ['X\'s mother is the only daughter of Y\'s mother. How is X\'s mother related to Y?', 'Sister', 'Mother', 'Aunt', 'Daughter', 'only daughter of Y\'s mother = Y\'s sister; X\'s mother is Y\'s sister'],
  ['Introducing a man, a woman said, "His wife is the only daughter of my father." How is the man related to the woman?', 'Husband', 'Brother', 'Father', 'Father-in-law', 'only daughter of her father = the woman herself; so the man is her husband'],
  ['M is the father of N. N is the sister of O. O is the son of P. How is P related to M?', 'Wife', 'Sister', 'Brother', 'Cannot be determined', 'M is father of N and O; O is son of P, so P is the mother (M\'s wife)'],
  ['A + B means A is the mother of B; A - B means A is the brother of B. In the expression P + Q - R, how is P related to R?', 'Mother', 'Grandmother', 'Sister', 'Cannot be determined', 'P + Q: P is mother of Q; Q - R: Q is brother of R. So P is mother of R also'],
  ['A x B means A is the father of B; A + B means A is the wife of B. Which expression shows "F is the mother of K"?', 'F + H x K', 'F x H + K', 'H + F x K', 'K x H + F', 'F + H: F is wife of H; H x K: H is father of K -> F is mother of K'],
  ['If Neena says, "Anita\'s father Raman is the only son of my father-in-law Mahesh", how is Neena related to Anita?', 'Mother', 'Aunt', 'Grandmother', 'Sister', 'Raman is the only son of Mahesh; Neena is Raman\'s wife; so Neena is Anita\'s mother'],
  ['Deepak said, "That boy is the younger of the two brothers of the daughter of my father\'s wife." How is the boy related to Deepak?', 'Brother', 'Cousin', 'Son', 'Nephew', 'father\'s wife = mother; her daughter = Deepak\'s sister; her brother = Deepak\'s brother'],
];

G['Blood Relations'] = (r, i, c) => {
  const b = BR[i % BR.length];
  return c.buildMCQ({ r, stem: b[0], right: b[1], wrong: [b[2], b[3], b[4]], explanation: b[1] + '.', steps: ['Working: ' + b[5], '∴ Answer: ' + b[1]] });
};

G['Direction Sense'] = (r, i, c) => {
  const T = [
    (r, i, c) => { const a = R(r, 3, 10), b = R(r, 3, 10);
      return c.buildMCQ({ r, stem: 'A man walks ' + a + ' km towards North, then turns right and walks ' + b + ' km, then turns right again and walks ' + a + ' km. How far is he from the starting point?', right: b + ' km', wrong: [(a + b) + ' km', a + ' km', (2 * a) + ' km'], explanation: b + ' km.', steps: ['Path: ' + a + ' km North, ' + b + ' km East, ' + a + ' km South', 'North and South cancel; net = ' + b + ' km East', '∴ Distance from start = ' + b + ' km'] }); },
    (r, i, c) => { const t = PK(r, [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15]]);
      return c.buildMCQ({ r, stem: 'Ravi walks ' + t[0] + ' km towards East, then turns North and walks ' + t[1] + ' km. How far is he now from the starting point?', right: t[2] + ' km', wrong: [(t[0] + t[1]) + ' km', t[1] + ' km', (t[2] + 1) + ' km'], explanation: t[2] + ' km.', steps: ['East ' + t[0] + ' and North ' + t[1] + ' are perpendicular', 'Distance = sqrt(' + t[0] + '^2 + ' + t[1] + '^2) = sqrt(' + (t[0] * t[0] + t[1] * t[1]) + ')', '   = ' + t[2] + ' km'] }); },
    (r, i, c) => { const s = PK(r, [['morning', 'shadows fall to the West, opposite to the rising sun'], ['evening', 'shadows fall to the East, opposite to the setting sun']]);
      return c.buildMCQ({ r, stem: 'One ' + s[0] + ', Priya walks towards the North. In which direction does her shadow fall?', right: s[1], wrong: ['To the North, ahead of her', 'No shadow in the ' + s[0], 'Directly below her'], explanation: s[1] + '.', steps: ['Sun is opposite the shadow at all times', 'In the ' + s[0] + ' the sun is behind the North direction', '∴ ' + s[1]] }); },
    (r, i, c) => { const d = PK(r, [['North', 'East'], ['East', 'South'], ['South', 'West'], ['West', 'North']]);
      return c.buildMCQ({ r, stem: 'A person facing ' + d[0] + ' turns 90 degrees clockwise, then 180 degrees anticlockwise. Which direction is he facing now?', right: d[1], wrong: [d[0], 'Exactly opposite ' + d[1], 'Cannot be determined'], explanation: d[1] + '.', steps: ['Start: ' + d[0], 'Clockwise 90: moves one step right', 'Anticlockwise 180: moves two steps left, net one step right overall', '∴ Final = ' + d[1]] }); },
    (r, i, c) => { const a = R(r, 4, 9), b = R(r, 4, 9);
      return c.buildMCQ({ r, stem: 'A girl cycles ' + a + ' km West, then ' + b + ' km South, then ' + a + ' km East. In which direction and how far is she from the start?', right: b + ' km South', wrong: [b + ' km North', (a + b) + ' km South-West', a + ' km West'], explanation: b + ' km South.', steps: ['West ' + a + ' and East ' + a + ' cancel out', 'Net displacement = ' + b + ' km South', '∴ She is ' + b + ' km South of start'] }); },
    (r, i, c) => { const a = R(r, 2, 6), b = R(r, 2, 6);
      return c.buildMCQ({ r, stem: 'Sunita walks ' + a + ' km South, turns left and walks ' + b + ' km, turns left again and walks ' + a + ' km. In which direction is she from her starting point?', right: 'East', wrong: ['West', 'North', 'South'], explanation: 'East.', steps: ['South ' + a + ' km -> left = East ' + b + ' km -> left = North ' + a + ' km', 'North-South legs cancel; East ' + b + ' km remains', '∴ She is East of the start'] }); },
  ];
  return T[i % T.length](r, i, c);
};

G['Seating Arrangement'] = (r, i, c) => {
  const T = [
    (r, i, c) => { const p = PK(r, [['A', 'B', 'C', 'D', 'E'], ['P', 'Q', 'R', 'S', 'T'], ['M', 'N', 'O', 'P2', 'Q2']]);
      return c.buildMCQ({ r, stem: p[0] + ', ' + p[1] + ', ' + p[2] + ', ' + p[3] + ' and ' + p[4] + ' are sitting in a row facing North. ' + p[1] + ' is to the immediate right of ' + p[0] + '. ' + p[2] + ' is between ' + p[3] + ' and ' + p[4] + '. ' + p[4] + ' is at the extreme left end. Who sits in the middle?', right: p[2], wrong: [p[3], p[1], p[0]], explanation: p[2] + ' sits in the middle.', steps: [p[4] + ' is extreme left (position 1)', p[2] + ' between ' + p[3] + ' and ' + p[4] + ' => ' + p[2] + ' pos 2, ' + p[3] + ' pos 3', p[0] + ' pos 4, ' + p[1] + ' pos 5 (right of ' + p[0] + ')', 'Order: ' + p[4] + ', ' + p[2] + ', ' + p[3] + ', ' + p[0] + ', ' + p[1], '∴ Middle = ' + p[2]] }); },
    (r, i, c) => { const n = PK(r, [6, 7, 8]);
      return c.buildMCQ({ r, stem: 'In a row of ' + n + ' students, Rahul is 7th from the left and Sita is ' + (n - 3) + 'th from the right. How many students are between them?', right: String(n - 7 - (n - 3) - 1 < 0 ? 0 : n - 7 - (n - 3) - 1), wrong: ['1', '2', '3'], explanation: 'Between = ' + (n - 7 - (n - 3) - 1 < 0 ? 0 : n - 7 - (n - 3) - 1) + '.', steps: ['Rahul position = 7 from left', 'Sita position = ' + (n - 3) + ' from right = ' + (n - (n - 3) + 1) + ' from left', 'Between = ' + (n - (n - 3) + 1) + ' - 7 - 1 = ' + (n - 7 - (n - 3) - 1 < 0 ? 0 : n - 7 - (n - 3) - 1)] }); },
    (r, i, c) => { const nm = PK(r, [[5, 3], [9, 6], [12, 8]]);
      return c.buildMCQ({ r, stem: 'In a class, Mohan ranks ' + nm[0] + 'th from the top and ' + nm[1] + 'th from the bottom. How many students are in the class?', right: String(nm[0] + nm[1] - 1), wrong: [String(nm[0] + nm[1]), String(nm[0] + nm[1] + 1), String(nm[0] * nm[1])], explanation: 'Total = ' + (nm[0] + nm[1] - 1) + '.', steps: ['Top rank = ' + nm[0] + ' means ' + (nm[0] - 1) + ' students above', 'Bottom rank = ' + nm[1] + ' means ' + (nm[1] - 1) + ' below', 'Total = ' + (nm[0] - 1) + ' + 1 (Mohan) + ' + (nm[1] - 1), '   = ' + (nm[0] + nm[1] - 1)] }); },
    (r, i, c) => { const k = R(r, 3, 6); const x = R(r, 2, k - 1);
      return c.buildMCQ({ r, stem: 'A, B, C, D, E and F sit around a circular table facing the centre. A is opposite D, and B is opposite E. Who is opposite C?', right: 'F', wrong: ['D', 'E', 'Cannot be determined'], explanation: 'F is opposite C.', steps: ['Circular table: 3 opposite pairs', 'A-D and B-E are two pairs', 'Remaining C and F must form the third pair', '∴ F is opposite C'] }); },
    (r, i, c) => { const nm = ['Ravi', 'Kiran', 'Meena', 'Omar'];
      return c.buildMCQ({ r, stem: nm[0] + ' is taller than ' + nm[1] + '. ' + nm[2] + ' is shorter than ' + nm[1] + '. ' + nm[3] + ' is taller than ' + nm[0] + '. Who is the tallest?', right: nm[3], wrong: [nm[0], nm[1], nm[2]], explanation: nm[3] + ' is tallest.', steps: [nm[3] + ' > ' + nm[0] + ' > ' + nm[1] + ' > ' + nm[2], '∴ Tallest = ' + nm[3]] }); },
  ];
  return T[i % T.length](r, i, c);
};

G['Puzzles'] = (r, i, c) => {
  const T = [
    (r, i, c) => { const cols = PK(r, [['red', 'blue', 'green'], ['white', 'black', 'grey'], ['pink', 'yellow', 'orange']]);
      return c.buildMCQ({ r, stem: 'Three boxes are labelled "' + cols[0] + '", "' + cols[1] + '" and "' + cols[2] + '", but every label is wrong. Each box contains balls of only one colour. You draw one ball from the box labelled "' + cols[0] + '" and it is ' + cols[1] + '. What is inside the box labelled "' + cols[1] + '"?', right: cols[2] + ' balls', wrong: [cols[0] + ' balls', cols[1] + ' balls', 'Cannot be determined'], explanation: 'Label "' + cols[1] + '" box has ' + cols[2] + ' balls.', steps: ['Every label is wrong, so label "' + cols[0] + '" box is not ' + cols[0], 'Draw from label "' + cols[0] + '" gave ' + cols[1] + ' => that box = ' + cols[1] + ' balls', 'Label "' + cols[1] + '" box: not ' + cols[1] + ' (label wrong), not ' + cols[1] + ' (taken) => must be ' + cols[2], '∴ Label "' + cols[1] + '" = ' + cols[2] + ' balls, label "' + cols[2] + '" = ' + cols[0] + ' balls'] }); },
    (r, i, c) => { const d = R(r, 2, 4); const total = 10 + d * 2;
      return c.buildMCQ({ r, stem: 'A frog falls into a well ' + total + ' ft deep. Each day it climbs ' + d + ' ft but slips back 1 ft at night (except when it gets out). On which day does it escape?', right: 'Day ' + (Math.ceil((total - d) / (d - 1)) + 1), wrong: ['Day ' + Math.ceil(total / d), 'Day ' + total, 'Day ' + (Math.ceil((total - d) / (d - 1)) + 2)], explanation: 'Escapes on day ' + (Math.ceil((total - d) / (d - 1)) + 1) + '.', steps: ['Net climb per full day = ' + d + ' - 1 = ' + (d - 1) + ' ft', 'On the last day it climbs out without slipping', 'Needs to reach ' + total + ' ft: after day N-1 it is at ' + total + ' - ' + d + ' ft', 'Days needed = ' + (Math.ceil((total - d) / (d - 1)) + 1)] }); },
    (r, i, c) => { const n = PK(r, [['priest', 'doctor', 'lawyer'], ['teacher', 'engineer', 'banker']]);
      return c.buildMCQ({ r, stem: 'A, B and C are a ' + n[0] + ', ' + n[1] + ' and ' + n[2] + ' (not in order). A is not the ' + n[0] + '. C is not the ' + n[1] + ' or ' + n[2] + '. Who is the ' + n[1] + '?', right: 'A', wrong: ['B', 'C', 'Cannot be determined'], explanation: 'A is the ' + n[1] + '.', steps: ['C is not ' + n[1] + ' and not ' + n[2] + ' => C is ' + n[0], 'A is not ' + n[0] + ' (taken by C) => A is ' + n[1], '∴ B is ' + n[2]] }); },
    (r, i, c) => { const w = PK(r, [['Ravi', 'Suresh', 'Amit'], ['Neeta', 'Pooja', 'Ritu']]); const h = PK(r, [[5, 7, 9], [4, 6, 8]]);
      return c.buildMCQ({ r, stem: w[0] + ' is taller than ' + w[1] + ' but shorter than ' + w[2] + '. ' + w[1] + ' is 150 cm tall. If ' + w[2] + ' is ' + h[2] + ' cm taller than ' + w[0] + ', and ' + w[0] + ' is ' + h[0] + ' cm taller than ' + w[1] + ', how tall is ' + w[2] + '?', right: (150 + h[0] + h[2]) + ' cm', wrong: [(150 + h[0]) + ' cm', (150 + h[2]) + ' cm', (150 + h[0] + h[2] + 5) + ' cm'], explanation: w[2] + ' = ' + (150 + h[0] + h[2]) + ' cm.', steps: [w[1] + ' = 150 cm', w[0] + ' = 150 + ' + h[0] + ' = ' + (150 + h[0]) + ' cm', w[2] + ' = ' + (150 + h[0]) + ' + ' + h[2] + ' = ' + (150 + h[0] + h[2]) + ' cm'] }); },
    (r, i, c) => { const n = PK(r, [['apple', 'banana', 'orange'], ['dog', 'cat', 'rabbit']]); const c2 = PK(r, [['red', 'yellow', 'orange'], ['brown', 'white', 'black']]);
      return c.buildMCQ({ r, stem: 'A, B, C each have a different ' + n[0] + ' and a different ' + n[1] + ' ' + n[2] + '. A does not have the ' + c2[0] + ' ' + n[0] + '. B has the ' + c2[1] + ' ' + n[0] + ' and the ' + c2[2] + ' ' + n[2] + '. C has the ' + c2[0] + ' ' + n[2] + '. What does A have?', right: c2[2] + ' ' + n[0] + ' and ' + c2[1] + ' ' + n[2], wrong: [c2[0] + ' ' + n[0] + ' and ' + c2[2] + ' ' + n[2], c2[1] + ' ' + n[0] + ' and ' + c2[0] + ' ' + n[2], 'Cannot be determined'], explanation: 'A has ' + c2[2] + ' ' + n[0] + ' and ' + c2[1] + ' ' + n[2] + '.', steps: ['B has ' + c2[1] + ' ' + n[0] + ' and ' + c2[2] + ' ' + n[2], 'C has ' + c2[0] + ' ' + n[2], 'Remaining: A has ' + c2[2] + ' ' + n[0] + ' and ' + c2[1] + ' ' + n[2]] }); },
    (r, i, c) => { const t = PK(r, [[10, 20, 30], [15, 25, 35]]);
      return c.buildMCQ({ r, stem: 'Three friends have ' + t[0] + ', ' + t[1] + ' and ' + t[2] + ' marbles. After sharing equally, how many does each get?', right: String(Math.round((t[0] + t[1] + t[2]) / 3)), wrong: [String(Math.round((t[0] + t[1] + t[2]) / 2)), String(t[0] + t[1] + t[2]), String(Math.round((t[0] + t[1] + t[2]) / 3) + 5)], explanation: 'Each gets ' + Math.round((t[0] + t[1] + t[2]) / 3) + ' marbles.', steps: ['Total = ' + t[0] + ' + ' + t[1] + ' + ' + t[2] + ' = ' + (t[0] + t[1] + t[2]), 'Each = ' + (t[0] + t[1] + t[2]) + ' / 3 = ' + Math.round((t[0] + t[1] + t[2]) / 3)] }); },
  ];
  return T[i % T.length](r, i, c);
};

G['Statement & Conclusions'] = (r, i, c) => {
  const T = [
    (r, i, c) => {
      return c.buildMCQ({ r, stem: 'Statement: "The best way to lose weight is regular exercise and a balanced diet." Conclusions: I. Crash diets are not effective long term. II. Exercise alone without diet control is incomplete. Which follows?', right: 'Both I and II follow', wrong: ['Only I follows', 'Only II follows', 'Neither follows'], explanation: 'Both follow.', steps: ['Statement links exercise AND diet as "best way"', 'I: implies other methods are less effective — follows', 'II: "and" implies both needed — follows', '∴ Both I and II follow'] }); },
    (r, i, c) => { const p = PK(r, [['X city', 'pollution'], ['Y town', 'traffic'], ['Z district', 'water shortage']]);
      return c.buildMCQ({ r, stem: 'Statement: "The government has decided to increase public transport in ' + p[0] + ' to reduce ' + p[1] + '." Conclusions: I. ' + p[1] + ' is a problem in ' + p[0] + '. II. Private vehicles contribute to ' + p[1] + '. Which follows?', right: 'Both I and II follow', wrong: ['Only I follows', 'Only II follows', 'Neither follows'], explanation: 'Both follow.', steps: ['Government action implies ' + p[1] + ' is a real problem in ' + p[0] + ' => I follows', 'Public transport replaces private vehicles, targeting ' + p[1] + ' => II follows', '∴ Both I and II follow'] }); },
    (r, i, c) => {
      return c.buildMCQ({ r, stem: 'Statement: "All employees must attend the safety training on Friday." Conclusions: I. Friday training is compulsory for employees. II. No employee may skip the training. Which follows?', right: 'Both I and II follow', wrong: ['Only I follows', 'Only II follows', 'Neither follows'], explanation: 'Both follow — "must" means compulsory.', steps: ['"Must attend" = compulsory => I follows', 'Compulsory for all => no one may skip => II follows', '∴ Both follow'] }); },
    (r, i, c) => {
      return c.buildMCQ({ r, stem: 'Statement: "Money spent on advertising increased by 40% this year, yet sales remained unchanged." Conclusions: I. Advertising did not boost sales. II. The company wasted money on advertising. Which follows?', right: 'Only conclusion I follows', wrong: ['Only conclusion II follows', 'Both I and II follow', 'Neither I nor II follows'], explanation: 'Only I follows.', steps: ['Sales unchanged despite more ad spend => this year ads did not boost sales => I follows', 'II: "wasted" is a judgement; ads may have prevented decline => does NOT follow', '∴ Only I follows'] }); },
    (r, i, c) => { const p = PK(r, [['Company X', 'profit'], ['School Y', 'enrollment'], ['Hospital Z', 'patients']]);
      return c.buildMCQ({ r, stem: 'Statement: "' + p[0] + ' has seen a 25% increase in ' + p[1] + ' this quarter." Conclusions: I. ' + p[0] + ' performed better than last quarter. II. ' + p[0] + ' is the best performer in its sector. Which follows?', right: 'Only conclusion I follows', wrong: ['Only conclusion II follows', 'Both I and II follow', 'Neither I nor II follows'], explanation: 'Only I follows.', steps: ['25% increase in ' + p[1] + ' => better performance than last quarter => I follows', 'No comparison with other companies/sector data => II does not follow', '∴ Only I follows'] }); },
    (r, i, c) => { const p = PK(r, [['City A', 'crime rate'], ['Town B', 'accidents'], ['Village C', 'pollution']]);
      return c.buildMCQ({ r, stem: 'Statement: "The ' + p[1] + ' in ' + p[0] + ' has decreased by 30% after new traffic rules." Conclusions: I. New traffic rules reduced ' + p[1] + '. II. ' + p[0] + ' is now completely safe. Which follows?', right: 'Only conclusion I follows', wrong: ['Only conclusion II follows', 'Both I and II follow', 'Neither I nor II follows'], explanation: 'Only I follows.', steps: ['30% decrease after new rules => rules likely helped => I follows', '"Completely safe" is too strong; 30% reduction does not mean zero => II does not follow', '∴ Only I follows'] }); },
    (r, i, c) => {
      return c.buildMCQ({ r, stem: 'Statement: "All students who passed the exam attended regular classes." Conclusions: I. Attending regular classes helps in passing. II. No student who skipped classes passed. Which follows?', right: 'Both I and II follow', wrong: ['Only I follows', 'Only II follows', 'Neither follows'], explanation: 'Both follow.', steps: ['All who passed attended classes => attendance linked to success => I follows', 'If all passers attended, then non-attendees did not pass => II follows (contrapositive)', '∴ Both I and II follow'] }); },
    (r, i, c) => { const p = PK(r, [['The train', 'delayed'], ['The flight', 'cancelled'], ['The bus', 'late']]);
      return c.buildMCQ({ r, stem: 'Statement: "' + p[0] + ' was ' + p[1] + ' due to heavy rain." Conclusions: I. Heavy rain caused the ' + p[1] + '. II. All trains/flights/buses were ' + p[1] + '. Which follows?', right: 'Only conclusion I follows', wrong: ['Only conclusion II follows', 'Both I and II follow', 'Neither I nor II follows'], explanation: 'Only I follows.', steps: ['Statement says rain caused this ' + p[0] + ' to be ' + p[1] + ' => I follows', 'Only one ' + p[0] + ' mentioned; "all" is too broad => II does not follow', '∴ Only I follows'] }); },
    (r, i, c) => {
      return c.buildMCQ({ r, stem: 'Statement: "The company hired 50 new employees this month." Conclusions: I. The company is expanding. II. The company fired 50 employees. Which follows?', right: 'Only conclusion I follows', wrong: ['Only conclusion II follows', 'Both I and II follow', 'Neither I nor II follows'], explanation: 'Only I follows (hiring suggests expansion, but firing is not mentioned).', steps: ['50 new hires => likely expansion => I follows', 'No mention of firing => II does not follow', '∴ Only I follows'] }); },
  ];
  return T[i % T.length](r, i, c);
};

G['Statement & Assumptions'] = (r, i, c) => {
  const T = [
    (r, i, c) => {
      return c.buildMCQ({ r, stem: 'Statement: "Buy shampoo X to get strong, shiny hair." — an advertisement. Assumption: I. People desire strong, shiny hair. II. Shampoo X delivers what it promises. Which is assumed?', right: 'Both I and II are assumed', wrong: ['Only I is assumed', 'Only II is assumed', 'Neither is assumed'], explanation: 'Both are assumed.', steps: ['Ad appeals to desire for strong shiny hair => I assumed', 'Ad claims product works => II assumed', '∴ Both I and II'] }); },
    (r, i, c) => {
      return c.buildMCQ({ r, stem: 'Statement: "Please do not use the office printer for personal work." — a notice. Assumption: I. Employees have been using it personally. II. Personal use harms the office. Which is assumed?', right: 'Only II is assumed', wrong: ['Only I is assumed', 'Both I and II are assumed', 'Neither is assumed'], explanation: 'Only II assumed.', steps: ['The notice can be preventive, not a reaction => I not necessarily assumed', 'Restriction implies personal use is undesirable/harmful => II assumed', '∴ Only II'] }); },
    (r, i, c) => {
      return c.buildMCQ({ r, stem: 'Statement: "Join the new gym at half price — first 100 members only!" Assumption: I. People are price-sensitive while choosing gyms. II. More than 100 people will try to join. Which is assumed?', right: 'Both I and II are assumed', wrong: ['Only I is assumed', 'Only II is assumed', 'Neither is assumed'], explanation: 'Both assumed.', steps: ['Discount offer assumes price matters to customers => I assumed', 'Limiting to 100 assumes demand will exceed 100 => II assumed', '∴ Both I and II'] }); },
    (r, i, c) => {
      return c.buildMCQ({ r, stem: 'Statement: "The Principal thanked the students for keeping the campus clean." Assumption: I. Students participated in keeping the campus clean. II. Cleanliness drives were organised earlier. Which is assumed?', right: 'Only I is assumed', wrong: ['Only II is assumed', 'Both I and II are assumed', 'Neither is assumed'], explanation: 'Only I assumed.', steps: ['Thanking students assumes they contributed => I assumed', 'No mention of earlier drives => II not assumed', '∴ Only I'] }); },
    (r, i, c) => { const p = PK(r, [['Use helmet', 'head injury'], ['Wash hands', 'infection'], ['Save money', 'financial emergency']]);
      return c.buildMCQ({ r, stem: 'Statement: "' + p[0] + ' to avoid ' + p[1] + '." Assumption: I. ' + p[0] + ' can prevent ' + p[1] + '. II. ' + p[1] + ' is a real risk. Which is assumed?', right: 'Both I and II are assumed', wrong: ['Only I is assumed', 'Only II is assumed', 'Neither is assumed'], explanation: 'Both assumed.', steps: ['Advice to ' + p[0] + ' assumes it works => I assumed', 'Warning about ' + p[1] + ' assumes it is a real risk => II assumed', 'Both I and II'] }); },
    (r, i, c) => { const p = PK(r, [['Drink water', 'healthy'], ['Exercise daily', 'fit'], ['Read books', 'knowledgeable']]);
      return c.buildMCQ({ r, stem: 'Statement: "' + p[0] + ' to become ' + p[1] + '." Assumption: I. ' + p[0] + ' leads to being ' + p[1] + '. II. Everyone wants to be ' + p[1] + '. Which is assumed?', right: 'Only I is assumed', wrong: ['Only II is assumed', 'Both I and II are assumed', 'Neither is assumed'], explanation: 'Only I assumed.', steps: ['Statement claims ' + p[0] + ' => ' + p[1] + ' => I assumed', 'Not everyone may want to be ' + p[1] + ' => II not assumed', 'Only I'] }); },
    (r, i, c) => {
      return c.buildMCQ({ r, stem: 'Statement: "The government banned plastic bags to reduce pollution." Assumption: I. Plastic bags contribute to pollution. II. The ban will be effective. Which is assumed?', right: 'Both I and II are assumed', wrong: ['Only I is assumed', 'Only II is assumed', 'Neither is assumed'], explanation: 'Both assumed.', steps: ['Ban on plastic bags assumes they cause pollution => I assumed', 'Ban assumes it will help reduce pollution => II assumed', '∴ Both I and II'] }); },
    (r, i, c) => { const p = PK(r, [['Eat vegetables', 'strong bones'], ['Sleep early', 'more energy', '']]);
      return c.buildMCQ({ r, stem: 'Statement: "' + p[0] + ' for ' + p[1] + '." Assumption: I. ' + p[0] + ' helps achieve ' + p[1] + '. II. People care about ' + p[1] + '. Which is assumed?', right: 'Only I is assumed', wrong: ['Only II is assumed', 'Both I and II are assumed', 'Neither is assumed'], explanation: 'Only I assumed.', steps: ['Statement links ' + p[0] + ' to ' + p[1] + ' => I assumed', 'Not everyone may care about ' + p[1] + ' => II not assumed', 'Only I'] }); },
    (r, i, c) => {
      return c.buildMCQ({ r, stem: 'Statement: "The school introduced online classes during the pandemic." Assumption: I. Students have internet access. II. Online classes are as effective as offline. Which is assumed?', right: 'Only I is assumed', wrong: ['Only II is assumed', 'Both I and II are assumed', 'Neither is assumed'], explanation: 'Only I assumed (introducing online classes assumes access, but not necessarily equal effectiveness).', steps: ['Online classes require internet => I assumed', 'No claim about effectiveness compared to offline => II not assumed', '∴ Only I'] }); },
  ];
  return T[i % T.length](r, i, c);
};

G['Data Sufficiency'] = (r, i, c) => {
  const T = [
    (r, i, c) => {
      return c.buildMCQ({ r, stem: 'What is the age of Ramesh? I. Ramesh is 5 years older than Suresh. II. Suresh is 20 years old.', right: 'Both statements together are sufficient', wrong: ['Statement I alone is sufficient', 'Statement II alone is sufficient', 'Both together are not sufficient'], explanation: 'Both together: 20 + 5 = 25.', steps: ['I alone: Ramesh = Suresh + 5, but Suresh unknown', 'II alone: Suresh = 20, Ramesh unknown', 'Combining: Ramesh = 20 + 5 = 25 => both needed'] }); },
    (r, i, c) => {
      return c.buildMCQ({ r, stem: 'What is the speed of the train? I. It covers 180 km in 3 hours. II. Its length is 200 metres.', right: 'Statement I alone is sufficient', wrong: ['Statement II alone is sufficient', 'Both together are needed', 'Both together are not sufficient'], explanation: 'I alone: 180/3 = 60 km/h.', steps: ['Speed = distance / time = 180 / 3 = 60 km/h => I sufficient', 'Length of train is irrelevant to speed => II useless', '∴ I alone is sufficient'] }); },
    (r, i, c) => {
      return c.buildMCQ({ r, stem: 'Is x greater than 5? I. x + 3 > 8. II. x is a positive integer.', right: 'Statement I alone is sufficient', wrong: ['Statement II alone is sufficient', 'Both together are needed', 'Both together are not sufficient'], explanation: 'I alone: x > 5, so yes.', steps: ['I: x + 3 > 8 => x > 5 => answers the question alone', 'II: x positive tells nothing about > 5', '∴ I alone is sufficient'] }); },
    (r, i, c) => {
      return c.buildMCQ({ r, stem: 'What is the two-digit number? I. The sum of its digits is 9. II. The digit at tens place is twice the digit at units place.', right: 'Both statements together are sufficient', wrong: ['Statement I alone is sufficient', 'Statement II alone is sufficient', 'Both together are not sufficient'], explanation: 'Both: t + u = 9, t = 2u => u = 3, t = 6 => 63.', steps: ['I alone: many numbers fit (18, 27, 36, 45, ...)', 'II alone: 63, 42, 21 all fit', 'Combine: t = 2u and t + u = 9 => 3u = 9 => u = 3, t = 6', '∴ Number = 63 — both needed'] }); },
  ];
  // Additional Data Sufficiency templates for variety
  T.push(...[
    (r, i, c) => { const a = c.ri(r, 15, 40), b = c.ri(r, 5, 15);
      return c.buildMCQ({ r, stem: 'What is the value of x? I. x + y = ' + (a + b) + '. II. y = ' + b + '.', right: 'Both statements together are sufficient', wrong: ['Statement I alone is sufficient', 'Statement II alone is sufficient', 'Both together are not sufficient'], explanation: 'Both: x = ' + (a + b) + ' - ' + b + ' = ' + a + '.', steps: ['I alone: x + y = ' + (a + b) + ', but y unknown', 'II alone: y = ' + b + ', x unknown', 'Combining: x = ' + (a + b) + ' - ' + b + ' = ' + a + ' => both needed'] }); },
    (r, i, c) => { const r2 = c.ri(r, 3, 12);
      return c.buildMCQ({ r, stem: 'What is the area of the circle? I. The radius is ' + r2 + '. II. The circumference is ' + (2 * Math.PI * r2).toFixed(1) + '.', right: 'Either statement alone is sufficient', wrong: ['Both together are needed', 'Statement I alone is sufficient', 'Statement II alone is sufficient'], explanation: 'Both give same info (area = πr²).', steps: ['I: Area = π x ' + r2 + '² = ' + (Math.PI * r2 * r2).toFixed(1), 'II: Circumference = 2πr => r = ' + r2 + ', same area', '∴ Either alone is sufficient'] }); },
    (r, i, c) => { const n = c.ri(r, 20, 50);
      return c.buildMCQ({ r, stem: 'Is the number ' + n + ' divisible by 6? I. It is divisible by 2. II. It is divisible by 3.', right: 'Both statements together are sufficient', wrong: ['Statement I alone is sufficient', 'Statement II alone is sufficient', 'Both together are not sufficient'], explanation: 'Both: divisible by 2 and 3 => divisible by 6.', steps: ['I alone: divisible by 2, but may not be by 3', 'II alone: divisible by 3, but may not be by 2', 'Both: divisible by 2 and 3 => divisible by 6'] }); },
    (r, i, c) => { const sp = c.ri(r, 100, 500);
      return c.buildMCQ({ r, stem: 'What is the profit percentage? I. Cost price is Rs.' + sp + '. II. Selling price is Rs.' + Math.round(sp * 1.2) + '.', right: 'Both statements together are sufficient', wrong: ['Statement I alone is sufficient', 'Statement II alone is sufficient', 'Both together are not sufficient'], explanation: 'Both: Profit% = (SP-CP)/CP x 100.', steps: ['I alone: CP known, SP unknown', 'II alone: SP known, CP unknown', 'Both: Profit = ' + Math.round(sp * 1.2) + ' - ' + sp + ' = ' + Math.round(sp * 0.2), 'Profit% = ' + Math.round(sp * 0.2) + '/' + sp + ' x 100 = 20%'] }); },
    (r, i, c) => { const a = c.ri(r, 10, 30), b = c.ri(r, 5, 15);
      return c.buildMCQ({ r, stem: 'What is the speed of the car? I. It covers ' + (a + b) + ' km in 2 hours. II. It covers ' + a + ' km in 1 hour and ' + b + ' km in the next hour.', right: 'Either statement alone is sufficient', wrong: ['Both together are needed', 'Statement I alone is sufficient', 'Statement II alone is sufficient'], explanation: 'Both give speed = ' + (a + b) + '/2 km/h.', steps: ['I: Speed = ' + (a + b) + '/2 = ' + ((a + b) / 2) + ' km/h', 'II: Speed = ' + a + '/1 = ' + a + ' and ' + b + '/1 = ' + b + ' (average same)', '∴ Either alone gives the speed'] }); },
    (r, i, c) => { const n = c.ri(r, 5, 15);
      return c.buildMCQ({ r, stem: 'What is the average of ' + n + ' numbers? I. The sum of the numbers is ' + (n * c.ri(r, 10, 30)) + '. II. Each number is ' + c.ri(r, 10, 30) + '.', right: 'Either statement alone is sufficient', wrong: ['Both together are needed', 'Statement I alone is sufficient', 'Statement II alone is sufficient'], explanation: 'Both give the average.', steps: ['I: Average = sum/' + n + ' = ' + (n * 20) + '/' + n + ' = 20', 'II: All numbers equal => average = that number', '∴ Either alone is sufficient'] }); },
  ]);
  return T[i % T.length](r, i, c);
};

G['Analogy'] = (r, i, c) => {
  const T = [
    (r, i, c) => { const pr = PK(r, [['Doctor : Hospital', 'Teacher : School'], ['Chef : Kitchen', 'Farmer : Field'], ['Pilot : Cockpit', 'Lawyer : Court']]);
      return c.buildMCQ({ r, stem: pr[0] + ' :: ' + pr[1].split(' : ')[0] + ' : ?', right: pr[1].split(' : ')[1], wrong: [pr[0].split(' : ')[1], 'Office', 'Hospital'], explanation: pr[1] + '.', steps: ['Doctor works in a Hospital', 'Similarly, a ' + pr[1].split(' : ')[0] + ' works in a ' + pr[1].split(' : ')[1], '∴ Answer: ' + pr[1]] }); },
    (r, i, c) => { const pr = PK(r, [['Book : Read', 'Food : Eat'], ['Song : Sing', 'Letter : Write'], ['Car : Drive', 'Boat : Sail']]);
      return c.buildMCQ({ r, stem: pr[0] + ' :: ' + pr[1].split(' : ')[0] + ' : ?', right: pr[1].split(' : ')[1], wrong: [pr[0].split(' : ')[1], 'Buy', 'Listen'], explanation: pr[1] + '.', steps: ['A Book is Read', 'Similarly, ' + pr[1].split(' : ')[0] + ' is ' + pr[1].split(' : ')[1], '∴ Answer: ' + pr[1]] }); },
    (r, i, c) => { const pr = PK(r, [['Cub : Lion', 'Kitten : Cat'], ['Puppy : Dog', 'Calf : Cow']]);
      return c.buildMCQ({ r, stem: pr[0] + ' :: ' + pr[1].split(' : ')[0] + ' : ?', right: pr[1].split(' : ')[1], wrong: [pr[0].split(' : ')[1], 'Kennel', 'Zoo'], explanation: pr[1] + '.', steps: ['Cub is the young one of a Lion', 'Similarly, ' + pr[1].split(' : ')[0] + ' is the young one of a ' + pr[1].split(' : ')[1], '∴ Answer: ' + pr[1]] }); },
    (r, i, c) => { const n = PK(r, [[3, 9], [4, 16], [5, 25], [6, 36], [7, 49]]);
      return c.buildMCQ({ r, stem: n[0] + ' : ' + n[1] + ' :: ' + (n[0] + 3) + ' : ?', right: String((n[0] + 3) * (n[0] + 3)), wrong: [String((n[0] + 3) * 3), String(n[1] + 9), String((n[0] + 3) * (n[0] + 3) + (n[0] + 3))], explanation: (n[0] + 3) + '^2 = ' + ((n[0] + 3) * (n[0] + 3)) + '.', steps: [n[0] + ' : ' + n[1] + ' => second = first squared (' + n[0] + '^2 = ' + n[1] + ')', 'Same pattern: ' + (n[0] + 3) + '^2 = ' + ((n[0] + 3) * (n[0] + 3)), '∴ Answer: ' + ((n[0] + 3) * (n[0] + 3))] }); },
  ];
  return T[i % T.length](r, i, c);
};

G['Odd One Out'] = (r, i, c) => {
  const T = [
    (r, i, c) => { const s = PK(r, [['Mango, Apple, Banana, Potato', 'Potato', 'vegetable; rest are fruits'], ['Rose, Lotus, Marigold, Oak', 'Oak', 'a tree; rest are flowers'], ['Gold, Silver, Iron, Diamond', 'Diamond', 'non-metal; rest are metals']]);
      return c.buildMCQ({ r, stem: 'Find the odd one out: ' + s[0] + '.', right: s[1], wrong: [s[0].split(', ')[0], s[0].split(', ')[1], s[0].split(', ')[2]], explanation: s[1] + ' — ' + s[2] + '.', steps: ['Group them by category', s[1] + ' is ' + s[2], '∴ Odd one = ' + s[1]] }); },
    (r, i, c) => { const s = PK(r, [['2, 3, 5, 8, 11', '8', 'only even number; rest are odd (and 8 breaks prime pattern)'], ['121, 144, 169, 200', '200', 'not a perfect square; rest are squares'], ['17, 23, 29, 33', '33', '33 = 3 x 11 is not prime; rest are primes']]);
      return c.buildMCQ({ r, stem: 'Find the odd one out: ' + s[0] + '.', right: s[1], wrong: [s[0].split(', ')[0], s[0].split(', ')[1], s[0].split(', ')[3]], explanation: s[1] + ' — ' + s[2] + '.', steps: ['Check each number', s[1] + ': ' + s[2], '∴ Odd one = ' + s[1]] }); },
    (r, i, c) => { const s = PK(r, [['Bicycle, Bus, Car, Truck', 'Bicycle', 'no engine; rest are motor vehicles'], ['Sparrow, Bat, Crow, Pigeon', 'Bat', 'a mammal; rest are birds'], ['Square, Rectangle, Circle, Triangle', 'Circle', 'no straight sides; rest are polygons']]);
      return c.buildMCQ({ r, stem: 'Find the odd one out: ' + s[0] + '.', right: s[1], wrong: [s[0].split(', ')[0], s[0].split(', ')[1], s[0].split(', ')[2]], explanation: s[1] + ' — ' + s[2] + '.', steps: ['Compare shared properties', s[1] + ' is ' + s[2], '∴ Odd one = ' + s[1]] }); },
  ];
  return T[i % T.length](r, i, c);
};

G['Venn Diagrams'] = (r, i, c) => {
  const T = [
    (r, i, c) => {
      return c.buildMCQ({ r, stem: 'In a class of 60 students, 35 like Maths, 30 like Science and 15 like both. How many like only one of the two subjects?', right: '35', wrong: ['50', '45', '20'], explanation: 'Only one subject = 35 + 30 - 2(15) = 35.', steps: ['Only Maths = 35 - 15 = 20', 'Only Science = 30 - 15 = 15', 'Only one subject = 20 + 15 = 35'] }); },
    (r, i, c) => { const T2 = R(r, 40, 80), a = R(r, 20, T2 - 10), b = R(r, 10, a - 5); const both = a + b - T2; const neither = T2 - (a + b - both);
      return c.buildMCQ({ r, stem: 'In a survey of ' + T2 + ' people, ' + a + ' drink tea, ' + b + ' drink coffee, and everyone drinks at least one of them. ' + both + ' drink both. How many drink exactly one drink?', right: String(T2 - both), wrong: [String(T2), String(T2 - both + 2), String(a - b)], explanation: (T2 - both) + ' drink exactly one.', steps: ['Exactly tea only = ' + a + ' - ' + both + ' = ' + (a - both), 'Exactly coffee only = ' + b + ' - ' + both + ' = ' + (b - both), 'Exactly one = ' + (a - both) + ' + ' + (b - both) + ' = ' + (T2 - both)] }); },
    (r, i, c) => {
      return c.buildMCQ({ r, stem: 'Which Venn diagram relation is correct: Doctors, Men, Women?', right: 'Doctors and Men can overlap; Women is a separate circle that can also overlap Doctors', wrong: ['All three are completely separate circles', 'Men circle lies completely inside Doctors', 'Women lies completely inside Men'], explanation: 'Doctors can be men or women.', steps: ['A doctor can be a man or a woman', 'So Doctors overlaps both Men and Women', 'Men and Women do not overlap each other (in classic puzzles)'] }); },
    (r, i, c) => { const n = R(r, 25, 60), k = R(r, 8, n - 8);
      return c.buildMCQ({ r, stem: 'In a group of ' + n + ' people, ' + k + ' speak Hindi and everyone speaks English. How many speak both Hindi and English?', right: String(k), wrong: ['0', String(n - k), String(n)], explanation: k + ' — all Hindi speakers also speak English.', steps: ['Everyone speaks English', 'Hindi speakers = ' + k + ', and they also speak English', '∴ Both = ' + k] }); },
  ];
  return T[i % T.length](r, i, c);
};

const TCK = [
    (r, i, c) => { const h = c.ri(r, 1, 12), m = c.pk(r, [10, 20, 25, 30, 40, 50]); const hA = h * 30 + m * 0.5, mA = m * 6; let ang = Math.abs(hA - mA); if (ang > 180) ang = 360 - ang;
      return c.buildMCQ({ r, stem: 'Find the angle between the hour hand and the minute hand of a clock when the time is ' + h + ':' + (m < 10 ? '0' + m : m) + '.', right: ang + ' degrees', wrong: [(ang + 15) + ' degrees', (ang + 30) + ' degrees', (ang + 7.5) + ' degrees'], explanation: 'Angle = ' + ang + ' degrees.', steps: ['Hour hand from 12 = ' + h + ' x 30 + ' + m + ' x 0.5 = ' + hA + ' degrees', 'Minute hand from 12 = ' + m + ' x 6 = ' + mA + ' degrees', 'Angle = |' + hA + ' - ' + mA + '| = ' + ang + ' degrees'] }); },
    (r, i, c) => {
      return c.buildMCQ({ r, stem: 'At what time between 3 and 4 o\'clock do the hands of a clock coincide?', right: '16 4/11 minutes past 3', wrong: ['15 5/11 minutes past 3', '17 3/11 minutes past 3', '16 minutes past 3'], explanation: 'Hands coincide at 16 4/11 minutes past 3.', steps: ['At 3:00, hour hand is 3 x 30 = 90 degrees ahead', 'Minute hand gains 5.5 degrees/minute on hour hand', 'Time = 90 / 5.5 = 180/11 = 16 4/11 minutes'] }); },
    (r, i, c) => { const DN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']; const d = c.pk(r, [0, 1, 2, 3, 4, 5, 6]); const k = c.ri(r, 2, 13); const after = (d + k) % 7;
      return c.buildMCQ({ r, stem: 'If today is ' + DN[d] + ', what day of the week will it be after ' + k + ' days?', right: DN[after], wrong: [DN[(after + 1) % 7], DN[(after + 2) % 7], DN[(after + 3) % 7]], explanation: 'It will be ' + DN[after] + '.', steps: ['Today: ' + DN[d], 'Days ahead = ' + k + '  =>  ' + k + ' mod 7 = ' + (k % 7), DN[d] + ' + ' + (k % 7) + ' days = ' + DN[after]] }); },
    (r, i, c) => { const yy = c.pk(r, [1996, 2000, 2004, 2016, 2019, 2021, 2023, 2024]); const isLeap = (yy % 4 === 0 && yy % 100 !== 0) || yy % 400 === 0; const leap = isLeap ? yy : (yy % 4 === 0 ? yy : yy - yy % 4);
      return c.buildMCQ({ r, stem: 'Which of the following years is a leap year?', right: String(leap), wrong: [String(leap + 1), String(leap + 2), String(leap + 3)], explanation: leap + ' is a leap year.', steps: ['Rule: divisible by 4 (century years need /400)', leap + ' / 4 = ' + (leap / 4) + ' (exact, not a century year)', 'So ' + leap + ' is a leap year'] }); },
    (r, i, c) => { const h = c.ri(r, 3, 12);
      return c.buildMCQ({ r, stem: 'How many times do the hands of a clock coincide in ' + h + ' hours?', right: String(h), wrong: [String(h + 1), String(h * 2), String(h - 1)], explanation: 'Hands coincide ' + h + ' times in ' + h + ' hours.', steps: ['Hands coincide once every 12/11 hours (~65 5/11 min)', 'In ' + h + ' hours: ' + h + ' times'] }); },
    (r, i, c) => {
      return c.buildMCQ({ r, stem: 'How many days are there in a leap year?', right: '366', wrong: ['365', '364', '367'], explanation: 'Leap year has 366 days.', steps: ['Normal year: 365 days', 'Leap year: February has 29 days instead of 28', '365 + 1 = 366 days'] }); },
];
G['Clocks & Calendars'] = (r, i, c) => { return TCK[i % TCK.length](r, i, c); };

const TRK = [
    (r, i, c) => { const n = c.ri(r, 15, 40), rank = c.ri(r, 3, 12);
      return c.buildMCQ({ r, stem: 'In a class of ' + n + ' students, Rahul ranks ' + rank + 'th from the top. What is his rank from the bottom?', right: String(n - rank + 1), wrong: [String(n - rank), String(n - rank + 2), String(rank)], explanation: 'Rank from bottom = ' + (n - rank + 1) + '.', steps: ['Students below Rahul = ' + n + ' - ' + rank + ' = ' + (n - rank), 'Rank from bottom = ' + (n - rank) + ' + 1 = ' + (n - rank + 1)] }); },
    (r, i, c) => { const a = c.ri(r, 5, 20), b = c.ri(r, 2, a - 1);
      return c.buildMCQ({ r, stem: 'In a row of students, Ravi is ' + a + 'th from the left and ' + b + 'th from the right. How many students are there in the row?', right: String(a + b - 1), wrong: [String(a + b), String(a + b + 1), String(a + b - 2)], explanation: 'Total students = ' + (a + b - 1) + '.', steps: ['From left = ' + a + ', from right = ' + b, 'Total = ' + a + ' + ' + b + ' - 1 (Ravi counted twice)', '   = ' + (a + b - 1)] }); },
    (r, i, c) => { const p = c.ri(r, 5, 15), q = c.ri(r, 2, p - 1); const between = p - q - 1;
      return c.buildMCQ({ r, stem: 'A is ' + p + 'th and B is ' + q + 'th from the left end of a row (A after B). How many people are between A and B?', right: String(between), wrong: [String(between + 1), String(between + 2), String(p - q)], explanation: 'People between = ' + between + '.', steps: ['A at position ' + p + ', B at position ' + q, 'Between = ' + p + ' - ' + q + ' - 1 = ' + between] }); },
    (r, i, c) => { const a = c.ri(r, 3, 10), b = c.ri(r, 3, 10);
      return c.buildMCQ({ r, stem: 'In a class, A ranks ' + a + 'th from the top and ' + b + 'th from the bottom. How many students are there in the class?', right: String(a + b - 1), wrong: [String(a + b), String(a + b + 1), String(a + b - 2)], explanation: 'Total = ' + (a + b - 1) + '.', steps: ['A is counted once from top and once from bottom', 'Total = ' + a + ' + ' + b + ' - 1', '   = ' + (a + b - 1)] }); },
    (r, i, c) => { const t = c.ri(r, 21, 35);
      return c.buildMCQ({ r, stem: 'In a class of ' + t + ' students, Gita stands exactly in the middle. What is her position from the top?', right: String(Math.ceil(t / 2)), wrong: [String(Math.ceil(t / 2) + 1), String(Math.floor(t / 2) - 1), String(Math.floor(t / 2))], explanation: 'Middle position = ' + Math.ceil(t / 2) + '.', steps: ['Total = ' + t + ' students (odd count)', 'Middle = (' + t + ' + 1) / 2 = ' + Math.ceil(t / 2), 'So Gita is ' + Math.ceil(t / 2) + 'th from top'] }); },
    (r, i, c) => { const n = c.ri(r, 20, 45), x = c.ri(r, 3, 10), y = c.ri(r, 2, x);
      return c.buildMCQ({ r, stem: 'In a class of ' + n + ' students, Amit ranks ' + x + 'th from the top and Sumit ranks ' + y + 'th from the bottom. How many students are there between them (worst case, if they do not overlap)?', right: String(Math.max(0, n - x - y)), wrong: [String(Math.max(0, n - x - y + 1)), String(n - x), String(n - y)], explanation: 'Students between = ' + Math.max(0, n - x - y) + '.', steps: ['Above Amit = ' + (x - 1) + ', below Sumit = ' + (y - 1), 'Between = ' + n + ' - ' + x + ' - ' + y + ' = ' + Math.max(0, n - x - y)] }); },
];
G['Ranking & Order'] = (r, i, c) => { return TRK[i % TRK.length](r, i, c); };

module.exports = { G };