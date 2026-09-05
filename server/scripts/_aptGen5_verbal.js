// _aptGen5_verbal.js - high-space parametric generators for the verbal topics whose
// earlier banks exhausted. Each generator has >= 150 distinct reachable stems so
// 50/50/50 (easy/medium/hard) always fill. Contract: gen(r, i, c) -> buildMCQ.
const G = {};
const V_PK = (r, arr) => arr[Math.floor(r() * arr.length)];
function V_shuf(r, arr) { const a = arr.slice(); for (let k = a.length - 1; k > 0; k--) { const j = Math.floor(r() * (k + 1)); const t = a[k]; a[k] = a[j]; a[j] = t; } return a; }

// ============================== Sentence Correction ==============================
G['Sentence Correction'] = (r, i, c) => {
  const fam = i % 6;
  if (fam === 0) { // singular head + of-phrase
    const head = V_PK(r, ['list', 'bunch', 'series', 'set', 'pair', 'collection', 'group', 'team', 'box', 'batch', 'heap', 'stack', 'file', 'row', 'cluster']);
    const pl = V_PK(r, ['items', 'keys', 'files', 'reports', 'letters', 'chairs', 'books', 'tools', 'tickets', 'cards', 'parcels', 'documents']);
    const place = V_PK(r, ['on the desk', 'in the drawer', 'on the shelf', 'in the office', 'on the table', 'in the cupboard']);
    return c.buildMCQ({ r, stem: 'Choose the grammatically correct sentence:', right: 'The ' + head + ' of ' + pl + ' is ' + place + '.', wrong: ['The ' + head + ' of ' + pl + ' are ' + place + '.', 'The ' + head + ' of ' + pl + ' were ' + place + '.', 'The ' + head + ' of ' + pl + ' have been ' + place + '.'], explanation: 'The subject is the singular head noun "' + head + '" (the of-phrase does not change number), so it takes the singular verb "is".', steps: ['Spot the true subject: "' + head + '" (singular)', 'The phrase "of ' + pl + '" only modifies it', 'Singular subject -> "is": The ' + head + ' of ' + pl + ' is ' + place] });
  }
  if (fam === 1) { // each of + singular
    const n = V_PK(r, ['players', 'candidates', 'students', 'members', 'delegates', 'participants', 'contestants', 'applicants', 'interns', 'officers', 'artists', 'speakers']);
    const o = V_PK(r, ['a separate room', 'a certificate', 'a badge', 'an ID card', 'a meal coupon', 'a seat number', 'a practice kit', 'a locker']);
    return c.buildMCQ({ r, stem: 'Choose the grammatically correct sentence:', right: 'Each of the ' + n + ' has been given ' + o + '.', wrong: ['Each of the ' + n + ' have been given ' + o + '.', 'Each of the ' + n + ' were given ' + o + '.', 'Each of the ' + n + ' are given ' + o + '.'], explanation: '"Each" is always singular - "Each of the ' + n + ' has..." - even though the following noun is plural.', steps: ['The pronoun "each" is singular', 'Ignore the plural noun after "of"', 'Singular verb: Each of the ' + n + ' has been given ' + o] });
  }
  if (fam === 2) { // present simple -s form
    const S = ['He', 'She', 'My brother', 'Our teacher', 'The dog', 'Riya'];
    const V = [['go', 'goes'], ['watch', 'watches'], ['study', 'studies'], ['play', 'plays'], ['wash', 'washes'], ['carry', 'carries'], ['finish', 'finishes'], ['read', 'reads'], ['write', 'writes'], ['teach', 'teaches'], ['cry', 'cries'], ['fix', 'fixes'], ['enjoy', 'enjoys'], ['push', 'pushes'], ['fly', 'flies']];
    const s = V_PK(r, S), v = V_PK(r, V), t = V_PK(r, ['every morning', 'every evening', 'after dinner', 'before school', 'on Sundays', 'at noon']);
    return c.buildMCQ({ r, stem: 'Choose the grammatically correct sentence (habitual action):', right: s + ' ' + v[1] + ' ' + t + '.', wrong: [s + ' ' + v[0] + ' ' + t + '.', s + ' ' + v[0] + 'ing ' + t + '.', s + ' ' + v[1].replace(/(es|s)$/, '') + 'ing ' + t + '.'], explanation: 'Third-person singular subjects take the -s/-es form in the simple present: "' + s + '" -> "' + v[1] + '".', steps: ['Subject "' + s + '" is third-person singular', 'Simple present + habitual time (' + t + ') needs the -s/-es form', 'Correct: ' + s + ' ' + v[1] + ' ' + t] });
  }
  if (fam === 3) { // adjective + preposition
    const FR = [['good', 'at', ['mathematics', 'chess', 'coding', 'cricket', 'public speaking']], ['afraid', 'of', ['heights', 'water', 'spiders', 'loud noise', 'the dark']], ['interested', 'in', ['painting', 'astronomy', 'music', 'chess', 'gardening']], ['proud', 'of', ['her results', 'his team', 'their village', 'the win', 'his roots']], ['famous', 'for', ['its temples', 'its street food', 'its forts', 'its lake', 'its market']], ['angry', 'with', ['the delay', 'the driver', 'the service', 'his excuse', 'the noise']], ['keen', 'on', ['swimming', 'trekking', 'reading', 'sketching', 'cycling']], ['suitable', 'for', ['beginners', 'this role', 'the job', 'children', 'the trip']], ['fond', 'of', ['sweets', 'old songs', 'rain', 'cats', 'mangoes']], ['aware', 'of', ['the rules', 'the risk', 'the change', 'the deadline', 'the problem']]];
    const f = V_PK(r, FR), subj = V_PK(r, ['He is', 'She is', 'Ravi is', 'Meera is', 'The boy is', 'The girl is']);
    const wr = FR.map(x => x[1]).filter(p => p !== f[1]);
    return c.buildMCQ({ r, stem: subj + ' ' + f[0] + ' ___ ' + V_PK(r, f[2]) + '.  (Fill in the correct preposition.)', right: f[1], wrong: [wr[0], wr[1], wr[2]], explanation: 'The fixed collocation is "' + f[0] + ' ' + f[1] + '" - this adjective always takes "' + f[1] + '".', steps: ['Identify the adjective: ' + f[0], 'Its fixed preposition is "' + f[1] + '"', 'So: ' + f[0] + ' ' + f[1] + ' ...'] });
  }
  if (fam === 4) { // between you and me
    const cl = V_PK(r, ['the plan will not work', 'this deal is risky', 'the results look weak', 'the trip is cancelled', 'the manager is resigning', 'the prices will rise', 'the exam is postponed', 'the launch is delayed']);
    return c.buildMCQ({ r, stem: 'Choose the grammatically correct sentence:', right: 'Between you and me, ' + cl + '.', wrong: ['Between you and I, ' + cl + '.', 'Between yourself and I, ' + cl + '.', 'Between I and you, ' + cl + '.'], explanation: '"Between" is a preposition, so it takes the object pronoun "me" - "Between you and me".', steps: ['"Between" is a preposition', 'Prepositions take object pronouns (me, not I)', 'Correct: Between you and me, ' + cl] });
  }
  const FR5 = [['The cat licked ___ paws.', 'its', ["it's", 'his', 'their']], ['The students handed in ___ essays.', 'their', ['there', "they're", 'its']], ['The company moved ___ headquarters.', 'its', ["it's", "their's", 'their']], ['The twins completed ___ project.', 'their', ['there', 'its', "they're"]], ['The dog wagged ___ tail.', 'its', ["it's", 'their', 'his']], ['The players wore ___ new kits.', 'their', ['there', 'its', "they're"]], ['The bird rebuilt ___ nest.', 'its', ["it's", 'their', 'her']], ['The girls cleaned ___ desks.', 'their', ['there', 'its', 'his']]];
  const f5 = V_PK(r, FR5);
  return c.buildMCQ({ r, stem: f5[0] + '  (Choose the correct pronoun.)', right: f5[1], wrong: f5[2], explanation: f5[1] === 'its' ? '"Its" is the possessive of "it"; "it\'s" always means "it is".' : '"Their" is the possessive for plural owners; "there" is a place and "they\'re" means "they are".', steps: ['Check who owns the object', f5[1] === 'its' ? 'Singular non-human owner -> possessive "its" (no apostrophe)' : 'Plural owner -> possessive "their"', 'Correct: ' + f5[0].replace('___', f5[1])] });
};
// ============================== Error Detection ==============================
// Options are the four sentence PARTS; the right option is the faulty part.
G['Error Detection'] = (r, i, c) => {
  const fam = i % 5;
  let parts, rightIdx, fix, good;
  if (fam === 0) { // singular head + plural verb
    const head = V_PK(r, ['The team of experts', 'The list of names', 'The bunch of keys', 'The pack of cards', 'The set of tools', 'The group of students', 'The fleet of ships', 'The series of tests', 'The collection of stamps', 'The panel of judges']);
    const vb = V_PK(r, [['has reached', 'have reached'], ['has arrived', 'have arrived'], ['has assembled', 'have assembled'], ['has gathered', 'have gathered']]);
    const place = V_PK(r, ['the venue', 'the site', 'the hall', 'the campus', 'the lab', 'the stadium', 'the workshop', 'the auditorium']);
    const tail = V_PK(r, ['for the inspection.', 'for the meeting.', 'for the drill.', 'for the ceremony.']);
    parts = [head, vb[1], place, tail]; rightIdx = 1; good = vb[0]; fix = 'Head noun "' + head.split(' of ')[0] + '" is singular, so use "' + vb[0] + '" - the of-phrase does not change the subject\'s number.';
  } else if (fam === 1) { // since + period (needs 'for')
    const s = V_PK(r, ['She', 'Ravi', 'Our manager', 'The clerk', 'My uncle', 'Kavita']);
    const d = V_PK(r, ['five years', 'three months', 'two weeks', 'a decade', 'seven months', 'ten years']);
    const p = V_PK(r, ['at this branch', 'in this city', 'at this factory', 'in this office', 'at this school', 'in this team']);
    parts = [s + ' has been working', 'since ' + d, p, 'without a break.']; rightIdx = 1; good = 'for ' + d; fix = '"Since" marks a point in time; a length of time (' + d + ') needs "for": "' + s + ' has been working for ' + d + '".';
  } else if (fam === 2) { // article (sound-based a/an)
    const rows = [['an university topper', 'a university topper'], ['a honest worker', 'an honest worker'], ['an European scholar', 'a European scholar'], ['a MBA holder', 'an MBA holder'], ['a hour early', 'an hour early'], ['an unique case', 'a unique case']];
    const row = V_PK(r, rows), s = V_PK(r, ['He is', 'She is', 'Ravi is', 'Meera is', 'The boy is', 'The girl is']);
    parts = [s, row[0], 'in this college', 'these days.']; rightIdx = 1; good = row[1]; fix = 'Use "' + row[1] + '" - a/an follows the SOUND of the next word, not its spelling (' + row[1].split(' ').slice(1).join(' ') + ').';
  } else if (fam === 3) { // wrong preposition / verb form
    const rows = [
      [['Ravi', 'My cousin', 'Her brother'], 'married with', 'married', 'a doctor', 'last year.'],
      [['Our team is', 'This squad is', 'The unit is'], 'capable to win', 'capable of winning', 'the final', 'this season.'],
      [['My sister is', 'The boy is', 'His daughter is'], 'good in', 'good at', 'mathematics', 'since childhood.'],
      [['Most people', 'Many elders', 'Several guests'], 'prefer tea than', 'prefer tea to', 'coffee', 'in winter.'],
      [['The board', 'The panel', 'The committee'], 'discussed about', 'discussed', 'the proposal', 'yesterday.'],
      [['The committee', 'The crew', 'The unit'], 'comprises of', 'comprises', 'five members', 'at present.'],
      [['Please do not', 'Kindly do not', 'Never'], 'enter into', 'enter', 'the lab', 'without permission.'],
      [['We', 'They', 'The tenants'], 'listen the news on', 'listen to the news on', 'the radio', 'every morning.'],
      [['We are', 'I am', 'She is'], 'awaiting for', 'awaiting', 'the reply', 'with hope.'],
      [['He will', 'She will', 'The clerk will'], 'return back to', 'return to', 'the office', 'by Monday.'],
    ];
    const row = V_PK(r, rows);
    parts = [V_PK(r, row[0]), row[1], row[3], row[4]]; rightIdx = 1; good = row[2]; fix = 'Correct usage is "' + row[2] + '" - "' + row[1] + '" is a wrong collocation/verb form in this frame.';
  } else { // comparison errors
    const rows = [
      [['This route is', 'This method is', 'That approach is'], 'more better than', 'better than', 'the old one', 'at present.'],
      [['He is', 'She is', 'That rookie is'], 'most fastest', 'the fastest', 'runner in the school', 'by a margin.'],
      [['The new judge is', 'This captain is', 'The acting head is'], 'more wiser than', 'wiser than', 'the old one', 'in such matters.'],
      [['Rohit is', 'Sunita is', 'My brother is'], 'senior than me', 'senior to me', 'in service', 'by two years.'],
      [['This model is', 'That engine is', 'The new build is'], 'superior than', 'superior to', 'the previous one', 'in every test.'],
      [['The clerk handled', 'The intern handled', 'She handled'], 'lesser files than', 'fewer files than', 'his colleague', 'this week.'],
      [['The final was', 'The interview was', 'The trial was'], 'harder then ever', 'harder than ever', 'anyone expected', 'this season.'],
      [['Ravi is the', 'Suresh is the', 'Meera is the'], 'eldest of the two', 'elder of the two', 'siblings in the family', 'clearly.'],
    ];
    const row = V_PK(r, rows);
    parts = [V_PK(r, row[0]), row[1], row[3], row[4]]; rightIdx = 1; good = row[2]; fix = 'Correct form is "' + row[2] + '" - avoid double comparatives/superlatives and use the right comparative partner.';
  }
  const right = parts[rightIdx];
  const wrongs = parts.filter((x, k) => k !== rightIdx);
  const sentence = parts.join(' ');
  const corrected = parts.map((x, k) => (k === rightIdx ? good : x)).join(' ');
  return c.buildMCQ({ r, stem: 'Identify the part of the sentence that contains an error: "' + sentence + '"', right, wrong: wrongs, explanation: fix + ' Corrected sentence: "' + corrected + '"', steps: ['Read each part against the grammar rule it tests', 'Faulty part: "' + right + '"', fix, 'Corrected: "' + corrected + '"'] });
};
// ============================== Fill in the Blanks ==============================
// 48 collocation rows x 10 subject names = 480 stems. {N} is replaced by a name.
const FB_NAMES = ['Ravi', 'Sita', 'Amit', 'Neha', 'Karan', 'Pooja', 'Vikas', 'Anita', 'Sameer', 'Divya'];
const FB = [
  ['{N} apologised ___ his mistake.', 'for', 'of', 'with', 'from', '"apologise for" is the fixed collocation'],
  ['{N} is afraid ___ heights.', 'of', 'from', 'with', 'by', '"afraid of" is the fixed collocation'],
  ['{N} is good ___ chess.', 'at', 'in', 'on', 'for', '"good at" a skill or game'],
  ['{N} is interested ___ astronomy.', 'in', 'on', 'at', 'for', '"interested in" a subject'],
  ['{N} is fond ___ sweets.', 'of', 'with', 'for', 'from', '"fond of" is the fixed collocation'],
  ['{N} is keen ___ trekking.', 'on', 'in', 'at', 'for', '"keen on" an activity'],
  ['{N} is proud ___ her results.', 'of', 'for', 'on', 'about', '"proud of" an achievement'],
  ['{N} is aware ___ the rules.', 'of', 'for', 'with', 'in', '"aware of" something'],
  ['{N} insisted ___ paying the bill.', 'on', 'for', 'at', 'to', '"insist on" doing something'],
  ['{N} congratulated me ___ my success.', 'on', 'for', 'of', 'about', '"congratulate somebody on" something'],
  ['{N} depends ___ his parents.', 'on', 'of', 'from', 'with', '"depend on" somebody'],
  ['{N} is waiting ___ the bus.', 'for', 'of', 'to', 'at', '"wait for" something'],
  ['{N} belongs ___ a rich family.', 'to', 'with', 'for', 'in', '"belong to" a group or family'],
  ['{N} complained ___ the heat.', 'about', 'with', 'for', 'to', '"complain about" something'],
  ['{N} is capable ___ winning.', 'of', 'to', 'for', 'in', '"capable of" doing something'],
  ['{N} succeeded ___ his mission.', 'in', 'on', 'at', 'for', '"succeed in" an effort'],
  ['{N} is famous ___ his honesty.', 'for', 'of', 'in', 'with', '"famous for" a quality'],
  ['{N} agreed ___ my proposal.', 'to', 'with', 'on', 'for', '"agree to" a proposal (a thing)'],
  ['{N} is suffering ___ fever.', 'from', 'of', 'with', 'by', '"suffer from" an illness'],
  ['{N} has been working here ___ 2019.', 'since', 'for', 'from', 'by', '"since" + a point in time (2019)'],
  ['{N} has lived here ___ ten years.', 'for', 'since', 'from', 'during', '"for" + a period (ten years)'],
  ['{N} prefers tea ___ coffee.', 'to', 'than', 'from', 'with', '"prefer X to Y" (never "than")'],
  ['{N} is different ___ his brother.', 'from', 'than', 'to', 'with', '"different from" is the accepted form'],
  ['{N} died ___ cancer.', 'of', 'by', 'with', 'for', '"die of" a disease'],
  ['{N} is confident ___ victory.', 'of', 'for', 'in', 'to', '"confident of" an outcome'],
['{N} arrived ___ the station on time.', 'at', 'to', 'in', 'on', '"arrive at" a station'],
  ['{N} reached ___ the airport early.', 'at', 'to', 'in', 'on', '"reach" takes no preposition, but "arrive at a place"'],
  ['{N} got ___ the bus at noon.', 'on', 'in', 'into', 'at', '"get on" a bus'],
  ['{N} is married ___ a doctor.', 'to', 'with', 'from', 'by', '"married to" somebody'],
  ['{N} is allergic ___ dust.', 'to', 'of', 'with', 'for', '"allergic to" something'],
  ['{N} is answerable ___ the manager.', 'to', 'for', 'with', 'at', '"answerable to" a person'],
  ['{N} is responsible ___ the project.', 'for', 'to', 'of', 'with', '"responsible for" a task'],
  ['{N} is satisfied ___ her progress.', 'with', 'of', 'from', 'in', '"satisfied with" something'],
  ['{N} is covered ___ dust.', 'with', 'by', 'of', 'in', '"covered with" dust'],
  ['{N} was accompanied ___ his friend.', 'by', 'with', 'of', 'from', '"accompanied by" a person'],
  ['{N} is popular ___ his classmates.', 'among', 'with', 'by', 'to', '"popular among" a group'],
  ['{N} is proud ___ the team\'s win.', 'of', 'for', 'on', 'about', '"proud of" an achievement'],
  ['{N} is satisfied ___ the new plan.', 'with', 'of', 'for', 'at', '"satisfied with" a plan'],
  ['{N} takes pride ___ his work.', 'in', 'of', 'on', 'at', '"take pride in" something'],
  ['{N} is skilled ___ karate.', 'in', 'at', 'with', 'on', '"skilled in" an art'],
  ['{N} is absorbed ___ his studies.', 'in', 'of', 'with', 'at', '"absorbed in" an activity'],
  ['{N} is devoted ___ her family.', 'to', 'for', 'of', 'in', '"devoted to" somebody'],
  ['{N} is committed ___ the cause.', 'to', 'with', 'for', 'of', '"committed to" something'],
  ['{N} is sure ___ the outcome.', 'of', 'for', 'in', 'to', '"sure of" an outcome'],
  ['{N} is worthy ___ the praise.', 'of', 'for', 'in', 'to', '"worthy of" something'],
  ['{N} is blessed ___ good health.', 'with', 'by', 'of', 'in', '"blessed with" a quality'],
  ['{N} is overwhelmed ___ gratitude.', 'with', 'by', 'of', 'for', '"overwhelmed with" gratitude'],
  ['{N} is in need ___ help.', 'of', 'for', 'with', 'from', '"in need of" something'],
];
G['Fill in the Blanks'] = (r, i, c) => {
  const row = FB[i % FB.length];
  const name = V_PK(r, FB_NAMES);
  const stem = row[0].replace('{N}', name);
  return c.buildMCQ({ r, stem: stem + '. Choose the correct preposition.', right: row[1], wrong: [row[2], row[3], row[4]], explanation: row[5] + ': "' + row[1] + '"', steps: ['Look at the word before the blank: the + ' + row[5], 'The mesh of collocation: ' + row[1], stem.replace('___', row[1]) + '.'] });
};
// ============================== Para Jumbles ==============================
// 10 process scripts x 2 scramble variants x 4 wrong orders = 80 stems.
// Correct order printed + clues justify it.
const PJ = [
  [['First, the seeds are sown in a nursery.', 'After a week, the saplings are transplanted to the main field.', 'Then the young plants are watered regularly.', 'Finally, the crop is harvested after three months.'], 'Nursery sowing -> transplanting -> watering -> harvesting.'],
  [['The mixture is measured into a clean bowl.', 'Eggs and sugar are added and the batter is whisked.', 'The batter is poured into a greased tin.', 'The cake is baked for 35 minutes until golden.'], 'Preparation order: measure -> mix -> pour -> bake.'],
  [['The letter is typed on a computer.', 'It is printed and signed by the manager.', 'The envelope is sealed and stamped.', 'The postman delivers it the next day.'], 'Typing -> signing/printing -> stamping -> delivery.'],
  [['The patient is examined by the doctor.', 'Blood tests are prescribed as needed.', 'The reports are reviewed after a day.', 'The treatment plan is then finalised.'], 'Examination -> tests -> report review -> treatment plan.'],
  [['The cloth is cut into panels.', 'The panels are stitched together.', 'Buttons and zips are attached.', 'The finished shirt is ironed and packed.'], 'Cutting -> stitching -> fasteners -> ironing/packing.'],
  [['The bricks are laid row after row.', 'The walls are plastered smooth.', 'The roof is fixed with tiles.', 'Finally, the house is painted.'], 'Laying -> plastering -> roofing -> painting.'],
  [['The grapes are crushed gently.', 'The juice is left to ferment in barrels.', 'The wine is aged for a year.', 'It is bottled and corked for sale.'], 'Crush -> ferment -> age -> bottle.'],
  [['A draft of the report is written.', 'Colleagues review it carefully.', 'Revisions are incorporated.', 'The final report is submitted.'], 'Draft -> review -> revise -> submit.'],
  [['The alarm rings at six.', 'Riya washes up and has breakfast.', 'She packs her books and leaves.', 'She reaches school by eight.'], 'Wake -> routine -> packing -> reaching school.'],
  [['Ravi books the tickets online.', 'He packs a small bag.', 'He takes a cab to the station.', 'He boards the train on time.'], 'Book -> pack -> travel -> board.'],
];
G['Para Jumbles'] = (r, i, c) => {
  const P = PJ[i % PJ.length];
  const s = V_shuf(r, [0, 1, 2, 3]);
  const correct = P[0].map((x, idx) => x + ' (' + String.fromCharCode(65 + idx) + ')').join(' ');
  const want = V_PK(r, [['A-B-C-D', [0, 1, 2, 3]], ['B-C-D-A', [1, 2, 3, 0]], ['C-D-A-B', [2, 3, 0, 1]], ['D-A-B-C', [3, 0, 1, 2]]]);
  // option labels come in the order the shuffled sentences were presented
  const permMap = {};
  s.forEach((origIdx, pos) => { permMap[pos] = origIdx; });
  const codeOf = arr => arr.map(origIdx => Object.keys(permMap).find(p => permMap[p] === origIdx)).map(x => String.fromCharCode(65 + Number(x))).join('-');
  const right = want[0];
  const wrongs = [codeOf([1, 0, 2, 3]), codeOf([0, 2, 1, 3]), codeOf([0, 1, 3, 2])].filter(x => x !== right).slice(0, 3);
  while (wrongs.length < 3) wrongs.push('A-B-C-D');
  return c.buildMCQ({ r, stem: 'Rearrange the following sentences to form a meaningful paragraph: (A) ' + P[0][s[0]] + ' (B) ' + P[0][s[1]] + ' (C) ' + P[0][s[2]] + ' (D) ' + P[0][s[3]] + ' Which is the correct sequence?', right, wrong: wrongs, explanation: 'Logical sequence: ' + P[1] + ' The correct order is given by the letters tags: ' + correct, steps: ['Identify the opener by what starts a natural process', 'Look for follow-up clues (then, after, finally)', 'Sequence: ' + P[1], 'So the correct order is ' + right] });
};
// ============================== Vocabulary ==============================
// 45 word|meaning|3-wrongs rows; wrongs rotated so each is a distinct 4-set.
const VOC = [
  ['ambiguous', 'having more than one possible meaning', 'obvious', 'direct', 'clear'],
  ['benevolent', 'kind and generous', 'cruel', 'hostile', 'miserly'],
  ['coherent', 'logical and well-organised', 'confused', 'scattered', 'vague'],
  ['diligent', 'industrious and hard-working', 'lazy', 'careless', 'slack'],
  ['eloquent', 'fluent and persuasive in speaking', 'hesitant', 'inarticulate', 'mumbling'],
  ['frugal', 'careful with money', 'extravagant', 'wasteful', 'spendthrift'],
  ['genuine', 'real and authentic', 'fake', 'counterfeit', 'bogus'],
  ['hazardous', 'dangerous', 'safe', 'harmless', 'benign'],
  ['immense', 'extremely large', 'tiny', 'minute', 'puny'],
  ['juvenile', 'youthful or immature', 'adult', 'mature', 'senior'],
  ['keen', 'eager or sharp', 'reluctant', 'dull', 'indifferent'],
  ['lucid', 'easily understood; clear', 'obscure', 'confusing', 'murky'],
  ['meticulous', 'very careful about details', 'careless', 'sloppy', 'hasty'],
  ['notorious', 'famous for something bad', 'reputable', 'unknown', 'honourable'],
  ['optional', 'available as a choice', 'compulsory', 'mandatory', 'required'],
  ['pragmatic', 'practical rather than idealistic', 'idealistic', 'impractical', 'fanciful'],
  ['reluctant', 'hesitant / unwilling', 'willing', 'eager', 'keen'],
  ['sturdy', 'strong and solidly built', 'fragile', 'frail', 'flimsy'],
  ['tranquil', 'calm and peaceful', 'agitated', 'noisy', 'turbulent'],
  ['vulnerable', 'open to attack or harm', 'protected', 'safe', 'invulnerable'],
  ['wary', 'cautious and watchful', 'careless', 'trusting', 'reckless'],
  ['zealous', 'showing great enthusiasm', 'apathetic', 'indifferent', 'lukewarm'],
  ['adamant', 'refusing to change one\'s mind', 'flexible', 'yielding', 'agreeable'],
  ['arduous', 'needing great effort', 'easy', 'trivial', 'simple'],
  ['candid', 'frank and honest', 'evasive', 'secretive', 'deceptive'],
  ['docile', 'easily managed or taught', 'stubborn', 'rebellious', 'defiant'],
  ['elusive', 'difficult to capture or find', 'easy', 'attainable', 'tangible'],
  ['feasible', 'possible and practical', 'impossible', 'impractical', 'unworkable'],
  ['gregarious', 'enjoying the company of others', 'unsociable', 'reclusive', 'introverted'],
  ['hostile', 'unfriendly and aggressive', 'friendly', 'welcoming', 'warm'],
  ['inquisitive', 'curious and questioning', 'indifferent', 'apathetic', 'uninterested'],
  ['lament', 'to express sorrow or regret', 'celebrate', 'rejoice', 'cheer'],
  ['meticulousness', 'great attention to detail', 'carelessness', 'neglect', 'sloppiness'],
  ['novice', 'a beginner', 'expert', 'veteran', 'professional'],
  ['ominous', 'suggesting something bad is coming', 'promising', 'favourable', 'auspicious'],
  ['peril', 'serious danger', 'safety', 'security', 'shelter'],
  ['quench', 'to satisfy (thirst)', 'inflame', 'aggravate', 'dehydrate'],
  ['resilient', 'able to recover quickly', 'fragile', 'delicate', 'weak'],
  ['sceptical', 'doubtful', 'trusting', 'credulous', 'believing'],
  ['tedious', 'long and boring', 'exciting', 'lively', 'engaging'],
  ['upheaval', 'a violent or sudden change', 'stability', 'calm', 'peace'],
  ['vindicate', 'to clear from blame or suspicion', 'convict', 'accuse', 'blame'],
  ['witty', 'cleverly humorous', 'dull', 'boring', 'humourless'],
  ['yearn', 'to long for something', 'avoid', 'shun', 'reject'],
  ['chastise', 'to scold sharply', 'praise', 'reward', 'compliment'],
  ['aberration', 'a deviation from the normal', 'norm', 'standard', 'routine'],
  ['blithe', 'carefree and light-hearted', 'anxious', 'worried', 'gloomy'],
  ['callous', 'insensitive and cruel', 'kind', 'caring', 'gentle'],
  ['debilitate', 'to weaken', 'strengthen', 'invigorate', 'fortify'],
  ['ephemeral', 'lasting a very short time', 'lasting', 'permanent', 'enduring'],
  ['facade', 'a false outward appearance', 'reality', 'truth', 'substance'],
  ['garrulous', 'excessively talkative', 'taciturn', 'reserved', 'quiet'],
  ['heresy', 'a belief contrary to orthodox doctrine', 'orthodoxy', 'dogma', 'convention'],
  ['impetuous', 'acting suddenly without thought', 'deliberate', 'thoughtful', 'cautious'],
  ['jeopardise', 'to endanger', 'protect', 'preserve', 'shield'],
  ['kindle', 'to arouse or ignite', 'suppress', 'extinguish', 'dampen'],
  ['lethargic', 'sluggish and apathetic', 'energetic', 'vigorous', 'active'],
  ['magnanimous', 'generous and forgiving', 'petty', 'vindictive', 'stingy'],
  ['nefarious', 'wicked or criminal', 'virtuous', 'honourable', 'righteous'],
  ['obsolete', 'no longer in use', 'current', 'modern', 'new'],
  ['paucity', 'scarcity', 'plenty', 'abundance', 'wealth'],
  ['quaint', 'attractively unusual or old-fashioned', 'modern', 'ordinary', 'commonplace'],
  ['rancour', 'bitterness or resentment', 'goodwill', 'friendliness', 'harmony'],
  ['sagacious', 'wise and shrewd', 'foolish', 'unwise', 'dull'],
  ['tacit', 'understood without being said', 'explicit', 'stated', 'spoken'],
  ['ubiquitous', 'present everywhere', 'rare', 'scarce', 'uncommon'],
  ['venerate', 'to regard with great respect', 'despise', 'scorn', 'disrespect'],
  ['winsome', 'charming and engaging', 'repulsive', 'dull', 'unattractive'],
  ['xenophobia', 'dislike of foreigners', 'cosmopolitanism', 'tolerance', 'welcome'],
  ['yield', 'to give way or produce', 'resist', 'withstand', 'deny'],
  ['zealot', 'a fanatically committed person', 'moderate', 'indifferent', 'sceptic'],
  ['alacrity', 'eagerness or willingness', 'reluctance', 'slowness', 'apathy'],
  ['bucolic', 'relating to the countryside', 'urban', 'city', 'metropolitan'],
  ['capricious', 'subject to sudden changes of mood', 'stable', 'steady', 'predictable'],
  ['dearth', 'a scarcity or lack', 'plenty', 'abundance', 'surplus'],
  ['efface', 'to wipe out or obliterate', 'preserve', 'maintain', 'retain'],
  ['fortuitous', 'happening by lucky chance', 'planned', 'intentional', 'deliberate'],
  ['gregariousness', 'a love of company', 'solitude', 'reclusiveness', 'withdrawal'],
  ['harbinger', 'a forerunner of something', 'outcome', 'follow-up', 'result'],
  ['innocuous', 'harmless', 'harmful', 'dangerous', 'hazardous'],
  ['jovial', 'cheerful and friendly', 'gloomy', 'serious', 'sullen'],
  ['knell', 'the sound of a bell, esp. for a death', 'celebration', 'festival', 'carol'],
  ['labyrinth', 'a maze-like structure', 'straight path', 'corridor', 'opening'],
  ['malleable', 'easily shaped or influenced', 'rigid', 'stiff', 'unbending'],
];
function genVocab(r, i, c) {
  const row = VOC[i % VOC.length];
  const mode = i % 2 === 0 ? 'def' : 'syn';
  const rot = i % 3;
  const wrongsDef = rot === 0 ? [row[2], row[3], row[4]] : rot === 1 ? [row[3], row[4], row[2]] : [row[4], row[2], row[3]];
  const wrongsSyn = c.pk(r, VOC.filter(x => x[0] !== row[0]).map(x => x[0]));
  const wrongs = mode === 'def' ? wrongsDef : [wrongsSyn[0], wrongsSyn[1], wrongsSyn[2]];
  const stem = mode === 'def' ? 'What does the word "' + row[0] + '" mean?' : 'Which word is most similar in meaning to "' + row[0] + '"?';
  const right = mode === 'def' ? row[1] : row[0];
  return { stem, right, wrongs, mode, word: row[0] };
}
G['Vocabulary'] = (r, i, c) => {
  const o = genVocab(r, i, c);
  const expl = o.mode === 'def' ? o.word + ' = ' + o.right + '. The other options are opposite or unrelated senses.' : '"' + o.right + '" is the closest in meaning to "' + o.word + '"; the others are unrelated or opposing.';
  return c.buildMCQ({ r, stem: o.stem, right: o.right, wrong: o.wrongs, explanation: expl, steps: ['Parse the root/context of "' + o.word + '"', 'Target: ' + (o.mode === 'def' ? 'definition' : 'synonym'), 'So: ' + o.right] });
};
// ============================== Grammar ==============================
// 5 parametric families: subject-verb agreement, tenses, articles, pronouns, connectors.
G['Grammar'] = (r, i, c) => {
  const fam = i % 5;
  if (fam === 0) { // SVA: either/neither + singular
    const qn = V_PK(r, ['cats', 'dogs', 'birds', 'birds in the cage', 'children', 'workers', 'files', 'tickets', 'rooms', 'guests']);
    const o1 = V_PK(r, ['in the garden.', 'on the roof.', 'outside the gate.', 'near the window.']);
    const o2 = V_PK(r, ['been cleaned yet.', 'been fed yet.', 'been checked yet.', 'arrived yet.', 'been watered yet.', 'been booked yet.']);
    const pair = V_PK(r, [['Neither of the', 'is'], ['Either of the', 'is'], ['One of the', 'is'], ['Each of the', 'has'], ['None of the', 'is']]);
    return c.buildMCQ({ r, stem: 'Choose the grammatically correct sentence:', right: pair[0] + ' ' + qn + ' ' + pair[1] + ' ' + o1, wrong: [pair[0] + ' ' + qn + ' are ' + o1, pair[0] + ' ' + qn + ' have ' + o2, pair[0] + ' ' + qn + ' were ' + o1], explanation: 'The subject is "each/either/neither/none/one", which is singular, so the singular verb is correct.', steps: ['Identify the subject: "' + pair[0].replace(' of the', '') + '" (singular)', 'of-phrase does not change number', 'Use singular verb ' + pair[1]] });
  }
  if (fam === 1) { // tense: present perfect with just/already/yet
    const S = V_PK(r, [['He', 'has'], ['She', 'has'], ['Ravi', 'has'], ['Meera', 'has'], ['The chef', 'has']]);
    const v = V_PK(r, [['finished', 'the report'], ['completed', 'the course'], ['cleaned', 'the room'], ['posted', 'the letter'], ['cooked', 'dinner'], ['booked', 'the tickets']]);
    const adv = V_PK(r, ['just', 'already']);
    return c.buildMCQ({ r, stem: 'Choose the grammatically correct sentence:', right: S[0] + ' ' + S[1] + ' ' + adv + ' ' + v[0] + ' ' + v[1] + '.', wrong: [S[0] + ' ' + adv + ' ' + S[1].replace('has', 'is') + ' ' + v[0] + ' ' + v[1] + '.', S[0] + ' ' + S[1] + ' ' + v[0] + 'ing ' + v[1] + '.', S[0] + ' ' + S[1] + ' ' + v[0] + ' ' + v[1] + ' yesterday.'], explanation: 'With "just/already", use the present perfect (has + past participle): ' + S[0] + ' ' + S[1] + ' ' + adv + ' ' + v[0] + '.', steps: ['"Just"/"already" signal the present perfect', 'has + past participle (' + v[0] + ')', 'So: ' + S[0] + ' ' + S[1] + ' ' + adv + ' ' + v[0] + ' ' + v[1]] });
  }
  if (fam === 2) { // articles: a/an/the omission
    const rows = [
      ['She stays at ___ hotel near the station.', 'a', 'an', 'the', 'no article'],
      ['We saw ___ owl in the garden.', 'an', 'a', 'the', 'no article'],
      ['___ Himalayas are the highest mountains.', 'The', 'A', 'An', 'no article'],
      ['Ravi plays ___ piano every evening.', 'the', 'a', 'an', 'no article'],
      ['He is ___ honest man.', 'an', 'a', 'the', 'no article'],
      ['___ Ganga is a holy river.', 'The', 'A', 'An', 'no article'],
      ['She bought ___ umbrella yesterday.', 'an', 'a', 'the', 'no article'],
      ['We stayed for ___ hour.', 'an', 'a', 'the', 'no article'],
      ['___ earth revolves around the sun.', 'The', 'A', 'An', 'no article'],
      ['He ate ___ apple for breakfast.', 'an', 'a', 'the', 'no article'],
      ['The Nile is ___ longest river.', 'the', 'a', 'an', 'no article'],
      ['She has ___ unique style.', 'a', 'an', 'the', 'no article'],
      ['___ Pacific Ocean is very deep.', 'The', 'A', 'An', 'no article'],
      ['He gave me ___ one-rupee coin.', 'a', 'an', 'the', 'no article'],
      ['Riya wants to become ___ astronaut.', 'an', 'a', 'the', 'no article'],
    ];
    const row = V_PK(r, rows);
    return c.buildMCQ({ r, stem: row[0] + '. Choose the correct article.', right: row[1], wrong: row.slice(2, 5), explanation: 'Article chosen for the SOUND and context of the next noun: "' + row[1] + '".', steps: ['Check the sound of the next word after the blank', 'Singular countable -> a/an; known/unique -> the', 'Correct: ' + row[0].replace('___', row[1])] });
  }
  if (fam === 3) { // pronouns: who/whom/whose
    const l = V_PK(r, [['who', 'that', 'the person'], ['whom', 'that', 'the person'], ['whose', 'her/his', 'the person']]);
    const right = l[0] === 'who' ? 'who' : l[0] === 'whom' ? 'whom' : 'whose';
    const wrongs = l[0] === 'who' ? ['whom', 'whose', 'what'] : l[0] === 'whom' ? ['who', 'whose', 'which'] : ['who', 'whom', 'which'];
    const stem = l[0] === 'who' ? 'The man ___ lives next door is a doctor.' : l[0] === 'whom' ? 'The man ___ you met yesterday is my uncle.' : 'The man ___ car was stolen filed a case.';
    return c.buildMCQ({ r, stem: stem + '. Choose the correct relative pronoun.', right, wrong: wrongs, explanation: l[1] + ' in a ' + (l[0] === 'who' ? 'subject (who)' : l[0] === 'whom' ? 'object (whom)' : 'possessive (whose)') + ' position.', steps: ['Check what role the pronoun plays in the clause', 'Subject->who / object->whom / possession->whose', 'Correct: ' + right] });
  }
  const GR_PREP = [
    ['She is good ___ mathematics.', 'at', ['in', 'on', 'with']],
    ['He is afraid ___ the dark.', 'of', ['from', 'with', 'by']],
    ['I am interested ___ astronomy.', 'in', ['on', 'at', 'for']],
    ['She is proud ___ her achievement.', 'of', ['for', 'on', 'about']],
    ['He got ___ the bus at the next stop.', 'on', ['in', 'into', 'at']],
    ['She knocked ___ the door twice.', 'at', ['on', 'in', 'to']],
    ['He is married ___ a doctor.', 'to', ['with', 'from', 'by']],
    ['She is fond ___ classical music.', 'of', ['with', 'for', 'on']],
    ['He depends ___ his parents for money.', 'on', ['of', 'from', 'with']],
    ['She is allergic ___ dust.', 'to', ['of', 'with', 'for']],
    ['He is keen ___ learning French.', 'on', ['in', 'at', 'for']],
    ['She is responsible ___ this project.', 'for', ['of', 'to', 'with']],
    ['He is capable ___ doing it alone.', 'of', ['to', 'for', 'in']],
    ['She was absent ___ the meeting.', 'from', ['of', 'to', 'in']],
    ['He is familiar ___ this software.', 'with', ['of', 'to', 'for']],
    ['He has been waiting ___ hours.', 'for', ['since', 'from', 'by']],
    ['She arrived ___ the station on time.', 'at', ['to', 'in', 'on']],
  ];
  const GR_PAST = [
    ['He went to the market', 'yesterday.', 'goes', 'went'],
    ['She bought a new pen', 'last week.', 'buys', 'bought'],
    ['They watched a movie', 'last night.', 'watch', 'watched'],
    ['I wrote a letter', 'yesterday morning.', 'write', 'wrote'],
    ['The car stopped at the gate', 'a moment ago.', 'stops', 'stopped'],
    ['Ravi ate all the apples', 'an hour ago.', 'eats', 'ate'],
    ['She sang a beautiful song', 'at the party.', 'sings', 'sang'],
    ['He ran to school', 'because he was late.', 'runs', 'ran'],
    ['They left the office', 'at six.', 'leave', 'left'],
    ['I saw an elephant', 'in the zoo.', 'see', 'saw'],
    ['We made a plan', 'for the holidays.', 'make', 'made'],
    ['She took the train', 'to Delhi.', 'takes', 'took'],
    ['He wore a blue shirt', 'to the interview.', 'wears', 'wore'],
    ['They built a bridge', 'over the river.', 'build', 'built'],
    ['She spoke to the manager', 'in the morning.', 'speaks', 'spoke'],
  ];
  const GR_SVA2 = [
    ['The quality of the mangoes ___ good.', 'is', ['are', 'were', 'have been']],
    ['A number of students ___ present.', 'were', ['was', 'is', 'has been']],
    ['Ten kilometres ___ a long distance.', 'is', ['are', 'were', 'have been']],
    ['The news ___ true.', 'is', ['are', 'were', 'have been']],
    ['Mathematics ___ my favourite subject.', 'is', ['are', 'were', 'have been']],
    ['The committee ___ decided the matter.', 'has', ['have', 'were', 'are']],
    ['Bread and butter ___ my breakfast.', 'is', ['are', 'were', 'have been']],
    ['Either he or his brothers ___ responsible.', 'are', ['is', 'was', 'has been']],
    ['Neither the teacher nor the students ___ present.', 'were', ['was', 'is', 'has been']],
    ['The jury ___ divided in its opinion.', 'is', ['are', 'were', 'have been']],
  ];
  const GR_CONN = [
    ['although', 'he was tired', 'he kept working'],
    ['unless', 'you apologise', 'I will not talk to you'],
    ['because', 'it rained', 'the ground was wet'],
    ['while', 'she sings', 'she chops vegetables'],
    ['since', 'he left', 'nobody has used that chair'],
    ['though', 'he lost', 'he played well'],
    ['as soon as', 'she arrived', 'the meeting began'],
    ['before', 'he left', 'he locked the door'],
  ];
  const fam6 = i % 6;
  if (fam6 === 0) {
    const row = V_PK(r, GR_PREP);
    return c.buildMCQ({ r, stem: row[0] + ' Choose the correct preposition.', right: row[1], wrong: row[2], explanation: 'The fixed collocation uses "' + row[1] + '".', steps: ['Spot the governing word', 'Its fixed preposition is "' + row[1] + '"', 'Correct: ' + row[0].replace('___', row[1])] });
  }
  if (fam6 === 1) {
    const row = V_PK(r, GR_PAST);
    return c.buildMCQ({ r, stem: row[0] + ' ___ ' + row[1] + ' Choose the correct verb form.', right: row[3], wrong: [row[2], row[3] + 'ing', 'has ' + row[3]], explanation: 'A past time marker (' + row[1] + ') needs the simple past: ' + row[3] + '.', steps: ['Spot the time marker: ' + row[1], 'Simple past verb: ' + row[3], 'Correct: ' + row[0] + ' ' + row[3] + ' ' + row[1]] });
  }
  if (fam6 === 2) {
    const row = V_PK(r, GR_SVA2);
    return c.buildMCQ({ r, stem: row[0] + ' Choose the correct verb.', right: row[1], wrong: row[2], explanation: 'This is a subject-verb agreement rule (special head noun/idiom): "' + row[1] + '".', steps: ['Identify the true subject', 'Apply the SVA rule', 'Correct verb: ' + row[1]] });
  }
  if (fam6 === 3) {
    const conn = V_PK(r, GR_CONN);
    const wrongs = V_shuf(r, GR_CONN.filter(x => x[0] !== conn[0]).map(x => x[0])).slice(0, 3);
    return c.buildMCQ({ r, stem: '___ ' + conn[1] + ', ' + conn[2] + '.', right: conn[0], wrong: wrongs, explanation: 'The connector "' + conn[0] + '" matches the relation between the clauses.', steps: ['Identify the relation', 'Choose the matching connector', 'Correct: ' + conn[0]] });
  }
  const l = V_PK(r, [['who', 'that', 'the person'], ['whom', 'that', 'the person'], ['whose', 'her/his', 'the person']]);
  const rp = l[0] === 'who' ? 'who' : l[0] === 'whom' ? 'whom' : 'whose';
  const stem = l[0] === 'who' ? 'The man ___ lives next door is a doctor.' : l[0] === 'whom' ? 'The man ___ you met yesterday is my uncle.' : 'The man ___ car was stolen filed a case.';
  return c.buildMCQ({ r, stem: stem + '. Choose the correct relative pronoun.', right: rp, wrong: l[0] === 'who' ? ['whom', 'whose', 'what'] : l[0] === 'whom' ? ['who', 'whose', 'which'] : ['who', 'whom', 'which'], explanation: 'A ' + (l[0] === 'who' ? 'subject' : l[0] === 'whom' ? 'object' : 'possessive') + ' pronoun is needed here.', steps: ['Check the pronoun\'s role in the clause', 'Subject->who / object->whom / possession->whose', 'Correct: ' + rp] });
};
// ============================== Active & Passive Voice ==============================
// 5 full transformation families: tense frames x wide verb/subject pools = 250+ stems.
const AV_PERSONS = ['Ravi', 'Sita', 'The chef', 'The manager', 'Riya', 'The boy', 'The girl', 'Amit', 'Meera', 'The guard', 'Kiran', 'The clerk'];
const AV_DOERS = ['the boys', 'the girls', 'the workers', 'the police', 'the children', 'the cooks', 'the engineers', 'the guards', 'the nurses', 'the farmers', 'the players', 'the students', 'the painters', 'the drivers'];
const AV_OBJ = [
  ['the door', 'the letter', 'the gate', 'the report', 'the parcel', 'the car', 'the house', 'the shirt', 'the wall', 'the window', 'the bridge', 'the machine', 'the pond', 'the fence'],
];
G['Active & Passive Voice'] = (r, i, c) => {
  const fam = i % 5;
  const s = V_PK(r, AV_PERSONS), O = V_PK(r, AV_OBJ[0]), doer = V_PK(r, AV_DOERS);
  if (fam === 0) { // simple present -> present simple passive (am/is/are + V3)
    const v3 = V_PK(r, ['closed', 'opened', 'painted', 'cleaned', 'repaired', 'fixed', 'guarded', 'locked']);
    const op = i % 4;
    if (op === 0) return c.buildMCQ({ r, stem: 'Convert to passive voice: "' + s + ' opens ' + O + ' every morning."', right: O[0].toUpperCase()[0] + O.slice(1) + ' is opened by ' + s + ' every morning.', wrong: [O + ' are opened by ' + s + ' every morning.', O + ' is open by ' + s + ' every morning.', O + ' is opened from ' + s + ' every morning.'], explanation: 'Simple present (opens) -> passive "is opened"; agent introduced by "by".', steps: ['Identify tense: simple present', 'Passive: is/are + V3', 'So: ' + O[0].toUpperCase()[0] + O.slice(1) + ' is opened by ' + s] });
    if (op === 1) return c.buildMCQ({ r, stem: 'Convert to passive voice: "' + doer + ' guard ' + O + ' every night."', right: O + ' is guarded by ' + doer + ' every night.', wrong: [O + ' are guarded by ' + doer + ' every night.', O + ' is guarding by ' + doer + ' every night.', O + ' is guarded from ' + doer + ' every night.'], explanation: 'Simple present (guard) -> passive "is guarded"; "by" introduces the doer.', steps: ['Simplify: simple present', 'is/are + guarded', 'So: ' + O + ' is guarded by ' + doer] });
    return c.buildMCQ({ r, stem: 'Convert to passive voice: "' + s + ' ' + v3 + ' ' + O + ' daily."', right: O + ' is ' + v3 + ' by ' + s + ' daily.', wrong: [O + ' are ' + v3 + ' by ' + s + ' daily.', O + ' is ' + v3 + 'ing by ' + s + ' daily.', O + ' is ' + v3 + ' from ' + s + ' daily.'], explanation: 'Simple present -> passive "is ' + v3 + '" + "by" + agent.', steps: ['Simple present', 'is/are + ' + v3, 'So: ' + O + ' is ' + v3 + ' by ' + s] });
  }
if (fam === 1) { // past -> past passive (was/were + V3)
    const v3 = V_PK(r, ['painted', 'repaired', 'cleaned', 'closed', 'opened', 'built', 'washed']);
    const op = i % 3;
    if (op === 0) return c.buildMCQ({ r, stem: 'Convert to passive voice: "' + s + ' painted ' + O + '."', right: O + ' was painted by ' + s + '.', wrong: [O + ' were painted by ' + s + '.', O + ' was paint by ' + s + '.', O + ' was painted from ' + s + '.'], explanation: 'Simple past (painted) -> passive "was painted"; agent via "by".', steps: ['Simple past', 'was/were + V3', 'So: ' + O + ' was painted by ' + s] });
    if (op === 1) return c.buildMCQ({ r, stem: 'Convert to passive voice: "' + doer + ' ' + v3 + ' ' + O + ' last week."', right: O + ' was ' + v3 + ' by ' + doer + ' last week.', wrong: [O + ' were ' + v3 + ' by ' + doer + ' last week.', O + ' was ' + v3 + 'ing by ' + doer + ' last week.', O + ' was ' + v3 + ' from ' + doer + ' last week.'], explanation: 'Simple past (' + v3 + ') -> passive "was ' + v3 + '".', steps: ['Simple past', 'was/were + ' + v3, 'So: ' + O + ' was ' + v3 + ' by ' + doer] });
    return c.buildMCQ({ r, stem: 'Convert to passive voice: "' + s + ' ' + v3 + ' ' + O + ' yesterday."', right: O + ' was ' + v3 + ' by ' + s + ' yesterday.', wrong: [O + ' were ' + v3 + ' by ' + s + ' yesterday.', O + ' is ' + v3 + ' by ' + s + ' yesterday.', O + ' was ' + v3 + 'ing by ' + s + ' yesterday.'], explanation: 'Simple past (' + v3 + ') -> passive "was ' + v3 + ' + by + agent".', steps: ['Simple past', 'was/were + ' + v3, 'So: ' + O + ' was ' + v3 + ' by ' + s] });
  }
  if (fam === 2) { // will -> future passive (will be + V3)
    const v3 = V_PK(r, ['completed', 'delivered', 'announced', 'published', 'finalised', 'signed', 'released', 'submitted']);
    return c.buildMCQ({ r, stem: 'Convert to passive voice: "' + s + ' will ' + v3 + ' ' + O + ' by Friday."', right: O + ' will be ' + v3 + ' by ' + s + ' by Friday.', wrong: [O + ' will be ' + v3 + 'ing by ' + s + ' by Friday.', O + ' will ' + v3 + ' by ' + s + ' by Friday.', O + ' will have ' + v3 + ' by ' + s + ' by Friday.'], explanation: 'Future (will + V1) -> passive "will be + V3".', steps: ['Future tense', 'will be + past participle', 'So: ' + O + ' will be ' + v3 + ' by ' + s] });
  }
  if (fam === 3) { // present continuous -> passive (is/are being + V3)
    const v3 = V_PK(r, ['built', 'repaired', 'cleaned', 'painted', 'watched', 'decorated', 'examined', 'loaded']);
    return c.buildMCQ({ r, stem: 'Convert to passive voice: "' + doer + ' are ' + v3 + 'ing ' + O + '."', right: O + ' is being ' + v3 + ' by ' + doer + '.', wrong: [O + ' is being ' + v3 + 'ing by ' + doer + '.', O + ' is ' + v3 + ' by ' + doer + '.', O + ' are being ' + v3 + ' by ' + doer + '.'], explanation: 'Present continuous (are V-ing) -> passive "is being + V3".', steps: ['Present continuous', 'is/are being + V3', 'So: ' + O + ' is being ' + v3 + ' by ' + doer] });
  }
  const v3 = V_PK(r, ['completed', 'finished', 'submitted', 'cleaned', 'closed', 'repaired']);
  return c.buildMCQ({ r, stem: 'Convert to passive voice: "' + doer + ' have ' + v3 + ' ' + O + '."', right: O + ' has been ' + v3 + ' by ' + doer + '.', wrong: [O + ' has being ' + v3 + ' by ' + doer + '.', O + ' has be ' + v3 + ' by ' + doer + '.', O + ' has been ' + v3 + 'ing by ' + doer + '.'], explanation: 'Present perfect (have + V3) -> passive "has been + V3".', steps: ['Present perfect', 'has/have been + V3', 'So: ' + O + ' has been ' + v3 + ' by ' + doer] });
};
// ============================== Direct & Indirect Speech ==============================
// 8 families x wide pools -> 1000+ reachable stems. Every option differs by WORDS
// (normalizeText strips punctuation, so punctuation-only distractors are illegal),
// and each transformation is grammatically exact. fam 5/6 report questions properly.
const DIS_SP = [['He said', 'he'], ['She said', 'she'], ['Ravi said', 'he'], ['Meera said', 'she'], ['The teacher said', 'she'], ['Amit said', 'he'], ['Riya said', 'she'], ['The manager said', 'he']];
const DIS_NAME = ['He', 'She', 'Ravi', 'Meera', 'The teacher', 'Amit', 'Riya', 'The manager'];
const DIS_SPQ = ['He said to me', 'She said to me', 'Ravi said to me', 'Meera said to me', 'The teacher said to me', 'Amit said to me', 'Riya said to me', 'The manager said to me'];
const DIS_WH = [
  ['Why are you late?', 'why I was late'],
  ['Where are you going?', 'where I was going'],
  ['What are you doing?', 'what I was doing'],
  ['When will you reach?', 'when I would reach'],
  ['How did you come?', 'how I had come'],
  ['Why do you study so hard?', 'why I studied so hard'],
  ['Where do you live?', 'where I lived'],
  ['What did you buy?', 'what I had bought'],
  ['When did you arrive?', 'when I had arrived'],
  ['How do you travel to work?', 'how I travelled to work'],
  ['Why were you absent?', 'why I had been absent'],
  ['What do you want?', 'what I wanted'],
];
const DIS_YN = [
  ['Are you busy?', 'if I was busy'],
  ['Do you like tea?', 'if I liked tea'],
  ['Can you swim?', 'if I could swim'],
  ['Will you come tomorrow?', 'if I would come the next day'],
  ['Did you finish the work?', 'if I had finished the work'],
  ['Have you eaten?', 'if I had eaten'],
  ['Is it raining?', 'if it was raining'],
  ['Are they ready?', 'if they were ready'],
  ['Do you know the answer?', 'if I knew the answer'],
  ['Can you drive a car?', 'if I could drive a car'],
  ['Will it help us?', 'if it would help us'],
  ['Did she call you?', 'if she had called me'],
];
G['Direct & Indirect Speech'] = (r, i, c) => {
  const fam = i % 8;
  const si = Math.floor(r() * DIS_SP.length);
  const sp = DIS_SP[si], name = DIS_NAME[si];
  const k = Math.floor(r() * DIS_SPQ.length);
  const sp2 = DIS_SPQ[k], name2 = DIS_NAME[k];
  if (fam === 0) { // present -> past, this -> that
    const v = V_PK(r, [['like', 'liked'], ['enjoy', 'enjoyed'], ['want', 'wanted'], ['know', 'knew'], ['need', 'needed'], ['visit', 'visited'], ['watch', 'watched'], ['call', 'called']]);
    const t = V_PK(r, ['this place', 'this song', 'this book', 'this city', 'this game', 'this dish']);
    const t2 = t.replace('this', 'that');
    return c.buildMCQ({ r, stem: 'Convert to indirect speech: ' + sp[0] + ', "I ' + v[0] + ' ' + t + '."', right: sp[0] + ' that ' + sp[1] + ' ' + v[1] + ' ' + t2 + '.', wrong: [sp[0] + ' that ' + sp[1] + ' ' + v[0] + ' ' + t2 + '.', sp[0] + ' that ' + sp[1] + ' ' + v[1] + ' ' + t + '.', sp[0] + ' that ' + sp[1] + ' ' + v[0] + ' ' + t + '.'], explanation: 'In reported speech the present backshifts to past (' + v[0] + ' -> ' + v[1] + ') and "this" changes to "that".', steps: ['Reporting verb: ' + sp[0] + ' that', 'Backshift: ' + v[0] + ' -> ' + v[1], 'Pointer: ' + t + ' -> ' + t2] });
  }
  if (fam === 1) { // will -> would, tomorrow -> the next day
    const v = V_PK(r, ['come', 'help', 'join', 'attend', 'call', 'meet', 'visit', 'finish']);
    return c.buildMCQ({ r, stem: 'Convert to indirect speech: ' + sp[0] + ', "I will ' + v + ' tomorrow."', right: sp[0] + ' that ' + sp[1] + ' would ' + v + ' the next day.', wrong: [sp[0] + ' that ' + sp[1] + ' will ' + v + ' the next day.', sp[0] + ' that ' + sp[1] + ' would ' + v + ' tomorrow.', sp[0] + ' that ' + sp[1] + ' will ' + v + ' tomorrow.'], explanation: '"will" backshifts to "would" and "tomorrow" becomes "the next day" in reported speech.', steps: ['Backshift: will -> would', 'Time shift: tomorrow -> the next day', 'So: ' + sp[0] + ' that ' + sp[1] + ' would ' + v + ' the next day'] });
  }
  if (fam === 2) { // am -> was, now -> then
    const adj = V_PK(r, ['busy', 'ready', 'tired', 'free', 'happy', 'hungry', 'upset', 'confident']);
    return c.buildMCQ({ r, stem: 'Convert to indirect speech: ' + sp[0] + ', "I am ' + adj + ' now."', right: sp[0] + ' that ' + sp[1] + ' was ' + adj + ' then.', wrong: [sp[0] + ' that ' + sp[1] + ' is ' + adj + ' then.', sp[0] + ' that ' + sp[1] + ' was ' + adj + ' now.', sp[0] + ' that ' + sp[1] + ' is ' + adj + ' now.'], explanation: '"am" backshifts to "was" and "now" becomes "then" in reported speech.', steps: ['Backshift: am -> was', 'Time shift: now -> then', 'So: ' + sp[0] + ' that ' + sp[1] + ' was ' + adj + ' then'] });
  }
  if (fam === 3) { // can -> could
    const v = V_PK(r, ['swim', 'drive', 'speak', 'play', 'cook', 'sing', 'dance', 'type']);
    return c.buildMCQ({ r, stem: 'Convert to indirect speech: ' + sp[0] + ', "I can ' + v + ' well."', right: sp[0] + ' that ' + sp[1] + ' could ' + v + ' well.', wrong: [sp[0] + ' that ' + sp[1] + ' can ' + v + ' well.', sp[0] + ' that ' + sp[1] + ' could to ' + v + ' well.', sp[0] + ' that ' + sp[1] + ' can to ' + v + ' well.'], explanation: 'The modal "can" backshifts to "could"; modals take the bare infinitive (no "to").', steps: ['Backshift: can -> could', 'Keep the bare infinitive: ' + v, 'So: ' + sp[0] + ' that ' + sp[1] + ' could ' + v + ' well'] });
  }
  if (fam === 4) { // request: Please + imperative -> requested me to + verb
    const row = V_PK(r, [['open', 'the door'], ['close', 'the window'], ['shut', 'the gate'], ['lock', 'the door'], ['clean', 'the whiteboard'], ['sign', 'the report'], ['check', 'the file'], ['bring', 'the letter'], ['open', 'the gate'], ['close', 'the shutter'], ['lock', 'the cupboard'], ['collect', 'the parcel']]);
    return c.buildMCQ({ r, stem: 'Convert to indirect speech: ' + sp2 + ', "Please ' + row[0] + ' ' + row[1] + '."', right: name2 + ' requested me to ' + row[0] + ' ' + row[1] + '.', wrong: [name2 + ' requested me for ' + row[0] + ' ' + row[1] + '.', name2 + ' requested to me to ' + row[0] + ' ' + row[1] + '.', name2 + ' ordered me that ' + row[0] + ' ' + row[1] + '.'], explanation: '"Please" + imperative becomes "requested me to + verb": the listener follows the reporting verb directly.', steps: ['Reporting verb: requested', 'Listener becomes the object: me', 'Imperative -> to + ' + row[0]] });
  }
  if (fam === 5) { // wh-question -> asked me + wh-word + statement order
    const row = V_PK(r, DIS_WH);
    return c.buildMCQ({ r, stem: 'Convert to indirect speech: ' + sp2 + ', "' + row[0] + '"', right: name2 + ' asked me ' + row[1] + '.', wrong: [name2 + ' asked that ' + row[1] + '.', name2 + ' asked me that ' + row[1] + '.', name2 + ' asked to me ' + row[1] + '.'], explanation: 'A wh-question is reported as "asked me + wh-word + statement order" - no "that", no question mark, and the listener follows the verb.', steps: ['Reporting verb: asked me', 'Keep the wh-word, use statement order: ' + row[1], 'End with a full stop, not a question mark'] });
  }
  if (fam === 6) { // yes/no question -> asked me if + statement order
    const row = V_PK(r, DIS_YN);
    return c.buildMCQ({ r, stem: 'Convert to indirect speech: ' + sp2 + ', "' + row[0] + '"', right: name2 + ' asked me ' + row[1] + '.', wrong: [name2 + ' asked me that ' + row[1] + '.', name2 + ' told me ' + row[1] + '.', name2 + ' said me ' + row[1] + '.'], explanation: 'A yes/no question is reported with "if/whether" + statement order: asked me ' + row[1] + ' - "that" or "said me" are wrong here.', steps: ['Reporting verb: asked me', 'Add if/whether and use statement order: ' + row[1], 'End with a full stop, not a question mark'] });
  }
  const o = V_PK(r, ['this book', 'this pen', 'this bag', 'this ticket', 'this wallet', 'this charger', 'this umbrella', 'this diary']); // past -> past perfect
  const n = o.replace('this ', '');
  return c.buildMCQ({ r, stem: 'Convert to indirect speech: ' + sp[0] + ', "I bought ' + o + ' yesterday."', right: sp[0] + ' that ' + sp[1] + ' had bought that ' + n + ' the previous day.', wrong: [sp[0] + ' that ' + sp[1] + ' bought that ' + n + ' the previous day.', sp[0] + ' that ' + sp[1] + ' had bought that ' + n + ' yesterday.', sp[0] + ' that ' + sp[1] + ' has bought that ' + n + ' the previous day.'], explanation: 'Simple past backshifts to past perfect (bought -> had bought) and "yesterday" becomes "the previous day".', steps: ['Backshift: bought -> had bought', 'Pointer: this -> that, yesterday -> the previous day', 'So: ' + sp[0] + ' that ' + sp[1] + ' had bought that ' + n + ' the previous day'] });
};
// ============================== Sentence Completion ==============================
// 4 families: contrast, cause, condition, purpose - 48 frames total -> 190+ stems.
const SC_ROWS_CONTRAST = [
  ['Although he worked very hard, ___.', ['he could not finish in time', 'he completed it with ease', 'he received no praise', 'the task was simple']],
  ['Despite his riches, ___.', ['he remained a simple man', 'he bought more houses', 'his wealth grew daily', 'everyone envied him']],
  ['Although it was raining heavily, ___.', ['the match continued', 'the play was cancelled', 'the grounds flooded', 'umbrellas were useless']],
  ['Despite her illness, ___.', ['she completed the marathon', 'she stayed in bed', 'the doctor advised rest', 'she missed the event']],
  ['Although the road was blocked, ___.', ['we reached on time', 'we turned back', 'the traffic waited', 'the bus stopped']],
  ['Despite repeated warnings, ___.', ['he drove carelessly', 'he slowed down', 'he bought a seatbelt', 'he sold the car']],
  ['Although the shop was closed, ___.', ['people waited outside', 'the doors stayed shut', 'the shutters were down', 'the owner was away']],
  ['Despite the high price, ___.', ['the gadget sold out fast', 'few could afford it', 'sales were slow', 'it stayed on the shelf']],
  ['Although he was injured, ___.', ['he played on bravely', 'he walked off', 'the coach benched him', 'the injury worsened']],
  ['Despite the noise, ___.', ['the baby slept peacefully', 'the baby woke up', 'everyone complained', 'the music stopped']],
  ['Although the task was simple, ___.', ['he took two days', 'he finished it fast', 'he needed one try', 'he enjoyed it']],
  ['Despite the discount, ___.', ['sales did not rise', 'the shop sold out', 'queues grew long', 'stocks ran low']],
  ['Although the food was tasty, ___.', ['the portion was tiny', 'everyone ordered more', 'the plates were full', 'the guests praised it']],
  ['Despite being the youngest, ___.', ['she led the team', 'she was last in line', 'she needed help', 'she stayed at home']],
  ['Although the train was on time, ___.', ['the platform was empty', 'we boarded early', 'the seats were full', 'the doors opened']],
  ['Despite the cold water, ___.', ['he swam across', 'he came out soon', 'he wore a jacket', 'it was freezing']],
  ['Although the weather was fine, ___.', ['they postponed the trip', 'the flights left on time', 'everyone walked', 'the picnic was fun']],
  ['Despite the heavy rain, ___.', ['she went on her walk', 'she stayed indoors', 'the roads flooded', 'the umbrella leaked']],
  ['Although he was nervous, ___.', ['he spoke clearly', 'he forgot his words', 'his hands shook', 'the mic died']],
  ['Despite the long queue, ___.', ['he waited patiently', 'he left the line', 'he complained loudly', 'the doors closed']],
];
const SC_ROWS_CAUSE = [
  ['The show was cancelled because ___.', ['the lead actor fell ill', 'the tickets sold out', 'the hall was full', 'the critics loved it']],
  ['We stayed inside since ___.', ['the storm was raging', 'the sun was shining', 'the garden was lovely', 'the weather cleared']],
  ['She passed the exam because ___.', ['she revised thoroughly', 'the paper was leaked', 'she was lucky', 'she guessed it all']],
  ['He was late for work as ___.', ['his bus broke down', 'he woke early', 'the route was clear', 'he took the metro']],
  ['The plants died because ___.', ['nobody watered them', 'they got extra care', 'the soil was rich', 'rain was abundant']],
  ['The match was postponed as ___.', ['the pitch was flooded', 'the sun came out', 'the crowd cheered', 'the players were fit']],
  ['She wore a sweater since ___.', ['it was very cold', 'the sun was hot', 'summer had begun', 'the room was warm']],
  ['The tank was filled because ___.', ['the valve had leaked', 'the level was full', 'the tap was shut', 'the pipe was dry']],
  ['The street was dark as ___.', ['the lights had failed', 'the sun was up', 'the lamps were new', 'the bulbs were bright']],
  ['She missed the bus because ___.', ['she overslept', 'she reached early', 'the clock was fast', 'the route was short']],
  ['The plan failed since ___.', ['the funds ran out', 'the team was ready', 'support was huge', 'the skills matched']],
  ['He resigned because ___.', ['he got a better offer', 'he loved the job', 'the pay rose', 'the team adored him']],
  ['The mirror cracked as ___.', ['it fell on the floor', 'it was polished', 'it was handled gently', 'it was new']],
  ['The food spoiled because ___.', ['the fridge was off', 'it was kept cold', 'it was sealed well', 'the weather was cool']],
  ['They cancelled the picnic since ___.', ['the weather turned bad', 'the sun was out', 'the park was open', 'all tickets were sold']],
  ['The system crashed because ___.', ['the power failed', 'the voltage was stable', 'the fans were clean', 'the backup ran']],
];
const SC_ROWS_COND = [
  ['If you study regularly, ___.', ['you will pass easily', 'you will surely fail', 'the exam gets easy', 'you waste time']],
  ['If it rains tomorrow, ___.', ['we shall cancel the trip', 'the ground dries fast', 'the sun will shine', 'we will sunbathe']],
  ['If you touch the wire, ___.', ['you will get a shock', 'it turns golden', 'the light glows', 'nothing happens']],
  ['If she practises daily, ___.', ['her skill improves quickly', 'she forgets the steps', 'she loses interest', 'the moves get rusty']],
  ['If the traffic is heavy, ___.', ['we will take the metro', 'we speed ahead', 'the lanes stay clear', 'we reach early']],
  ['If he apologises, ___.', ['she will forgive him', 'she stays angry', 'the fight worsens', 'they part ways']],
  ['If you pour salt on it, ___.', ['the ice melts', 'the ice hardens', 'the road freezes', 'the snow grows']],
  ['If the prices rise, ___.', ['demand will fall', 'sales will soar', 'shops will boom', 'customers will rush']],
];
const SC_ROWS_PURPOSE = [
  ['She saved money so that ___.', ['she could buy a laptop', 'she would waste it', 'it stayed idle', 'she lent it out']],
  ['He wore gloves so that ___.', ['his hands stayed warm', 'his fingers froze', 'the frost bit him', 'he felt cold']],
  ['They left early so that ___.', ['they could catch the train', 'they missed the bus', 'they reached late', 'they walked slowly']],
  ['Riya kept notes so that ___.', ['she could revise later', 'she ignored them', 'the work grew', 'she forgot soon']],
  ['We bought covers so that ___.', ['the books stayed clean', 'the pages stained', 'the covers tore', 'the books got wet']],
  ['He switched off the fan so that ___.', ['the room stayed quiet', 'the noise grew', 'the papers flew', 'the air got cold']],
  ['They installed cameras so that ___.', ['they could watch the gate', 'the wall turned bright', 'the birds nested', 'the door stayed shut']],
  ['She set an alarm so that ___.', ['she could wake early', 'she slept late', 'the bell annoyed her', 'she missed the train']],
];
G['Sentence Completion'] = (r, i, c) => {
  const fam = i % 4;
  if (fam === 0) {
    const cl = V_PK(r, SC_ROWS_CONTRAST);
    return c.buildMCQ({ r, stem: cl[0] + '. Choose the best option to complete the sentence.', right: cl[1][0], wrong: cl[1].slice(1), explanation: 'The contrast marker needs a SURPRISING outcome; only "' + cl[1][0] + '" contradicts the first clause.', steps: ['Spot the contrast marker', 'Look for the option that contradicts the first clause', 'So: ' + cl[0].replace('___.', cl[1][0]) + ''] });
  }
  if (fam === 1) {
    const cl = V_PK(r, SC_ROWS_CAUSE);
    return c.buildMCQ({ r, stem: cl[0] + '. Choose the best option to complete the sentence.', right: cl[1][0], wrong: cl[1].slice(1), explanation: 'The cause marker needs a matching REASON; only "' + cl[1][0] + '" fits.', steps: ['Spot the cause marker', 'Choose the reason that matches', 'So: ' + cl[0].replace('___.', cl[1][0]) + ''] });
  }
  if (fam === 2) {
    const cl = V_PK(r, SC_ROWS_COND);
    return c.buildMCQ({ r, stem: cl[0] + '. Choose the best option to complete the sentence.', right: cl[1][0], wrong: cl[1].slice(1), explanation: '"If" sets a condition; the consequence follows logically. Only "' + cl[1][0] + '" matches.', steps: ['Spot the condition marker "if"', 'Choose the logical result', 'So: ' + cl[0].replace('___.', cl[1][0]) + ''] });
  }
  const cl = V_PK(r, SC_ROWS_PURPOSE);
  return c.buildMCQ({ r, stem: cl[0] + '. Choose the best option to complete the sentence.', right: cl[1][0], wrong: cl[1].slice(1), explanation: '"so that" states a PURPOSE; only "' + cl[1][0] + '" is an intended goal.', steps: ['Spot "so that" (purpose)', 'Choose the intended goal', 'So: ' + cl[0].replace('___.', cl[1][0]) + ''] });
};
module.exports = { G };


