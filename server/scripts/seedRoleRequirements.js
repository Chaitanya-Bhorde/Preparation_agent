require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const RoleRequirements = require('../models/RoleRequirements');

const defaultRoles = [
  {
    role: 'Software Developer / SDE',
    description: 'Core software development role focusing on algorithms, system design, and general programming skills',
    requiredSkills: [
      { skill: 'DSA', weight: 3, category: 'technical' },
      { skill: 'OOP', weight: 2, category: 'technical' },
      { skill: 'system design', weight: 2, category: 'technical' },
      { skill: 'DBMS', weight: 1, category: 'technical' },
      { skill: 'OS', weight: 1, category: 'technical' },
      { skill: 'Computer Networks', weight: 1, category: 'technical' },
      { skill: 'Git', weight: 1, category: 'tool' },
      { skill: 'REST API', weight: 1, category: 'technical' },
      { skill: 'Java', weight: 1, category: 'technical' },
      { skill: 'Python', weight: 1, category: 'technical' },
    ],
    keywords: ['dsa', 'data structures', 'algorithms', 'oop', 'object-oriented', 'system design', 'dbms', 'os', 'computer networks', 'git', 'rest api', 'agile', 'scrum'],
    minExperience: { years: 0, description: 'Internship or projects acceptable' },
    educationRequirements: ['Bachelor\'s in CS/IT/related field', 'Strong academic record'],
    preferredSkills: ['microservices', 'docker', 'kubernetes', 'cloud platforms', 'CI/CD'],
    scoringWeights: {
      technicalSkills: 0.3,
      experience: 0.25,
      education: 0.15,
      projects: 0.15,
      achievements: 0.1,
      keywordDensity: 0.05,
    },
  },
  {
    role: 'Data Analyst',
    description: 'Data analysis role focusing on statistics, SQL, and business intelligence tools',
    requiredSkills: [
      { skill: 'SQL', weight: 3, category: 'technical' },
      { skill: 'Excel', weight: 2, category: 'tool' },
      { skill: 'Power BI', weight: 1, category: 'tool' },
      { skill: 'Tableau', weight: 1, category: 'tool' },
      { skill: 'Python', weight: 2, category: 'technical' },
      { skill: 'R', weight: 1, category: 'technical' },
      { skill: 'statistics', weight: 2, category: 'domain' },
      { skill: 'data visualization', weight: 1, category: 'domain' },
      { skill: 'Pandas', weight: 1, category: 'technical' },
    ],
    keywords: ['sql', 'excel', 'power bi', 'tableau', 'python', 'r', 'statistics', 'analytics', 'data visualization', 'pandas', 'numpy', 'business intelligence'],
    minExperience: { years: 0, description: 'Entry-level with analytical projects' },
    educationRequirements: ['Bachelor\'s in Statistics/Math/CS/Business', 'Analytical mindset'],
    preferredSkills: ['machine learning', 'A/B testing', 'ETL', 'data modeling'],
    scoringWeights: {
      technicalSkills: 0.35,
      experience: 0.2,
      education: 0.15,
      projects: 0.2,
      achievements: 0.05,
      keywordDensity: 0.05,
    },
  },
  {
    role: 'Frontend Developer',
    description: 'Frontend development role focusing on UI/UX, JavaScript frameworks, and web technologies',
    requiredSkills: [
      { skill: 'React', weight: 3, category: 'technical' },
      { skill: 'JavaScript', weight: 3, category: 'technical' },
      { skill: 'TypeScript', weight: 2, category: 'technical' },
      { skill: 'HTML', weight: 2, category: 'technical' },
      { skill: 'CSS', weight: 2, category: 'technical' },
      { skill: 'Redux', weight: 1, category: 'technical' },
      { skill: 'Git', weight: 1, category: 'tool' },
    ],
    keywords: ['react', 'javascript', 'typescript', 'html', 'css', 'redux', 'next.js', 'vue', 'angular', 'responsive design', 'ui/ux', 'frontend'],
    minExperience: { years: 0, description: 'Portfolio of frontend projects' },
    educationRequirements: ['Bachelor\'s in CS/IT/related field'],
    preferredSkills: ['Next.js', 'Tailwind CSS', 'GraphQL', 'testing frameworks'],
    scoringWeights: {
      technicalSkills: 0.35,
      experience: 0.2,
      education: 0.1,
      projects: 0.25,
      achievements: 0.05,
      keywordDensity: 0.05,
    },
  },
  {
    role: 'Backend Developer',
    description: 'Backend development role focusing on server-side logic, databases, and APIs',
    requiredSkills: [
      { skill: 'Node.js', weight: 2, category: 'technical' },
      { skill: 'Python', weight: 2, category: 'technical' },
      { skill: 'Java', weight: 2, category: 'technical' },
      { skill: 'SQL', weight: 2, category: 'technical' },
      { skill: 'MongoDB', weight: 1, category: 'technical' },
      { skill: 'REST API', weight: 2, category: 'technical' },
      { skill: 'Docker', weight: 1, category: 'tool' },
      { skill: 'Git', weight: 1, category: 'tool' },
    ],
    keywords: ['node.js', 'python', 'java', 'sql', 'mongodb', 'rest api', 'microservices', 'docker', 'backend', 'server', 'api'],
    minExperience: { years: 0, description: 'Backend project experience' },
    educationRequirements: ['Bachelor\'s in CS/IT/related field'],
    preferredSkills: ['Redis', 'Kafka', 'AWS', 'CI/CD', 'testing'],
    scoringWeights: {
      technicalSkills: 0.35,
      experience: 0.2,
      education: 0.1,
      projects: 0.25,
      achievements: 0.05,
      keywordDensity: 0.05,
    },
  },
  {
    role: 'Full Stack Developer',
    description: 'Full stack development role requiring both frontend and backend expertise',
    requiredSkills: [
      { skill: 'React', weight: 2, category: 'technical' },
      { skill: 'Node.js', weight: 2, category: 'technical' },
      { skill: 'JavaScript', weight: 2, category: 'technical' },
      { skill: 'SQL', weight: 2, category: 'technical' },
      { skill: 'MongoDB', weight: 1, category: 'technical' },
      { skill: 'HTML', weight: 1, category: 'technical' },
      { skill: 'CSS', weight: 1, category: 'technical' },
      { skill: 'Git', weight: 1, category: 'tool' },
    ],
    keywords: ['react', 'node.js', 'javascript', 'sql', 'mongodb', 'fullstack', 'frontend', 'backend', 'api', 'git', 'docker'],
    minExperience: { years: 1, description: 'Experience with end-to-end product development' },
    educationRequirements: ['Bachelor\'s in CS/IT/related field'],
    preferredSkills: ['Next.js', 'Express', 'PostgreSQL', 'cloud platforms', 'CI/CD'],
    scoringWeights: {
      technicalSkills: 0.35,
      experience: 0.25,
      education: 0.1,
      projects: 0.2,
      achievements: 0.05,
      keywordDensity: 0.05,
    },
  },
  {
    role: 'QA/Testing',
    description: 'Quality assurance role focusing on testing methodologies, automation, and quality processes',
    requiredSkills: [
      { skill: 'Selenium', weight: 2, category: 'tool' },
      { skill: 'Jest', weight: 1, category: 'tool' },
      { skill: 'Cypress', weight: 1, category: 'tool' },
      { skill: 'Java', weight: 1, category: 'technical' },
      { skill: 'Python', weight: 1, category: 'technical' },
      { skill: 'SQL', weight: 1, category: 'technical' },
      { skill: 'Git', weight: 1, category: 'tool' },
      { skill: 'API testing', weight: 1, category: 'domain' },
    ],
    keywords: ['testing', 'selenium', 'jest', 'cypress', 'automation', 'qa', 'quality assurance', 'test cases', 'bug tracking', 'api testing'],
    minExperience: { years: 0, description: 'Testing project experience' },
    educationRequirements: ['Bachelor\'s in CS/IT/related field'],
    preferredSkills: ['JIRA', 'JMeter', 'Postman', 'CI/CD', 'performance testing'],
    scoringWeights: {
      technicalSkills: 0.3,
      experience: 0.25,
      education: 0.15,
      projects: 0.2,
      achievements: 0.05,
      keywordDensity: 0.05,
    },
  },
];

const seedRoleRequirements = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    for (const role of defaultRoles) {
      await RoleRequirements.findOneAndUpdate(
        { role: role.role },
        role,
        { upsert: true, new: true }
      );
      console.log(`Seeded role requirements for ${role.role}`);
    }

    console.log('All role requirements seeded successfully');
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding role requirements:', error);
    process.exit(1);
  }
};

seedRoleRequirements();