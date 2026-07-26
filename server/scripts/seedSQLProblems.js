const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const SQLProblem = require('../models/SQLProblem');

const problems = [
  {
    title: 'Select All Employees',
    description: 'Write a SQL query to retrieve all columns from the employees table.',
    difficulty: 'easy',
    topic: 'Basic SELECT',
    tags: ['SELECT', 'basic'],
    schemaSetupSQL: `CREATE TABLE employees (id INT, name VARCHAR(100), department VARCHAR(100), salary DECIMAL(10,2), hire_date DATE);
INSERT INTO employees VALUES (1, 'Alice', 'Engineering', 120000, '2020-01-15');
INSERT INTO employees VALUES (2, 'Bob', 'Marketing', 95000, '2021-03-10');
INSERT INTO employees VALUES (3, 'Charlie', 'Engineering', 110000, '2019-06-22');
INSERT INTO employees VALUES (4, 'Diana', 'Sales', 85000, '2022-11-01');
INSERT INTO employees VALUES (5, 'Eve', 'Marketing', 105000, '2020-09-14');`,
    sampleTestCases: [
      {
        inputStateSQL: '',
        expectedOutputRows: [
          { id: 1, name: 'Alice', department: 'Engineering', salary: 120000, hire_date: '2020-01-15' },
          { id: 2, name: 'Bob', department: 'Marketing', salary: 95000, hire_date: '2021-03-10' },
          { id: 3, name: 'Charlie', department: 'Engineering', salary: 110000, hire_date: '2019-06-22' },
          { id: 4, name: 'Diana', department: 'Sales', salary: 85000, hire_date: '2022-11-01' },
          { id: 5, name: 'Eve', department: 'Marketing', salary: 105000, hire_date: '2020-09-14' },
        ],
      },
    ],
    hiddenTestCases: [
      {
        inputStateSQL: `INSERT INTO employees VALUES (6, 'Frank', 'Engineering', 130000, '2023-02-28');`,
        expectedOutputRows: [
          { id: 1, name: 'Alice', department: 'Engineering', salary: 120000, hire_date: '2020-01-15' },
          { id: 2, name: 'Bob', department: 'Marketing', salary: 95000, hire_date: '2021-03-10' },
          { id: 3, name: 'Charlie', department: 'Engineering', salary: 110000, hire_date: '2019-06-22' },
          { id: 4, name: 'Diana', department: 'Sales', salary: 85000, hire_date: '2022-11-01' },
          { id: 5, name: 'Eve', department: 'Marketing', salary: 105000, hire_date: '2020-09-14' },
          { id: 6, name: 'Frank', department: 'Engineering', salary: 130000, hire_date: '2023-02-28' },
        ],
      },
    ],
    referenceSolutionSQL: 'SELECT * FROM employees;',
  },
  {
    title: 'Filter by Department',
    description: 'Write a query to select the names and salaries of all employees in the Engineering department.',
    difficulty: 'easy',
    topic: 'WHERE Clause',
    tags: ['WHERE', 'filtering'],
    schemaSetupSQL: `CREATE TABLE employees (id INT, name VARCHAR(100), department VARCHAR(100), salary DECIMAL(10,2));
INSERT INTO employees VALUES (1, 'Alice', 'Engineering', 120000);
INSERT INTO employees VALUES (2, 'Bob', 'Marketing', 95000);
INSERT INTO employees VALUES (3, 'Charlie', 'Engineering', 110000);
INSERT INTO employees VALUES (4, 'Diana', 'Sales', 85000);
INSERT INTO employees VALUES (5, 'Eve', 'Marketing', 105000);`,
    sampleTestCases: [
      {
        inputStateSQL: '',
        expectedOutputRows: [
          { name: 'Alice', salary: 120000 },
          { name: 'Charlie', salary: 110000 },
        ],
      },
    ],
    hiddenTestCases: [
      {
        inputStateSQL: `INSERT INTO employees VALUES (6, 'Frank', 'Engineering', 130000);`,
        expectedOutputRows: [
          { name: 'Alice', salary: 120000 },
          { name: 'Charlie', salary: 110000 },
          { name: 'Frank', salary: 130000 },
        ],
      },
    ],
    referenceSolutionSQL: "SELECT name, salary FROM employees WHERE department = 'Engineering';",
  },
  {
    title: 'Order By Salary',
    description: 'Write a query to list all employees ordered by salary in descending order. Show name and salary.',
    difficulty: 'easy',
    topic: 'ORDER BY',
    tags: ['ORDER BY', 'sorting'],
    schemaSetupSQL: `CREATE TABLE employees (id INT, name VARCHAR(100), salary DECIMAL(10,2));
INSERT INTO employees VALUES (1, 'Alice', 120000);
INSERT INTO employees VALUES (2, 'Bob', 95000);
INSERT INTO employees VALUES (3, 'Charlie', 110000);
INSERT INTO employees VALUES (4, 'Diana', 85000);
INSERT INTO employees VALUES (5, 'Eve', 105000);`,
    sampleTestCases: [
      {
        inputStateSQL: '',
        expectedOutputRows: [
          { name: 'Alice', salary: 120000 },
          { name: 'Charlie', salary: 110000 },
          { name: 'Eve', salary: 105000 },
          { name: 'Bob', salary: 95000 },
          { name: 'Diana', salary: 85000 },
        ],
      },
    ],
    hiddenTestCases: [
      {
        inputStateSQL: `INSERT INTO employees VALUES (6, 'Frank', 130000);`,
        expectedOutputRows: [
          { name: 'Frank', salary: 130000 },
          { name: 'Alice', salary: 120000 },
          { name: 'Charlie', salary: 110000 },
          { name: 'Eve', salary: 105000 },
          { name: 'Bob', salary: 95000 },
          { name: 'Diana', salary: 85000 },
        ],
      },
    ],
    referenceSolutionSQL: 'SELECT name, salary FROM employees ORDER BY salary DESC;',
  },
  {
    title: 'Count Employees per Department',
    description: 'Write a query to count the number of employees in each department. Show department name and employee count.',
    difficulty: 'easy',
    topic: 'GROUP BY',
    tags: ['GROUP BY', 'aggregation', 'COUNT'],
    schemaSetupSQL: `CREATE TABLE employees (id INT, name VARCHAR(100), department VARCHAR(100));
INSERT INTO employees VALUES (1, 'Alice', 'Engineering');
INSERT INTO employees VALUES (2, 'Bob', 'Marketing');
INSERT INTO employees VALUES (3, 'Charlie', 'Engineering');
INSERT INTO employees VALUES (4, 'Diana', 'Sales');
INSERT INTO employees VALUES (5, 'Eve', 'Marketing');
INSERT INTO employees VALUES (6, 'Frank', 'Engineering');`,
    sampleTestCases: [
      {
        inputStateSQL: '',
        expectedOutputRows: [
          { department: 'Engineering', count: 3 },
          { department: 'Marketing', count: 2 },
          { department: 'Sales', count: 1 },
        ],
      },
    ],
    hiddenTestCases: [
      {
        inputStateSQL: `INSERT INTO employees VALUES (7, 'Grace', 'Marketing');`,
        expectedOutputRows: [
          { department: 'Engineering', count: 3 },
          { department: 'Marketing', count: 3 },
          { department: 'Sales', count: 1 },
        ],
      },
    ],
    referenceSolutionSQL: 'SELECT department, COUNT(*) as count FROM employees GROUP BY department;',
  },
  {
    title: 'Average Salary by Department',
    description: 'Write a query to find the average salary for each department. Show department and avg_salary rounded to 2 decimal places.',
    difficulty: 'easy',
    topic: 'GROUP BY with Aggregation',
    tags: ['GROUP BY', 'AVG', 'ROUND'],
    schemaSetupSQL: `CREATE TABLE employees (id INT, name VARCHAR(100), department VARCHAR(100), salary DECIMAL(10,2));
INSERT INTO employees VALUES (1, 'Alice', 'Engineering', 120000);
INSERT INTO employees VALUES (2, 'Bob', 'Marketing', 95000);
INSERT INTO employees VALUES (3, 'Charlie', 'Engineering', 110000);
INSERT INTO employees VALUES (4, 'Diana', 'Sales', 85000);
INSERT INTO employees VALUES (5, 'Eve', 'Marketing', 105000);`,
    sampleTestCases: [
      {
        inputStateSQL: '',
        expectedOutputRows: [
          { department: 'Engineering', avg_salary: 115000.00 },
          { department: 'Marketing', avg_salary: 100000.00 },
          { department: 'Sales', avg_salary: 85000.00 },
        ],
      },
    ],
    hiddenTestCases: [
      {
        inputStateSQL: `INSERT INTO employees VALUES (6, 'Frank', 'Engineering', 130000);`,
        expectedOutputRows: [
          { department: 'Engineering', avg_salary: 120000.00 },
          { department: 'Marketing', avg_salary: 100000.00 },
          { department: 'Sales', avg_salary: 85000.00 },
        ],
      },
    ],
    referenceSolutionSQL: "SELECT department, ROUND(AVG(salary), 2) as avg_salary FROM employees GROUP BY department;",
  },
  {
    title: 'Find Highest Paid Employee',
    description: 'Write a query to find the employee(s) with the highest salary. Show name and salary.',
    difficulty: 'easy',
    topic: 'Subquery',
    tags: ['subquery', 'MAX'],
    schemaSetupSQL: `CREATE TABLE employees (id INT, name VARCHAR(100), salary DECIMAL(10,2));
INSERT INTO employees VALUES (1, 'Alice', 120000);
INSERT INTO employees VALUES (2, 'Bob', 95000);
INSERT INTO employees VALUES (3, 'Charlie', 110000);
INSERT INTO employees VALUES (4, 'Diana', 85000);
INSERT INTO employees VALUES (5, 'Eve', 105000);`,
    sampleTestCases: [
      {
        inputStateSQL: '',
        expectedOutputRows: [
          { name: 'Alice', salary: 120000 },
        ],
      },
    ],
    hiddenTestCases: [
      {
        inputStateSQL: `UPDATE employees SET salary = 130000 WHERE name = 'Charlie';`,
        expectedOutputRows: [
          { name: 'Charlie', salary: 130000 },
        ],
      },
    ],
    referenceSolutionSQL: 'SELECT name, salary FROM employees WHERE salary = (SELECT MAX(salary) FROM employees);',
  },
  {
    title: 'Simple INNER JOIN',
    description: 'Write a query to join employees with their departments. Show employee name, department name, and location.',
    difficulty: 'medium',
    topic: 'JOINs',
    tags: ['JOIN', 'INNER JOIN'],
    schemaSetupSQL: `CREATE TABLE departments (id INT, dept_name VARCHAR(100), location VARCHAR(100));
INSERT INTO departments VALUES (1, 'Engineering', 'Building A');
INSERT INTO departments VALUES (2, 'Marketing', 'Building B');
INSERT INTO departments VALUES (3, 'Sales', 'Building C');
CREATE TABLE employees (id INT, name VARCHAR(100), dept_id INT);
INSERT INTO employees VALUES (1, 'Alice', 1);
INSERT INTO employees VALUES (2, 'Bob', 2);
INSERT INTO employees VALUES (3, 'Charlie', 1);
INSERT INTO employees VALUES (4, 'Diana', 3);
INSERT INTO employees VALUES (5, 'Eve', 2);`,
    sampleTestCases: [
      {
        inputStateSQL: '',
        expectedOutputRows: [
          { name: 'Alice', dept_name: 'Engineering', location: 'Building A' },
          { name: 'Bob', dept_name: 'Marketing', location: 'Building B' },
          { name: 'Charlie', dept_name: 'Engineering', location: 'Building A' },
          { name: 'Diana', dept_name: 'Sales', location: 'Building C' },
          { name: 'Eve', dept_name: 'Marketing', location: 'Building B' },
        ],
      },
    ],
    hiddenTestCases: [
      {
        inputStateSQL: `INSERT INTO employees VALUES (6, 'Frank', 1);`,
        expectedOutputRows: [
          { name: 'Alice', dept_name: 'Engineering', location: 'Building A' },
          { name: 'Bob', dept_name: 'Marketing', location: 'Building B' },
          { name: 'Charlie', dept_name: 'Engineering', location: 'Building A' },
          { name: 'Diana', dept_name: 'Sales', location: 'Building C' },
          { name: 'Eve', dept_name: 'Marketing', location: 'Building B' },
          { name: 'Frank', dept_name: 'Engineering', location: 'Building A' },
        ],
      },
    ],
    referenceSolutionSQL: 'SELECT e.name, d.dept_name, d.location FROM employees e INNER JOIN departments d ON e.dept_id = d.id;',
  },
  {
    title: 'LEFT JOIN with NULL Handling',
    description: 'Write a query to show all employees and their orders. Include employees who have no orders. Show employee name, order_id, and amount.',
    difficulty: 'medium',
    topic: 'LEFT JOIN',
    tags: ['LEFT JOIN', 'NULL'],
    schemaSetupSQL: `CREATE TABLE employees (id INT, name VARCHAR(100));
INSERT INTO employees VALUES (1, 'Alice');
INSERT INTO employees VALUES (2, 'Bob');
INSERT INTO employees VALUES (3, 'Charlie');
INSERT INTO employees VALUES (4, 'Diana');
CREATE TABLE orders (order_id INT, employee_id INT, amount DECIMAL(10,2));
INSERT INTO orders VALUES (101, 1, 500);
INSERT INTO orders VALUES (102, 1, 300);
INSERT INTO orders VALUES (103, 3, 700);`,
    sampleTestCases: [
      {
        inputStateSQL: '',
        expectedOutputRows: [
          { name: 'Alice', order_id: 101, amount: 500 },
          { name: 'Alice', order_id: 102, amount: 300 },
          { name: 'Bob', order_id: null, amount: null },
          { name: 'Charlie', order_id: 103, amount: 700 },
          { name: 'Diana', order_id: null, amount: null },
        ],
      },
    ],
    hiddenTestCases: [
      {
        inputStateSQL: `INSERT INTO orders VALUES (104, 2, 200);`,
        expectedOutputRows: [
          { name: 'Alice', order_id: 101, amount: 500 },
          { name: 'Alice', order_id: 102, amount: 300 },
          { name: 'Bob', order_id: 104, amount: 200 },
          { name: 'Charlie', order_id: 103, amount: 700 },
          { name: 'Diana', order_id: null, amount: null },
        ],
      },
    ],
    referenceSolutionSQL: 'SELECT e.name, o.order_id, o.amount FROM employees e LEFT JOIN orders o ON e.id = o.employee_id;',
  },
  {
    title: 'Departments with Above Average Salaries',
    description: 'Write a query to find departments where the average salary is above the overall average salary.',
    difficulty: 'medium',
    topic: 'Subquery with GROUP BY',
    tags: ['subquery', 'HAVING', 'GROUP BY'],
    schemaSetupSQL: `CREATE TABLE employees (id INT, name VARCHAR(100), department VARCHAR(100), salary DECIMAL(10,2));
INSERT INTO employees VALUES (1, 'Alice', 'Engineering', 120000);
INSERT INTO employees VALUES (2, 'Bob', 'Marketing', 95000);
INSERT INTO employees VALUES (3, 'Charlie', 'Engineering', 110000);
INSERT INTO employees VALUES (4, 'Diana', 'Sales', 85000);
INSERT INTO employees VALUES (5, 'Eve', 'Marketing', 105000);
INSERT INTO employees VALUES (6, 'Frank', 'Engineering', 90000);`,
    sampleTestCases: [
      {
        inputStateSQL: '',
        expectedOutputRows: [
          { department: 'Engineering', avg_salary: 106666.67 },
          { department: 'Marketing', avg_salary: 100000.00 },
        ],
      },
    ],
    hiddenTestCases: [
      {
        inputStateSQL: `UPDATE employees SET salary = 70000 WHERE name = 'Frank';`,
        expectedOutputRows: [
          { department: 'Marketing', avg_salary: 100000.00 },
        ],
      },
    ],
    referenceSolutionSQL: "SELECT department, ROUND(AVG(salary), 2) as avg_salary FROM employees GROUP BY department HAVING AVG(salary) > (SELECT AVG(salary) FROM employees);",
  },
  {
    title: 'Rank Employees by Salary',
    description: 'Write a query to rank employees by salary within each department using a window function. Show name, department, salary, and salary_rank.',
    difficulty: 'hard',
    topic: 'Window Functions',
    tags: ['RANK', 'window function', 'PARTITION BY'],
    schemaSetupSQL: `CREATE TABLE employees (id INT, name VARCHAR(100), department VARCHAR(100), salary DECIMAL(10,2));
INSERT INTO employees VALUES (1, 'Alice', 'Engineering', 120000);
INSERT INTO employees VALUES (2, 'Bob', 'Marketing', 95000);
INSERT INTO employees VALUES (3, 'Charlie', 'Engineering', 110000);
INSERT INTO employees VALUES (4, 'Diana', 'Sales', 85000);
INSERT INTO employees VALUES (5, 'Eve', 'Marketing', 105000);
INSERT INTO employees VALUES (6, 'Frank', 'Engineering', 130000);`,
    sampleTestCases: [
      {
        inputStateSQL: '',
        expectedOutputRows: [
          { name: 'Frank', department: 'Engineering', salary: 130000, salary_rank: 1 },
          { name: 'Alice', department: 'Engineering', salary: 120000, salary_rank: 2 },
          { name: 'Charlie', department: 'Engineering', salary: 110000, salary_rank: 3 },
          { name: 'Eve', department: 'Marketing', salary: 105000, salary_rank: 1 },
          { name: 'Bob', department: 'Marketing', salary: 95000, salary_rank: 2 },
          { name: 'Diana', department: 'Sales', salary: 85000, salary_rank: 1 },
        ],
      },
    ],
    hiddenTestCases: [
      {
        inputStateSQL: `INSERT INTO employees VALUES (7, 'Grace', 'Marketing', 110000);`,
        expectedOutputRows: [
          { name: 'Frank', department: 'Engineering', salary: 130000, salary_rank: 1 },
          { name: 'Alice', department: 'Engineering', salary: 120000, salary_rank: 2 },
          { name: 'Charlie', department: 'Engineering', salary: 110000, salary_rank: 3 },
          { name: 'Grace', department: 'Marketing', salary: 110000, salary_rank: 1 },
          { name: 'Eve', department: 'Marketing', salary: 105000, salary_rank: 2 },
          { name: 'Bob', department: 'Marketing', salary: 95000, salary_rank: 3 },
          { name: 'Diana', department: 'Sales', salary: 85000, salary_rank: 1 },
        ],
      },
    ],
    referenceSolutionSQL: 'SELECT name, department, salary, RANK() OVER (PARTITION BY department ORDER BY salary DESC) as salary_rank FROM employees;',
  },
  {
    title: 'Find Duplicate Emails',
    description: 'Write a query to find all email addresses that appear more than once in the users table. Show email and count.',
    difficulty: 'easy',
    topic: 'GROUP BY with HAVING',
    tags: ['GROUP BY', 'HAVING', 'duplicates'],
    schemaSetupSQL: `CREATE TABLE users (id INT, name VARCHAR(100), email VARCHAR(100));
INSERT INTO users VALUES (1, 'Alice', 'alice@example.com');
INSERT INTO users VALUES (2, 'Bob', 'bob@example.com');
INSERT INTO users VALUES (3, 'Charlie', 'alice@example.com');
INSERT INTO users VALUES (4, 'Diana', 'diana@example.com');
INSERT INTO users VALUES (5, 'Eve', 'bob@example.com');`,
    sampleTestCases: [
      {
        inputStateSQL: '',
        expectedOutputRows: [
          { email: 'alice@example.com', count: 2 },
          { email: 'bob@example.com', count: 2 },
        ],
      },
    ],
    hiddenTestCases: [
      {
        inputStateSQL: `INSERT INTO users VALUES (6, 'Frank', 'frank@example.com');`,
        expectedOutputRows: [
          { email: 'alice@example.com', count: 2 },
          { email: 'bob@example.com', count: 2 },
        ],
      },
    ],
    referenceSolutionSQL: 'SELECT email, COUNT(*) as count FROM users GROUP BY email HAVING COUNT(*) > 1;',
  },
  {
    title: 'Running Total of Sales',
    description: 'Write a query to calculate a running total of sales ordered by sale_date using a window function. Show sale_date, amount, and running_total.',
    difficulty: 'hard',
    topic: 'Window Functions - SUM OVER',
    tags: ['window function', 'SUM', 'running total'],
    schemaSetupSQL: `CREATE TABLE sales (id INT, sale_date DATE, amount DECIMAL(10,2));
INSERT INTO sales VALUES (1, '2024-01-01', 100);
INSERT INTO sales VALUES (2, '2024-01-02', 200);
INSERT INTO sales VALUES (3, '2024-01-03', 150);
INSERT INTO sales VALUES (4, '2024-01-04', 300);
INSERT INTO sales VALUES (5, '2024-01-05', 250);`,
    sampleTestCases: [
      {
        inputStateSQL: '',
        expectedOutputRows: [
          { sale_date: '2024-01-01', amount: 100, running_total: 100 },
          { sale_date: '2024-01-02', amount: 200, running_total: 300 },
          { sale_date: '2024-01-03', amount: 150, running_total: 450 },
          { sale_date: '2024-01-04', amount: 300, running_total: 750 },
          { sale_date: '2024-01-05', amount: 250, running_total: 1000 },
        ],
      },
    ],
    hiddenTestCases: [
      {
        inputStateSQL: `INSERT INTO sales VALUES (6, '2024-01-06', 100);`,
        expectedOutputRows: [
          { sale_date: '2024-01-01', amount: 100, running_total: 100 },
          { sale_date: '2024-01-02', amount: 200, running_total: 300 },
          { sale_date: '2024-01-03', amount: 150, running_total: 450 },
          { sale_date: '2024-01-04', amount: 300, running_total: 750 },
          { sale_date: '2024-01-05', amount: 250, running_total: 1000 },
          { sale_date: '2024-01-06', amount: 100, running_total: 1100 },
        ],
      },
    ],
    referenceSolutionSQL: 'SELECT sale_date, amount, SUM(amount) OVER (ORDER BY sale_date) as running_total FROM sales;',
  },
  {
    title: 'Nth Highest Salary',
    description: 'Write a query to find the employee with the 2nd highest salary. Show name and salary.',
    difficulty: 'medium',
    topic: 'Subquery with LIMIT/OFFSET',
    tags: ['subquery', 'LIMIT', 'OFFSET'],
    schemaSetupSQL: `CREATE TABLE employees (id INT, name VARCHAR(100), salary DECIMAL(10,2));
INSERT INTO employees VALUES (1, 'Alice', 120000);
INSERT INTO employees VALUES (2, 'Bob', 95000);
INSERT INTO employees VALUES (3, 'Charlie', 110000);
INSERT INTO employees VALUES (4, 'Diana', 85000);
INSERT INTO employees VALUES (5, 'Eve', 105000);`,
    sampleTestCases: [
      {
        inputStateSQL: '',
        expectedOutputRows: [
          { name: 'Charlie', salary: 110000 },
        ],
      },
    ],
    hiddenTestCases: [
      {
        inputStateSQL: `INSERT INTO employees VALUES (6, 'Frank', 130000);`,
        expectedOutputRows: [
          { name: 'Alice', salary: 120000 },
        ],
      },
    ],
    referenceSolutionSQL: 'SELECT name, salary FROM employees ORDER BY salary DESC LIMIT 1 OFFSET 1;',
  },
  {
    title: 'Self JOIN - Find Managers',
    description: 'Write a query to find employees who earn more than their managers. Show employee name, employee_salary, manager_name, manager_salary. Assume manager_id column references id in same table.',
    difficulty: 'hard',
    topic: 'Self JOIN',
    tags: ['self join', 'JOIN'],
    schemaSetupSQL: `CREATE TABLE employees (id INT, name VARCHAR(100), salary DECIMAL(10,2), manager_id INT);
INSERT INTO employees VALUES (1, 'Alice', 150000, NULL);
INSERT INTO employees VALUES (2, 'Bob', 110000, 1);
INSERT INTO employees VALUES (3, 'Charlie', 120000, 1);
INSERT INTO employees VALUES (4, 'Diana', 90000, 2);
INSERT INTO employees VALUES (5, 'Eve', 100000, 2);`,
    sampleTestCases: [
      {
        inputStateSQL: '',
        expectedOutputRows: [
          { employee: 'Charlie', employee_salary: 120000, manager: 'Alice', manager_salary: 150000 },
        ],
      },
    ],
    hiddenTestCases: [
      {
        inputStateSQL: `UPDATE employees SET salary = 160000 WHERE name = 'Bob';`,
        expectedOutputRows: [
          { employee: 'Bob', employee_salary: 160000, manager: 'Alice', manager_salary: 150000 },
          { employee: 'Charlie', employee_salary: 120000, manager: 'Alice', manager_salary: 150000 },
        ],
      },
    ],
    referenceSolutionSQL: "SELECT e.name as employee, e.salary as employee_salary, m.name as manager, m.salary as manager_salary FROM employees e INNER JOIN employees m ON e.manager_id = m.id WHERE e.salary > m.salary;",
  },
  {
    title: 'Product Sales Analysis',
    description: 'Write a query to find total sales amount for each product category using JOIN and GROUP BY. Show category and total_sales.',
    difficulty: 'medium',
    topic: 'Multi-table JOIN with Aggregation',
    tags: ['JOIN', 'GROUP BY', 'SUM'],
    schemaSetupSQL: `CREATE TABLE products (id INT, name VARCHAR(100), category VARCHAR(100), price DECIMAL(10,2));
INSERT INTO products VALUES (1, 'Laptop', 'Electronics', 1200);
INSERT INTO products VALUES (2, 'Phone', 'Electronics', 800);
INSERT INTO products VALUES (3, 'Desk', 'Furniture', 400);
INSERT INTO products VALUES (4, 'Chair', 'Furniture', 200);
CREATE TABLE sales (id INT, product_id INT, quantity INT);
INSERT INTO sales VALUES (1, 1, 5);
INSERT INTO sales VALUES (2, 2, 10);
INSERT INTO sales VALUES (3, 3, 3);
INSERT INTO sales VALUES (4, 4, 8);`,
    sampleTestCases: [
      {
        inputStateSQL: '',
        expectedOutputRows: [
          { category: 'Electronics', total_sales: 14000 },
          { category: 'Furniture', total_sales: 2800 },
        ],
      },
    ],
    hiddenTestCases: [
      {
        inputStateSQL: `INSERT INTO sales VALUES (5, 1, 3);`,
        expectedOutputRows: [
          { category: 'Electronics', total_sales: 17600 },
          { category: 'Furniture', total_sales: 2800 },
        ],
      },
    ],
    referenceSolutionSQL: 'SELECT p.category, SUM(p.price * s.quantity) as total_sales FROM products p INNER JOIN sales s ON p.id = s.product_id GROUP BY p.category;',
  },
  {
    title: 'Dense Rank for Scores',
    description: 'Write a query to rank student scores using DENSE_RANK. Show name, score, and dense_rank. Students with equal scores should get the same rank.',
    difficulty: 'hard',
    topic: 'DENSE_RANK',
    tags: ['DENSE_RANK', 'window function'],
    schemaSetupSQL: `CREATE TABLE students (id INT, name VARCHAR(100), score INT);
INSERT INTO students VALUES (1, 'Alice', 95);
INSERT INTO students VALUES (2, 'Bob', 85);
INSERT INTO students VALUES (3, 'Charlie', 95);
INSERT INTO students VALUES (4, 'Diana', 75);
INSERT INTO students VALUES (5, 'Eve', 85);
INSERT INTO students VALUES (6, 'Frank', 90);`,
    sampleTestCases: [
      {
        inputStateSQL: '',
        expectedOutputRows: [
          { name: 'Alice', score: 95, dense_rank: 1 },
          { name: 'Charlie', score: 95, dense_rank: 1 },
          { name: 'Frank', score: 90, dense_rank: 2 },
          { name: 'Bob', score: 85, dense_rank: 3 },
          { name: 'Eve', score: 85, dense_rank: 3 },
          { name: 'Diana', score: 75, dense_rank: 4 },
        ],
      },
    ],
    hiddenTestCases: [
      {
        inputStateSQL: `INSERT INTO students VALUES (7, 'Grace', 90);`,
        expectedOutputRows: [
          { name: 'Alice', score: 95, dense_rank: 1 },
          { name: 'Charlie', score: 95, dense_rank: 1 },
          { name: 'Frank', score: 90, dense_rank: 2 },
          { name: 'Grace', score: 90, dense_rank: 2 },
          { name: 'Bob', score: 85, dense_rank: 3 },
          { name: 'Eve', score: 85, dense_rank: 3 },
          { name: 'Diana', score: 75, dense_rank: 4 },
        ],
      },
    ],
    referenceSolutionSQL: 'SELECT name, score, DENSE_RANK() OVER (ORDER BY score DESC) as dense_rank FROM students;',
  },
  {
    title: 'First and Last Order per Customer',
    description: 'Write a query using window functions to find the first and last order date for each customer. Show customer_id, first_order_date, last_order_date.',
    difficulty: 'hard',
    topic: 'Window Functions - FIRST_VALUE LAST_VALUE',
    tags: ['FIRST_VALUE', 'LAST_VALUE', 'window function'],
    schemaSetupSQL: `CREATE TABLE orders (order_id INT, customer_id INT, order_date DATE, amount DECIMAL(10,2));
INSERT INTO orders VALUES (1, 1, '2024-01-05', 100);
INSERT INTO orders VALUES (2, 1, '2024-02-10', 200);
INSERT INTO orders VALUES (3, 2, '2024-01-15', 150);
INSERT INTO orders VALUES (4, 2, '2024-03-20', 300);
INSERT INTO orders VALUES (5, 1, '2024-04-01', 250);
INSERT INTO orders VALUES (6, 3, '2024-02-01', 400);`,
    sampleTestCases: [
      {
        inputStateSQL: '',
        expectedOutputRows: [
          { customer_id: 1, first_order_date: '2024-01-05', last_order_date: '2024-04-01' },
          { customer_id: 2, first_order_date: '2024-01-15', last_order_date: '2024-03-20' },
          { customer_id: 3, first_order_date: '2024-02-01', last_order_date: '2024-02-01' },
        ],
      },
    ],
    hiddenTestCases: [
      {
        inputStateSQL: `INSERT INTO orders VALUES (7, 3, '2024-05-10', 350);`,
        expectedOutputRows: [
          { customer_id: 1, first_order_date: '2024-01-05', last_order_date: '2024-04-01' },
          { customer_id: 2, first_order_date: '2024-01-15', last_order_date: '2024-03-20' },
          { customer_id: 3, first_order_date: '2024-02-01', last_order_date: '2024-05-10' },
        ],
      },
    ],
    referenceSolutionSQL: "SELECT DISTINCT customer_id, FIRST_VALUE(order_date) OVER (PARTITION BY customer_id ORDER BY order_date) as first_order_date, LAST_VALUE(order_date) OVER (PARTITION BY customer_id ORDER BY order_date ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as last_order_date FROM orders;",
  },
  {
    title: 'Delete Duplicate Rows',
    description: 'Write a query to find duplicate names in the employees table (names appearing more than once). Show name and count.',
    difficulty: 'easy',
    topic: 'Duplicate Detection',
    tags: ['GROUP BY', 'HAVING', 'duplicates'],
    schemaSetupSQL: `CREATE TABLE employees (id INT, name VARCHAR(100));
INSERT INTO employees VALUES (1, 'Alice');
INSERT INTO employees VALUES (2, 'Bob');
INSERT INTO employees VALUES (3, 'Alice');
INSERT INTO employees VALUES (4, 'Charlie');
INSERT INTO employees VALUES (5, 'Bob');
INSERT INTO employees VALUES (6, 'Diana');`,
    sampleTestCases: [
      {
        inputStateSQL: '',
        expectedOutputRows: [
          { name: 'Alice', count: 2 },
          { name: 'Bob', count: 2 },
        ],
      },
    ],
    hiddenTestCases: [
      {
        inputStateSQL: `INSERT INTO employees VALUES (7, 'Alice');`,
        expectedOutputRows: [
          { name: 'Alice', count: 3 },
          { name: 'Bob', count: 2 },
        ],
      },
    ],
    referenceSolutionSQL: 'SELECT name, COUNT(*) as count FROM employees GROUP BY name HAVING COUNT(*) > 1;',
  },
  {
    title: 'Date Difference Calculation',
    description: 'Write a query to calculate the number of days between each order and the previous order for each customer. Show customer_id, order_date, and days_since_last_order.',
    difficulty: 'hard',
    topic: 'Window Functions with Date',
    tags: ['LAG', 'window function', 'date'],
    schemaSetupSQL: `CREATE TABLE orders (order_id INT, customer_id INT, order_date DATE);
INSERT INTO orders VALUES (1, 1, '2024-01-05');
INSERT INTO orders VALUES (2, 1, '2024-02-10');
INSERT INTO orders VALUES (3, 2, '2024-01-15');
INSERT INTO orders VALUES (4, 2, '2024-03-20');
INSERT INTO orders VALUES (5, 1, '2024-04-01');`,
    sampleTestCases: [
      {
        inputStateSQL: '',
        expectedOutputRows: [
          { customer_id: 1, order_date: '2024-01-05', days_since_last_order: null },
          { customer_id: 1, order_date: '2024-02-10', days_since_last_order: 36 },
          { customer_id: 1, order_date: '2024-04-01', days_since_last_order: 51 },
          { customer_id: 2, order_date: '2024-01-15', days_since_last_order: null },
          { customer_id: 2, order_date: '2024-03-20', days_since_last_order: 65 },
        ],
      },
    ],
    hiddenTestCases: [
      {
        inputStateSQL: `INSERT INTO orders VALUES (6, 2, '2024-06-01');`,
        expectedOutputRows: [
          { customer_id: 1, order_date: '2024-01-05', days_since_last_order: null },
          { customer_id: 1, order_date: '2024-02-10', days_since_last_order: 36 },
          { customer_id: 1, order_date: '2024-04-01', days_since_last_order: 51 },
          { customer_id: 2, order_date: '2024-01-15', days_since_last_order: null },
          { customer_id: 2, order_date: '2024-03-20', days_since_last_order: 65 },
          { customer_id: 2, order_date: '2024-06-01', days_since_last_order: 73 },
        ],
      },
    ],
    referenceSolutionSQL: "SELECT customer_id, order_date, JULIANDAY(order_date) - JULIANDAY(LAG(order_date) OVER (PARTITION BY customer_id ORDER BY order_date)) as days_since_last_order FROM orders;",
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/prepagent');
    console.log('Connected to MongoDB');
    await SQLProblem.deleteMany({});
    
    // Generate slugs before inserting
    const problemsWithSlugs = problems.map(p => {
      const slug = p.title.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-');
      return { ...p, slug };
    });
    
    const created = await SQLProblem.insertMany(problemsWithSlugs);
    console.log(`Seeded ${created.length} SQL problems`);
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
