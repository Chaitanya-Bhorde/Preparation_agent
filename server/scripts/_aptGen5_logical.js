// _aptGen5_logical.js Ã¢â‚¬â€ high-space parametric generators for logical topics whose
// earlier banks exhausted (fewer than 150 unique stems). Space per topic >= 200
// distinct stems so 50/50/50 (easy/medium/hard) are always reachable by retries.
// Contract: gen(r, i, c) -> c.buildMCQ({ r, stem, right, wrong:[w1,w2,w3], explanation, steps })
// r = seeded RNG (differs per attempt), i = slot cursor (0..149 + attempts), c = helpers.
const G = {};

// deterministic shuffle driven by r
function shuf(r, arr) {
  const a = arr.slice();
  for (let k = a.length - 1; k > 0; k--) { const j = Math.floor(r() * (k + 1)); const t = a[k]; a[k] = a[j]; a[j] = t; }
  return a;
}
const NAMES = ['Amit', 'Bina', 'Chetan', 'Divya', 'Esha', 'Farhan', 'Gita', 'Hari', 'Isha', 'Jai', 'Kiran', 'Lata'];

// ============================== Coding-Decoding ==============================
const CW = ['FLOWER', 'MARKET', 'ORANGE', 'SILVER', 'PLANET', 'MONDAY', 'DRAGON', 'CAMERA', 'DANGER', 'GARDEN', 'MACHINE', 'PICTURE', 'RAINBOW', 'STATION', 'TRAVEL', 'WINTER', 'SUMMER', 'BRIDGE', 'CANDLE', 'DIAMOND', 'ENGINE', 'FRIEND', 'GOLDEN', 'HARVEST', 'ISLAND', 'JOURNEY', 'KETTLE', 'LANTERN', 'MARBLE', 'NEEDLE', 'OFFICE', 'PALACE', 'ROCKET', 'SADDLE', 'TEMPLE', 'VELVET', 'WINDOW', 'BASKET', 'CIRCUS', 'DESERT'];
const sh = (w, k) => w.split('').map(ch => String.fromCharCode(((ch.charCodeAt(0) - 65 + (k % 26) + 26) % 26) + 65)).join('');
const rev = w => w.split('').reverse().join('');
const pos = w => w.split('').map(ch => ch.charCodeAt(0) - 64);

G['Coding-Decoding'] = (r, i, c) => {
  const fam = i % 4;
  const w1 = CW[(i * 7) % CW.length];
  let w2 = CW[(i * 7 + 9) % CW.length];
  if (w2 === w1) w2 = CW[(i * 7 + 1) % CW.length];
  if (fam === 0) { // letter shift
    const k = 1 + Math.floor(r() * 24);
    const c1 = sh(w1, k), right = sh(w2, k);
    const wrongs = [sh(w2, k + 1), sh(w2, k + 2), sh(w2, k + 3)];
    const map2 = w2.split('').map((ch, idx) => ch + '->' + right[idx]).join(', ');
    return c.buildMCQ({ r, stem: 'In a certain code language, "' + w1 + '" is written as "' + c1 + '". How is "' + w2 + '" written in that code?', right, wrong: wrongs, explanation: 'Each letter moves ' + k + ' step(s) forward in the alphabet (' + w1 + ' + ' + k + ' = ' + c1 + '). Applying the same shift: ' + map2 + '. So ' + w2 + ' -> ' + right + '.', steps: ['Compare ' + w1 + ' with ' + c1 + ' to find the shift: every letter moves ' + k + ' step(s) forward', 'Apply +(' + k + ') to each letter of ' + w2 + ': ' + map2, 'So ' + w2 + ' is coded as ' + right] });
  }
  if (fam === 1) { // reversal
    const c1 = rev(w1), right = rev(w2);
    const wrongs = [rev(sh(w2, 1)), sh(rev(w2), 2), rev(sh(w2, 3))];
    return c.buildMCQ({ r, stem: 'In a certain code language, "' + w1 + '" is written as "' + c1 + '". How is "' + w2 + '" written in that code?', right, wrong: wrongs, explanation: 'The code is the word written in reverse order: ' + w1 + ' reversed is ' + c1 + '. Reversing ' + w2 + ' gives ' + right + '.', steps: ['Compare ' + w1 + ' with its code ' + c1 + ': the letters are reversed', 'Reverse ' + w2 + ' letter by letter: ' + right, 'So ' + w2 + ' is coded as ' + right] });
  }
  if (fam === 2) { // letter positions summed
    const p1 = pos(w1), s1 = p1.reduce((a, b) => a + b, 0);
    const p2 = pos(w2), right = String(p2.reduce((a, b) => a + b, 0));
    const n = Number(right);
    const wrongs = [String(n + 1), String(n - 1), String(n + 2)];
    return c.buildMCQ({ r, stem: 'If "' + w1 + '" is coded as ' + s1 + ' by adding the alphabet positions of its letters, what is the code for "' + w2 + '"?', right, wrong: wrongs, explanation: w2.split('').map((ch, idx) => ch + '=' + p2[idx]).join(', ') + ' and ' + p2.join(' + ') + ' = ' + right + '.', steps: ['Write each letter position of ' + w2 + ': ' + p2.join(', '), 'Add them: ' + p2.join(' + ') + ' = ' + right, 'So the code for ' + w2 + ' is ' + right] });
  }
  // fam 3: dashed letter positions
  const p1 = pos(w1), c1 = p1.join('-');
  const p2 = pos(w2), right = p2.join('-');
  const wrongs = [[p2[0] + 1].concat(p2.slice(1)).join('-'), p2.slice(0, -1).concat([p2[p2.length - 1] - 1]).join('-'), p2.slice(0, 1).concat([p2[1] + 1], p2.slice(2)).join('-')];
  return c.buildMCQ({ r, stem: 'In a code language, each letter is replaced by its alphabet position: "' + w1 + '" is coded as ' + c1 + '. Following the same rule, what is the code for "' + w2 + '"?', right, wrong: wrongs, explanation: 'A=1, B=2, ... Z=26. For ' + w2 + ': ' + w2.split('').map((ch, idx) => ch + '=' + p2[idx]).join(', ') + ', so the code is ' + right + '.', steps: ['Check ' + w1 + ': ' + w1.split('').map((ch, idx) => ch + '=' + p1[idx]).join(', ') + ' gives ' + c1, 'Write positions for ' + w2 + ': ' + p2.join(', '), 'Join with dashes: ' + right] });
};
// ============================== Seating Arrangement ==============================
// Constraints are DERIVED from a random row order, so the stated clues always
// uniquely determine the arrangement and the printed answer is provably correct.
G['Seating Arrangement'] = (r, i, c) => {
  const n = 5 + (i % 2); // 5 (easy) or 6 (harder) people in a row
  const people = shuf(r, NAMES).slice(0, n);
  const L = people[0], R = people[n - 1], mids = people.slice(1, n - 1);
  const cl = [L + ' sits at the extreme left of the row.', R + ' sits at the extreme right of the row.'];
  if (n === 5) {
    cl.push(mids[0] + ' sits immediately to the right of ' + L + '.');
    cl.push(mids[1] + ' sits immediately to the right of ' + mids[0] + '.');
    cl.push(mids[2] + ' sits exactly between ' + mids[1] + ' and ' + R + '.');
  } else {
    cl.push(mids[0] + ' sits immediately to the right of ' + L + '.');
    cl.push(mids[1] + ' sits immediately to the right of ' + mids[0] + '.');
    cl.push(mids[2] + ' sits exactly between ' + mids[1] + ' and ' + mids[3] + '.');
    cl.push(mids[3] + ' sits immediately to the left of ' + R + '.');
  }
  const intro = n + ' friends ' + people.join(', ') + ' sit in a row facing you.';
  const qv = i % 3;
  let stem, right;
  if (qv === 0) { if (n === 5) { stem = 'Who sits exactly in the middle of the row?'; right = mids[1]; } else { stem = 'Who sits third from the left end?'; right = people[2]; } }
  else if (qv === 1) { const x = mids[Math.min(1, mids.length - 1)]; stem = 'Who sits immediately to the right of ' + x + '?'; right = people[people.indexOf(x) + 1]; }
  else { stem = 'Who sits second from the left end?'; right = people[1]; }
  const wrongs = people.filter(p => p !== right).slice(0, 3);
  return c.buildMCQ({ r, stem: intro + ' ' + cl.join(' ') + ' ' + stem, right, wrong: wrongs, explanation: 'The clues fix the row completely. Left to right: ' + people.join(', ') + '. Therefore ' + stem.replace('?', '') + ': ' + right + '.', steps: ['Fix the ends: ' + L + ' (extreme left) and ' + R + ' (extreme right)', 'Apply the adjacency clues: ' + mids.join(' follows ') + ' fill the middle in order', 'Final row (left to right): ' + people.join(', '), 'So ' + stem.replace('?', '') + ': ' + right] });
};

// ============================== Puzzles ==============================
// Assignment puzzle: one direct clue + "does not" eliminations that force a unique solution.
const PUZ_DOM = [
  { items: ['Mumbai', 'Delhi', 'Chennai', 'Kolkata', 'Pune'], what: 'city', vb: 'lives in', vn: 'live in', vq: 'live in', q1: 'Who lives in', q2: 'Which city does' },
  { items: ['red', 'blue', 'green', 'white', 'black'], what: 'colour', vb: 'likes the colour', vn: 'like the colour', vq: 'like', q1: 'Who likes the colour', q2: 'Which colour does' },
  { items: ['apple', 'banana', 'mango', 'grape', 'peach'], what: 'fruit', vb: 'likes', vn: 'like', vq: 'like', q1: 'Who likes the', q2: 'Which fruit does' },
  { items: ['cricket', 'chess', 'tennis', 'hockey', 'football'], what: 'sport', vb: 'plays', vn: 'play', vq: 'play', q1: 'Who plays', q2: 'Which sport does' },
];
G['Puzzles'] = (r, i, c) => {
  const dom = PUZ_DOM[i % PUZ_DOM.length];
  const people = shuf(r, NAMES).slice(0, 5);
  const items = shuf(r, dom.items);
  const assigned = people.map((p, k) => ({ p, it: items[k] }));
  const askIdx = (i % 4) + 1; // ask about persons 1..4, never the direct-clue person
  const cl = [people[0] + ' ' + dom.vb + ' ' + items[0] + '.'];
  for (let k = 1; k <= 3; k++) {
    const rem = assigned.slice(k).map(x => x.it);
    const negs = rem.filter(x => x !== assigned[k].it);
    cl.push(people[k] + ' does not ' + dom.vn + ' ' + negs.join(' or ') + '.');
  }
  const askWho = i % 2 === 0;
  let stem, right;
  if (askWho) { right = assigned[askIdx].p; stem = dom.q1 + ' ' + assigned[askIdx].it + '?'; }
  else { right = assigned[askIdx].it; stem = dom.q2 + ' ' + people[askIdx] + ' ' + dom.vq + '?'; }
  const wrongs = (askWho ? people.filter(p => p !== right) : items.filter(x => x !== right)).slice(0, 3);
  const intro = 'Five friends ' + people.join(', ') + ' each have a different ' + dom.what + ' among ' + items.join(', ') + '. ';
  return c.buildMCQ({ r, stem: intro + cl.join(' ') + ' ' + stem, right, wrong: wrongs, explanation: 'The direct clue fixes ' + people[0] + '. Each negative clue rules out every remaining ' + dom.what + ' except one, so ' + people[1] + ', ' + people[2] + ' and ' + people[3] + ' are forced in order and ' + people[4] + ' takes the last one. ' + stem.replace('?', '') + ': ' + right + '.', steps: [cl[0]].concat(cl.slice(1).map(x => 'Eliminate: ' + x)).concat([people[4] + ' is left with the only remaining ' + dom.what, stem.replace('?', '') + ': ' + right]) });
};
// ============================== Statement & Conclusions ==============================
// Airtight syllogism families x curated term triples x conclusion swap = 210+ stems.
const TRIPLES = [['roses', 'flowers', 'plants'], ['dogs', 'animals', 'pets'], ['mangoes', 'fruits', 'things that grow on trees'], ['sparrows', 'birds', 'egg-laying animals'], ['chairs', 'furniture', 'household items'], ['novels', 'books', 'printed works'], ['cars', 'vehicles', 'machines with engines'], ['whales', 'mammals', 'animals'], ['tigers', 'cats', 'predators'], ['wheat', 'crops', 'farm produce'], ['gold', 'metals', 'natural elements'], ['crows', 'birds', 'feathered animals'], ['doctors', 'graduates', 'educated people'], ['singers', 'artists', 'performers'], ['kites', 'toys', 'playthings']];
const SC_FAM = [
  { st: (A, B, C) => 'All ' + A + ' are ' + B + '. All ' + B + ' are ' + C + '.', c1: (A, B, C) => 'All ' + A + ' are ' + C + '.', f1: true, c2: (A, B, C) => 'All ' + C + ' are ' + A + '.', f2: false, why: 'All A are B and all B are C chain into "all A are C"; the reverse (all C are A) never follows from a chain.' },
  { st: (A, B, C) => 'Some ' + A + ' are ' + B + '. All ' + B + ' are ' + C + '.', c1: (A, B, C) => 'Some ' + A + ' are ' + C + '.', f1: true, c2: (A, B, C) => 'All ' + A + ' are ' + B + '.', f2: false, why: 'The Some-A-are-B overlap sits wholly inside C, so "some A are C" follows; "some" can never be upgraded to "all".' },
  { st: (A, B, C) => 'All ' + A + ' are ' + B + '. No ' + B + ' is ' + C + '.', c1: (A, B, C) => 'No ' + A + ' is ' + C + '.', f1: true, c2: (A, B, C) => 'Some ' + C + ' are ' + A + '.', f2: false, why: 'A sits fully inside B, and B is wholly separate from C, so A cannot touch C; "some C are A" would break that separation.' },
  { st: (A, B, C) => 'All ' + A + ' are ' + B + '.', c1: (A, B, C) => 'Some ' + A + ' are ' + B + '.', f1: true, c2: (A, B, C) => 'Some ' + B + ' are ' + A + '.', f2: true, why: 'A universal statement implies the particular ("some A are B"), and if some A are B then some B must be A too Ã¢â‚¬â€ both follow.' },
  { st: (A, B, C) => 'Some ' + A + ' are ' + B + '. Some ' + B + ' are ' + C + '.', c1: (A, B, C) => 'Some ' + A + ' are ' + C + '.', f1: false, c2: (A, B, C) => 'All ' + A + ' are ' + B + '.', f2: false, why: 'Two "some" premises can overlap anywhere, so no definite link joins A and C; and "some" never upgrades to "all".' },
  { st: (A, B, C) => 'All ' + A + ' are ' + B + '. Some ' + B + ' are ' + C + '.', c1: (A, B, C) => 'Some ' + A + ' are ' + C + '.', f1: false, c2: (A, B, C) => 'All ' + C + ' are ' + A + '.', f2: false, why: 'The Some-B-are-C circle may lie completely outside A, so nothing joins A and C for certain; "all C are A" is far stronger than given.' },
  { st: (A, B, C) => 'No ' + A + ' is ' + B + '. All ' + C + ' are ' + A + '.', c1: (A, B, C) => 'No ' + C + ' is ' + B + '.', f1: true, c2: (A, B, C) => 'Some ' + B + ' are ' + C + '.', f2: false, why: 'C sits inside A, and A is wholly separate from B, so C cannot touch B; "some B are C" contradicts that separation.' },
];
const SC_OPTS = ['Only conclusion I follows', 'Only conclusion II follows', 'Both conclusions follow', 'Neither conclusion follows'];
G['Statement & Conclusions'] = (r, i, c) => {
  const fam = SC_FAM[i % SC_FAM.length];
  const T = TRIPLES[Math.floor(r() * TRIPLES.length)];
  const swap = r() < 0.5;
  let t1 = fam.c1(T[0], T[1], T[2]), t2 = fam.c2(T[0], T[1], T[2]);
  let f1 = fam.f1, f2 = fam.f2;
  if (swap) { const tt = t1; t1 = t2; t2 = tt; const tf = f1; f1 = f2; f2 = tf; }
  const right = f1 && f2 ? SC_OPTS[2] : (f1 && !f2 ? SC_OPTS[0] : (!f1 && f2 ? SC_OPTS[1] : SC_OPTS[3]));
  const wrongs = SC_OPTS.filter(x => x !== right);
  return c.buildMCQ({ r, stem: 'Statements: ' + fam.st(T[0], T[1], T[2]) + ' Conclusions: I. ' + t1 + ' II. ' + t2 + ' Which of the conclusions logically follows?', right, wrong: wrongs, explanation: fam.why + ' Here conclusion I "' + t1 + '" ' + (f1 ? 'follows' : 'does NOT follow') + ', and conclusion II "' + t2 + '" ' + (f2 ? 'follows' : 'does NOT follow') + '.', steps: ['Premises: ' + fam.st(T[0], T[1], T[2]), 'Test I "' + t1 + '": ' + (f1 ? 'supported by the premises' : 'not forced by the premises'), 'Test II "' + t2 + '": ' + (f2 ? 'supported by the premises' : 'not forced by the premises'), 'So: ' + right] });
};
// ============================== Statement & Assumptions ==============================
// 18 scenario templates x filler banks = 180+ distinct stems. Implicit/not-implicit
// verdicts follow standard exam logic (an assumption = unstated premise of the statement).
const SA_PLACES = ['library', 'gymnasium', 'laboratory', 'swimming pool', 'billing office', 'reading room'];
const SA_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SA_PRODUCTS = ['smartwatch', 'backpack', 'running shoes', 'coffee maker', 'water bottle', 'headphones', 'camera', 'bicycle'];
const SA_NAMES = ['Rahul', 'Priya', 'Arjun', 'Sneha', 'Vikram', 'Anita', 'Rohit', 'Meera'];
const SA_CITIES = ['Jaipur', 'Lucknow', 'Patna', 'Indore', 'Nagpur', 'Surat', 'Bhopal', 'Kochi'];
const SA_COURSES = ['spoken English', 'data entry', 'web design', 'accounting', 'graphology', 'yoga'];
const SA_PK = (r, arr) => arr[Math.floor(r() * arr.length)];
const SAT = [
  (r) => { const p = SA_PK(r, SA_PLACES), d = SA_PK(r, SA_DAYS); return { st: 'Notice: The ' + p + ' will remain closed on ' + d + ' for maintenance work.', a1: 'The ' + p + ' is open on the other days of the week.', a2: 'People reading the notice will plan their visits around it.', ans: 'BOTH', why: 'Announcing one closed day presumes the ' + p + ' stays open otherwise (I), and issuing a notice presumes readers will use that information (II).' }; },
  (r) => { const p = SA_PK(r, SA_PRODUCTS); return { st: '"Buy the new ' + p + ' now Ã¢â‚¬â€ limited stock offer!"', a1: 'Scarcity of stock encourages buyers to act quickly.', a2: 'The ' + p + ' costs more than all its alternatives.', ans: 'I', why: 'Ads cite limited stock because they assume urgency drives purchases (I); no price comparison is implied anywhere (II).' }; },
  (r) => { const n = SA_PK(r, SA_NAMES), s = SA_PK(r, ['mathematics', 'science', 'English']); return { st: n + ' scored the highest marks in ' + s + ', so he must be the most hardworking student.', a1: 'Marks reflect how hard a student works.', a2: 'No other student attempted all the questions.', ans: 'I', why: 'Concluding "hardworking" from marks assumes marks measure effort (I); nothing about attempting questions is assumed (II).' }; },
  (r) => { const p = SA_PK(r, ['office', 'mall', 'school', 'hotel', 'hospital', 'studio', 'bank', 'hostel']); return { st: 'Please use the staircase in case of fire. (board inside a lift at the ' + p + ')', a1: 'Lifts can become unsafe during a fire.', a2: 'The staircase is always faster than the lift.', ans: 'I', why: 'The instruction assumes lifts pose a danger in fire (I); no claim about relative speed is assumed (II).' }; },
  (r) => { const n = SA_PK(r, ['100', '150', '200', '250']); return { st: 'The seminar hall has only ' + n + ' seats, and entry is on a first-come, first-served basis.', a1: 'Some people may be turned away if more than ' + n + ' arrive.', a2: 'Seats can be reserved in advance by payment.', ans: 'I', why: 'First-come entry with finite seats assumes overflow is possible (I); paid reservation contradicts the stated policy (II).' }; },
  (r) => { const v = SA_PK(r, ['car', 'bike', 'scooter', 'truck']), m = SA_PK(r, ['six months', 'four months']); return { st: 'Get your ' + v + ' serviced every ' + m + ' for safe driving.', a1: 'Regular servicing reduces the risk of accidents.', a2: 'Every driver can afford the servicing cost.', ans: 'I', why: 'The advice links servicing to safety, assuming it prevents problems (I); affordability is never assumed by such advice (II).' }; },
  (r) => { const cty = SA_PK(r, SA_CITIES), t = SA_PK(r, ['superfast express', 'passenger train', 'Shatabdi']); return { st: 'The ' + t + ' to ' + cty + ' departs at 6 a.m. sharp.', a1: 'Some passengers need the departure time to plan their journey.', a2: 'The train never runs late.', ans: 'I', why: 'Publishing a time assumes travellers use it to plan (I); punctuality is not claimed by stating a time (II).' }; },
  (r) => { const s = SA_PK(r, ['soap', 'an antiseptic wash', 'running water and soap', 'a sanitiser']); return { st: 'Wash your hands with ' + s + ' before eating to avoid infection.', a1: 'Unwashed hands can carry germs that cause infection.', a2: 'Handwashing kills every germ instantly.', ans: 'I', why: 'The advice assumes dirty hands are a genuine infection route (I); total, instant germ kill is an extreme not implied (II).' }; },
  (r) => { const co = SA_PK(r, SA_COURSES); return { st: 'Admissions are open for the ' + co + ' batch Ã¢â‚¬â€ limited seats only.', a1: 'Scarcity of seats prompts early applications.', a2: 'The ' + co + ' course guarantees a job.', ans: 'I', why: 'Highlighting limited seats assumes scarcity pushes people to apply sooner (I); job guarantees are not part of the notice (II).' }; },
  (r) => { const w = SA_PK(r, ['wire', 'cable', 'metal rod', 'panel', 'guard rail']); return { st: 'Danger board: Do not touch the ' + w + ' Ã¢â‚¬â€ it carries high voltage.', a1: 'Touching the ' + w + ' can cause harm.', a2: 'The warning is displayed in several languages.', ans: 'I', why: 'A danger sign assumes contact is harmful (I); nothing suggests anything about translations (II).' }; },
  (r) => { const d = SA_PK(r, ['10%', '20%', '25%', '30%']), s = SA_PK(r, ['bookshop', 'saree store', 'electronics shop', 'furniture shop']); return { st: 'The ' + s + ' announced a ' + d + ' discount for the festival week.', a1: 'Discounts attract more customers.', a2: 'The ' + s + ' wants to increase its festival-season sales.', ans: 'BOTH', why: 'Offering a discount assumes it draws buyers (I) and that the shop aims to raise festive sales (II) Ã¢â‚¬â€ both are built into the move.' }; },
  (r) => { const m = SA_PK(r, ['syrup', 'bottle of tablets', 'ointment', 'inhaler', 'pack of drops', 'sachet']); return { st: 'Keep the ' + m + ' out of the reach of children.', a1: 'The ' + m + ' tastes pleasant to children.', a2: 'Children may swallow it accidentally if they can reach it.', ans: 'II', why: 'The instruction assumes accidental consumption is a real risk (II); pleasant taste is not assumed Ã¢â‚¬â€ danger alone motivates it (I not implicit).' }; },
  (r) => { const n = SA_PK(r, SA_NAMES), cc = SA_PK(r, ['blue', 'green', 'grey']), g = SA_PK(r, ['shirt', 'jacket', 'kurta']); return { st: n + ' is wearing a ' + cc + ' ' + g + ' today.', a1: n + ' owns no other ' + g + '.', a2: 'Everyone likes ' + cc + ' ' + g + 's.', ans: 'NEITHER', why: 'The statement only reports what ' + n + ' is wearing today; nothing about the rest of the wardrobe or anyone\'s preferences is assumed.' }; },
  (r) => { const k = SA_PK(r, ['library', 'museum', 'bookshop']), n = SA_PK(r, ['fifty', 'twenty', 'a hundred']); return { st: 'The ' + k + ' added ' + n + ' new titles this month.', a1: 'The ' + k + ' had no titles before this month.', a2: 'Readers will stop buying personal books now.', ans: 'NEITHER', why: 'Adding titles says nothing about the earlier collection (I) and makes no claim about readers\' purchases (II).' }; },
  (r) => { const cty = SA_PK(r, SA_CITIES); return { st: 'The municipal corporation of ' + cty + ' has urged residents to boil drinking water.', a1: 'The water supply may currently be contaminated.', a2: 'Residents already boil all their drinking water.', ans: 'I', why: 'The advisory assumes a real risk in the supply (I); if residents already boiled everything, the appeal would be pointless (II not implicit).' }; },
  (r) => { const p = SA_PK(r, ['auditorium', 'hospital ward', 'aircraft cabin', 'exam hall', 'library', 'operation theatre']); return { st: 'Please switch off your mobile phones inside the ' + p + '.', a1: 'Phone signals can disturb the functioning of the ' + p + '.', a2: 'Mobile phones are banned everywhere these days.', ans: 'I', why: 'The request presumes phones can cause disturbance there (I); a universal ban is obviously not assumed (II).' }; },
  (r) => { const d = SA_PK(r, ['a valid student ID', 'a bonafide certificate', 'a fee receipt', 'a college letter']); return { st: 'The airline allows an extra 5 kg baggage for students travelling with ' + d + '.', a1: 'Students often carry more luggage while moving for studies.', a2: 'Student status can be verified from that document.', ans: 'BOTH', why: 'The concession assumes students genuinely need extra baggage (I) and that the document can prove student status (II).' }; },
  (r) => { const t = SA_PK(r, ['2 p.m.', '3 p.m.', '4 p.m.', '5 p.m.']); return { st: 'The canteen will remain shut till ' + t + ' today.', a1: 'The canteen staff deserve a long break.', a2: 'Customers should plan their meals around the closure.', ans: 'II', why: 'Announcing a closure time assumes customers will adjust their plans (II); nothing implies an opinion about staff breaks (I).' }; },
];
const SA_OPTS = ['Only assumption I is implicit', 'Only assumption II is implicit', 'Both assumptions are implicit', 'Neither assumption is implicit'];
G['Statement & Assumptions'] = (r, i, c) => {
  const o = SAT[i % SAT.length](r);
  const ansKey = { I: SA_OPTS[0], II: SA_OPTS[1], BOTH: SA_OPTS[2], NEITHER: SA_OPTS[3] }[o.ans];
  const wrongs = SA_OPTS.filter(x => x !== ansKey);
  return c.buildMCQ({ r, stem: 'Statement: "' + o.st + '" Assumption I: ' + o.a1 + ' Assumption II: ' + o.a2 + ' Which assumption(s) is/are implicit?', right: ansKey, wrong: wrongs, explanation: o.why, steps: ['An implicit assumption is an unstated premise the statement depends on', 'Test I "' + o.a1 + '"', 'Test II "' + o.a2 + '"', 'Verdict: ' + ansKey] });
};
// ============================== Analogy ==============================
// 8 relation families x ordered pair choices = 400+ stems; wrongs drawn from other
// families so they can never accidentally be correct.
const AN_F = [
  [['Doctor : Hospital', 'Teacher : School', 'Chef : Kitchen', 'Pilot : Cockpit', 'Lawyer : Court', 'Farmer : Field', 'Librarian : Library', 'Mechanic : Garage'], (a0, a1, c0, c1) => 'A ' + a0 + ' works in a ' + a1 + ', so a ' + c0 + ' works in a ' + c1 + '.'],
  [['Dog : Puppy', 'Cat : Kitten', 'Cow : Calf', 'Sheep : Lamb', 'Horse : Foal', 'Hen : Chick', 'Deer : Fawn', 'Goat : Kid'], (a0, a1, c0, c1) => 'A ' + a1 + ' is the young one of a ' + a0 + ', just as a ' + c1 + ' is the young one of a ' + c0 + '.'],
  [['France : Paris', 'Japan : Tokyo', 'Egypt : Cairo', 'Italy : Rome', 'Spain : Madrid', 'Kenya : Nairobi', 'Canada : Ottawa', 'Greece : Athens'], (a0, a1, c0, c1) => a1 + ' is the capital of ' + a0 + ', just as ' + c1 + ' is the capital of ' + c0 + '.'],
  [['Pen : Write', 'Knife : Cut', 'Hammer : Strike', 'Broom : Sweep', 'Spade : Dig', 'Axe : Chop', 'Pin : Fasten', 'Key : Lock'], (a0, a1, c0, c1) => 'A ' + a0 + ' is used to ' + a1 + ', so a ' + c0 + ' is used to ' + c1 + '.'],
  [['Sculptor : Chisel', 'Writer : Pen', 'Painter : Brush', 'Carpenter : Saw', 'Farmer : Plough', 'Barber : Scissors', 'Doctor : Stethoscope', 'Chef : Knife'], (a0, a1, c0, c1) => 'A ' + a0 + ' works with a ' + a1 + ', so a ' + c0 + ' works with a ' + c1 + '.'],
  [['Milk : Cow', 'Wool : Sheep', 'Egg : Hen', 'Honey : Bee', 'Silk : Silkworm', 'Pearl : Oyster'], (a0, a1, c0, c1) => a0 + ' is obtained from a ' + a1 + ', just as ' + c0 + ' is obtained from a ' + c1 + '.'],
  [['Book : Author', 'Painting : Artist', 'Song : Singer', 'Building : Architect', 'Statue : Sculptor'], (a0, a1, c0, c1) => 'A ' + a0 + ' is created by an ' + a1 + ', so a ' + c0 + ' is created by a ' + c1 + '.'],
  [['Foot : Shoe', 'Hand : Glove', 'Head : Cap', 'Finger : Ring', 'Neck : Scarf', 'Leg : Trouser'], (a0, a1, c0, c1) => 'A ' + a1 + ' is worn on the ' + a0 + ', so a ' + c1 + ' is worn on the ' + c0 + '.'],
];
const AN_POOL = [];
AN_F.forEach((f, fi) => f[0].forEach(p => AN_POOL.push({ w: p.split(' : ')[1], fam: fi })));
G['Analogy'] = (r, i, c) => {
  const fi = i % AN_F.length;
  const pairs = shuf(r, AN_F[fi][0]);
  const a = pairs[0].split(' : '), b = pairs[1].split(' : ');
  const right = b[1];
  const wrongs = shuf(r, AN_POOL.filter(x => x.fam !== fi && x.w !== right)).slice(0, 3).map(x => x.w);
  return c.buildMCQ({ r, stem: a[0] + ' : ' + a[1] + ' :: ' + b[0] + ' : ?  (Choose the option that completes the analogy the same way.)', right, wrong: wrongs, explanation: AN_F[fi][1](a[0], a[1], b[0], b[1]) + ' The missing term is "' + right + '".', steps: ['Find how ' + a[0] + ' relates to ' + a[1], AN_F[fi][1](a[0], a[1], b[0], b[1]), 'Apply the same relation to ' + b[0] + ' -> ' + right] });
};
// ============================== Odd One Out ==============================
const OOO_W = [
  [['Copper', 'Iron', 'Zinc', 'Oak'], 'Oak', 'metals; the rest is a tree'],
  [['Wheat', 'Rice', 'Maize', 'Sapphire'], 'Sapphire', 'grains; the rest is a gemstone'],
  [['Cricket', 'Hockey', 'Chess', 'Baseball'], 'Chess', 'outdoor field sports; the rest is an indoor board game'],
  [['Ganga', 'Yamuna', 'Nile', 'Everest'], 'Everest', 'rivers; the rest is a mountain'],
  [['Ant', 'Bee', 'Wasp', 'Sparrow'], 'Sparrow', 'insects; the rest is a bird'],
  [['Sofa', 'Bed', 'Wardrobe', 'Chandelier'], 'Chandelier', 'furniture; the rest is a light fixture'],
  [['Ruby', 'Emerald', 'Topaz', 'Sandstone'], 'Sandstone', 'gemstones; the rest is plain rock'],
  [['Mercury', 'Venus', 'Mars', 'Moon'], 'Moon', 'planets; the rest is Earth\'s natural satellite'],
  [['Cycling', 'Swimming', 'Running', 'Driving'], 'Driving', 'physical exercise; the rest is not'],
  [['Novel', 'Poem', 'Essay', 'Calculator'], 'Calculator', 'literary works; the rest is a device'],
  [['Gram', 'Kilogram', 'Milligram', 'Litre'], 'Litre', 'units of mass; the rest is a unit of volume'],
  [['January', 'March', 'July', 'Autumn'], 'Autumn', 'months; the rest is a season'],
  [['Triangle', 'Square', 'Pentagon', 'Cube'], 'Cube', 'two-dimensional shapes; the rest is a solid'],
  [['Barometer', 'Thermometer', 'Hygrometer', 'Spectacles'], 'Spectacles', 'measuring instruments; the rest is worn'],
  [['Dholak', 'Tabla', 'Mridangam', 'Sitar'], 'Sitar', 'percussion instruments; the rest is a string instrument'],
  [['Biography', 'Autobiography', 'Memoir', 'Dictionary'], 'Dictionary', 'life-based writing; the rest is a reference work'],
  [['Biology', 'Chemistry', 'Physics', 'Sculpting'], 'Sculpting', 'sciences; the rest is an art'],
  [['Debit card', 'Credit card', 'Cheque', 'Postcard'], 'Postcard', 'payment instruments; the rest is postal'],
  [['Tsunami', 'Earthquake', 'Cyclone', 'Auction'], 'Auction', 'natural disasters; the rest is an event'],
  [['Sculptor', 'Painter', 'Novelist', 'Canvas'], 'Canvas', 'creators; the rest is a material'],
  [['Fog', 'Mist', 'Dew', 'Smoke'], 'Smoke', 'forms of condensation; the rest comes from burning'],
  [['Keyboard', 'Monitor', 'Mouse', 'Whiteboard'], 'Whiteboard', 'computer peripherals; the rest is an office board'],
  [['Mango', 'Potato', 'Apple', 'Guava'], 'Potato', 'fruits; the rest is a vegetable'],
  [['Sparrow', 'Crow', 'Bat', 'Parrot'], 'Bat', 'birds; the rest is a mammal that can truly fly'],
];
const OOO_PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
const OOO_COMP = [4, 6, 8, 9, 10, 12, 15, 18, 20, 21, 22, 25, 26];
const OOO_SQ = [4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144];
const OOO_NONSQ = [5, 7, 10, 12, 13, 15, 17, 18, 20];
const OOO_pick = (r, f, n) => { const s = []; while (s.length < n) { const v = f(); if (s.indexOf(v) === -1) s.push(v); } return s; };
G['Odd One Out'] = (r, i, c) => {
  const t = i % 3;
  if (t === 0) {
    const b = OOO_W[(i * 5 + Math.floor(r() * OOO_W.length)) % OOO_W.length];
    const wrongs = b[0].filter(x => x !== b[1]).slice(0, 3);
    return c.buildMCQ({ r, stem: 'Find the odd one out: ' + b[0].join(', ') + '.', right: b[1], wrong: wrongs, explanation: b[1] + ' is the odd one out Ã¢â‚¬â€ the others are all ' + b[2] + '.', steps: ['Look for a property shared by three options', 'The shared theme: ' + b[2], b[1] + ' does not share it, so it is the odd one'] });
  }
  if (t === 1) {
    const kind = Math.floor(r() * 5);
    let set, right, why;
    if (kind === 0) { set = OOO_pick(r, () => 2 * (2 + Math.floor(r() * 18)), 3); right = 2 * Math.floor(r() * 18) + 1; why = 'the others are even numbers'; }
    else if (kind === 1) { set = OOO_pick(r, () => 2 * Math.floor(r() * 18) + 1, 3); right = 2 * (2 + Math.floor(r() * 18)); why = 'the others are odd numbers'; }
    else if (kind === 2) { set = shuf(r, OOO_PRIMES).slice(0, 3); right = OOO_COMP[Math.floor(r() * OOO_COMP.length)]; why = 'the others are prime numbers'; }
    else if (kind === 3) { set = shuf(r, OOO_SQ).slice(0, 3); right = OOO_NONSQ[Math.floor(r() * OOO_NONSQ.length)]; why = 'the others are perfect squares'; }
    else { const k = 3 + Math.floor(r() * 7); const m = OOO_pick(r, () => k * (2 + Math.floor(r() * 20)), 3); set = m; right = m[0] + 1; why = 'the others are multiples of ' + k; }
    while (set.indexOf(right) !== -1) right = right + 1;
    const items = shuf(r, set.concat([right]));
    return c.buildMCQ({ r, stem: 'Find the odd one out: ' + items.join(', ') + '.', right: String(right), wrong: items.filter(x => x !== right).slice(0, 3).map(x => String(x)), explanation: right + ' is the odd one out because ' + why + ' (' + set.join(', ') + ' all share the property).', steps: ['Test a common property (even/odd, prime, square, multiple)', 'Three options share it: ' + set.join(', '), right + ' breaks it, so it is the odd one'] });
  }
  const lk = Math.floor(r() * 2);
  if (lk === 0) {
    const V = ['A', 'E', 'I', 'O', 'U'], C = 'BCDFGHJKLMNPQRSTVWXYZ'.split('');
    const vowelsMode = r() < 0.5;
    const set = vowelsMode ? shuf(r, V).slice(0, 3) : shuf(r, C).slice(0, 3);
    const right = vowelsMode ? C[Math.floor(r() * C.length)] : V[Math.floor(r() * V.length)];
    const items = shuf(r, set.concat([right]));
    return c.buildMCQ({ r, stem: 'Find the odd one out: ' + items.join(', ') + '.', right, wrong: items.filter(x => x !== right).slice(0, 3), explanation: right + ' is the odd one out Ã¢â‚¬â€ the others are all ' + (vowelsMode ? 'vowels' : 'consonants') + ' (' + set.join(', ') + ').', steps: ['Classify each letter as vowel or consonant', set.join(', ') + ' are all ' + (vowelsMode ? 'vowels' : 'consonants'), right + ' is not, so it is the odd one'] });
  }
  const L0 = 65 + Math.floor(r() * 12), g = [2, 3, 4][Math.floor(r() * 3)];
  const seq = [0, 1, 2].map(k => String.fromCharCode(L0 + k * g));
  const right = String.fromCharCode(L0 + 2 * g + 1);
  const items = shuf(r, seq.concat([right]));
  return c.buildMCQ({ r, stem: 'Find the letter that does not fit the pattern: ' + items.join(', ') + '.', right, wrong: items.filter(x => x !== right).slice(0, 3), explanation: 'The letters ' + seq.join(', ') + ' advance by ' + g + ' place(s) each time (' + seq[0] + ' -> ' + seq[1] + ' -> ' + seq[2] + '), but ' + right + ' breaks the progression.', steps: ['Convert letters to positions: ' + seq.map(x => x.charCodeAt(0) - 64).join(', '), 'The gaps are ' + g + ', ' + g + ' Ã¢â‚¬â€ a regular progression', right + ' does not continue it, so it is the odd one'] });
};

module.exports = { G };






// ============================== Statement & Conclusions (union space) ==============================
// DEPTH-3 question x the SAME 15 term triples = huge (families x triples x context) combinatorial space.
const SC_CTX = ['What can you conclude for certain?', 'Which statement must be true?', 'What necessarily follows?', 'Which option is definitely true?', 'What is certainly implied?', 'Which statement is inescapable?', 'What do the statements lead to without doubt?'];
let scCount = 0;
G['Statement & Conclusions'] = (r, i, c) => {
  const fam = i % 3;
  const T = TRIPLES[Math.floor(r() * TRIPLES.length)];
  const ctx = c.pk(r, SC_CTX);
  const A = T[0], B = T[1], C = T[2];
  let st, right, wrong, why;
  if (fam === 0) { // universal containment chain
    st = 'All ' + A + ' are ' + B + '. All ' + B + ' are ' + C + '.';
    right = 'All ' + A + ' are ' + C + '.';
    wrong = ['All ' + C + ' are ' + A + '.', 'All ' + B + ' are ' + A + '.', 'All ' + A + ' are ' + C + ' and some ' + C + ' are not ' + A + '.']; // last is true too - filter
    wrong = wrong.filter(x => x !== right);
    if (wrong.length < 3) wrong = wrong.concat(['Some ' + C + ' are not ' + A + '.']);
    why = 'A is inside B, B is inside C, so A is inside C (universal chain).';
  } else if (fam === 1) { // some overlap
    st = 'Some ' + A + ' are ' + B + '. All ' + B + ' are ' + C + '.';
    right = 'Some ' + A + ' are ' + C + '.';
    wrong = ['All ' + A + ' are ' + C + '.', 'All ' + A + ' are ' + B + '.', 'Some ' + C + ' are not ' + A + '.'];
    why = 'The overlap (some A are B) sits fully inside C, so some A are C; nothing stronger is forced.';
  } else { // universal negative
    st = 'All ' + A + ' are ' + B + '. No ' + B + ' is ' + C + '.';
    right = 'No ' + A + ' is ' + C + '.';
    wrong = ['All ' + A + ' are ' + C + '.', 'Some ' + C + ' are ' + A + '.', 'All ' + B + ' are ' + A + '.'];
    why = 'A sits inside B, and B avoids C entirely, so A cannot touch C.';
  }
  if (Math.floor(r() * 12) === 0) { // occasionally the "must NOT follow" form to vary the key
    const keep = wrong[0]; const discard = right; right = keep; wrong = ['What\'s certain', discard, wrong[1], wrong[2]].filter(x => x !== right).slice(0, 3);
    st = st + ' Which statement does NOT follow?';
    why = 'Since ' + keep + ' is forced by the premises, only ' + discard + ' might be true but is not guaranteed.';
  } else {
    st = st + ' ' + ctx;
  }
  const wrongs = wrong.slice(0, 3);
  if (wrongs.length < 3) wrongs.push('All ' + A + ' are ' + C + '.');
  return c.buildMCQ({ r, stem: st, right, wrong: wrongs, explanation: why, steps: ['Sketch the premises as circles', why, 'Check each option against the sketch', 'So: ' + right] });
};
