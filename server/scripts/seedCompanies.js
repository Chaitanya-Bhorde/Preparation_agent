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
  {
    name: 'Google',
    slug: 'google',
    description: 'Google is a multinational technology company specializing in Internet-related services and products.',
    testPattern: 'Technical MCQs + Coding + System Design + HR',
    rounds: ['Online Assessment', 'Technical Phone Screen', 'Onsite Interviews', 'Hiring Committee'],
    eligibility: 'CGPA >= 7.0',
    topics: ['Data Structures', 'Algorithms', 'System Design', 'Aptitude'],
    packageRange: '15 - 45 LPA',
    interviewQuestions: [
      { question: 'Explain the difference between a process and a thread.', category: 'Technical', difficulty: 'Medium', hint: 'Think about memory sharing and execution.', expectedAnswer: 'A process has its own memory space. A thread shares memory with other threads.' },
      { question: 'What is the time complexity of binary search?', category: 'Technical', difficulty: 'Easy', hint: 'Think about halving the search space.', expectedAnswer: 'O(log n). The search space is halved with each comparison.' },
      { question: 'Design a URL shortening service like bit.ly', category: 'System Design', difficulty: 'Hard', hint: 'Consider hash functions and database scaling.', expectedAnswer: 'Use a hash function to generate short keys, store mappings in a database, consider caching and load balancing.' },
      { question: 'Tell me about a time you handled a difficult bug.', category: 'HR', difficulty: 'Medium', hint: 'Use STAR method.', expectedAnswer: 'Describe the situation, task, action, and result of debugging a complex issue.' },
    ],
    isActive: true,
  },
  {
    name: 'Amazon',
    slug: 'amazon',
    description: 'Amazon is a multinational technology and e-commerce company focusing on cloud computing and AI.',
    testPattern: 'Online Assessment + Technical Interviews + Bar Raiser',
    rounds: ['Online Assessment', 'Phone Interview', 'Onsite Loops', 'Bar Raiser Round'],
    eligibility: 'CGPA >= 6.5',
    topics: ['Coding', 'Data Structures', 'System Design', 'Behavioral'],
    packageRange: '12 - 40 LPA',
    interviewQuestions: [
      { question: 'Explain the Amazon Leadership Principles.', category: 'HR', difficulty: 'Medium', hint: 'Focus on Customer Obsession and Ownership.', expectedAnswer: 'Amazon has 16 Leadership Principles including Customer Obsession, Ownership, Invent and Simplify, etc.' },
      { question: 'What is the difference between TCP and UDP?', category: 'Technical', difficulty: 'Easy', hint: 'Consider reliability vs speed.', expectedAnswer: 'TCP is connection-oriented, reliable, slower. UDP is connectionless, faster, unreliable.' },
      { question: 'Design a distributed cache system', category: 'System Design', difficulty: 'Hard', hint: 'Consider eviction policies and consistency.', expectedAnswer: 'Use consistent hashing, LRU eviction, consider cache invalidation strategies.' },
      { question: 'Solve: Find the missing number in an array of 1 to n.', category: 'Coding', difficulty: 'Easy', hint: 'Use XOR or sum formula.', expectedAnswer: 'Use formula n*(n+1)/2 - sum(array) or XOR all numbers.' },
    ],
    isActive: true,
  },
  {
    name: 'Microsoft',
    slug: 'microsoft',
    description: 'Microsoft is a global technology company known for Windows, Office, and Azure cloud services.',
    testPattern: 'Online Test + Technical Interviews + Behavioral',
    rounds: ['Online Assessment', 'Technical Phone Screen', 'Onsite Interviews'],
    eligibility: 'CGPA >= 6.0',
    topics: ['DSA', 'OOPS', 'System Design', 'Aptitude'],
    packageRange: '10 - 35 LPA',
    interviewQuestions: [
      { question: 'What is polymorphism in OOP?', category: 'Technical', difficulty: 'Easy', hint: 'Think compile-time vs runtime.', expectedAnswer: 'Polymorphism allows objects of different classes to be treated as objects of a common superclass.' },
      { question: 'Reverse a linked list in place.', category: 'Coding', difficulty: 'Medium', hint: 'Use three pointers.', expectedAnswer: 'Use prev, current, next pointers to iteratively reverse the list.' },
      { question: 'Explain the CAP theorem.', category: 'Technical', difficulty: 'Medium', hint: 'Consistency, Availability, Partition tolerance.', expectedAnswer: 'A distributed system can only guarantee two of the three: Consistency, Availability, and Partition tolerance.' },
    ],
    isActive: true,
  },
  {
    name: 'Meta',
    slug: 'meta',
    description: 'Meta Platforms (formerly Facebook) is a leader in social media and metaverse technologies.',
    testPattern: 'Technical Screen + Onsite + Behavioral',
    rounds: ['Recruiter Screen', 'Technical Phone', 'Onsite (3-4 rounds)', 'Hiring Committee'],
    eligibility: 'CGPA >= 6.5',
    topics: ['Algorithms', 'System Design', 'Product Sense'],
    packageRange: '15 - 45 LPA',
    interviewQuestions: [
      { question: 'Implement a Least Recently Used (LRU) cache.', category: 'Coding', difficulty: 'Hard', hint: 'Use hash map + doubly linked list.', expectedAnswer: 'Combine a hash map for O(1) lookups with a doubly linked list for O(1) eviction.' },
      { question: 'What happens when you type a URL in the browser?', category: 'Technical', difficulty: 'Medium', hint: 'DNS, TCP, HTTP, rendering.', expectedAnswer: 'DNS lookup, TCP handshake, HTTP request, server response, browser rendering.' },
      { question: 'Design Instagram feed ranking.', category: 'System Design', difficulty: 'Hard', hint: 'Consider personalization and engagement metrics.', expectedAnswer: 'Use graph algorithms, machine learning models, and real-time features.' },
    ],
    isActive: true,
  },
  {
    name: 'Apple',
    slug: 'apple',
    description: 'Apple is a multinational technology company known for consumer electronics and software.',
    testPattern: 'Technical Deep Dives + System Design + Culture Fit',
    rounds: ['HR Screen', 'Technical Phone', 'Onsite (4-5 rounds)', 'Hiring Manager'],
    eligibility: 'CGPA >= 6.5',
    topics: ['Data Structures', 'Algorithms', 'System Design', 'iOS/macOS'],
    packageRange: '12 - 40 LPA',
    interviewQuestions: [
      { question: 'Explain the iOS app lifecycle.', category: 'Technical', difficulty: 'Medium', hint: 'Consider states like active, inactive, background.', expectedAnswer: 'Not running, inactive, active, background, suspended. Methods: didFinishLaunching, applicationDidBecomeActive, etc.' },
      { question: 'What is ARC in iOS development?', category: 'Technical', difficulty: 'Medium', hint: 'Automatic Reference Counting.', expectedAnswer: 'ARC automatically manages memory by inserting retain/release calls at compile time.' },
      { question: 'Design a music streaming service.', category: 'System Design', difficulty: 'Hard', hint: 'Consider buffering and quality adaptation.', expectedAnswer: 'Use CDN for content delivery, adaptive bitrate streaming, caching strategies.' },
    ],
    isActive: true,
  },
  {
    name: 'Netflix',
    slug: 'netflix',
    description: 'Netflix is a streaming entertainment company and content producer.',
    testPattern: 'Coding + System Design + Behavioral',
    rounds: ['Recruiter Screen', 'Technical Phone', 'Onsite', 'Hiring Committee'],
    eligibility: 'CGPA >= 6.5',
    topics: ['Algorithms', 'Distributed Systems', 'Microservices'],
    packageRange: '15 - 50 LPA',
    interviewQuestions: [
      { question: 'Design a recommendation system for Netflix.', category: 'System Design', difficulty: 'Hard', hint: 'Consider collaborative filtering and content-based filtering.', expectedAnswer: 'Use matrix factorization, content-based features, real-time A/B testing.' },
      { question: 'Explain microservices architecture.', category: 'Technical', difficulty: 'Medium', hint: 'Consider service communication and data consistency.', expectedAnswer: 'Decompose application into small independent services, communicate via APIs, each service has its own database.' },
      { question: 'Find the longest increasing subsequence.', category: 'Coding', difficulty: 'Medium', hint: 'Use dynamic programming or patience sorting.', expectedAnswer: 'DP approach O(n^2) or binary search approach O(n log n).' },
    ],
    isActive: true,
  },
  {
    name: 'Adobe',
    slug: 'adobe',
    description: 'Adobe is a multinational software company known for creative and document management products.',
    testPattern: 'Aptitude + Technical + HR',
    rounds: ['Online Test', 'Technical Interview', 'HR Interview'],
    eligibility: 'CGPA >= 6.0',
    topics: ['Aptitude', 'Data Structures', 'OOP', 'Projects'],
    packageRange: '8 - 22 LPA',
    interviewQuestions: [
      { question: 'What is the difference between class and structure in C++?', category: 'Technical', difficulty: 'Easy', hint: 'Think about default access modifiers and inheritance.', expectedAnswer: 'Struct members are public by default, class members are private. Struct cannot inherit, class can.' },
      { question: 'Explain the concept of virtual functions.', category: 'Technical', difficulty: 'Medium', hint: 'Think about runtime polymorphism and vtable.', expectedAnswer: 'Virtual functions enable runtime polymorphism. They are resolved at runtime using vtable.' },
      { question: 'A train travels 120 km in 2 hours. What is its speed?', category: 'Aptitude', difficulty: 'Easy', hint: 'Speed = Distance / Time.', expectedAnswer: 'Speed = 120 km / 2 hours = 60 km/h.' },
    ],
    isActive: true,
  },
  {
    name: 'Salesforce',
    slug: 'salesforce',
    description: 'Salesforce is a cloud-based CRM software company.',
    testPattern: 'Online Assessment + Technical + Behavioral',
    rounds: ['Online Test', 'Technical Interview', 'Manager Interview', 'HR'],
    eligibility: 'CGPA >= 6.0',
    topics: ['DSA', 'OOPS', 'Database', 'Aptitude'],
    packageRange: '8 - 25 LPA',
    interviewQuestions: [
      { question: 'What is CRM?', category: 'Technical', difficulty: 'Easy', hint: 'Customer Relationship Management.', expectedAnswer: "CRM is a technology for managing all your company's relationships and interactions with customers and potential customers." },
      { question: 'Explain polymorphism with a real-world example.', category: 'Technical', difficulty: 'Medium', hint: 'Think about different forms of the same action.', expectedAnswer: 'A person can be a student, employee, and parent simultaneously - same person different roles.' },
      { question: 'What is the output: SELECT COUNT(*) FROM table?', category: 'Aptitude', difficulty: 'Easy', hint: 'Counts all rows including NULLs.', expectedAnswer: 'COUNT(*) returns the number of rows in the table.' },
    ],
    isActive: true,
  },
  {
    name: 'Oracle',
    slug: 'oracle',
    description: 'Oracle is a multinational computer technology corporation specializing in database software.',
    testPattern: 'Aptitude + Technical + HR',
    rounds: ['Online Test', 'Technical Interview', 'HR Interview'],
    eligibility: 'CGPA >= 6.0',
    topics: ['DBMS', 'SQL', 'Data Structures', 'Aptitude'],
    packageRange: '5 - 15 LPA',
    interviewQuestions: [
      { question: 'What is a database index?', category: 'Technical', difficulty: 'Medium', hint: 'Think about faster data retrieval.', expectedAnswer: 'An index is a data structure that improves the speed of data retrieval operations on a database table.' },
      { question: 'Explain ACID properties.', category: 'Technical', difficulty: 'Medium', hint: 'Atomicity, Consistency, Isolation, Durability.', expectedAnswer: 'ACID ensures reliable processing of database transactions.' },
      { question: 'What is the difference between DELETE and TRUNCATE?', category: 'Technical', difficulty: 'Easy', hint: 'Consider logging and rollback.', expectedAnswer: 'DELETE removes rows one at a time, can be rolled back. TRUNCATE removes all rows at once, cannot be rolled back.' },
    ],
    isActive: true,
  },
  {
    name: 'IBM',
    slug: 'ibm',
    description: 'IBM is a global technology company offering hardware, software, and consulting services.',
    testPattern: 'Aptitude + Technical + HR',
    rounds: ['Online Test', 'Technical Interview', 'HR Interview'],
    eligibility: 'CGPA >= 6.0',
    topics: ['Aptitude', 'Data Structures', 'DBMS', 'Projects'],
    packageRange: '4 - 12 LPA',
    interviewQuestions: [
      { question: 'What is cloud computing?', category: 'Technical', difficulty: 'Easy', hint: 'On-demand delivery of IT resources.', expectedAnswer: 'Cloud computing delivers computing services over the internet including servers, storage, databases, networking, software.' },
      { question: 'Explain the concept of blockchain.', category: 'Technical', difficulty: 'Medium', hint: 'Distributed ledger technology.', expectedAnswer: 'Blockchain is a distributed ledger that records transactions across many computers so that the record cannot be altered retroactively.' },
      { question: 'If 20% of a number is 50, what is the number?', category: 'Aptitude', difficulty: 'Easy', hint: 'Let x be the number.', expectedAnswer: '0.2 * x = 50 => x = 250' },
    ],
    isActive: true,
  },
  {
    name: 'SAP',
    slug: 'sap',
    description: 'SAP is a German multinational software company known for enterprise resource planning software.',
    testPattern: 'Online Test + Technical + HR',
    rounds: ['Online Assessment', 'Technical Interview', 'HR Interview'],
    eligibility: 'CGPA >= 6.0',
    topics: ['Aptitude', 'Technical', 'DBMS', 'Projects'],
    packageRange: '5 - 15 LPA',
    interviewQuestions: [
      { question: 'What is ERP?', category: 'Technical', difficulty: 'Easy', hint: 'Enterprise Resource Planning.', expectedAnswer: 'ERP is a type of software that organizations use to manage day-to-day business activities.' },
      { question: 'Explain the difference between ON-Premise and Cloud ERP.', category: 'Technical', difficulty: 'Medium', hint: 'Consider deployment and maintenance.', expectedAnswer: 'On-premise is installed locally, cloud is hosted remotely. Cloud offers lower upfront cost and easier maintenance.' },
    ],
    isActive: true,
  },
  {
    name: 'Deloitte',
    slug: 'deloitte',
    description: 'Deloitte is a multinational professional services network providing audit, consulting, and advisory services.',
    testPattern: 'Aptitude + Technical + HR + Case Study',
    rounds: ['Online Test', 'Case Study', 'Technical Interview', 'HR Interview'],
    eligibility: 'CGPA >= 6.0',
    topics: ['Aptitude', 'Technical Basics', 'Communication'],
    packageRange: '4 - 10 LPA',
    interviewQuestions: [
      { question: 'What is GST?', category: 'Technical', difficulty: 'Easy', hint: 'Goods and Services Tax.', expectedAnswer: 'GST is an indirect tax levied on the supply of goods and services.' },
      { question: 'Explain the difference between asset and liability.', category: 'Technical', difficulty: 'Easy', hint: 'Think about balance sheet.', expectedAnswer: 'Assets are resources owned by a business. Liabilities are obligations owed by the business.' },
      { question: 'Describe a situation where you had to work in a team.', category: 'HR', difficulty: 'Easy', hint: 'Use STAR method.', expectedAnswer: 'Describe the situation, task, action, and result of a team project.' },
    ],
    isActive: true,
  },
  {
    name: 'Walmart',
    slug: 'walmart',
    description: 'Walmart is a multinational retail corporation operating a chain of hypermarkets and grocery stores.',
    testPattern: 'Online Assessment + Technical + HR',
    rounds: ['Online Test', 'Technical Interview', 'HR Interview'],
    eligibility: 'CGPA >= 6.0',
    topics: ['DSA', 'System Design', 'Behavioral'],
    packageRange: '10 - 30 LPA',
    interviewQuestions: [
      { question: 'Design a grocery store inventory system.', category: 'System Design', difficulty: 'Medium', hint: 'Consider real-time updates and scalability.', expectedAnswer: 'Use microservices for inventory management, real-time notifications, and analytics dashboard.' },
      { question: 'Explain the retail supply chain.', category: 'Technical', difficulty: 'Medium', hint: 'Consider logistics and inventory management.', expectedAnswer: 'Supply chain includes procurement, warehousing, distribution, and retail operations.' },
    ],
    isActive: true,
  },
  {
    name: 'Flipkart',
    slug: 'flipkart',
    description: 'Flipkart is an Indian e-commerce company known for online retail and marketplace services.',
    testPattern: 'Online Test + Technical + HR',
    rounds: ['Online Assessment', 'Technical Interview', 'Hiring Manager', 'HR'],
    eligibility: 'CGPA >= 6.5',
    topics: ['DSA', 'System Design', 'Aptitude'],
    packageRange: '8 - 25 LPA',
    interviewQuestions: [
      { question: 'Design a notification system for e-commerce.', category: 'System Design', difficulty: 'Hard', hint: 'Consider email, SMS, push notifications.', expectedAnswer: 'Use message queues, template engines, and delivery tracking with fallback mechanisms.' },
      { question: 'Find the second largest element in an array.', category: 'Coding', difficulty: 'Easy', hint: 'Single pass with two variables.', expectedAnswer: 'Track max1 and max2 while iterating through the array.' },
    ],
    isActive: true,
  },
  {
    name: 'Paytm',
    slug: 'paytm',
    description: 'Paytm is an Indian digital payments and financial services company.',
    testPattern: 'Online Test + Technical + HR',
    rounds: ['Online Assessment', 'Technical Interview', 'HR Interview'],
    eligibility: 'CGPA >= 6.0',
    topics: ['DSA', 'DBMS', 'Aptitude'],
    packageRange: '6 - 18 LPA',
    interviewQuestions: [
      { question: 'Explain how UPI works.', category: 'Technical', difficulty: 'Medium', hint: 'Unified Payments Interface.', expectedAnswer: 'UPI enables instant bank-to-bank money transfer via mobile platform using Virtual Payment Address.' },
      { question: 'What is a transaction in DBMS?', category: 'Technical', difficulty: 'Easy', hint: 'Unit of work in database.', expectedAnswer: 'A transaction is a unit of work that is performed against a database. It follows ACID properties.' },
    ],
    isActive: true,
  },
  {
    name: 'Zomato',
    slug: 'zomato',
    description: 'Zomato is an Indian online food ordering and delivery platform.',
    testPattern: 'Online Test + Technical + HR',
    rounds: ['Online Assessment', 'Technical Interview', 'HR Interview'],
    eligibility: 'CGPA >= 6.0',
    topics: ['DSA', 'System Design', 'Aptitude'],
    packageRange: '6 - 20 LPA',
    interviewQuestions: [
      { question: 'Design a food delivery tracking system.', category: 'System Design', difficulty: 'Hard', hint: 'Consider real-time GPS and ETA calculations.', expectedAnswer: 'Use GPS tracking, map APIs, real-time database updates, and notification system.' },
      { question: 'Explain how recommendation systems work.', category: 'Technical', difficulty: 'Medium', hint: 'Collaborative vs content-based filtering.', expectedAnswer: 'Recommendation systems use user behavior and item features to suggest relevant items.' },
    ],
    isActive: true,
  },
  {
    name: 'Ola',
    slug: 'ola',
    description: 'Ola is an Indian ride-hailing company offering cab, auto, and bike services.',
    testPattern: 'Online Test + Technical + HR',
    rounds: ['Online Assessment', 'Technical Interview', 'HR Interview'],
    eligibility: 'CGPA >= 6.0',
    topics: ['DSA', 'System Design', 'Aptitude'],
    packageRange: '6 - 20 LPA',
    interviewQuestions: [
      { question: 'Design a ride-matching algorithm.', category: 'System Design', difficulty: 'Hard', hint: 'Consider nearest driver and ETA.', expectedAnswer: 'Use geospatial indexing, real-time matching, and dynamic pricing algorithms.' },
      { question: 'Find the shortest path in a graph.', category: 'Coding', difficulty: 'Medium', hint: 'Dijkstra or BFS for unweighted.', expectedAnswer: 'Use Dijkstra algorithm with priority queue for weighted graphs.' },
    ],
    isActive: true,
  },
  {
    name: 'PhonePe',
    slug: 'phonepe',
    description: 'PhonePe is an Indian digital payments and financial services company.',
    testPattern: 'Online Test + Technical + HR',
    rounds: ['Online Assessment', 'Technical Interview', 'HR Interview'],
    eligibility: 'CGPA >= 6.0',
    topics: ['DSA', 'DBMS', 'Security'],
    packageRange: '8 - 22 LPA',
    interviewQuestions: [
      { question: 'Explain how UPI transaction security works.', category: 'Technical', difficulty: 'Hard', hint: 'Consider encryption and tokenization.', expectedAnswer: 'UPI uses end-to-end encryption, two-factor authentication, and device binding for security.' },
      { question: 'What is SQL injection?', category: 'Technical', difficulty: 'Medium', hint: 'Malicious SQL in user input.', expectedAnswer: 'SQL injection is a vulnerability where malicious SQL code is inserted into user input to manipulate the database.' },
    ],
    isActive: true,
  },
  {
    name: 'Swiggy',
    slug: 'swiggy',
    description: 'Swiggy is an Indian online food ordering and delivery platform.',
    testPattern: 'Online Test + Technical + HR',
    rounds: ['Online Assessment', 'Technical Interview', 'HR Interview'],
    eligibility: 'CGPA >= 6.0',
    topics: ['DSA', 'System Design', 'Aptitude'],
    packageRange: '6 - 18 LPA',
    interviewQuestions: [
      { question: 'Design a food delivery dispatch system.', category: 'System Design', difficulty: 'Hard', hint: 'Consider order assignment and routing.', expectedAnswer: 'Use greedy algorithms for order assignment, real-time tracking, and load balancing.' },
      { question: 'Explain how recommendation systems work.', category: 'Technical', difficulty: 'Medium', hint: 'Collaborative vs content-based filtering.', expectedAnswer: 'Recommendation systems use user behavior and item features to suggest relevant items.' },
    ],
    isActive: true,
  },
];

const seedMoreCompanies = async () => {
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

seedMoreCompanies();

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