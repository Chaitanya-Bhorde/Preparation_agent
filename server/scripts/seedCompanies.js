require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const CompanyInfo = require('../models/CompanyInfo');

const companies = [
  {
    name: 'TCS',
    slug: 'tcs',
    description: 'Tata Consultancy Services is an Indian multinational IT services company.',
    testPattern: 'Aptitude + Technical + HR',
    rounds: ['Online Test', 'Technical Interview', 'HR Interview'],
    eligibility: 'Minimum 60% in academics',
    topics: ['Aptitude', 'Verbal', 'Logical Reasoning', 'Technical Basics', 'Programming'],
    packageRange: '3.5 - 7 LPA',
    interviewQuestions: [
      { question: 'Explain the difference between a stack and a queue.', category: 'Technical', difficulty: 'Easy', hint: 'Think about insertion and deletion order.', expectedAnswer: 'Stack follows LIFO (Last In First Out), Queue follows FIFO (First In First Out).' },
      { question: 'What is object-oriented programming?', category: 'Technical', difficulty: 'Easy', hint: 'Mention the four main pillars.', expectedAnswer: 'OOP is a programming paradigm based on objects containing data and code. Main pillars: Encapsulation, Abstraction, Inheritance, Polymorphism.' },
      { question: 'Explain the concept of inheritance in OOP.', category: 'Technical', difficulty: 'Medium', hint: 'Discuss types of inheritance.', expectedAnswer: ' Inheritance allows a class to inherit properties and methods from another class. Types: Single, Multiple, Multilevel, Hierarchical, Hybrid.' },
      { question: 'What are the different types of normalizations in DBMS?', category: 'Technical', difficulty: 'Medium', hint: '1NF, 2NF, 3NF, BCNF', expectedAnswer: 'Normalization is the process of organizing data to reduce redundancy. Forms: 1NF (atomic values), 2NF (no partial dependency), 3NF (no transitive dependency), BCNF (Boyce-Codd Normal Form).' },
      { question: 'Tell me about yourself.', category: 'HR', difficulty: 'Easy', hint: 'Present a concise professional summary.', expectedAnswer: 'Brief introduction covering education, technical skills, projects, and career aspirations.' },
    ],
    isActive: true,
  },
  {
    name: 'Infosys',
    slug: 'infosys',
    description: 'Infosys is a global leader in consulting, technology, and outsourcing services.',
    testPattern: 'Aptitude + Logical Reasoning + Verbal',
    rounds: ['Online Assessment', 'Technical Interview', 'HR Interview'],
    eligibility: 'Minimum 65% in academics',
    topics: ['Quantitative Aptitude', 'Logical Reasoning', 'Verbal Ability', 'Programming Concepts'],
    packageRange: '3.6 - 8 LPA',
    interviewQuestions: [
      { question: 'What is the time complexity of binary search?', category: 'Technical', difficulty: 'Easy', hint: 'Think about how the search space reduces.', expectedAnswer: 'O(log n). The search space is halved with each comparison.' },
      { question: 'Explain the working of a hash table.', category: 'Technical', difficulty: 'Medium', hint: 'Discuss hashing and collision handling.', expectedAnswer: 'Hash table stores key-value pairs. Uses hash function to compute index. Collisions handled by chaining or open addressing.' },
      { question: 'What is the difference between TCP and UDP?', category: 'Technical', difficulty: 'Easy', hint: 'Consider reliability vs speed.', expectedAnswer: 'TCP is connection-oriented, reliable, slower. UDP is connectionless, unreliable, faster. TCP guarantees delivery; UDP does not.' },
      { question: 'Solve: If A+B=15 and A-B=5, find A and B.', category: 'Aptitude', difficulty: 'Easy', hint: 'Add the equations.', expectedAnswer: 'Adding: 2A=20, so A=10. Then B=5.' },
      { question: 'Why do you want to work at Infosys?', category: 'HR', difficulty: 'Medium', hint: 'Research the companys values and growth.', expectedAnswer: 'Mention Infosys global presence, learning opportunities, and alignment with career goals.' },
    ],
    isActive: true,
  },
  {
    name: 'Wipro',
    slug: 'wipro',
    description: 'Wipro is a leading global information technology, consulting, and business process services company.',
    testPattern: 'Aptitude + Technical + Communication',
    rounds: ['Online Test', 'Technical Interview', 'HR Interview'],
    eligibility: 'Minimum 60% in academics',
    topics: ['Quantitative Aptitude', 'Logical Reasoning', 'Verbal English', 'Programming Basics'],
    packageRange: '3.5 - 6 LPA',
    interviewQuestions: [
      { question: 'What is a primary key in a database?', category: 'Technical', difficulty: 'Easy', hint: 'Uniqueness and non-null constraints.', expectedAnswer: 'A primary key uniquely identifies each record in a table. It cannot be NULL and must be unique.' },
      { question: 'Explain the concept of recursion.', category: 'Technical', difficulty: 'Medium', hint: 'Function calling itself.', expectedAnswer: 'Recursion is when a function calls itself to solve smaller instances of the same problem. Needs base case to stop.' },
      { question: 'What are the main components of a computer network?', category: 'Technical', difficulty: 'Easy', hint: 'NICs, routers, switches, protocols.', expectedAnswer: 'Nodes (computers), networking devices (routers, switches, hubs), transmission media (cables, wireless), protocols (TCP/IP).' },
      { question: 'Find the next number in the series: 2, 6, 12, 20, 30, ?', category: 'Aptitude', difficulty: 'Medium', hint: 'Differences between consecutive terms.', expectedAnswer: 'Differences: 4, 6, 8, 10. Next difference is 12, so answer is 42.' },
      { question: 'Describe your final year project.', category: 'Technical', difficulty: 'Medium', hint: 'Technology stack, challenges, outcomes.', expectedAnswer: 'Explain project goal, technologies used, your role, challenges faced and how you solved them, and results achieved.' },
    ],
    isActive: true,
  },
  {
    name: 'Cognizant',
    slug: 'cognizant',
    description: 'Cognizant is a multinational technology company specializing in IT services and consulting.',
    testPattern: 'Aptitude + Technical + Communication',
    rounds: ['Aptitude Test', 'Programming Test', 'Technical Interview', 'HR Interview'],
    eligibility: 'Minimum 60% in academics',
    topics: ['Quantitative Aptitude', 'Logical Reasoning', 'Verbal Ability', 'Data Structures', 'Algorithms'],
    packageRange: '3.5 - 7 LPA',
    interviewQuestions: [
      { question: 'What is the difference between == and === operators in JavaScript?', category: 'Coding', difficulty: 'Easy', hint: 'Type coercion.', expectedAnswer: '== checks value equality with type coercion. === checks both value and type equality without coercion.' },
      { question: 'Explain the bubble sort algorithm.', category: 'Coding', difficulty: 'Easy', hint: 'Repeatedly swapping adjacent elements.', expectedAnswer: 'Bubble sort repeatedly steps through the list, compares adjacent elements and swaps them if they are in wrong order. Time complexity O(n^2).' },
      { question: 'What is the purpose of the GROUP BY clause in SQL?', category: 'Technical', difficulty: 'Easy', hint: 'Aggregation and grouping.', expectedAnswer: 'GROUP BY groups rows that have the same values in specified columns, often used with aggregate functions like COUNT, SUM, AVG.' },
      { question: 'Solve: A man has Rs. 240. He buys 12 apples for Rs. 5 each. How much money is left?', category: 'Aptitude', difficulty: 'Easy', hint: 'Simple subtraction.', expectedAnswer: 'Cost of 12 apples = 12 * 5 = Rs. 60. Money left = 240 - 60 = Rs. 180.' },
      { question: 'What are your strengths and weaknesses?', category: 'HR', difficulty: 'Medium', hint: 'Be honest and show self-awareness.', expectedAnswer: 'Strengths: technical skills, problem-solving. Weakness: being too critical of own work, but working on it by setting realistic standards.' },
    ],
    isActive: true,
  },
  {
    name: 'Zensar',
    slug: 'zensar',
    description: 'Zensar is a global leader in digital transformation and technology services.',
    testPattern: 'Aptitude + Technical + HR',
    rounds: ['Online Test', 'Technical Interview', 'HR Interview'],
    eligibility: 'Minimum 55% in academics',
    topics: ['Quantitative Aptitude', 'Logical Reasoning', 'Verbal Ability', 'Technical Skills'],
    packageRange: '3.2 - 6 LPA',
    interviewQuestions: [
      { question: 'What is polymorphism in OOP?', category: 'Technical', difficulty: 'Medium', hint: 'Many forms, compile-time and runtime.', expectedAnswer: 'Polymorphism allows objects of different classes to be treated as objects of a common superclass. Types: Compile-time (method overloading), Runtime (method overriding).' },
      { question: 'Explain the difference between DELETE and TRUNCATE in SQL.', category: 'Technical', difficulty: 'Medium', hint: 'One can be rolled back, the other cannot.', expectedAnswer: 'DELETE removes rows one at a time, can be rolled back, fires triggers. TRUNCATE removes all rows at once, cannot be rolled back, does not fire triggers.' },
      { question: 'What is the output of the code: print(2**3)?', category: 'Coding', difficulty: 'Easy', hint: 'Python operator.', expectedAnswer: '8 (** is the exponentiation operator in Python).' },
      { question: 'If a train travels 120 km in 2 hours, what is its speed?', category: 'Aptitude', difficulty: 'Easy', hint: 'Speed = Distance / Time.', expectedAnswer: 'Speed = 120 km / 2 hours = 60 km/h.' },
      { question: 'Where do you see yourself in 5 years?', category: 'HR', difficulty: 'Medium', hint: 'Show ambition and alignment with company growth.', expectedAnswer: 'I see myself growing within the organization, taking on more responsibilities, and contributing to impactful projects while continuously learning.' },
    ],
    isActive: true,
  },
  {
    name: 'Accenture',
    slug: 'accenture',
    description: 'Accenture is a global professional services company with capabilities in digital, cloud, and security.',
    testPattern: 'Aptitude + Technical + Communication + HR',
    rounds: ['Online Assessment', 'Technical Interview', 'HR Interview'],
    eligibility: 'Minimum 65% in academics',
    topics: ['Quantitative Aptitude', 'Logical Reasoning', 'Verbal Ability', 'Technical Fundamentals'],
    packageRange: '4 - 9 LPA',
    interviewQuestions: [
      { question: 'What is cloud computing?', category: 'Technical', difficulty: 'Easy', hint: 'On-demand delivery of IT resources.', expectedAnswer: 'Cloud computing delivers computing services over the internet, including servers, storage, databases, networking, software, and analytics.' },
      { question: 'Explain the MVC architecture.', category: 'Technical', difficulty: 'Medium', hint: 'Model-View-Controller separation.', expectedAnswer: 'MVC separates application into three components: Model (data and business logic), View (UI), Controller (handles input and updates model/view).' },
      { question: 'What is the time complexity of inserting at the beginning of an array?', category: 'Technical', difficulty: 'Medium', hint: 'All elements need to shift.', expectedAnswer: 'O(n) because all existing elements need to be shifted one position to the right to make space for the new element.' },
      { question: 'A shopkeeper gives a 20% discount on a Rs. 500 item. What is the selling price?', category: 'Aptitude', difficulty: 'Easy', hint: 'Calculate 20% of 500 and subtract.', expectedAnswer: 'Discount = 20% of 500 = Rs. 100. Selling price = 500 - 100 = Rs. 400.' },
      { question: 'Describe a challenging situation and how you handled it.', category: 'HR', difficulty: 'Medium', hint: 'Use STAR method.', expectedAnswer: 'Situation: describe context. Task: explain your responsibility. Action: what you did. Result: outcome and learning.' },
    ],
    isActive: true,
  },
];

const seedCompanies = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    for (const company of companies) {
      await CompanyInfo.findOneAndUpdate(
        { slug: company.slug },
        company,
        { upsert: true, new: true }
      );
      console.log(`Seeded company: ${company.name} with ${company.interviewQuestions.length} interview questions`);
    }

    console.log('All companies seeded successfully');
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding companies:', error);
    process.exit(1);
  }
};

seedCompanies();