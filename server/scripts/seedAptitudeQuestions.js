const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const AptitudeQuestion = require('../models/AptitudeQuestion');

const questions = [
  { category: 'verbal', question: 'Choose the synonym of "happy".', options: [{text:'Sad'},{text:'Joyful'},{text:'Angry'},{text:'Tired'}], correctIndex: 1, explanation: 'Joyful means feeling or expressing great happiness.', tags: ['synonyms'], difficulty: 'easy' },
  { category: 'verbal', question: 'Choose the antonym of "big".', options: [{text:'Large'},{text:'Huge'},{text:'Tiny'},{text:'Great'}], correctIndex: 2, explanation: 'Tiny is the opposite of big.', tags: ['antonyms'], difficulty: 'easy' },
  { category: 'verbal', question: '"She has been waiting ___ 2 hours."', options: [{text:'since'},{text:'for'},{text:'from'},{text:'by'}], correctIndex: 1, explanation: '"For" is used with durations.', tags: ['grammar'], difficulty: 'easy' },
  { category: 'verbal', question: '"He succeeded ___ all difficulties."', options: [{text:'in'},{text:'with'},{text:'despite of'},{text:'despite'}], correctIndex: 3, explanation: '"Despite" is the correct preposition here; "despite of" is incorrect.', tags: ['grammar'], difficulty: 'medium' },
  { category: 'verbal', question: '"Despite of" is correct usage.', options: [{text:'True'},{text:'False'}], correctIndex: 1, explanation: 'Correct form is "despite" or "in spite of"; "despite of" is incorrect.', tags: ['grammar'], difficulty: 'easy' },
  { category: 'verbal', question: 'Choose the correct: "I haven\'t seen him ___ last Monday."', options: [{text:'since'},{text:'for'},{text:'from'},{text:'by'}], correctIndex: 0, explanation: '"Since" is used with a point in time.', tags: ['grammar'], difficulty: 'easy' },
  { category: 'quant', question: 'If A+B=15 and A-B=5, find A and B.', options: [{text:'A=10, B=5'},{text:'A=5, B=10'},{text:'A=7, B=8'},{text:'A=8, B=7'}], correctIndex: 0, explanation: 'Adding equations gives 2A=20 => A=10, then B=5.', tags: ['algebra'], difficulty: 'easy' },
  { category: 'quant', question: 'What is 20% of 500?', options: [{text:'50'},{text:'100'},{text:'150'},{text:'200'}], correctIndex: 1, explanation: '20% of 500 = 0.2 * 500 = 100.', tags: ['percentages'], difficulty: 'easy' },
  { category: 'quant', question: 'A shopkeeper gives 20% discount on Rs.500. Selling price?', options: [{text:'300'},{text:'400'},{text:'450'},{text:'350'}], correctIndex: 1, explanation: '20% of 500 = 100; 500-100 = 400.', tags: ['percentages'], difficulty: 'easy' },
  { category: 'quant', question: 'If train travels 120 km in 2 hours, speed?', options: [{text:'40 km/h'},{text:'60 km/h'},{text:'120 km/h'},{text:'240 km/h'}], correctIndex: 1, explanation: 'Speed = Distance/Time = 120/2 = 60 km/h.', tags: ['time-speed-distance'], difficulty: 'easy' },
  { category: 'quant', question: 'Find next number: 2, 6, 12, 20, 30, ?', options: [{text:'36'},{text:'40'},{text:'42'},{text:'44'}], correctIndex: 2, explanation: 'Differences: 4,6,8,10 => next add 12 -> 42.', tags: ['series'], difficulty: 'medium' },
  { category: 'quant', question: 'A man buys 12 apples at Rs.5 each from Rs.240. Money left?', options: [{text:'120'},{text:'180'},{text:'140'},{text:'200'}], correctIndex: 1, explanation: 'Cost = 12*5=60; left=240-60=180.', tags: ['arithmetic'], difficulty: 'easy' },
  { category: 'logical', question: 'All cats are mammals. Some mammals are black. Conclusion?', options: [{text:'All cats are black'},{text:'Some cats may be black'},{text:'No cats are black'},{text:'Cats are not mammals'}], correctIndex: 1, explanation: 'From the premises, some cats could be black, but it is not certain.', tags: ['syllogism'], difficulty: 'medium' },
  { category: 'logical', question: 'If it rains, the ground gets wet. It is not wet. What follows?', options: [{text:'It rained'},{text:'It did not rain'},{text:'Cannot say'},{text:'Ground is dry'}], correctIndex: 1, explanation: 'By modus tollens, if rain implies wet and ground is not wet, then it did not rain.', tags: ['reasoning'], difficulty: 'medium' },
  { category: 'logical', question: 'Choose the odd one: 3, 5, 7, 9, 11.', options: [{text:'3'},{text:'5'},{text:'9'},{text:'11'}], correctIndex: 2, explanation: '9 is composite; others are prime.', tags: ['odd-one-out'], difficulty: 'easy' },
  { category: 'verbal', question: 'Pick the correct spelling.', options: [{text:'Accomodation'},{text:'Accommodation'},{text:'Acommodation'},{text:'Acommodation'}], correctIndex: 1, explanation: '"Accommodation" has double c and double m.', tags: ['spelling'], difficulty: 'easy' },
  { category: 'logical', question: 'A is taller than B. C is shorter than A. Who is tallest?', options: [{text:'A'},{text:'B'},{text:'C'},{text:'Cannot say'}], correctIndex: 0, explanation: 'We only know A > B and A > C, so A is tallest.', tags: ['ordering'], difficulty: 'easy' },
  { category: 'verbal', question: '"I am agree" is grammatically correct.', options: [{text:'True'},{text:'False'}], correctIndex: 1, explanation: 'Correct form is "I agree" without "am".', tags: ['grammar'], difficulty: 'easy' },
  { category: 'quant', question: 'Simplify: 8/16', options: [{text:'1/2'},{text:'2/3'},{text:'3/4'},{text:'4/5'}], correctIndex: 0, explanation: '8/16 = 1/2.', tags: ['fractions'], difficulty: 'easy' },
  { category: 'logical', question: 'If 2+3=10, 3+4=21, 4+5=32, then 5+6=?', options: [{text:'42'},{text:'43'},{text:'45'},{text:'39'}], correctIndex: 1, explanation: 'Pattern: a+b => a*(a+b) = 5*11=55? Wait typical puzzle: 2*5=10, 3*7=21, 4*8=32 => 5*9=45, so 45. Correct answer is 45.', tags: ['puzzle'], difficulty: 'medium' }
];

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/prepagent');
  const res = await AptitudeQuestion.insertMany(questions);
  console.log(`Seeded ${res.length} aptitude questions`);
  await mongoose.disconnect();
  process.exit(0);
};
run().catch((err) => { console.error(err); process.exit(1); });