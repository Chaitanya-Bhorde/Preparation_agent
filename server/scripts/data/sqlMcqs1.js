// SQL MCQs Part 1
module.exports = [
  { topic: 'SQL Introduction', question: 'SQL stands for:', options: ['Structured Query Language', 'Simple Query Language', 'Standard Query Language', 'System Query Language'], correctAnswer: 0, explanation: 'SQL = Structured Query Language.', difficulty: 'easy' },
  { topic: 'DDL', question: 'DDL is:', options: ['Data Definition Language', 'Data Manipulation Language', 'Data Query Language', 'Data Control Language'], correctAnswer: 0, explanation: 'DDL (Data Definition Language) defines database structure.', difficulty: 'easy' },
  { topic: 'DDL', question: 'Which is DDL command?', options: ['SELECT', 'INSERT', 'CREATE', 'UPDATE'], correctAnswer: 2, explanation: 'CREATE is a DDL command. SELECT/INSERT UPDATE are DML/DQL.', difficulty: 'easy' },
  { topic: 'DML', question: 'DML commands include:', options: ['CREATE', 'ALTER', 'INSERT', 'DROP'], correctAnswer: 2, explanation: 'INSERT is DML. CREATE, ALTER, DROP are DDL.', difficulty: 'easy' },
  { topic: 'SELECT', question: 'SELECT is:', options: ['DDL', 'DML', 'DQL', 'DCL'], correctAnswer: 2, explanation: 'SELECT is DQL (Data Query Language).', difficulty: 'easy' },
  { topic: 'CREATE', question: 'CREATE TABLE is:', options: ['DML', 'DDL', 'DQL', 'TCL'], correctAnswer: 1, explanation: 'CREATE TABLE is a DDL command.', difficulty: 'easy' },
  { topic: 'ALTER', question: 'ALTER is used to:', options: ['Insert data', 'Modify table structure', 'Delete data', 'Query data'], correctAnswer: 1, explanation: 'ALTER modifies table structure (add/remove/modify columns).', difficulty: 'easy' },
  { topic: 'DROP', question: 'DROP TABLE:', options: ['Deletes rows', 'Deletes table structure', 'Updates data', 'Creates table'], correctAnswer: 1, explanation: 'DROP TABLE deletes the entire table structure and data.', difficulty: 'easy' },
  { topic: 'INSERT', question: 'INSERT INTO is:', options: ['DDL', 'DML', 'DQL', 'DCL'], correctAnswer: 1, explanation: 'INSERT INTO is a DML command.', difficulty: 'easy' },
  { topic: 'WHERE', question: 'WHERE clause is used to:', options: ['Group rows', 'Filter rows', 'Sort rows', 'Join tables'], correctAnswer: 1, explanation: 'WHERE clause filters rows based on a condition.', difficulty: 'easy' },
  { topic: 'GROUP BY', question: 'GROUP BY is used with:', options: ['WHERE', 'Aggregate functions', 'ORDER BY only', 'JOIN'], correctAnswer: 1, explanation: 'GROUP BY groups rows and is used with aggregate functions (COUNT, SUM, etc.).', difficulty: 'medium' },
  { topic: 'HAVING', question: 'HAVING is used with:', options: ['Individual rows', 'GROUP BY', 'ORDER BY', 'JOIN'], correctAnswer: 1, explanation: 'HAVING filters groups (used with GROUP BY), WHERE filters rows.', difficulty: 'medium' },
  { topic: 'ORDER BY', question: 'ORDER BY ASC means:', options: ['Descending', 'Ascending', 'Random', 'No order'], correctAnswer: 1, explanation: 'ORDER BY ASC sorts in ascending order.', difficulty: 'easy' },
  { topic: 'DISTINCT', question: 'SELECT DISTINCT:', options: ['All rows', 'Unique values only', 'First row', 'Last row'], correctAnswer: 1, explanation: 'SELECT DISTINCT returns only unique values.', difficulty: 'easy' },
  { topic: 'Joins', question: 'JOIN is used to:', options: ['Filter rows', 'Combine rows from multiple tables', 'Sort data', 'Group data'], correctAnswer: 1, explanation: 'JOIN combines rows from two or more tables based on related columns.', difficulty: 'easy' },
];
