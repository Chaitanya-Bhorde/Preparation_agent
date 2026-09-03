// Verbal Ability generators v2 - item-bank variety, notebook-style steps
// seeder passes r = seeded RNG, i = question index, c = {ri, pk, buildMCQ}
const G = {};
const qb = (r, c, b) => c.buildMCQ({ r, stem: b[0], right: b[1], wrong: [b[2], b[3], b[4]], explanation: b[1] + '.', steps: [b[5]] });

const RC = [
  ['Read: "The honeybee is one of the most important pollinators in the world. It helps fertilize crops such as apples, almonds and blueberries. In recent years, bee populations have declined due to pesticides and habitat loss." Why have bee populations declined?', 'Pesticides and habitat loss', 'Lack of flowers', 'Cold weather', 'Over-pollination', 'Passage says: declined "due to pesticides and habitat loss"'],
  ['Read: "The honeybee is one of the most important pollinators in the world. It helps fertilize crops such as apples, almonds and blueberries." Which crops are mentioned as bee-pollinated?', 'Apples, almonds and blueberries', 'Rice and wheat', 'Only apples', 'Sugarcane and maize', 'Passage lists: apples, almonds and blueberries'],
  ['Read: "Rohit walked to school every day to save money. Over a year, he saved enough to buy books for the next semester." Why did Rohit walk to school?', 'To save money', 'He enjoyed walking', 'The school was nearby', 'He had no books', 'First line says: walked "to save money"'],
  ['Read: "Rohit walked to school every day to save money. Over a year, he saved enough to buy books for the next semester." What did Rohit buy with his savings?', 'Books for the next semester', 'A new bicycle', 'School uniform', 'A school bag', 'Last line: saved enough "to buy books for the next semester"'],
  ['Read: "The Internet was originally developed to connect research universities. Today it touches almost every part of daily life, from shopping to education." What was the Internet\'s original purpose?', 'To connect research universities', 'To sell products online', 'To provide entertainment', 'To replace telephones', 'Passage: "originally developed to connect research universities"'],
  ['Read: "The Internet was originally developed to connect research universities. Today it touches almost every part of daily life, from shopping to education." According to the passage, the Internet today is used for:', 'Almost every part of daily life', 'Only research work', 'Only shopping', 'Only education', 'Passage: "touches almost every part of daily life"'],
  ['Read: "Water boils at 100 degrees Celsius at sea level. At higher altitudes, the boiling point drops because of lower air pressure." Why does water boil at a lower temperature on mountains?', 'Lower air pressure', 'Cleaner water', 'Stronger sunlight', 'Higher humidity', 'Passage: "because of lower air pressure"'],
  ['Read: "Water boils at 100 degrees Celsius at sea level." At what temperature does water boil at sea level?', '100 degrees Celsius', '90 degrees Celsius', '110 degrees Celsius', '120 degrees Celsius', 'Passage states directly: 100 degrees Celsius'],
  ['Read: "Migratory birds travel thousands of kilometres each year. They navigate using the sun, stars and Earth\'s magnetic field." How do migratory birds navigate?', 'Sun, stars and magnetic field', 'By following rivers', 'By counting days', 'By smell alone', 'Passage lists: sun, stars and Earth\'s magnetic field'],
  ['Read: "Migratory birds travel thousands of kilometres each year." How far do migratory birds travel each year?', 'Thousands of kilometres', 'A few metres', 'Only within a city', 'They do not travel', 'Passage: "travel thousands of kilometres each year"'],
  ['Read: "Recycling paper saves trees and reduces landfill waste. One tonne of recycled paper saves about 17 trees." How many trees does one tonne of recycled paper save?', 'About 17', 'About 7', 'About 70', 'None', 'Passage: "saves about 17 trees"'],
  ['Read: "Regular exercise improves heart health and reduces stress. Doctors recommend at least 30 minutes of activity daily." What do doctors recommend?', 'At least 30 minutes of daily activity', 'Exercise only on weekends', 'No exercise at all', 'Two hours of rest daily', 'Passage: "at least 30 minutes of activity daily"'],
  ['Read: "The train arrived two hours late because of heavy fog. Passengers were given refreshments while they waited." Why did the train arrive late?', 'Heavy fog', 'A broken engine', 'A strike', 'Heavy rain', 'Passage: "because of heavy fog"'],
  ['Read: "The train arrived two hours late because of heavy fog. Passengers were given refreshments while they waited." How late was the train, and what were passengers given?', 'Two hours late; refreshments', 'One hour late; tickets', 'Two hours late; nothing', 'Three hours late; dinner', 'Passage: "two hours late" and "given refreshments"'],
];
G['Reading Comprehension'] = (r, i, c) => { return qb(r, c, RC[i % RC.length]); };

// Sentence Correction - parameterized generator for high variety
G['Sentence Correction'] = (r, i, c) => {
  const subjects = ['She', 'He', 'The children', 'My friend', 'The teacher', 'Each student', 'The team', 'Nobody', 'The manager', 'Everyone', 'The dog', 'A scientist', 'The players', 'My sister', 'The workers'];
  const verbs3rd = ['goes', 'writes', 'reads', 'plays', 'studies', 'works', 'runs', 'speaks', 'eats', 'drives'];
  const verbsBase = ['go', 'write', 'read', 'play', 'study', 'work', 'run', 'speak', 'eat', 'drive'];
  const objects = ['every day', 'in the park', 'at school', 'carefully', 'with enthusiasm', 'regularly', 'at home', 'in the morning', 'for two hours', 'with friends'];
  const nouns = ['book', 'letter', 'story', 'report', 'essay', 'novel', 'article', 'poem', 'message', 'assignment'];
  const prepContexts = ['good at', 'interested in', 'afraid of', 'fond of', 'tired of', 'proud of', 'aware of', 'capable of', 'famous for', 'responsible for'];
  const uncountables = ['news', 'information', 'advice', 'furniture', 'luggage', 'equipment', 'research', 'knowledge'];
  const groups = ['the boys', 'the girls', 'the students', 'my friends', 'the players'];
  
  const T = [
    (r, i, c) => { const s = c.pk(r, subjects); const v = c.pk(r, verbs3rd); const o = c.pk(r, objects); const wv = c.pk(r, verbsBase);
      return c.buildMCQ({ r, stem: 'Choose the correct sentence:', right: s + ' ' + v + ' ' + o + '.', wrong: [s + ' ' + wv + ' ' + o + '.', s + ' not ' + v + ' ' + o + '.', s + ' ' + v + 's ' + o + '.'], explanation: s + ' takes singular verb "' + v + '".', steps: ['Subject: ' + s, 'Verb must agree: ' + v, 'Correct: ' + s + ' ' + v + ' ' + o] }); },
    (r, i, c) => { const s = c.pk(r, ['She', 'He', 'My friend', 'The student', 'The teacher']); const n = c.pk(r, nouns); const done = c.pk(r, ['finished', 'completed', 'written', 'read', 'submitted']);
      return c.buildMCQ({ r, stem: 'Choose the correct sentence:', right: s + ' has ' + done + ' the ' + n + '.', wrong: [s + ' have ' + done + ' the ' + n + '.', s + ' had ' + done + ' the ' + n + '.', s + ' is ' + done + ' the ' + n + '.'], explanation: 'Use "has" + past participle for present perfect.', steps: ['Subject: ' + s + ' (singular)', 'Present perfect: has + past participle', 'Correct: ' + s + ' has ' + done + ' the ' + n] }); },
    (r, i, c) => { const n = c.pk(r, groups);
      return c.buildMCQ({ r, stem: 'Choose the correct sentence:', right: 'Neither of ' + n + ' was present.', wrong: ['Neither of ' + n + ' were present.', 'Neither of ' + n + ' are present.', 'Neither ' + n + ' was present.'], explanation: '"Neither" is singular, takes "was".', steps: ['"Neither" = singular', 'Use singular verb "was"', 'Correct: Neither of ' + n + ' was present'] }); },
    (r, i, c) => { const ctx = c.pk(r, prepContexts); const s = c.pk(r, ['She', 'He', 'My brother', 'The child', 'The artist']);
      return c.buildMCQ({ r, stem: 'Choose the correct sentence:', right: s + ' is ' + ctx + ' music.', wrong: [s + ' is ' + ctx.replace('of', 'in') + ' music.', s + ' is ' + ctx.replace('of', 'at') + ' music.', s + ' is ' + ctx.replace('of', 'for') + ' music.'], explanation: '"' + ctx + '" is the correct collocation.', steps: ['Identify the phrase: ' + ctx, 'Fixed preposition: ' + ctx.split(' ')[1], 'Correct: ' + s + ' is ' + ctx + ' music'] }); },
    (r, i, c) => { const n = c.pk(r, ['honest', 'hour', 'university', 'umbrella', 'useless', 'European', 'one-eyed']); const article = (n.match(/^[aeiou]/) && !n.startsWith('uni') && !n.startsWith('use') && !n.startsWith('Euro')) ? 'an' : 'a';
      return c.buildMCQ({ r, stem: 'Choose the correct article:', right: article + ' ' + n + ' person', wrong: [(article === 'a' ? 'an' : 'a') + ' ' + n + ' person', 'the ' + n + ' person', 'No article needed'], explanation: '"' + n + '" starts with ' + (article === 'an' ? 'vowel' : 'consonant') + ' sound.', steps: ['Word: ' + n, 'Sound: ' + (article === 'an' ? 'vowel' : 'consonant'), 'Article: ' + article] }); },
    (r, i, c) => { const s = c.pk(r, ['When', 'After', 'Before', 'As soon as', 'Until']); const v = c.pk(r, ['arrives', 'finishes', 'completes', 'returns', 'calls']);
      return c.buildMCQ({ r, stem: 'Choose the correct sentence:', right: s + ' he ' + v + ', I will tell him.', wrong: [s + ' he will ' + v.replace('s', '') + ', I will tell him.', s + ' he ' + v.replace('s', '') + ', I will tell him.', s + ' he ' + v + ', I tell him.'], explanation: 'In time clauses, use present simple (not future).', steps: ['Time clause: ' + s + ' + present simple', 'Main clause: will + base verb', 'Correct: ' + s + ' he ' + v + ', I will tell him'] }); },
    (r, i, c) => { const a = c.pk(r, ['big', 'small', 'fast', 'slow', 'tall', 'short', 'old', 'young']); const sup = a + (a.endsWith('e') ? 'st' : a + 'est');
      return c.buildMCQ({ r, stem: 'Choose the correct sentence:', right: 'This is the ' + sup + ' building in the city.', wrong: ['This is the ' + a + 'er building in the city.', 'This is the more ' + a + ' building in the city.', 'This is the most ' + a + ' building in the city.'], explanation: 'Superlative (the ' + sup + ') for "in the city" comparison.', steps: ['Comparison: in the city (group)', 'Superlative: the + ' + sup, 'Correct: the ' + sup + ' building'] }); },
    (r, i, c) => { const n = c.pk(r, uncountables);
      return c.buildMCQ({ r, stem: 'Choose the correct sentence:', right: 'The ' + n + ' is useful.', wrong: ['The ' + n + ' are useful.', 'The ' + n + ' were useful.', 'The ' + n + ' have been useful.'], explanation: '"' + n + '" is uncountable, takes singular verb "is".', steps: ['Noun: ' + n + ' (uncountable)', 'Singular verb: is', 'Correct: The ' + n + ' is useful'] }); },
    (r, i, c) => { const s = c.pk(r, ['Each', 'Every', 'Either', 'Neither']); const n = c.pk(r, ['student', 'boy', 'girl', 'employee', 'member']); const v = c.pk(r, ['has', 'have']);
      return c.buildMCQ({ r: r, stem: 'Choose the correct sentence:', right: s + ' ' + n + ' has a book.', wrong: [s + ' ' + n + ' have a book.', s + ' ' + n + ' had a book.', s + ' ' + n + ' is having a book.'], explanation: '"' + s + '" is singular, takes "has".', steps: ['Subject: ' + s + ' (singular)', 'Singular verb: has', 'Correct: ' + s + ' ' + n + ' has a book'] }); },
    (r, i, c) => { const s = c.pk(r, ['The news', 'The furniture', 'The information', 'The luggage', 'The equipment']); const v = c.pk(r, ['is', 'are']);
      return c.buildMCQ({ r: r, stem: 'Choose the correct sentence:', right: s + ' is very important.', wrong: [s + ' are very important.', s + ' were very important.', s + ' have been very important.'], explanation: '"' + s + '" is singular/uncountable.', steps: ['Subject: ' + s + ' (singular)', 'Singular verb: is', 'Correct: ' + s + ' is very important'] }); },
    (r, i, c) => { const n = c.pk(r, ['scissors', 'trousers', 'glasses', 'shorts', 'jeans', 'pajamas']);
      return c.buildMCQ({ r: r, stem: 'Choose the correct sentence:', right: 'These ' + n + ' are new.', wrong: ['This ' + n + ' is new.', 'These ' + n + ' is new.', 'This ' + n + ' are new.'], explanation: '"' + n + '" is always plural (pair noun).', steps: ['Noun: ' + n + ' (always plural)', 'Plural verb: are', 'Correct: These ' + n + ' are new'] }); },
    (r, i, c) => { const s = c.pk(r, ['The police', 'The cattle', 'The people', 'The poultry']);
      return c.buildMCQ({ r: r, stem: 'Choose the correct sentence:', right: s + ' are coming.', wrong: [s + ' is coming.', s + ' was coming.', s + ' has come.'], explanation: '"' + s + '" is a plural noun.', steps: ['Subject: ' + s + ' (plural noun)', 'Plural verb: are', 'Correct: ' + s + ' are coming'] }); },
    (r, i, c) => { const n = c.pk(r, ['mathematics', 'physics', 'economics', 'politics', 'athletics', 'gymnastics']);
      return c.buildMCQ({ r: r, stem: 'Choose the correct sentence:', right: n + ' is an interesting subject.', wrong: [n + ' are interesting subjects.', n + ' was an interesting subject.', n + ' have been interesting subjects.'], explanation: '"' + n + '" ends in -ics but is singular (academic subject).', steps: ['Subject: ' + n + ' (academic, singular)', 'Singular verb: is', 'Correct: ' + n + ' is an interesting subject'] }); },
    (r, i, c) => { const s = c.pk(r, ['Ten thousand rupees', 'Five hundred kilometres', 'Three hours', 'Twenty dollars']);
      return c.buildMCQ({ r: r, stem: 'Choose the correct sentence:', right: s + ' is a large amount.', wrong: [s + ' are a large amount.', s + ' was a large amount.', s + ' were a large amount.'], explanation: 'Amounts/quantities as a unit take singular verb.', steps: ['Subject: ' + s + ' (amount as unit)', 'Singular verb: is', 'Correct: ' + s + ' is a large amount'] }); },
    (r, i, c) => { const s = c.pk(r, ['The rich', 'The poor', 'The blind', 'The deaf', 'The unemployed']);
      return c.buildMCQ({ r: r, stem: 'Choose the correct sentence:', right: s + ' are not always happy.', wrong: [s + ' is not always happy.', s + ' was not always happy.', s + ' has not always been happy.'], explanation: '"' + s + '" + adjective = plural noun.', steps: ['Subject: ' + s + ' (plural)', 'Plural verb: are', 'Correct: ' + s + ' are not always happy'] }); },
    (r, i, c) => { const n = c.pk(r, ['sheep', 'deer', 'fish', 'salmon', 'trout']);
      return c.buildMCQ({ r: r, stem: 'Choose the correct sentence:', right: 'Three ' + n + ' were grazing.', wrong: ['Three ' + n + 's were grazing.', 'Three ' + n + ' was grazing.', 'Three ' + n + 's was grazing.'], explanation: '"' + n + '" has same singular and plural form.', steps: ['Noun: ' + n + ' (same singular/plural)', 'Three + plural: were', 'Correct: Three ' + n + ' were grazing'] }); },
    (r, i, c) => { const s = c.pk(r, ['My friend and colleague', 'The singer and dancer', 'The poet and painter']);
      return c.buildMCQ({ r: r, stem: 'Choose the correct sentence:', right: s + ' is coming today.', wrong: [s + ' are coming today.', s + ' was coming today.', s + ' have come today.'], explanation: 'One person with two roles takes singular verb.', steps: ['Subject: ' + s + ' (one person)', 'Singular verb: is', 'Correct: ' + s + ' is coming today'] }); },
    (r, i, c) => { const s = c.pk(r, ['Bread and butter', 'Slow and steady', 'Truth and honesty']);
      return c.buildMCQ({ r: r, stem: 'Choose the correct sentence:', right: s + ' is a good combination.', wrong: [s + ' are good combinations.', s + ' was a good combination.', s + ' were good combinations.'], explanation: '"' + s + '" is a single idea (singular).', steps: ['Subject: ' + s + ' (single idea)', 'Singular verb: is', 'Correct: ' + s + ' is a good combination'] }); },
    (r, i, c) => { const n = c.pk(r, ['cattle', 'police', 'people', 'poultry', 'gentry']);
      return c.buildMCQ({ r: r, stem: 'Choose the correct sentence:', right: 'The ' + n + ' are in the field.', wrong: ['The ' + n + ' is in the field.', 'The ' + n + ' was in the field.', 'The ' + n + ' has been in the field.'], explanation: '"' + n + '" is always plural.', steps: ['Noun: ' + n + ' (always plural)', 'Plural verb: are', 'Correct: The ' + n + ' are in the field'] }); },
    (r, i, c) => { const s = c.pk(r, ['Every boy and girl', 'Each man and woman', 'Each student']);
      return c.buildMCQ({ r: r, stem: 'Choose the correct sentence:', right: s + ' was given a prize.', wrong: [s + ' were given a prize.', s + ' are given a prize.', s + ' have been given a prize.'], explanation: '"Every/Each" makes the subject singular.', steps: ['Subject: ' + s + ' (singular)', 'Singular verb: was', 'Correct: ' + s + ' was given a prize'] }); },
    (r, i, c) => { const s = c.pk(r, ['The number of', 'A number of']);
      const n = c.pk(r, ['students', 'books', 'people']);
      return c.buildMCQ({ r: r, stem: 'Choose the correct sentence:', right: s + ' ' + n + ' is increasing.', wrong: [s + ' ' + n + ' are increasing.', s + ' ' + n + ' was increasing.', s + ' ' + n + ' were increasing.'], explanation: '"The number of" takes singular verb.', steps: ['Subject: ' + s + ' (singular)', 'Singular verb: is', 'Correct: ' + s + ' ' + n + ' is increasing'] }); },
  ];
  const T2 = [
    (r, i, c) => { const s = c.pk(r, ['The scissors', 'The trousers', 'The glasses']);
      return c.buildMCQ({ r: r, stem: 'Choose the correct sentence:', right: s + ' are on the table.', wrong: [s + ' is on the table.', s + ' was on the table.', s + ' has been on the table.'], explanation: '"' + s + '" (plural noun) takes plural verb.', steps: ['Subject: ' + s + ' (plural)', 'Plural verb: are', 'Correct: ' + s + ' are on the table'] }); },
    (r, i, c) => { const n = c.pk(r, ['one of the students', 'one of the books', 'one of the players']);
      return c.buildMCQ({ r: r, stem: 'Choose the correct sentence:', right: 'He is ' + n + ' who was selected.', wrong: ['He is ' + n + ' who are selected.', 'He is ' + n + ' who were selected.', 'He is ' + n + ' whom was selected.'], explanation: '"One of the" + singular verb.', steps: ['Subject: one (singular)', 'Singular verb: was', 'Correct: He is ' + n + ' who was selected'] }); },
    (r, i, c) => { const s = c.pk(r, ['Each of the boys', 'Every one of the girls', 'Any one of the students']);
      return c.buildMCQ({ r: r, stem: 'Choose the correct sentence:', right: s + ' has a book.', wrong: [s + ' have a book.', 'Each of the boys are here.', s + ' are having a book.'], explanation: '"Each/Every one" = singular.', steps: ['Subject: ' + s + ' (singular)', 'Singular verb: has', 'Correct: ' + s + ' has a book'] }); },
    (r, i, c) => { const s = c.pk(r, ['Neither Ram nor his friends', 'Neither the teacher nor the students']);
      return c.buildMCQ({ r: r, stem: 'Choose the correct sentence:', right: s + ' were present.', wrong: [s + ' was present.', s + ' are present.', s + ' have been present.'], explanation: '"Neither...nor" agrees with nearest subject.', steps: ['Nearest subject is plural', 'Plural verb: were', 'Correct: ' + s + ' were present'] }); },
    (r, i, c) => { const s = c.pk(r, ['Either the teacher or the students', 'Either the boys or the girl']);
      return c.buildMCQ({ r: r, stem: 'Choose the correct sentence:', right: s + ' are responsible.', wrong: [s + ' is responsible.', s + ' was responsible.', s + ' were responsible.'], explanation: '"Either...or" agrees with nearest subject.', steps: ['Nearest subject is plural', 'Plural verb: are', 'Correct: ' + s + ' are responsible'] }); },
    (r, i, c) => { const n = c.pk(r, ['mathematics', 'physics', 'economics', 'news', 'measles']);
      return c.buildMCQ({ r: r, stem: 'Choose the correct sentence:', right: n + ' is my favourite subject.', wrong: [n + ' are my favourite subject.', n + ' was my favourite subject.', n + ' were my favourite subject.'], explanation: '"' + n + '" looks plural but is singular.', steps: ['Subject: ' + n + ' (singular)', 'Singular verb: is', 'Correct: ' + n + ' is my favourite subject'] }); },
    (r, i, c) => { const s = c.pk(r, ['The committee', 'The jury', 'The team']);
      return c.buildMCQ({ r: r, stem: 'Choose the correct sentence:', right: s + ' has decided.', wrong: [s + ' have decided.', s + ' are decided.', s + ' were decided.'], explanation: '"' + s + '" as a whole = singular.', steps: ['Subject: ' + s + ' (collective, singular)', 'Singular verb: has', 'Correct: ' + s + ' has decided'] }); },
    (r, i, c) => { const s = c.pk(r, ['The committee', 'The jury', 'The team']);
      return c.buildMCQ({ r: r, stem: 'Choose the correct sentence:', right: s + ' are divided.', wrong: [s + ' is divided.', s + ' was divided.', s + ' has divided.'], explanation: '"' + s + '" as members = plural.', steps: ['Subject: ' + s + ' (members, plural)', 'Plural verb: are', 'Correct: ' + s + ' are divided'] }); },
    (r, i, c) => { const n = c.pk(r, ['pair of scissors', 'pair of trousers', 'pair of glasses']);
      return c.buildMCQ({ r: r, stem: 'Choose the correct sentence:', right: 'This ' + n + ' is sharp.', wrong: ['This ' + n + ' are sharp.', 'This ' + n + ' was sharp.', 'This ' + n + ' were sharp.'], explanation: '"Pair of" takes singular verb.', steps: ['Subject: ' + n + ' (singular)', 'Singular verb: is', 'Correct: This ' + n + ' is sharp'] }); },
    (r, i, c) => { const s = c.pk(r, ['Ten miles', 'Five years', 'Hundred rupees']);
      return c.buildMCQ({ r: r, stem: 'Choose the correct sentence:', right: s + ' is a long distance.', wrong: [s + ' are a long distance.', s + ' was a long distance.', s + ' were a long distance.'], explanation: 'Distance/Time/Money as unit = singular.', steps: ['Subject: ' + s + ' (unit)', 'Singular verb: is', 'Correct: ' + s + ' is a long distance'] }); },
  ];
  for (let j = 0; j < T2.length; j++) T.push(T2[j]);
  return T[i % T.length](r, i, c);
};

const TED = [
  ['Find the error: "One of my friend / lives in Delhi / with his family."', 'One of my friend', 'lives in Delhi', 'with his family', 'No error', '"One of" must be followed by a plural noun: "one of my friends"'],
  ['Find the error: "The Ganges / is one of / the longest river in India."', 'the longest river', 'is one of', 'The Ganges', 'No error', '"One of the" + superlative + PLURAL noun: "the longest rivers"'],
  ['Find the error: "She has been / working here / since five years."', 'since five years', 'working here', 'She has been', 'No error', 'Duration (five years) takes "for", starting point takes "since": "for five years"'],
  ['Find the error: "Neither of the two answers / are correct / according to the key."', 'are correct', 'Neither of the two answers', 'according to the key', 'No error', '"Neither" is singular: "is correct"'],
  ['Find the error: "He is more taller / than his brother / by two inches."', 'He is more taller', 'than his brother', 'by two inches', 'No error', 'Double comparative: use either "taller" or "more tall", not both'],
  ['Find the error: "I met / an European / at the conference yesterday."', 'an European', 'I met', 'at the conference yesterday', 'No error', '"European" starts with a consonant sound "Yu", so "a European"'],
  ['Find the error: "The team / are playing well / in this tournament so far."', 'are playing well', 'The team', 'in this tournament so far', 'No error', 'Team acting as one unit takes singular verb: "is playing"'],
  ['Find the error: "She asked me / where did I go / after the class."', 'where did I go', 'She asked me', 'after the class', 'No error', 'Indirect question: no auxiliary inversion - "where I went"'],
  ['Find the error: "If I was you, / I would apologise / immediately."', 'If I was you', 'I would apologise', 'immediately', 'No error', 'Unreal condition (past subjunctive): "If I were you"'],
  ['Find the error: "He returned back / from Mumbai / last night."', 'He returned back', 'from Mumbai', 'last night', 'No error', '"Return" already means "come back", so "back" is redundant'],
  ['Find the error: "The scissors / is lying / on the table."', 'is lying', 'The scissors', 'on the table', 'No error', '"Scissors" is always plural: "are lying"'],
  ['Find the error: "One should do / his duty / honestly."', 'his duty', 'One should do', 'honestly', 'No error', '"One" takes "one\'s", not "his": "one\'s duty"'],
];
G['Error Detection'] = (r, i, c) => { return qb(r, c, TED[i % TED.length]); };

const TFB = [
  ['Fill in the blank: "She has been living in Pune ___ 2015."', 'since', 'for', 'from', 'at', 'Starting point of time (2015) takes "since"; duration takes "for"'],
  ['Fill in the blank: "I have been waiting ___ two hours."', 'for', 'since', 'from', 'during', 'Duration (two hours) takes "for"'],
  ['Fill in the blank: "He is good ___ playing the guitar."', 'at', 'in', 'on', 'with', '"Good at" + activity is the correct collocation'],
  ['Fill in the blank: "The cat is hiding ___ the table."', 'under', 'above', 'along', 'into', 'Position below something = "under"'],
  ['Fill in the blank: "She is married ___ an engineer."', 'to', 'with', 'for', 'from', '"Married to" someone (not "with")'],
  ['Fill in the blank: "Hard work is the key ___ success."', 'to', 'of', 'for', 'in', 'Fixed collocation: "key to" something'],
  ['Fill in the blank: "I am not acquainted ___ this subject."', 'with', 'to', 'from', 'on', '"Acquainted with" is the correct preposition'],
  ['Fill in the blank: "He prefers coffee ___ tea."', 'to', 'than', 'over than', 'from', '"Prefer X to Y" - always "to", never "than"'],
  ['Fill in the blank: "The teacher was angry ___ the noise."', 'about', 'on', 'for', 'of', '"Angry about" something (situation); "angry with" a person'],
  ['Fill in the blank: "Please submit the report ___ Friday."', 'by', 'until', 'since', 'in', '"By Friday" = deadline; "until" suggests continuing action'],
  ['Fill in the blank: "Neither Ram ___ Shyam came to the party."', 'nor', 'or', 'and', 'not', '"Neither ... nor" is the correct correlative pair'],
  ['Fill in the blank: "Not only did she sing, ___ she also danced."', 'but', 'and', 'or', 'also', '"Not only ... but also" is the correct pair'],
  ['Fill in the blank: "He is ___ honest man I have ever met."', 'the most', 'more', 'much', 'very', 'Superlative (the most honest) for "ever met"'],
  ['Fill in the blank: "If it ___ tomorrow, we will cancel the picnic."', 'rains', 'will rain', 'rained', 'would rain', 'First conditional: if + present simple, will + base verb'],
];
G['Fill in the Blanks'] = (r, i, c) => { return qb(r, c, TFB[i % TFB.length]); };

const TPJ = [
  ['Arrange: (P) he went to the market (Q) Early in the morning (R) and bought fresh vegetables (S) after finishing his chores', 'Q, P, R, S', 'P, Q, R, S', 'Q, R, P, S', 'S, Q, P, R', 'Time phrase first (Q), then action (P), result (R), condition (S)'],
  ['Arrange: (P) the students submitted (Q) After completing the exam (R) their answer sheets (S) and left the hall', 'Q, P, R, S', 'P, Q, S, R', 'Q, R, P, S', 'R, P, Q, S', 'Clause (Q) first, verb phrase (P), object (R), then result (S)'],
  ['Arrange: (P) because the roads were flooded (Q) The train arrived late (R) and many passengers missed (S) their connecting buses', 'Q, P, R, S', 'P, Q, R, S', 'Q, R, S, P', 'S, R, Q, P', 'Main clause (Q), reason (P), continuation (R), object (S)'],
  ['Arrange: (P) to win the championship (Q) The team practised hard (R) for six months (S) every single day', 'Q, R, S, P', 'P, Q, R, S', 'Q, P, R, S', 'R, Q, S, P', 'Subject + verb (Q), duration (R), frequency (S), purpose (P)'],
  ['Arrange: (P) she opened the door (Q) Hearing the doorbell (R) and greeted the guests (S) with a warm smile', 'Q, P, R, S', 'P, Q, R, S', 'Q, R, P, S', 'P, R, Q, S', 'Participle clause (Q) first, main action (P), next action (R), manner (S)'],
  ['Arrange: (P) he decided to become a doctor (Q) When he was only ten (R) after watching his grandmother (S) struggle with illness', 'Q, P, R, S', 'P, Q, R, S', 'Q, R, S, P', 'R, S, Q, P', 'Time clause (Q) first, then decision (P), reason clause (R), object (S)'],
  ['Arrange: (P) the meeting was postponed (Q) Due to heavy rain (R) and all members (S) were informed by email', 'Q, P, R, S', 'P, Q, S, R', 'Q, R, P, S', 'P, R, S, Q', 'Reason (Q) first, main clause (P), subject continuation (R), passive verb (S)'],
  ['Arrange: (P) before the sun rose (Q) The farmers were already (R) working in the fields (S) with their sickles', 'P, Q, R, S', 'Q, P, R, S', 'Q, R, P, S', 'R, Q, P, S', 'Time phrase (P) opens, then subject+auxiliary (Q), main verb (R), instrument (S)'],
  ['Arrange: (P) the boy apologised (Q) After realising his mistake (R) to his teacher (S) without any hesitation', 'Q, P, R, S', 'P, Q, R, S', 'Q, R, P, S', 'P, R, S, Q', 'Participle clause (Q), main clause (P), object (R), manner (S)'],
  ['Arrange: (P) she writes articles (Q) For a leading newspaper (R) whenever she gets time (S) in the evening', 'P, R, Q, S', 'P, Q, R, S', 'Q, P, R, S', 'R, P, S, Q', 'Main clause (P), frequency clause (R), workplace (Q), time (S)'],
];
G['Para Jumbles'] = (r, i, c) => { return qb(r, c, TPJ[i % TPJ.length]); };

const TSA = [
  ['Choose the SYNONYM of "Abundant":', 'Plentiful', 'Scarce', 'Tiny', 'Weak', 'Abundant = existing in large quantities = plentiful'],
  ['Choose the ANTONYM of "Abundant":', 'Scarce', 'Plentiful', 'Ample', 'Copious', 'Opposite of "in large quantity" is "scarce" (rare/insufficient)'],
  ['Choose the SYNONYM of "Brave":', 'Courageous', 'Cowardly', 'Timid', 'Careless', 'Brave = showing courage = courageous'],
  ['Choose the ANTONYM of "Brave":', 'Cowardly', 'Bold', 'Fearless', 'Daring', 'Opposite of brave (fearless) is cowardly'],
  ['Choose the SYNONYM of "Enormous":', 'Huge', 'Minute', 'Narrow', 'Slight', 'Enormous = extremely large = huge'],
  ['Choose the ANTONYM of "Enormous":', 'Minute', 'Massive', 'Vast', 'Gigantic', 'Minute = extremely small, opposite of enormous'],
  ['Choose the SYNONYM of "Diligent":', 'Hardworking', 'Lazy', 'Careless', 'Sleepy', 'Diligent = showing steady effort = hardworking'],
  ['Choose the ANTONYM of "Diligent":', 'Lazy', 'Industrious', 'Attentive', 'Meticulous', 'Opposite of hardworking is lazy'],
  ['Choose the SYNONYM of "Candid":', 'Honest', 'Deceitful', 'Secretive', 'Rude', 'Candid = truthful and straightforward = honest'],
  ['Choose the ANTONYM of "Candid":', 'Deceitful', 'Frank', 'Blunt', 'Sincere', 'Opposite of open/honest is deceitful'],
  ['Choose the SYNONYM of "Fragile":', 'Delicate', 'Sturdy', 'Solid', 'Robust', 'Fragile = easily broken = delicate'],
  ['Choose the ANTONYM of "Fragile":', 'Sturdy', 'Brittle', 'Flimsy', 'Frail', 'Sturdy = strongly built, opposite of fragile'],
  ['Choose the SYNONYM of "Generous":', 'Giving', 'Greedy', 'Selfish', 'Stingy', 'Generous = willing to give = giving'],
  ['Choose the ANTONYM of "Generous":', 'Stingy', 'Charitable', 'Liberal', 'Bountiful', 'Stingy = unwilling to give, opposite of generous'],
  ['Choose the SYNONYM of "Rapid":', 'Swift', 'Sluggish', 'Delayed', 'Creeping', 'Rapid = fast = swift'],
];
G['Synonyms & Antonyms'] = (r, i, c) => { return qb(r, c, TSA[i % TSA.length]); };

const TVO = [
  ['What does the word "Melancholy" mean?', 'A feeling of deep sadness', 'Great happiness', 'Angry outburst', 'Sudden fear', 'Melancholy = a lasting, thoughtful sadness'],
  ['What does the word "Benevolent" mean?', 'Kind and generous', 'Cruel and harsh', 'Very tall', 'Full of envy', 'Benevolent = well-meaning and kindly'],
  ['What does the word "Obsolete" mean?', 'Out of date, no longer used', 'Brand new', 'Very expensive', 'Highly recommended', 'Obsolete = no longer in use (like old technology)'],
  ['What does the word "Ambiguous" mean?', 'Having more than one meaning', 'Crystal clear', 'Loud and noisy', 'Extremely bright', 'Ambiguous = open to more than one interpretation'],
  ['What does the word "Frugal" mean?', 'Careful with money', 'Spending freely', 'Loving luxury', 'Always hungry', 'Frugal = economical, avoiding waste'],
  ['What does the word "Eloquent" mean?', 'Fluent and persuasive in speech', 'Unable to speak', 'Talking fast', 'Shouting loudly', 'Eloquent = clear, powerful, expressive speaking'],
  ['What does the word "Tenacious" mean?', 'Holding on firmly, persistent', 'Giving up quickly', 'Very flexible', 'Afraid of heights', 'Tenacious = griping firmly, not letting go'],
  ['What does the word "Mundane" mean?', 'Ordinary and dull', 'Heavenly', 'Dangerous', 'Expensive', 'Mundane = everyday, lacking excitement'],
  ['What does the word "Prudent" mean?', 'Showing care and thought for the future', 'Reckless', 'Talkative', 'Lucky', 'Prudent = acting with care and foresight'],
  ['What does the word "Reluctant" mean?', 'Unwilling, hesitant', 'Eager and excited', 'Fully trained', 'Very fast', 'Reluctant = unwilling and hesitating'],
  ['What does the word "Robust" mean?', 'Strong and healthy', 'Weak and thin', 'Broken', 'Sleepy', 'Robust = sturdy in health and build'],
  ['What does the word "Novice" mean?', 'A beginner', 'An expert', 'A winner', 'A teacher', 'Novice = someone new to a field or activity'],
];
G['Vocabulary'] = (r, i, c) => { return qb(r, c, TVO[i % TVO.length]); };

const TSC2 = [
  ['Complete: "Despite the heavy rain, the match ___ as scheduled."', 'went ahead', 'went off', 'went out', 'went up', '"Go ahead" = proceed as planned; "despite" signals contrast with the rain'],
  ['Complete: "He was so tired that he could hardly keep his eyes ___."', 'open', 'opened', 'opening', 'to open', '"Keep + object + adjective" - the adjective is "open"'],
  ['Complete: "The more you practise, ___ you become."', 'the better', 'the best', 'better', 'best', 'Double comparative pattern: "The more ..., the more/better ..."'],
  ['Complete: "Scarcely had he sat down ___ the phone rang."', 'when', 'than', 'then', 'that', '"Scarcely ... when" is the correct pair; "no sooner" pairs with "than"'],
  ['Complete: "No sooner had she arrived ___ it started raining."', 'than', 'when', 'then', 'that', '"No sooner ... than" is a fixed correlative pair'],
  ['Complete: "It is high time we ___ for the airport."', 'left', 'leave', 'will leave', 'are leaving', '"It is high time" + past subjunctive (left) for immediate action'],
  ['Complete: "The audience ___ asked to take their seats."', 'was', 'were being', 'are', 'has', 'Collective noun "audience" as a unit takes "was" here (passive)'],
  ['Complete: "I would rather ___ than beg."', 'starve', 'starving', 'to starve', 'starved', '"Would rather + base verb (starve) than ..."'],
  ['Complete: "He speaks English ___ than his brother."', 'more fluently', 'fluenter', 'more fluent', 'most fluently', 'Adverb comparative: "more fluently than"'],
  ['Complete: "Unless you work hard, you ___ pass."', 'will not', 'will', 'would', 'would not', '"Unless" = if not; so result is negative: "will not pass"'],
  ['Complete: "Each boy ___ given a prize yesterday."', 'was', 'were', 'are', 'have been', '"Each" + singular "was"; "yesterday" confirms past tense'],
  ['Complete: "She is too young ___ this problem alone."', 'to solve', 'for solving', 'that solve', 'solved', '"Too + adjective + to + base verb" structure'],
];
G['Sentence Completion'] = (r, i, c) => { return qb(r, c, TSC2[i % TSC2.length]); };

const TGR = [
  ['Which tense is used in: "She will have finished the course by June."', 'Future Perfect', 'Simple Future', 'Present Perfect', 'Past Perfect', '"Will have + past participle" = future perfect tense'],
  ['Pick the correct article: "He is ___ university student."', 'a', 'an', 'the', 'no article', '"University" begins with consonant sound "Yu", so "a"'],
  ['Pick the correct article: "___ Sun rises in the east."', 'The', 'A', 'An', 'No article', 'Unique objects (sun, moon, earth) always take "the"'],
  ['Which sentence is in Passive Voice?', 'The letter was written by Ravi.', 'Ravi wrote the letter.', 'Ravi is writing a letter.', 'Ravi writes letters.', 'Passive = form of "be" + past participle + "by + doer"'],
  ['Identify the adverb: "He ran quickly to catch the bus."', 'quickly', 'ran', 'bus', 'he', 'Adverb modifies the verb "ran" - it is "quickly"'],
  ['Plural of "Child" is:', 'Children', 'Childs', 'Childes', 'Childrens', 'Irregular plural: child -> children'],
  ['Plural of "Ox" is:', 'Oxen', 'Oxes', 'Ox', 'Oxis', 'Irregular plural: ox -> oxen'],
  ['Which is the correct possessive?', "The girl's book", 'The girls book', 'The girl book', "The girls' of book", 'Singular possessive: noun + apostrophe + s'],
  ['Choose the correct pronoun: "This gift is for ___ and me."', 'him', 'he', 'his', 'himself', 'After preposition "for" use object pronoun "him"'],
  ['Past tense of "Go" is:', 'went', 'goed', 'gone', 'going', 'Irregular verb: go -> went (past), gone (past participle)'],
  ['Which word is a conjunction?', 'although', 'quickly', 'garden', 'bright', '"Although" joins clauses, so it is a conjunction'],
  ['"My shoes are wet." The underlined word "shoes" is a:', 'plural noun', 'singular noun', 'verb', 'adjective', '"Shoes" = more than one shoe = plural noun'],
];
G['Grammar'] = (r, i, c) => { return qb(r, c, TGR[i % TGR.length]); };

const TAP = [
  ['Change to Passive: "Ravi writes a letter."', 'A letter is written by Ravi.', 'A letter written by Ravi.', 'A letter is being wrote by Ravi.', 'Ravi is written by a letter.', 'Passive: object first + is/am/are + past participle (written) + by + subject'],
  ['Change to Passive: "The teacher praised the student."', 'The student was praised by the teacher.', 'The student is praised by the teacher.', 'The student praised by the teacher.', 'The student was praise by the teacher.', 'Simple past active -> was/were + past participle'],
  ['Change to Passive: "They are building a house."', 'A house is being built by them.', 'A house is built by them.', 'A house was built by them.', 'A house has built by them.', 'Present continuous -> is/are being + past participle'],
  ['Change to Passive: "She has completed the work."', 'The work has been completed by her.', 'The work is completed by her.', 'The work was completed by her.', 'The work have been completed by her.', 'Present perfect -> has/have been + past participle'],
  ['Change to Passive: "He will finish the report tomorrow."', 'The report will be finished by him tomorrow.', 'The report will finish by him tomorrow.', 'The report is finished by him tomorrow.', 'The report will been finished by him tomorrow.', 'Simple future -> will be + past participle'],
  ['Change to Active: "The cake was baked by Mother."', 'Mother baked the cake.', 'Mother was baked the cake.', 'Mother bakes the cake.', 'The cake baked Mother.', 'Passive past (was + baked) -> simple past active: Mother baked'],
  ['Change to Active: "The window was broken by the boys."', 'The boys broke the window.', 'The boys break the window.', 'The boys were broken the window.', 'The window broke the boys.', 'was broken (passive past) -> broke (active past)'],
  ['Change to Passive: "Someone has stolen my bicycle."', 'My bicycle has been stolen.', 'My bicycle is stolen by someone.', 'My bicycle was being stolen.', 'My bicycle has stolen.', 'Present perfect -> has been + past participle; unknown doer can be dropped'],
  ['Change to Passive: "Open the door."', 'Let the door be opened.', 'The door is opened.', 'The door be opened.', 'The door was opened.', 'Imperative -> Let + object + be + past participle'],
  ['Change to Passive: "Who wrote this poem?"', 'By whom was this poem written?', 'By whom this poem was written?', 'Who was written this poem?', 'Whom wrote this poem?', 'Question in passive: By whom + was + object + past participle'],
  ['Change to Active: "The letters were delivered by the postman."', 'The postman delivered the letters.', 'The postman deliver the letters.', 'The postman was delivered the letters.', 'The letters delivered the postman.', 'Passive past -> simple past active (delivered)'],
  ['Change to Passive: "People speak English all over the world."', 'English is spoken all over the world.', 'English is speaking all over the world.', 'English was spoken all over the world.', 'English has spoken all over the world.', 'Simple present -> is/am/are + past participle (spoken)'],
];
G['Active & Passive Voice'] = (r, i, c) => { return qb(r, c, TAP[i % TAP.length]); };

const TDS = [
  ['Change to Indirect Speech: He said, "I am busy."', 'He said that he was busy.', 'He said that he is busy.', 'He said that I am busy.', 'He says that he was busy.', 'Reporting verb past -> present (am) becomes past (was); I -> he'],
  ['Change to Indirect Speech: She said, "I have finished my work."', 'She said that she had finished her work.', 'She said that she has finished her work.', 'She said that I had finished my work.', 'She says she finished her work.', 'Present perfect (have finished) -> past perfect (had finished)'],
  ['Change to Indirect Speech: He said, "I will come tomorrow."', 'He said that he would come the next day.', 'He said that he will come tomorrow.', 'He said that I would come tomorrow.', 'He says that he would come tomorrow.', 'will -> would; tomorrow -> the next day'],
  ['Change to Indirect Speech: The teacher said, "The earth revolves around the sun."', 'The teacher said that the earth revolves around the sun.', 'The teacher said that the earth revolved around the sun.', 'The teacher says that the earth revolved around the sun.', 'The teacher said that the earth had revolved around the sun.', 'Universal truths keep present tense even after a past reporting verb'],
  ['Change to Indirect Speech: She said, "Where are you going?"', 'She asked where I was going.', 'She asked where are you going.', 'She said where was I going.', 'She asked where was I going.', 'Question -> assertive order (where + I + was); present -> past'],
  ['Change to Indirect Speech: He said to me, "Please help me."', 'He requested me to help him.', 'He said to please help him.', 'He ordered me to help him.', 'He told that help him.', 'Request ("please") -> requested + object + to + base verb'],
  ['Change to Indirect Speech: The coach said, "Run faster!"', 'The coach ordered us to run faster.', 'The coach said to run faster please.', 'The coach requested to run faster.', 'The coach said that run faster.', 'Command -> ordered + to + base verb'],
  ['Change to Indirect Speech: He said, "I bought a car yesterday."', 'He said that he had bought a car the previous day.', 'He said that he bought a car yesterday.', 'He said that he has bought a car yesterday.', 'He said he will buy a car yesterday.', 'Simple past -> past perfect; yesterday -> the previous day'],
  ['Change to Indirect Speech: She said, "I can swim."', 'She said that she could swim.', 'She said that she can swim.', 'She says that she could swim.', 'She said that I could swim.', 'can -> could (backshift in indirect speech)'],
  ['Change to Indirect Speech: Mother said, "Do not play in the sun."', 'Mother warned me not to play in the sun.', 'Mother said do not play in the sun.', 'Mother ordered that not play in the sun.', 'Mother asked not playing in the sun.', 'Negative command -> warned/told + not + to + base verb'],
  ['Change to Direct Speech: He said that he was reading a book.', 'He said, "I am reading a book."', 'He said, "He is reading a book."', 'He said, "I was reading a book."', 'He says, "I read a book."', 'Past continuous (was reading) -> present continuous (am reading) with I'],
  ['Change to Indirect Speech: Ravi said, "Hurrah! We won the match."', 'Ravi exclaimed with joy that they had won the match.', 'Ravi said hurrah they won the match.', 'Ravi told that we have won the match.', 'Ravi exclaimed that we win the match.', 'Exclamation -> exclaimed with joy; we -> they; won -> had won'],
];
G['Direct & Indirect Speech'] = (r, i, c) => { return qb(r, c, TDS[i % TDS.length]); };

const TOW = [
  ['One word for "A person who loves books":', 'Bibliophile', 'Bibliography', 'Philanthropist', 'Optimist', 'Biblio = book + phile = lover, so Bibliophile'],
  ['One word for "A person who speaks two languages":', 'Bilingual', 'Linguist', 'Polyglot', 'Interpreter', 'Bi = two + lingual = language, so Bilingual'],
  ['One word for "One who cannot read or write":', 'Illiterate', 'Illegible', 'Ignorant', 'Illicit', 'Illiterate = unable to read/write; illegible = unclear writing'],
  ['One word for "A place where books are kept":', 'Library', 'Bookstore', 'Repository', 'Archive', 'Library = a collection place for books'],
  ['One word for "A person who does not believe in God":', 'Atheist', 'Agnostic', 'Devotee', 'Fanatic', 'Atheist = without belief in God (a = without + theos = God)'],
  ['One word for "Government by the people":', 'Democracy', 'Monarchy', 'Aristocracy', 'Bureaucracy', 'Demos = people + kratos = rule, so Democracy'],
  ['One word for "One who eats too much":', 'Glutton', 'Gourmand chef', 'Vegetarian', 'Invalid', 'Glutton = one who overeats habitually'],
  ['One word for "A speech made without preparation":', 'Extempore', 'Rehearsed', 'Eulogy', 'Monologue', 'Extempore = spoken without preparation'],
  ['One word for "A medicine that counteracts poison":', 'Antidote', 'Antibiotic', 'Anaesthetic', 'Vaccine', 'Antidote = anti (against) + dote (given) counteracts poison'],
  ['One word for "Fear of confined spaces":', 'Claustrophobia', 'Hydrophobia', 'Acrophobia', 'Xenophobia', 'Claustro = enclosed + phobia = fear'],
  ['One word for "A person who deals in cattle":', 'Drover', 'Dairyman', 'Jockey', 'Groom', 'Drover = one who drives/moves cattle'],
  ['One word for "Life story written by oneself":', 'Autobiography', 'Biography', 'Memoirist', 'Eulogy', 'Auto = self + bio = life + graphy = writing'],
  ['One word for "A collection of poems":', 'Anthology', 'Album', 'Directory', 'Encyclopedia', 'Anthology = a collected volume of writings/poems'],
  ['One word for "One who walks in sleep":', 'Somnambulist', 'Insomniac', 'Sleepyhead', 'Nightwatch', 'Somnus = sleep + ambulare = to walk'],
];
G['One Word Substitution'] = (r, i, c) => { return qb(r, c, TOW[i % TOW.length]); };

const TIP = [
  ['Meaning of the idiom "Break the ice":', 'To start a conversation in an awkward situation', 'To break something made of ice', 'To end a friendship', 'To cancel a plan', 'Break the ice = ease tension and begin conversation'],
  ['Meaning of the idiom "Piece of cake":', 'Something very easy', 'A delicious dessert', 'A small reward', 'An unfair share', 'Piece of cake = a task that is very easy to do'],
  ['Meaning of the idiom "Cost an arm and a leg":', 'To be very expensive', 'To cause physical injury', 'To be very cheap', 'To bargain hard', 'Cost an arm and a leg = extremely costly'],
  ['Meaning of the idiom "Once in a blue moon":', 'Very rarely', 'Every night', 'During monsoon', 'Very often', 'Blue moons are rare, so the idiom means rarely'],
  ['Meaning of the idiom "Spill the beans":', 'To reveal a secret', 'To waste food', 'To cook a meal', 'To drop something', 'Spill the beans = disclose secret information'],
  ['Meaning of the idiom "Hit the nail on the head":', 'To say exactly the right thing', 'To hurt oneself', 'To miss the target', 'To work as a carpenter', 'Hitting the nail on the head = precisely correct'],
  ['Meaning of the idiom "Under the weather":', 'Slightly ill', 'Very happy', 'Caught in rain', 'Extremely angry', 'Under the weather = feeling unwell'],
  ['Meaning of the idiom "Bite the bullet":', 'To face a difficult situation bravely', 'To eat quickly', 'To lose courage', 'To speak angrily', 'Bite the bullet = endure a painful situation with courage'],
  ['Meaning of the idiom "Let the cat out of the bag":', 'To reveal a secret by mistake', 'To free an animal', 'To buy a fake product', 'To create trouble', 'Letting the cat out = the secret is out'],
  ['Meaning of the idiom "A blessing in disguise":', 'Something that seems bad but turns out good', 'A hidden gift', 'A religious ceremony', 'A costume party', 'Disguise hides the blessing - misfortune that benefits'],
  ['Meaning of the idiom "Beat around the bush":', 'To avoid the main topic', 'To search a garden', 'To fight bravely', 'To finish quickly', 'Beating around the bush = talking without coming to the point'],
  ['Meaning of the idiom "Burn the midnight oil":', 'To work or study late into the night', 'To waste fuel', 'To sleep early', 'To celebrate at night', 'Burning midnight oil = studying/working late'],
  ['Meaning of the idiom "Kill two birds with one stone":', 'To achieve two things with one action', 'To hunt two birds', 'To waste one chance', 'To make two mistakes', 'One stone, two birds = double benefit from single effort'],
  ['Meaning of the idiom "In hot water":', 'In trouble', 'In a bathtub', 'Feeling warm', 'Very popular', 'In hot water = in a difficult or troublesome situation'],
];
G['Idioms & Phrases'] = (r, i, c) => { return qb(r, c, TIP[i % TIP.length]); };

module.exports = { G };