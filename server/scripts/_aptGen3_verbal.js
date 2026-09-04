// _aptGen3_verbal.js -- Genuinely distinct banks for weak verbal topics.
// Sentence Correction: many distinct ERROR TYPES (each with word-banks),
// so the 50/50/50 questions are genuinely different -- not 1 template x numbers.
// seeder passes r = seeded RNG, i = question index, c = {ri, pk, buildMCQ}
const G = {};

const SC_TYPES = [
  // 1. Tense -- simple past vs present perfect
  (r, i, c) => {
    const sub = c.pk(r, ['She', 'Rahul', 'The manager', 'Priya', 'The team']);
    const last = c.pk(r, ['yesterday', 'last week', 'last Monday', 'two days ago', 'last year']);
    const done = c.pk(r, ['submitted the report', 'finished the project', 'completed the survey', 'sent the invoice', 'closed the deal']);
    return c.buildMCQ({ r, stem: 'Choose the correct sentence:',
      right: sub + ' ' + done.split(' ')[0] + ' ' + done.split(' ').slice(1).join(' ') + ' ' + last + '.',
      wrong: [sub + ' has ' + done + ' ' + last + '.', sub + ' have ' + done + ' ' + last + '.', sub + ' will ' + done.split(' ')[0].replace(/ed$/, '') + ' ' + last + '.'],
      explanation: 'With a definite past time (' + last + ') use Simple Past, not Present Perfect.',
      steps: ['Clue: "' + last + '" is finished past time', 'Finished past time -> Simple Past', 'So: ' + sub + ' ... ' + last] });
  },
  // 2. Subject-verb agreement
  (r, i, c) => {
    const usePlural = i % 2 === 0;
    const sg = c.pk(r, ['The boy', 'The girl', 'A worker', 'He', 'The author']);
    const sgV = c.pk(r, ['plays cricket', 'goes to school', 'reads the paper', 'works hard', 'writes stories']);
    const base = {'plays': 'play', 'goes': 'go', 'reads': 'read', 'works': 'work', 'writes': 'write'}[sgV.split(' ')[0]];
    const plV = base + ' ' + sgV.slice(sgV.indexOf(' ') + 1);
    return c.buildMCQ({ r, stem: 'Choose the correct sentence:',
      right: usePlural ? sg + 's ' + plV : sg + ' ' + sgV,
      wrong: usePlural ? [sg + ' ' + sgV, sg + 's ' + sgV, sg + ' ' + plV] : [sg + 's ' + plV, sg + ' ' + plV, sg + 's ' + sgV],
      explanation: (usePlural ? sg + 's' : sg) + ' is ' + (usePlural ? 'plural -> verb has no -s' : 'singular -> verb has -s') + '.',
      steps: ['Subject: ' + (usePlural ? sg + 's' : sg), 'It is ' + (usePlural ? 'plural' : 'singular'), 'Verb must agree: ' + (usePlural ? plV : sgV)] });
  },
  // 3. Article a/an by SOUND
  (r, i, c) => {
    const noun = c.pk(r, ['apple', 'hour', 'umbrella', 'honest man', 'MP']);
    const cons = c.pk(r, ['book', 'university', 'European', 'one-way ticket']);
    const useAn = i % 2 === 0, w = useAn ? noun : cons;
    return c.buildMCQ({ r, stem: 'Choose the correct sentence:',
      right: 'He bought ' + (useAn ? 'an' : 'a') + ' ' + w + '.',
      wrong: ['He bought ' + (useAn ? 'a' : 'an') + ' ' + w + '.', 'He bought the ' + w + 's.', 'He bought ' + (useAn ? 'an' : 'a') + ' ' + w + 's.'],
      explanation: '\"' + w + '\" begins with a ' + (useAn ? 'vowel' : 'consonant') + ' sound -> \"' + (useAn ? 'an' : 'a') + '\".',
      steps: ['First SOUND of "' + w + '" is ' + (useAn ? 'vowel' : 'consonant'), 'Vowel sound -> an; consonant sound -> a', 'So: ' + (useAn ? 'an' : 'a') + ' ' + w] });
  },
  // 4. Preposition collocation
  (r, i, c) => {
    const set = c.pk(r, [['interested', 'in'], ['good', 'at'], ['afraid', 'of'], ['married', 'to'], ['proud', 'of'], ['satisfied', 'with'], ['responsible', 'for'], ['dependent', 'on']]);
    const obj = c.pk(r, ['music', 'maths', 'dogs', 'his job', 'her work', 'the team', 'the results']);
    return c.buildMCQ({ r, stem: 'Choose the correct preposition:',
      right: 'She is ' + set[0] + ' ' + set[1] + ' ' + obj + '.',
      wrong: ['She is ' + set[0] + ' on ' + obj + '.', 'She is ' + set[0] + ' at ' + obj + '.', 'She is ' + set[0] + ' of ' + obj + '.'],
      explanation: 'Fixed collocation: \"' + set[0] + ' ' + set[1] + '\".',
      steps: ['Phrase: ' + set[0] + ' + fixed preposition', 'Correct preposition = ' + set[1], 'So: ' + set[0] + ' ' + set[1] + ' ' + obj] });
  },
  // 5. Pronoun case (object after preposition)
  (r, i, c) => {
    const pr = c.pk(r, [['I', 'me'], ['he', 'him'], ['she', 'her'], ['they', 'them'], ['we', 'us']]);
    return c.buildMCQ({ r, stem: 'Choose the correct sentence:',
      right: 'Between you and ' + pr[1] + ', this is a secret.',
      wrong: ['Between you and ' + pr[0] + ', this is a secret.', pr[0] + ' and her are leaving.', pr[0] + ' and him are leaving.'],
      explanation: 'After the preposition \'between\', use the OBJECT form (' + pr[1] + ').',
      steps: ['\'between\' is a preposition', 'Object of preposition -> object pronoun', 'So: between you and ' + pr[1]] });
  },
  // 6. Parallel structure
  (r, i, c) => {
    const b = c.pk(r, [['reading, writing and painting', 'to read, to write and to paint'], ['jogging, swimming and cycling', 'to jog, to swim and to cycle'], ['singing, dancing and acting', 'to sing, to dance and to act']]);
    return c.buildMCQ({ r, stem: 'Choose the correct sentence:',
      right: 'She likes ' + b[0] + '.',
      wrong: ['She likes ' + b[1] + '.', 'She likes ' + b[0].split(', ')[0] + ', to ' + b[0].split(', ')[1].replace('ing', '') + ' and ' + b[0].split(', ')[2] + '.', 'She likes to ' + b[0].split(', ')[0].replace('ing', '') + ', ' + b[0].split(', ')[1] + ' and ' + b[0].split(', ')[2] + '.'],
      explanation: 'List items must have the same form (all gerunds).',
      steps: ['List: ' + b[0], 'All items in same form', 'Parallel structure maintained'] });
  },
  // 7. Redundancy
  (r, i, c) => {
    const red = c.pk(r, [['revert back', 'revert'], ['repeat again', 'repeat'], ['free gift', 'gift'], ['advance planning', 'planning'], ['joint cooperation', 'cooperation'], ['each and every', 'every']]);
    return c.buildMCQ({ r, stem: 'Choose the sentence without redundancy:',
      right: 'Please ' + red[1] + ' the message.',
      wrong: ['Please ' + red[0] + ' the message.', 'Please ' + red[1] + ' back the message.', 'Please ' + red[1] + ' again the message.'],
      explanation: '\"' + red[0] + '\" is redundant; use just \"' + red[1] + '\".',
      steps: ['Original: ' + red[0], 'Extra word adds no meaning', 'Correct: ' + red[1]] });
  },
  // 8. Dangling modifier (-ing phrase)
  (r, i, c) => {
    return c.buildMCQ({ r, stem: 'Choose the correct sentence:',
      right: 'Walking down the road, I saw a strange shop.',
      wrong: ['Walking down the road, a strange shop was seen by me.', 'Walking down the road, the shop looked strange.', 'Walking down the road, seeing a strange shop.'],
      explanation: 'The -ing phrase\'s subject must be the doer (I walked).',
      steps: ['Opening phrase: Walking down the road', 'Who walked? I did', 'So the subject must be I'] });
  },
  // 9. Conditional (if-clause)
  (r, i, c) => {
    const cond = c.pk(r, [['rains', 'will stay'], ['studies', 'will pass'], ['comes', 'will meet'], ['heats', 'will melt']]);
    return c.buildMCQ({ r, stem: 'Choose the correct sentence:',
      right: 'If it ' + cond[0] + ', I ' + cond[1] + ' at home.',
      wrong: ['If it will ' + cond[0] + ', I ' + cond[1] + ' at home.', 'If it ' + cond[0] + ', I stay at home.', 'If it will ' + cond[0] + ', I stay at home.'],
      explanation: 'First conditional: if + present simple, main = will + base verb.',
      steps: ['If-clause: present simple (' + cond[0] + ')', 'Main clause: will + base verb', 'No "will" inside the if-clause'] });
  },
  // 10. few/a few vs little/a little
  (r, i, c) => {
    const pair = c.pk(r, [['countable', 'books', 'a few'], ['uncountable', 'water', 'a little']]);
    const good = pair[0] === 'countable' ? 'a few' : 'a little';
    const neg = pair[0] === 'countable' ? 'few' : 'little';
    return c.buildMCQ({ r, stem: 'Choose the correct sentence (positive meaning):',
      right: 'We have ' + good + ' ' + pair[1] + ', enough for us.',
      wrong: ['We have ' + neg + ' ' + pair[1] + ', enough for us.', 'We have ' + good + ' ' + pair[1] + 's, enough for us.', 'We have many ' + pair[1] + ', enough for us.'],
      explanation: '"a few/a little" = positive (some); "few/little" = nearly none.',
      steps: ['Context: enough for us -> positive', pair[0] === 'countable' ? 'Countable -> a few' : 'Uncountable -> a little', 'So: ' + good + ' ' + pair[1]] });
  },
// 11. Question tag
  (r, i, c) => {
    const tag = c.pk(r, [['She is a teacher', 'isn\'t she'], ['They are coming', 'aren\'t they'], ['He can swim', 'can\'t he'], ['You like tea', 'don\'t you'], ['Ravi has left', 'hasn\'t he']]);
    return c.buildMCQ({ r, stem: 'Choose the correct question tag:',
      right: tag[0] + ', ' + tag[1] + '?',
      wrong: [tag[0] + ', ' + (tag[1].startsWith('i') ? 'are they' : tag[1].startsWith('a') ? 'is he' : tag[1].startsWith('c') ? 'can he' : 'did he') + '?', tag[0] + ', ' + (tag[1].startsWith('d') ? 'does he' : 'will he') + '?', tag[0] + ' ' + tag[1] + '?'],
      explanation: 'Positive main sentence -> negative tag.',
      steps: ['Main sentence is positive', 'Tag must be negative', 'Verb matches: ' + tag[1]] });
  },
  // 12. Gerund vs infinitive
  (r, i, c) => {
    const pref = c.pk(r, [['enjoy', 'walking'], ['avoid', 'making'], ['suggest', 'taking'], ['finish', 'reading'], ['keep', 'trying']]);
    return c.buildMCQ({ r, stem: 'Choose the correct sentence:',
      right: 'I ' + pref[0] + ' ' + pref[1] + ' daily.',
      wrong: ['I ' + pref[0] + ' to ' + pref[1] + ' daily.', 'I ' + pref[0] + ' for ' + pref[1] + ' daily.', 'I ' + pref[0] + ' to ' + pref[1].replace('ing', '') + ' daily.'],
      explanation: '"' + pref[0] + '" takes a gerund (' + pref[1] + ').',
      steps: ['Main verb: ' + pref[0], 'It is followed by a gerund (-ing)', 'So: ' + pref[1]] });
  },
  // 13. Relative clause (who/which)
  (r, i, c) => {
    const cc = c.pk(r, [['who', 'The man'], ['which', 'The book'], ['that', 'The car']]);
    return c.buildMCQ({ r, stem: 'Choose the correct sentence:',
      right: cc[1] + ' ' + cc[0] + ' was here is my friend.',
      wrong: [cc[1] + ' ' + (cc[0] === 'which' ? 'who' : 'which') + ' was here is my friend.', cc[1] + ' whose was here is my friend.', cc[1] + ' whom was here is my friend.'],
      explanation: '"' + cc[0] + '" refers to a ' + (cc[0] === 'which' ? 'thing' : 'person') + ' as subject.',
      steps: ['Main clause: ' + cc[1] + ' is my friend', 'Relative pronoun = ' + cc[0], 'Clause attaches to ' + (cc[0] === 'which' ? 'thing' : 'person')] });
  },
  // 14. Conjunction -- neither/nor, either/or
  (r, i, c) => {
    const pair = c.pk(r, [['neither', 'nor'], ['either', 'or'], ['not only', 'but also']]);
    return c.buildMCQ({ r, stem: 'Choose the correct pair of conjunctions:',
      right: 'He ' + pair[0] + ' eats meat ' + pair[1] + ' drinks milk.',
      wrong: ['He ' + pair[0] + ' eats meat ' + (pair[1] === 'nor' ? 'or' : 'nor') + ' drinks milk.', 'He eats meat ' + pair[1] + ' drinks milk ' + pair[0] + '.', 'He ' + (pair[0] === 'neither' ? 'either' : 'neither') + ' eats meat nor drinks milk.'],
      explanation: 'Correlative pair: ' + pair[0] + ' ... ' + pair[1] + '.',
      steps: ['Correlative conjunction pair', pair[0] + ' pairs with ' + pair[1], 'So: ' + pair[0] + ' ... ' + pair[1]] });
  },
  // 15. Modal verbs (base verb, no 'to')
  (r, i, c) => {
    const m = c.pk(r, [['may', 'permission'], ['can', 'ability'], ['must', 'obligation'], ['should', 'advice']]);
    return c.buildMCQ({ r, stem: 'Choose the correct sentence (modal for ' + m[1] + '):',
      right: 'You ' + m[0] + ' submit the form by Friday.',
      wrong: ['You ' + m[0] + ' to submit the form by Friday.', 'You ' + m[0] + ' to submitting the form by Friday.', 'You to ' + m[0] + ' submit the form by Friday.'],
      explanation: 'Modals are followed by the base verb (no \'to\').',
      steps: ['Modal: ' + m[0], 'Modal + base verb (no to)', 'So: ' + m[0] + ' submit'] });
  },
  // 16. Uncountable noun + quantifier
  (r, i, c) => {
    const unc = c.pk(r, ['advice', 'information', 'furniture', 'work', 'news']);
    return c.buildMCQ({ r, stem: 'Choose the correct sentence:',
      right: 'There is not much ' + unc + ' left.',
      wrong: ['There are not many ' + unc + ' left.', 'There is not many ' + unc + ' left.', 'There are not much ' + unc + ' left.'],
      explanation: '"' + unc + '" is uncountable -> use "much", not "many".',
      steps: ['Noun: ' + unc + ' (uncountable)', 'Uncountable -> much', 'So: not much ' + unc] });
  },
];

G['Sentence Correction'] = (r, i, c) => SC_TYPES[i % SC_TYPES.length](r, i, c);

module.exports = { G };
