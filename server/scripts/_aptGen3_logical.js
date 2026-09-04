// _aptGen3_logical.js — Genuinely distinct scenario banks for weak logical topics.
// Overrides weak gen2 topics with distinct CATEGORY sets & scenarios so 50/50/50
// questions genuinely differ (not 1 template x names).
// seeder passes r = seeded RNG, i = index, c = {ri, pk, buildMCQ}
const G = {};

// ---- Odd One Out: many distinct category banks, each a different reasoning type ----
const ODD_BANKS = [
  [['Mango', 'Apple', 'Banana', 'Rose'], 'Rose', 'fruit'],
  [['Grapes', 'Orange', 'Lotus', 'Papaya'], 'Lotus', 'fruit'],
  [['Lily', 'Guava', 'Jasmine', 'Hibiscus'], 'Guava', 'flower'],
  [['Peach', 'Tulip', 'Plum', 'Pear'], 'Tulip', 'fruit'],
  [['Lion', 'Eagle', 'Tiger', 'Bear'], 'Eagle', 'mammal'],
  [['Sparrow', 'Parrot', 'Crow', 'Whale'], 'Whale', 'bird'],
  [['Dog', 'Cat', 'Peacock', 'Horse'], 'Peacock', 'mammal'],
  [['Snake', 'Crocodile', 'Lizard', 'Cow'], 'Cow', 'reptile'],
  [['Car', 'Bus', 'Train', 'Bicycle'], 'Bicycle', 'motor vehicle'],
  [['Truck', 'Ship', 'Aeroplane', 'Boat'], 'Truck', 'water or air transport'],
  [['Scooter', 'Motorcycle', 'Bullock cart', 'Auto-rickshaw'], 'Bullock cart', 'motor-driven'],
  [['Doctor', 'Teacher', 'Engineer', 'Pen'], 'Pen', 'person'],
  [['Chef', 'Farmer', 'Pencil', 'Pilot'], 'Pencil', 'person'],
  [[2, 4, 6, 9], 9, 'even number'],
  [[11, 13, 15, 17], 15, 'prime number'],
  [[5, 10, 15, 22], 22, 'multiple of 5'],
  [[3, 6, 12, 15, 18, 21, 23, 24], 23, 'multiple of 3'],
  [['A', 'E', 'I', 'K'], 'K', 'vowel'],
  [['B', 'D', 'F', 'H', 'J', 'M'], 'M', 'alphabet at alternate positions'],
  [['C', 'E', 'G', 'I', 'K', 'N'], 'N', 'alphabet at alternate positions'],
  [['Chair', 'Table', 'Sofa', 'Glass'], 'Glass', 'furniture'],
  [['Shirt', 'Trouser', 'Cup', 'Sock'], 'Cup', 'clothing item'],
  [['Monday', 'Tuesday', 'January', 'Wednesday'], 'January', 'day of the week'],
  [['Summer', 'Winter', 'Monsoon', 'February'], 'February', 'season'],
  [['Honda', 'Toyota', 'Biscuit', 'Ferrari'], 'Biscuit', 'vehicle'],
  [['Mango', 'Rose', 'Jasmine', 'Lotus'], 'Mango', 'flower'],
];
G['Odd One Out'] = (r, i, c) => {
  const b = ODD_BANKS[i % ODD_BANKS.length];
  const wrongs = b[0].filter(x => x !== b[1]);
  return c.buildMCQ({ r,
    stem: 'Find the odd one out: ' + b[0].join(', ') + '.',
    right: b[1], wrong: [wrongs[0], wrongs[1], wrongs[2]],
    explanation: b[1] + ' is the odd one out — the rest are ' + b[2] + 's.',
    steps: ['Group theme: ' + b[2], b[0].filter(x => x !== b[1]).join(', ') + ' all fit the theme', b[1] + ' does not fit'] });
};
// ---- Blood Relations: distinct family-tree scenarios ----
const BR_TYPES = [
  (r, i, c) => {
    const who = c.pk(r, ['Amit', 'Bina', 'Chetan', 'Divya']);
    const cases = c.pk(r, [
      { txt: 'wife of my brother', ans: 'Sister-in-law', exp: 'Brother\'s wife is one\'s sister-in-law.' },
      { txt: 'wife of my son', ans: 'Daughter-in-law', exp: 'Son\'s wife is one\'s daughter-in-law.' },
      { txt: 'wife of my uncle', ans: 'Aunt', exp: 'Uncle\'s wife is one\'s aunt.' },
      { txt: 'husband of my sister', ans: 'Brother-in-law', exp: 'Sister\'s husband is one\'s brother-in-law.' },
      { txt: 'husband of my daughter', ans: 'Son-in-law', exp: 'Daughter\'s husband is one\'s son-in-law.' },
    ]);
    const male = cases.txt.indexOf('husband') === 0;
    const pool = ['Sister-in-law', 'Daughter-in-law', 'Aunt', 'Niece', 'Cousin', 'Grandmother', 'Mother'];
    const wrongs = pool.filter(x => x !== cases.ans).slice(0, 3);
    return c.buildMCQ({ r, stem: who + ', pointing to a photograph, said, "' + (male ? 'He' : 'She') + ' is the ' + cases.txt + '." How is the ' + (male ? 'man' : 'woman') + ' related to ' + who + '?',
      right: cases.ans, wrong: wrongs,
      explanation: cases.exp,
      steps: ['"' + cases.txt + '" is stated directly', 'By marriage rules: ' + cases.exp, 'So answer: ' + cases.ans] });
  },
  (r, i, c) => {
    return c.buildMCQ({ r, stem: 'Pointing to a girl, Neha said, "She is the daughter of my only brother\'s wife." How is the girl related to Neha?',
      right: 'Niece', wrong: ['Sister', 'Daughter', 'Cousin'],
      explanation: 'Neha\'s brother\'s wife = sister-in-law; her daughter = Neha\'s niece.',
      steps: ['Neha\'s only brother = her brother', 'Brother\'s wife = sister-in-law', 'Their daughter = niece'] });
  },
  (r, i, c) => {
    const person = c.pk(r, ['Ravi', 'Kavita', 'Arjun', 'Meera']);
    return c.buildMCQ({ r, stem: person + ' is the son of Anil. Anil\'s wife\'s father is Gopal. How is Gopal related to ' + person + '?',
      right: 'Grandfather', wrong: ['Father', 'Uncle', 'Father-in-law'],
      explanation: 'Anil\'s wife = ' + person + '\'s mother; her father = ' + person + '\'s grandfather.',
      steps: ['Anil\'s wife = ' + person + '\'s mother', 'Mother\'s father = grandfather', 'So Gopal is the grandfather'] });
  },
  (r, i, c) => {
    return c.buildMCQ({ r, stem: 'A is the father of B. B is the sister of C. D is the mother of C. How is D related to A?',
      right: 'Wife', wrong: ['Sister', 'Daughter', 'Mother'],
      explanation: 'D is the mother of A\'s children, so D is A\'s wife.',
      steps: ['B and C are siblings, both children of A and D', 'D is their mother', 'Mother of A\'s children = A\'s wife'] });
  },
  (r, i, c) => {
    const child = c.pk(r, ['a boy', 'a girl']);
    return c.buildMCQ({ r, stem: 'The uncle of ' + child + ' is the brother of the father of ' + child + '. How is the uncle related to ' + child + '\'s father?',
      right: 'Brother', wrong: ['Cousin', 'Nephew', 'Grandfather'],
      explanation: 'The father\'s brother = the child\'s uncle.',
      steps: ['Uncle = father\'s brother', 'So uncle is the brother of the father', 'Answer: Brother'] });
  },
];
BR_TYPES.push(...[
  (r, i, c) => {
    return c.buildMCQ({ r, stem: 'If Sita is the mother of Ravi, and Ravi is the brother of Geeta, who is Geeta\'s mother?',
      right: 'Sita', wrong: ['Geeta', 'Ravi', 'Ravi\'s wife'],
      explanation: 'Sita is the mother of both Ravi and Geeta.',
      steps: ['Sita is the mother of Ravi', 'Ravi and Geeta are siblings', 'So Sita is Geeta\'s mother too'] });
  },
  (r, i, c) => {
    const m = c.pk(r, ['Amit', 'Bina']);
    return c.buildMCQ({ r, stem: m + '\'s father is Kiran. Kiran\'s son is Varun. How is Varun related to ' + m + '?',
      right: 'Brother', wrong: ['Cousin', 'Father', 'Uncle'],
      explanation: 'Varun and ' + m + ' share the same father Kiran, so they are siblings.',
      steps: [m + ' is Kiran\'s child', 'Varun is Kiran\'s son too', 'So Varun is ' + m + '\'s brother'] });
  },
  (r, i, c) => {
    return c.buildMCQ({ r, stem: 'Deepa introduced a boy as "He is the son of the daughter of my grandfather." How is the boy related to Deepa?',
      right: 'Brother', wrong: ['Cousin', 'Uncle', 'Nephew'],
      explanation: 'Grandfather\'s daughter = Deepa\'s mother; her son = Deepa\'s brother.',
      steps: ['Grandfather\'s daughter = Deepa\'s mother', 'Mother\'s son = Deepa\'s brother', 'Answer: Brother'] });
  },
  (r, i, c) => {
    return c.buildMCQ({ r, stem: 'P and Q are married. Q\'s sister is R. How is R related to P?',
      right: 'Sister-in-law', wrong: ['Sister', 'Cousin', 'Aunt'],
      explanation: 'Q is P\'s spouse; Q\'s sister = P\'s sister-in-law.',
      steps: ['Q = P\'s spouse', 'R = Q\'s sister', 'So R is P\'s sister-in-law'] });
  },
  (r, i, c) => {
    return c.buildMCQ({ r, stem: 'X\'s mother is the wife of Y. Y\'s father is Z. How is Z related to X?',
      right: 'Grandfather', wrong: ['Father', 'Uncle', 'Brother'],
      explanation: 'Y is X\'s father; Z is Y\'s father = X\'s grandfather.',
      steps: ['X\'s mother is Y\'s wife → Y is the father', 'Z is Y\'s father', 'So Z is X\'s grandfather'] });
  },
]);
G['Blood Relations'] = (r, i, c) => BR_TYPES[i % BR_TYPES.length](r, i, c);
// ---- Syllogism: distinct premise shapes, each a different reasoning rule ----
const SYL_TYPES = [
  (r, i, c) => {
    const A = c.pk(r, ['All cats are mammals', 'All dogs are animals', 'All tables are furniture', 'All roses are flowers']);
    const B = c.pk(r, ['No mammal is a bird', 'No animal is a stone', 'No furniture is a vehicle', 'No flower is a fruit']);
    return c.buildMCQ({ r, stem: 'Statements: ' + A + '. ' + B + '. Conclusion: Some A are B.',
      right: 'No conclusion follows', wrong: ['Only conclusion 1 follows', 'Only conclusion 2 follows', 'Either 1 or 2'],
      explanation: 'All A ⊆ B and B ∩ C = ∅ → we cannot say anything definite about A and C.',
      steps: ['All A are inside B', 'B has no overlap with C', 'A and C may or may not overlap', 'So no definite conclusion'] });
  },
  (r, i, c) => {
    const A = c.pk(r, ['All apples are fruits', 'All pens are stationery', 'All chairs are furniture', 'All rivers are water bodies']);
    const B = c.pk(r, ['Some fruits are sweet', 'Some stationery is cheap', 'Some furniture is wooden', 'Some water bodies are salty']);
    return c.buildMCQ({ r, stem: 'Statements: ' + A + '. ' + B + '. Conclusion: Some A are B.',
      right: 'Conclusion follows', wrong: ['Conclusion does not follow', 'Only converse conclusion follows', 'None'],
      explanation: 'All A are inside B and part of B is A ("Some B are A") — the overlap exists.',
      steps: ['Draw A circle inside B circle', 'Part of B overlaps A (Some B are A)', 'That overlap is exactly "Some A are B"'] });
  },
  (r, i, c) => {
    const A = c.pk(r, ['No bus is a train', 'No pen is a pencil', 'No cup is a plate', 'No lion is a deer']);
    const B = c.pk(r, ['Some trains are fast', 'Some pencils are sharp', 'Some plates are round', 'Some deer are brown']);
    const C = c.pk(r, ['buses are fast', 'pens are sharp', 'cups are round', 'lions are brown']);
    return c.buildMCQ({ r, stem: 'Statements: ' + A + '. ' + B + '. Conclusion: Some ' + C + '. Does it follow?',
      right: 'No, it does not follow', wrong: ['Yes, it follows', 'Follows generally', 'Follows necessarily'],
      explanation: 'A and B are disjoint, so an attribute of B does not transfer to A.',
      steps: ['No A is B → disjoint circles', 'Some B are C → C overlaps B', 'C may or may not touch A → not definite'] });
  },
  (r, i, c) => {
    const A = c.pk(r, ['Some books are novels', 'Some teachers are writers', 'Some fruits are citrus', 'Some birds are parrots']);
    const B = c.pk(r, ['All novels are stories', 'All writers are artists', 'All citrus are sour', 'All parrots are colourful']);
    return c.buildMCQ({ r, stem: 'Statements: ' + A + '. ' + B + '. Conclusion: Some A are B.',
      right: 'Yes, necessarily', wrong: ['No', 'Cannot be determined', 'Only the converse follows'],
      explanation: 'The Some part of A lies fully inside B, so it is A ∩ B.',
      steps: ['Some A lie inside B (statement 1)', 'All B lie inside C (statement 2)', 'That overlap is part of C too → conclusion holds'] });
  },
  (r, i, c) => {
    const A = c.pk(r, ['All players are athletes', 'All students are learners', 'All workers are employees', 'All citizens are voters']);
    const B = c.pk(r, ['No athlete is a doctor', 'No learner is a teacher', 'No employee is a manager', 'No voter is a politician']);
    return c.buildMCQ({ r, stem: 'Statements: ' + A + '. ' + B + '. Conclusion: No A is a B.',
      right: 'Yes, necessarily', wrong: ['No', 'Some A are B', 'Cannot be determined'],
      explanation: 'All A are inside B, and B does not touch C → A cannot touch C.',
      steps: ['All A ⊆ B', 'B ∩ C = ∅', 'So A ∩ C = ∅ → No A is C'] });
  },
  (r, i, c) => {
    const X = c.pk(r, ['All men are mortal', 'All scientists are logical', 'All poets are creative', 'All puppies are playful']);
    const Y = c.pk(r, ['Some mortal beings are great', 'Some logical people are astronauts', 'Some creative people are writers', 'Some playful animals are kittens']);
    return c.buildMCQ({ r, stem: 'Statements: ' + X + '. ' + Y + '. Conclusion: Some A could be great/astronaut/... (possibility).',
      right: 'Possibility conclusion is valid', wrong: ['Not valid', 'Only a definite conclusion is valid', 'Neither is valid'],
      explanation: 'Some B are C does not force any A to be C, but it IS possible.',
      steps: ['Some B are C may or may not include the A part', 'So "Some A are C" is possible, not certain', 'Possibility conclusions are valid'] });
  },
  (r, i, c) => {
    const A = c.pk(r, ['No mountain is a river', 'No rose is a tree', 'No fish is a bird', 'No star is a planet']);
    return c.buildMCQ({ r, stem: 'Statement: ' + A + '. Which follows?\n1) Some A are not B\n2) No B is A',
      right: 'Both 1 and 2 follow', wrong: ['Only 1', 'Only 2', 'Neither'],
      explanation: 'No A is B → disjoint circles → the converse and the existential negative both hold.',
      steps: ['No A is B → circles are disjoint', 'Converse: No B is A (follows)', 'Some A are not B (follows) → both true'] });
  },
  (r, i, c) => {
    const A = c.pk(r, ['All cats are animals. All tigers are cats', 'All dogs are mammals. All lions are cats', 'All birds are animals. All owls are birds']);
    return c.buildMCQ({ r, stem: 'Statements: ' + A + '. Conclusion: All tigers/lions/owls are animals. Does it follow?',
      right: 'Yes, necessarily', wrong: ['No', 'Only some', 'Does not follow'],
      explanation: 'The subject is wholly inside an intermediate set which is itself fully inside the larger set.',
      steps: ['All subjects are category X', 'All X are animals', 'By transitivity: all subjects are animals'] });
  },
];
// ---- Seating Arrangement: distinct linear/circular patterns ----
const SEAT_TYPES = [
  (r, i, c) => {
    const names = ['A', 'B', 'C', 'D', 'E'];
    const pos = c.pk(r, [2, 3, 4]);
    const name = names[Math.floor(r() * 5)];
    return c.buildMCQ({ r, stem: 'Five friends A, B, C, D and E sit in a row facing north. A sits at one of the ends. B sits exactly in the middle. C is second to the right of D. Who sits to the immediate left of B?',
      right: 'D', wrong: ['A', 'E', 'C'],
      explanation: 'Row: A (end) ... C D B ... → D is immediately left of B.',
      steps: ['Place B in the middle (position 3)', 'C second to the right of D', 'Arrangement: A ... C D B ...', 'So D is left of B'] });
  },
  (r, i, c) => {
    return c.buildMCQ({ r, stem: 'Six people P, Q, R, S, T, U sit in a circular arrangement facing the centre. P sits opposite R. Q sits to the immediate right of P. T sits second to the left of U. Who sits opposite Q?',
      right: 'U', wrong: ['P', 'R', 'T'],
      explanation: 'Fix P and R opposite; Q right of P; T and U placed; U lands opposite Q.',
      steps: ['Place P at top, R at bottom (opposite)', 'Q to the immediate right of P', 'T second left of U', 'Opposite of Q = U'] });
  },
  (r, i, c) => {
    const a1 = c.pk(r, ['A is to the left of B', 'C is to the right of D', 'E is between B and F']);
    const n = c.pk(r, [['A', 'C'], ['B', 'D'], ['E', 'F']]);
    return c.buildMCQ({ r, stem: 'Seven people are seated in a row. Given: ' + a1 + '. Which pair sits adjacent?',
      right: n[0] + ' and ' + n[1], wrong: ['G and H', 'I and J', 'K and L'],
      explanation: 'From the given relative clue, ' + n[0] + ' and ' + n[1] + ' are neighbours.',
      steps: ['Use the relative-placing clue: ' + a1, 'Only ' + n[0] + ' and ' + n[1] + ' are fixed relative to each other', 'So they sit adjacent'] });
  },
  (r, i, c) => {
    return c.buildMCQ({ r, stem: 'Four people sit in a row facing south. X sits second from the right. W sits to the immediate left of X. Y sits to the extreme left. Who sits to the immediate right of Y?',
      right: 'Z', wrong: ['X', 'W', 'Y'],
      explanation: 'Row facing south (left/right mirror): Y Z W X → Z is right of Y.',
      steps: ['X second from right', 'W immediately left of X', 'Y at extreme left', 'So order: Y Z W X → Z right of Y'] });
  },
  (r, i, c) => {
    const nn = c.pk(r, ['five', 'six', 'seven']);
    return c.buildMCQ({ r, stem: 'In a sitting arrangement of ' + nn + ' friends around a round table facing the centre, if two particular friends always sit together, in how many distinct ways can the arrangement be made?',
      right: nn === 'five' ? '48' : nn === 'six' ? '240' : '1440', wrong: [nn === 'five' ? '24' : nn === 'six' ? '120' : '720', nn === 'five' ? '120' : nn === 'six' ? '720' : '5040', nn === 'five' ? '12' : nn === 'six' ? '60' : '360'],
      explanation: 'Fix the pair as one unit → (n-1)! circular arrangements of units × 2! for the pair order.',
      steps: ['Tie the two friends into one unit', 'Units = ' + (nn === 'five' ? 4 : nn === 'six' ? 5 : 6), 'Circular arrangements of units = (' + (nn === 'five' ? 4 : nn === 'six' ? 5 : 6) + '-1)!', '× 2! for the pair order = ' + (nn === 'five' ? 3 : nn === 'six' ? 4 : 5) + '! × 2'] });
  },
  (r, i, c) => {
    const p = c.pk(r, [['chairs', '4', '3'], ['boys', '3', '2']]);
    return c.buildMCQ({ r, stem: 'There are ' + p[1] + ' empty ' + p[0] + ' and ' + p[2] + ' people. In how many ways can the people be seated?',
      right: String(perm(p[1], p[2])), wrong: [String(perm(p[1], p[2]) + 2), String(Math.pow(p[2], p[1])), String(fact(p[1]) * fact(p[2]))],
      explanation: 'P(' + p[1] + ', ' + p[2] + ') = ' + p[1] + '! / (' + p[1] + '-' + p[2] + ')! = ' + perm(p[1], p[2]) + '.',
      steps: ['Choose ' + p[2] + ' places from ' + p[1], 'Permute the people: ' + perm(p[1], p[2]) + ' ways', 'So total = ' + perm(p[1], p[2])] });
  },
];
G['Seating Arrangement'] = (r, i, c) => SEAT_TYPES[i % SEAT_TYPES.length](r, i, c);
function perm(n, r) { let p = 1; for (let k = 0; k < r; k++) p *= (n - k); return p; }
function fact(n) { let f = 1; for (let k = 2; k <= n; k++) f *= k; return f; }
// ---- Analogy: many distinct word-pair relation banks ----
const ANA_BANKS = [
  ['Doctor : Hospital', 'Teacher', 'School', 'works in'],
  ['Chef : Kitchen', 'Farmer', 'Field', 'works in'],
  ['Book : Read', 'Food', 'Eat', 'is used to'],
  ['Car : Drive', 'Song', 'Sing', 'is used to'],
  ['Cub : Lion', 'Kitten', 'Cat', 'is the young one of'],
  ['Puppy : Dog', 'Calf', 'Cow', 'is the young one of'],
  ['Pen : Write', 'Sword', 'Fight', 'is used for'],
  ['Sun : Light', 'Moon', 'Cool light', 'gives'],
  ['Bird : Wings', 'Fish', 'Fins', 'has'],
  ['Mango : Fruit', 'Tiger', 'Animal', 'is a kind of'],
  ['Run : Walk', 'Fast', 'Slow', 'relates as'],
  ['Earth : Planet', 'Rose', 'Flower', 'is a type of'],
  ['Rain : Flood', 'Fire', 'Smoke', 'causes'],
  ['Tree : Forest', 'Star', 'Galaxy', 'is part of'],
  ['Milk : White', 'Coal', 'Black', 'is coloured'],
  ['Teacher : Teach', 'Doctor', 'Treat', 'professionally'],
  ['Wool : Sheep', 'Silk', 'Silkworm', 'is obtained from'],
  ['Leg : Walk', 'Eye', 'See', 'is used to'],
];
G['Analogy'] = (r, i, c) => {
  const b = ANA_BANKS[i % ANA_BANKS.length];
  return c.buildMCQ({ r, stem: b[0] + ' :: ' + b[1] + ' : ?',
    right: b[2], wrong: [b[0].split(' : ')[1], b[0].split(' : ')[0], 'Patient'],
    explanation: b[1] + ' ' + b[3] + ' a ' + b[2] + ', just as ' + b[0].split(' : ')[0] + ' ' + b[3] + ' ' + b[0].split(' : ')[1] + '.',
    steps: ['Relation: ' + b[0].split(' : ')[0] + ' ' + b[3] + ' ' + b[0].split(' : ')[1], 'Apply to: ' + b[1], 'Answer: ' + b[2]] });
};
// ---- Statement & Assumptions: distinct scenario banks ----
const ASSUMP_TYPES = [
  (r, i, c) => {
    const st = c.pk(r, ['"Please do not use plastic bags."', '"Save water for the future."', '"Switch off lights when not in use."', '"Plant a tree this monsoon."']);
    return c.buildMCQ({ r, stem: 'Statement: ' + st + ' Assumption: The speaker believes people can follow the instruction.',
      right: 'Assumption is implicit', wrong: ['Assumption is not implicit', 'Partly implicit', 'No relation'],
      explanation: 'An instruction is only given because the speaker presumes listeners can act on it.',
      steps: ['The statement is a request/instruction', 'A request implies the speaker believes it can be done', 'So the assumption is implicit'] });
  },
  (r, i, c) => {
    const st = c.pk(r, ['"Government opened 100 new schools."', '"Company hired 500 new engineers."', '"City built 10 new hospitals."']);
    return c.buildMCQ({ r, stem: 'Statement: ' + st + ' Assumption: There is a need for such facilities/human resources.',
      right: 'Assumption is implicit', wrong: ['Not implicit', 'Vague', 'Irrelevant'],
      explanation: 'Expansion decisions are made assuming a genuine need exists.',
      steps: ['A big expansion implies demand', 'Organisations act on presumed need', 'So the assumption is implicit'] });
  },
  (r, i, c) => {
    const st = c.pk(r, ['"All employees must attend the training."', '"Every student should submit the assignment."', '"All residents must pay the tax."']);
    return c.buildMCQ({ r, stem: 'Statement: ' + st + ' Assumption: The instruction will be followed by everyone.',
      right: 'Not implicit', wrong: ['Implicit', 'Always implicit', 'Cannot be decided'],
      explanation: '"Must" expresses a rule/order, not a belief that everyone will comply.',
      steps: ['This is a directive, not a prediction', 'Rules are made regardless of exact compliance', 'So the assumption is NOT implicit'] });
  },
  (r, i, c) => {
    const st = c.pk(r, ['"Buy one get one free on soft drinks."', '"50% off on all winter clothes."', '"Free delivery on orders above Rs.499."']);
    return c.buildMCQ({ r, stem: 'Statement: ' + st + ' Assumption: Such offers attract more customers.',
      right: 'Assumption is implicit', wrong: ['Not implicit', 'None', 'Irrelevant'],
      explanation: 'Marketers make offers only because they assume offers increase sales.',
      steps: ['Offers are a marketing lever', 'Their purpose is to attract customers', 'So the assumption is implicit'] });
  },
];
G['Statement & Assumptions'] = (r, i, c) => ASSUMP_TYPES[i % ASSUMP_TYPES.length](r, i, c);
// ---- Batch L1: verified distinct-type expansions (ASCII-safe) ----
SEAT_TYPES.push(...[
  (r, i, c) => { const v = c.pk(r, [
    { st: 'Five people M, N, O, P and Q sit in a row facing north. O sits in the middle. M sits second from the left. N sits immediately to the right of O. P sits at the extreme right. Who sits at the extreme left?', a: 'Q', w: ['M', 'N', 'O'], s: ['O=3, M=2, N=4, P=5 from the clues', 'Only position 1 remains for Q', 'So Q is at the extreme left'] },
    { st: 'Five people A, B, C, D and E sit in a row facing north. D sits in the middle. A sits at the extreme right. B sits immediately to the left of D. E sits second from the right. Who sits at the extreme left?', a: 'C', w: ['A', 'B', 'D'], s: ['D=3, B=2, E=4, A=5 from the clues', 'Only position 1 remains for C', 'So C is at the extreme left'] }]); return c.buildMCQ({ r, stem: v.st, right: v.a, wrong: v.w, explanation: 'Fix the forced positions one by one; the only unfilled seat answers the question.', steps: v.s }); },
  (r, i, c) => { const v = c.pk(r, [
    { st: 'Six friends A, B, C, D, E and F sit in a row facing north. B sits third from the left. A sits immediately to the right of B. E sits at the extreme right. C sits second from the left. Who sits between C and A?', a: 'B', w: ['D', 'E', 'F'], s: ['B=3, A=4, E=6, C=2 from the clues', 'Positions 1 and 5 remain for D and F', 'Seat 3 (B) lies between C(2) and A(4)'] },
    { st: 'Six students L, M, N, O, P and Q sit in a row facing north. M sits fourth from the left. L sits immediately to the left of M. P sits at the extreme left. O sits second from the right. Who sits between L and O?', a: 'M', w: ['N', 'P', 'Q'], s: ['M=4, L=3, P=1, O=5 from the clues', 'Positions 2 and 6 remain for N and Q', 'Seat 4 (M) lies between L(3) and O(5)'] }]); return c.buildMCQ({ r, stem: v.st, right: v.a, wrong: v.w, explanation: 'Place each fixed clue first, then read the middle seat.', steps: v.s }); },
  (r, i, c) => { const v = c.pk(r, [
    { st: 'Seven people H, I, J, K, L, M and N sit in a row facing north. K sits fourth from the left. I sits immediately to the right of K. M sits at the extreme right. H sits second from the left. How many people sit between H and I?', a: '2', w: ['1', '3', '4'], s: ['K=4, I=5, M=7, H=2', 'Between positions 2 and 5 lie seats 3 and 4', 'So 2 people sit between H and I'] },
    { st: 'Seven people J, K, L, M, N, O and P sit in a row facing north. L sits third from the left. J sits immediately to the right of L. P sits at the extreme right. K sits second from the left. N sits between L and P. How many people sit between K and J?', a: '1', w: ['0', '2', '3'], s: ['L=3, J=4, P=7, K=2, N=5', 'Between positions 2 and 4 lies seat 3 (L)', 'So exactly 1 person sits between K and J'] }]); return c.buildMCQ({ r, stem: v.st, right: v.a, wrong: v.w, explanation: 'Convert each clue to a position number, then count the seats in between.', steps: v.s }); },
  (r, i, c) => { const v = c.pk(r, [
    { st: 'Four friends W, X, Y and Z sit in a row facing south. X is second from the left end. W is at the left end. Z is adjacent to X. Who is at the right end?', a: 'Y', w: ['W', 'X', 'Z'], s: ['Viewer left-to-right: W=1, X=2', 'Z adjacent to X takes position 3', 'Y fills the last seat (right end)'] },
    { st: 'Four students A, B, C and D sit in a row facing south. B is second from the left end. A is at the left end. C is adjacent to B. Who is at the right end?', a: 'D', w: ['A', 'B', 'C'], s: ['A=1, B=2 from the clues', 'C adjacent to B takes position 3', 'D fills the last seat (right end)'] }]); return c.buildMCQ({ r, stem: v.st, right: v.a, wrong: v.w, explanation: 'Seat the fixed people from the left end; the last unfilled seat is the answer.', steps: v.s }); },
  (r, i, c) => { const v = c.pk(r, [
    { st: 'Five friends G, H, I, J and K sit in a row facing north. H sits third from the left. J sits immediately to the left of H. K sits at the extreme left. Who sits immediately to the right of H?', a: 'I', w: ['G', 'J', 'K'], s: ['H=3, J=2, K=1', 'Seats 4 and 5 go to I and G in order', 'Immediately right of H(3) is seat 4 = I'] },
    { st: 'Five students L, M, N, O and P sit in a row facing north. M sits third from the left. O sits immediately to the left of M. P sits at the extreme left. Who sits immediately to the right of M?', a: 'L', w: ['N', 'O', 'P'], s: ['M=3, O=2, P=1', 'Seats 4 and 5 go to L and N in order', 'Immediately right of M(3) is seat 4 = L'] }]); return c.buildMCQ({ r, stem: v.st, right: v.a, wrong: v.w, explanation: 'Fix the left block first; the neighbour to the right is the next seat.', steps: v.s }); },
  (r, i, c) => { const v = c.pk(r, [
    { st: 'Six people sit in a row facing north: A at the extreme left, F at the extreme right, C third from the left, D immediately to the right of C. How many people sit between A and D?', a: '2', w: ['1', '3', '4'], s: ['A=1, C=3, D=4, F=6', 'Between A(1) and D(4) are seats 2 and 3', 'So 2 people (B and C) sit between them'] },
    { st: 'Five people sit in a row facing north: A at the extreme left, E at the extreme right, C second from the left, D immediately to the right of C. How many people sit between A and D?', a: '1', w: ['0', '2', '3'], s: ['A=1, C=2, D=3, E=5', 'Between A(1) and D(3) is seat 2 (C)', 'So exactly 1 person sits between them'] }]); return c.buildMCQ({ r, stem: v.st, right: v.a, wrong: v.w, explanation: 'Number the seats, place everyone, then count the middle seats.', steps: v.s }); },
]);
// ---- Batch L2: Blood Relations distinct chains ----
BR_TYPES.push(...[
  (r, i, c) => { const v = c.pk(r, [
    { st: 'Pointing to a man, Rita said, "He is the son of my grandfather\'s only son." How is the man related to Rita?', a: 'Brother', w: ['Cousin', 'Uncle', 'Nephew'], s: ['Grandfather\'s only son = Rita\'s father', 'Father\'s son (male) = Rita\'s brother', 'Answer: Brother'] },
    { st: 'Pointing to a woman, Suresh said, "She is the daughter of my grandmother\'s only daughter." How is the woman related to Suresh?', a: 'Sister', w: ['Cousin', 'Aunt', 'Niece'], s: ['Grandmother\'s only daughter = Suresh\'s mother', 'Mother\'s daughter (female) = Suresh\'s sister', 'Answer: Sister'] }]); return c.buildMCQ({ r, stem: v.st, right: v.a, wrong: v.w, explanation: 'Resolve the family chain from the oldest generation downward.', steps: v.s }); },
  (r, i, c) => { const v = c.pk(r, [
    { st: 'A is B\'s sister. C is B\'s mother. D is C\'s father. How is A related to D?', a: 'Granddaughter', w: ['Daughter', 'Grandmother', 'Niece'], s: ['D is C\'s father, and C is the mother of A and B', 'So D is the grandfather of A', 'A (female) is D\'s granddaughter'] },
    { st: 'P is Q\'s brother. R is Q\'s mother. S is R\'s father. How is P related to S?', a: 'Grandson', w: ['Son', 'Nephew', 'Grandfather'], s: ['S is R\'s father, and R is the mother of P and Q', 'So S is the grandfather of P', 'P (male) is S\'s grandson'] }]); return c.buildMCQ({ r, stem: v.st, right: v.a, wrong: v.w, explanation: 'Trace two generations up from the sibling pair to find the grandparent link.', steps: v.s }); },
  (r, i, c) => { const v = c.pk(r, [
    { st: 'Pointing to a photograph, Rima said, "He is the father of my mother\'s only sibling\'s son." How is the man related to Rima?', a: 'Uncle', w: ['Father', 'Grandfather', 'Brother-in-law'], s: ['Mother\'s only sibling = maternal uncle (mother is female, "only" leaves no aunt)', 'Uncle\'s son = Rima\'s cousin', 'Father of the cousin = the maternal uncle himself'] },
    { st: 'Pointing to a photograph, Amar said, "She is the mother of my father\'s only sibling\'s wife\'s sister." How is the woman related to Amar?', a: 'Cannot be determined', w: ['Aunt', 'Grandmother', 'Mother'], s: ['Father\'s only sibling = uncle; his wife\'s sister = aunt\'s sister', 'The aunt\'s sister is not related to Amar by blood in a fixed way (she could be anyone from the aunt\'s family)', 'Her relation to Amar is not fixed → cannot be determined'] }]); return c.buildMCQ({ r, stem: v.st, right: v.a, wrong: v.w, explanation: '"Only sibling" fixes gender; but in-law side relatives of in-laws have no fixed relation.', steps: v.s }); },
  (r, i, c) => { const v = c.pk(r, [
    { st: 'If X is the son of Y, and Y is the sister of Z, and Z is the daughter of W, how is W related to X?', a: 'Grandmother or grandfather', w: ['Definitely grandmother', 'Definitely grandfather', 'Father'], s: ['Z is Y\'s sibling, so W is the parent of Y and Z', 'X is Y\'s son', 'So W is X\'s grandparent; W\'s gender is never stated → grandmother or grandfather'] },
    { st: 'If M is the daughter of N, and N is the brother of O, and O is the son of P, how is P related to M?', a: 'Grandfather or grandmother', w: ['Definitely grandfather', 'Definitely grandmother', 'Uncle'], s: ['O is N\'s sibling, so P is the parent of N and O', 'M is N\'s daughter', 'So P is M\'s grandparent; gender not stated → either'] }]); return c.buildMCQ({ r, stem: v.st, right: v.a, wrong: v.w, explanation: 'When a relative\'s gender is never stated, keep both options; do not assume.', steps: v.s }); },
]);
// ---- Batch L2b: coded + in-law chains ----
BR_TYPES.push(...[
  (r, i, c) => { const v = c.pk(r, [
    { st: 'A + B means A is the mother of B; A - B means A is the brother of B. What does P + Q - R tell us about R?', a: 'R is P\'s child', w: ['R is P\'s grandson', 'R is P\'s nephew', 'R is definitely P\'s son'], s: ['P + Q: P is Q\'s mother', 'Q - R: Q is R\'s brother → R and Q share parents', 'So R is also P\'s child; R\'s own gender is not given, so "definitely son" is wrong'] },
    { st: 'A * B means A is the father of B; A @ B means A is the sister of B. What does M * N @ P tell us about P?', a: 'P is M\'s child', w: ['P is M\'s grandchild', 'P is M\'s nephew', 'P is M\'s sibling'], s: ['M * N: M is N\'s father', 'N @ P: N is P\'s sister → P shares N\'s parents', 'So P\'s father is also M → P is M\'s child'] }]); return c.buildMCQ({ r, stem: v.st, right: v.a, wrong: v.w, explanation: 'A sibling symbol makes both persons children of the same parents.', steps: v.s }); },
  (r, i, c) => { const v = c.pk(r, [
    { st: 'Introducing a boy, a girl said, "His mother is the only daughter of my mother." How is the girl related to the boy?', a: 'Mother', w: ['Aunt', 'Sister', 'Grandmother'], s: ['"Only daughter of my mother" = the girl herself', 'The boy\'s mother = the girl', 'So the girl is the boy\'s mother'] },
    { st: 'Introducing a man, a woman said, "His wife is the only daughter of my mother." How is the man related to the woman?', a: 'Husband', w: ['Brother-in-law', 'Brother', 'Father'], s: ['"Only daughter of my mother" = the woman herself', 'The man\'s wife = the woman', 'So the man is her husband'] }]); return c.buildMCQ({ r, stem: v.st, right: v.a, wrong: v.w, explanation: '"Only daughter of my mother" maps back to the speaker herself.', steps: v.s }); },
  (r, i, c) => { const v = c.pk(r, [
    { st: 'A\'s father is B\'s son. C is B\'s father. How is C related to A?', a: 'Grandfather\'s father (great-grandfather)', w: ['Grandfather', 'Father', 'Uncle'], s: ['A\'s father = B\'s son → A is two generations below B', 'C is B\'s father → C is three generations above A', 'So C is A\'s great-grandfather (grandfather\'s father)'] },
    { st: 'P\'s mother is Q\'s daughter. R is Q\'s father. How is R related to P?', a: 'Great-grandfather', w: ['Grandfather', 'Father', 'Grandson'], s: ['P\'s mother is Q\'s daughter → P is two generations below Q', 'R is Q\'s father → three generations above P', 'So R is P\'s great-grandfather'] }]); return c.buildMCQ({ r, stem: v.st, right: v.a, wrong: v.w, explanation: 'Count generations: each "father of" adds one level above.', steps: v.s }); },
  (r, i, c) => { const v = c.pk(r, [
    { st: 'X and Y are brothers. Z is Y\'s wife. W is X\'s son. How is Z related to W?', a: 'Aunt', w: ['Mother', 'Sister', 'Cousin'], s: ['Z is Y\'s wife and Y is W\'s uncle (W is X\'s son)', 'Wife of one\'s uncle = aunt', 'So Z is W\'s aunt'] },
    { st: 'M and N are sisters. O is N\'s husband. P is M\'s daughter. How is O related to P?', a: 'Uncle', w: ['Father', 'Brother', 'Cousin'], s: ['O is N\'s husband; N is P\'s aunt (P is M\'s daughter, M and N sisters)', 'Husband of one\'s aunt = uncle', 'So O is P\'s uncle'] }]); return c.buildMCQ({ r, stem: v.st, right: v.a, wrong: v.w, explanation: 'Uncle/aunt come from parent\'s siblings; their spouses carry the same title.', steps: v.s }); },
]);
// ---- Batch L2c: multi-statement puzzles ----
BR_TYPES.push(...[
  (r, i, c) => { const v = c.pk(r, [
    { st: 'In a family of six, P is the son of Q. R is the daughter of S. T is the father of S. Q and S are married. How is P related to R?', a: 'Brother', w: ['Cousin', 'Uncle', 'Cannot be determined'], s: ['Q and S are a married couple', 'P is Q\'s son and R is S\'s daughter', 'Same couple\'s children → P and R are siblings; P male → brother'] },
    { st: 'In a family of six, A is the daughter of B. C is the son of D. B and D are married. E is the grandmother of A. How is C related to A?', a: 'Brother', w: ['Cousin', 'Uncle', 'Cannot be determined'], s: ['B and D are a married couple', 'A is B\'s daughter, C is D\'s son', 'Same couple → siblings; C male → brother'] }]); return c.buildMCQ({ r, stem: v.st, right: v.a, wrong: v.w, explanation: 'Married couple with children stated on each side = one nuclear family.', steps: v.s }); },
  (r, i, c) => { const v = c.pk(r, [
    { st: 'A family has a couple with three children: two boys and one girl. The girl\'s paternal grandfather has only one son. How many male members are there at minimum (grandfather + couple + children)?', a: '4', w: ['5', '6', '3'], s: ['Paternal grandfather: 1 male', 'His only son (the father): 1 male', 'Two boys: 2 males', 'Total = 1 + 1 + 2 = 4 males'] },
    { st: 'A family has a couple with three children: one boy and two girls. The boy\'s maternal grandmother has only one daughter. How many female members are there at minimum (grandmother + couple + children)?', a: '4', w: ['3', '5', '2'], s: ['Maternal grandmother: 1 female', 'Her only daughter (the mother): 1 female', 'Two girl children: 2 females', 'Total = 1 + 1 + 2 = 4 females'] }]); return c.buildMCQ({ r, stem: v.st, right: v.a, wrong: v.w, explanation: 'Count each stated male/female across generations without assuming extras.', steps: v.s }); },
  (r, i, c) => { const v = c.pk(r, [
    { st: 'A is the brother of B. B is the wife of C. D is the father of A. How is D related to B?', a: 'Father', w: ['Father-in-law', 'Uncle', 'Grandfather'], s: ['A is the brother of B → they share the same parents', 'D is the father of A, so D is also the father of B', 'Blood relation → D is B\'s father'] },
    { st: 'P is the sister of Q. Q is the husband of R. S is the mother of P. How is S related to R?', a: 'Mother-in-law', w: ['Mother', 'Aunt', 'Grandmother'], s: ['P and Q are siblings, so S (P\'s mother) is also Q\'s mother', 'R is married to Q', 'Mother of the spouse = mother-in-law → S is R\'s mother-in-law'] }]); return c.buildMCQ({ r, stem: v.st, right: v.a, wrong: v.w, explanation: 'Decide the blood link first, then the in-law link; never mix the two chains.', steps: v.s }); },
  (r, i, c) => { const v = c.pk(r, [
    { st: 'A is older than B. B is the mother of C. A is the sister of B. Who is the eldest among A, B and C?', a: 'A definitely', w: ['B definitely', 'C definitely', 'Cannot be determined'], s: ['C is B\'s child → B is older than C', 'A is older than B (given)', 'So A > B > C in age → A is the eldest'] },
    { st: 'A is taller than B. B is the father of C. A is the son of B. Who is the shortest among A, B and C?', a: 'Cannot be determined', w: ['A definitely', 'B definitely', 'C definitely'], s: ['Height is independent of family relations', 'We know only that A is taller than B', 'C\'s height is unknown → the shortest cannot be determined'] }]); return c.buildMCQ({ r, stem: v.st, right: v.a, wrong: v.w, explanation: 'Family relations fix generation order, but only stated comparisons fix age/height.', steps: v.s }); },
]);
module.exports = { G };
G['Syllogism'] = (r, i, c) => SYL_TYPES[i % SYL_TYPES.length](r, i, c);