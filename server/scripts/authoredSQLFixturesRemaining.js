'use strict';
/**
 * Authored execution fixtures for the REMAINING placeholder SQL problems —
 * the 32 active docs still carrying the test_table stub after
 * migrateAuthoredSQLFixtures.js, plus the inactive review sentinel's
 * description repair.
 *
 * Ground truth: each problem's existing referenceSolutionSQL (kept verbatim
 * except three documented sandbox/output repairs):
 *   - filtering-window-results: alias-in-WHERE is invalid SQL -> CTE rewrite
 *     (semantically identical top-10 filter).
 *   - right-join / full-outer-join: unaliased duplicate `name` columns collapse
 *     in this pipeline's row shaping -> explicit output aliases, which the
 *     descriptions also document as the required output contract.
 *
 * Expected rows are NOT hardcoded here: scripts/backfillRemainingSQLFixtures.js
 * derives them by executing the reference against schemaSetupSQL (and
 * schemaSetupSQL + hidden inputStateSQL) twice for determinism before writing.
 */
module.exports = [
  {
    title: 'EXISTS Operator',
    slug: 'exists-operator',
    description: 'Find the names of employees who belong to a department whose budget exceeds 1000000. Express the department check as a correlated EXISTS subquery over the departments table.',
    schemaSetupSQL: `CREATE TABLE employees (id INT, name VARCHAR(100), department_id INT);
CREATE TABLE departments (id INT, name VARCHAR(100), budget INT);
INSERT INTO departments VALUES (1, 'Engineering', 2000000), (2, 'Sales', 900000), (3, 'HR', 400000);
INSERT INTO employees VALUES (1, 'Alice', 1), (2, 'Bob', 2), (3, 'Charlie', 1), (4, 'Diana', 3);`,
    referenceSolutionSQL: 'SELECT name FROM employees e WHERE EXISTS (SELECT 1 FROM departments d WHERE d.id = e.department_id AND d.budget > 1000000);',
    hiddenInputStateSQL: "INSERT INTO departments VALUES (4, 'Research', 1500000);\nINSERT INTO employees VALUES (5, 'Eve', 4);",
  },
  {
    title: 'Window Frame',
    slug: 'window-frame',
    description: 'For every employee, compute a running sum of salary over rows ordered by hire date, framed as the previous row, the current row, and the next row (ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING). Return name, salary, and window_sum.',
    schemaSetupSQL: `CREATE TABLE employees (id INT, name VARCHAR(100), salary INT, hire_date DATE);
INSERT INTO employees VALUES (1, 'Alice', 120000, '2020-01-15'), (2, 'Bob', 95000, '2021-03-10'), (3, 'Charlie', 110000, '2019-06-22'), (4, 'Diana', 85000, '2022-11-01'), (5, 'Eve', 105000, '2020-09-14');`,
    referenceSolutionSQL: 'SELECT name, salary, SUM(salary) OVER (ORDER BY hire_date ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING) AS window_sum FROM employees;',
    hiddenInputStateSQL: "INSERT INTO employees VALUES (6, 'Frank', 130000, '2018-02-01');",
  },
  {
    title: 'Pivot Table',
    slug: 'pivot-table',
    description: 'Pivot the employees data so each department shows its total salary split by gender: one column for male salaries and one for female salaries. Return department, male_sal, and female_sal.',
    schemaSetupSQL: `CREATE TABLE employees (id INT, name VARCHAR(100), salary INT, department VARCHAR(100), gender VARCHAR(10));
INSERT INTO employees VALUES (1, 'Alice', 120000, 'Engineering', 'Female'), (2, 'Bob', 95000, 'Sales', 'Male'), (3, 'Charlie', 110000, 'Engineering', 'Male'), (4, 'Diana', 85000, 'HR', 'Female'), (5, 'Eve', 105000, 'Sales', 'Female');`,
    referenceSolutionSQL: "SELECT department, SUM(CASE WHEN gender = 'Male' THEN salary ELSE 0 END) AS male_sal, SUM(CASE WHEN gender = 'Female' THEN salary ELSE 0 END) AS female_sal FROM employees GROUP BY department;",
    hiddenInputStateSQL: "INSERT INTO employees VALUES (6, 'Frank', 78000, 'HR', 'Male');",
  },
  {
    title: 'Pattern Matching',
    slug: 'pattern-matching',
    description: 'Return the names of all users whose email address ends with @gmail.com, using the LIKE operator with a leading wildcard.',
    schemaSetupSQL: `CREATE TABLE users (id INT, name VARCHAR(100), email VARCHAR(100));
INSERT INTO users VALUES (1, 'Ann', 'ann@gmail.com'), (2, 'Ben', 'ben@yahoo.com'), (3, 'Cara', 'cara@gmail.com'), (4, 'Dan', 'dan@hotmail.com');`,
    referenceSolutionSQL: "SELECT name FROM users WHERE email LIKE '%@gmail.com';",
    hiddenInputStateSQL: "INSERT INTO users VALUES (5, 'Elle', 'elle@gmail.com');",
  },
  {
    title: 'NULL Values',
    slug: 'null-values',
    description: 'Return every employee name with their bonus, replacing NULL bonuses with 0 using COALESCE so the result never contains NULL.',
    schemaSetupSQL: `CREATE TABLE employees (id INT, name VARCHAR(100), bonus INT);
INSERT INTO employees VALUES (1, 'Alice', 5000), (2, 'Bob', NULL), (3, 'Charlie', 3000), (4, 'Diana', NULL), (5, 'Eve', 1500);`,
    referenceSolutionSQL: 'SELECT name, COALESCE(bonus, 0) AS bonus FROM employees;',
    hiddenInputStateSQL: "INSERT INTO employees VALUES (6, 'Frank', NULL);",
  },
  {
    title: 'Common Table Expressions',
    slug: 'common-table-expressions',
    description: 'Using a common table expression, compute total sales per department, then return only the departments whose total sales exceed 10000 together with that total.',
    schemaSetupSQL: `CREATE TABLE sales (id INT, department VARCHAR(100), amount INT);
INSERT INTO sales VALUES (1, 'Engineering', 7000), (2, 'Engineering', 5000), (3, 'Sales', 12000), (4, 'HR', 3000), (5, 'Sales', 1500);`,
    referenceSolutionSQL: 'WITH dept_sales AS (SELECT department, SUM(amount) AS total FROM sales GROUP BY department) SELECT department, total FROM dept_sales WHERE total > 10000;',
    hiddenInputStateSQL: "INSERT INTO sales VALUES (6, 'HR', 9000);",
  },
  {
    title: 'NOT IN Operator',
    slug: 'not-in-operator',
    description: 'Return the names of employees whose department is not HR. Compare department_id against the subquery of ids from departments where the name is HR, using NOT IN.',
    schemaSetupSQL: `CREATE TABLE employees (id INT, name VARCHAR(100), department_id INT);
CREATE TABLE departments (id INT, name VARCHAR(100));
INSERT INTO departments VALUES (1, 'Engineering'), (2, 'Sales'), (3, 'HR');
INSERT INTO employees VALUES (1, 'Alice', 1), (2, 'Bob', 2), (3, 'Diana', 3), (4, 'Frank', 4);`,
    referenceSolutionSQL: "SELECT name FROM employees WHERE department_id NOT IN (SELECT id FROM departments WHERE name = 'HR');",
    hiddenInputStateSQL: "INSERT INTO employees VALUES (5, 'Grace', 5);",
  },
  {
    title: 'Multiple JOINs',
    slug: 'multiple-joins',
    description: 'Join employees to departments on department_id and to projects on employee_id. Return each employee name with their department name and project name for every matching row.',
    schemaSetupSQL: `CREATE TABLE employees (id INT, name VARCHAR(100), department_id INT);
CREATE TABLE departments (id INT, name VARCHAR(100));
CREATE TABLE projects (id INT, name VARCHAR(100), employee_id INT);
INSERT INTO departments VALUES (1, 'Engineering'), (2, 'Sales');
INSERT INTO employees VALUES (1, 'Alice', 1), (2, 'Bob', 2), (3, 'Charlie', 1);
INSERT INTO projects VALUES (1, 'Apollo', 1), (2, 'Zeus', 2), (3, 'Hermes', 3);`,
    referenceSolutionSQL: 'SELECT e.name, d.name AS department, p.name AS project FROM employees e JOIN departments d ON e.department_id = d.id JOIN projects p ON e.id = p.employee_id;',
    hiddenInputStateSQL: "INSERT INTO projects VALUES (4, 'Artemis', 1);",
  },
  {
    title: 'Correlated Subquery',
    slug: 'correlated-subquery',
    description: 'Return name and salary for every employee whose salary is higher than the average salary of their own department, using a correlated subquery in the WHERE clause.',
    schemaSetupSQL: `CREATE TABLE employees (id INT, name VARCHAR(100), salary INT, department VARCHAR(100));
INSERT INTO employees VALUES (1, 'Alice', 120000, 'Engineering'), (2, 'Bob', 80000, 'Engineering'), (3, 'Charlie', 70000, 'Engineering'), (4, 'Diana', 90000, 'Sales'), (5, 'Eve', 110000, 'Sales');`,
    referenceSolutionSQL: 'SELECT name, salary FROM employees e1 WHERE salary > (SELECT AVG(salary) FROM employees e2 WHERE e2.department = e1.department);',
    hiddenInputStateSQL: "INSERT INTO employees VALUES (6, 'Frank', 60000, 'Sales');",
  },
  {
    title: 'IN Operator',
    slug: 'in-operator',
    description: 'Return the names of employees whose department_id is in the list 1, 2, or 3, using the IN operator.',
    schemaSetupSQL: `CREATE TABLE employees (id INT, name VARCHAR(100), department_id INT);
INSERT INTO employees VALUES (1, 'Alice', 1), (2, 'Bob', 2), (3, 'Diana', 3), (4, 'Grace', 4), (5, 'Henry', 5);`,
    referenceSolutionSQL: 'SELECT name FROM employees WHERE department_id IN (1, 2, 3);',
    hiddenInputStateSQL: "INSERT INTO employees VALUES (6, 'Ivy', 2);",
  },
  {
    title: 'Employees Above Average',
    slug: 'employees-above-average',
    description: 'Return the name and salary of every employee who earns more than the company-wide average salary, using a scalar subquery to compute that average.',
    schemaSetupSQL: `CREATE TABLE employees (id INT, name VARCHAR(100), salary INT);
INSERT INTO employees VALUES (1, 'Alice', 120000), (2, 'Bob', 95000), (3, 'Charlie', 70000), (4, 'Diana', 85000), (5, 'Eve', 60000);`,
    referenceSolutionSQL: 'SELECT name, salary FROM employees WHERE salary > (SELECT AVG(salary) FROM employees);',
    hiddenInputStateSQL: "INSERT INTO employees VALUES (6, 'Frank', 50000);",
  },
  {
    title: 'Range Queries',
    slug: 'range-queries',
    description: 'Return name and salary for employees whose salary falls between 50000 and 100000 inclusive, using the BETWEEN operator.',
    schemaSetupSQL: `CREATE TABLE employees (id INT, name VARCHAR(100), salary INT);
INSERT INTO employees VALUES (1, 'Alice', 120000), (2, 'Bob', 95000), (3, 'Charlie', 70000), (4, 'Diana', 45000), (5, 'Eve', 100000);`,
    referenceSolutionSQL: 'SELECT name, salary FROM employees WHERE salary BETWEEN 50000 AND 100000;',
    hiddenInputStateSQL: "INSERT INTO employees VALUES (6, 'Frank', 60000);",
  },
  {
    title: 'Percent Rank',
    slug: 'percent-rank',
    description: 'For each employee, compute the percentile rank of their salary among all employees with PERCENT_RANK. Return name, salary, and pct_rank.',
    schemaSetupSQL: `CREATE TABLE employees (id INT, name VARCHAR(100), salary INT);
INSERT INTO employees VALUES (1, 'Alice', 120000), (2, 'Bob', 95000), (3, 'Charlie', 70000), (4, 'Diana', 85000), (5, 'Eve', 60000);`,
    referenceSolutionSQL: 'SELECT name, salary, PERCENT_RANK() OVER (ORDER BY salary) AS pct_rank FROM employees;',
    hiddenInputStateSQL: "INSERT INTO employees VALUES (6, 'Frank', 50000);",
  },
  {
    title: 'Order By with ASC/DESC',
    slug: 'order-by-with-asc-desc',
    description: 'Return every employee name and salary sorted by salary from highest to lowest using ORDER BY salary DESC.',
    schemaSetupSQL: `CREATE TABLE employees (id INT, name VARCHAR(100), salary INT);
INSERT INTO employees VALUES (1, 'Alice', 120000), (2, 'Bob', 95000), (3, 'Charlie', 70000), (4, 'Diana', 85000), (5, 'Eve', 60000);`,
    referenceSolutionSQL: 'SELECT name, salary FROM employees ORDER BY salary DESC;',
    hiddenInputStateSQL: "INSERT INTO employees VALUES (6, 'Frank', 130000);",
  },
  {
    title: 'Lead and Lag',
    slug: 'lead-and-lag',
    description: 'For each employee ordered by salary, return name, salary, the previous salary with LAG, and the next salary with LEAD. Use prev_salary and next_salary as the output column names.',
    schemaSetupSQL: `CREATE TABLE employees (id INT, name VARCHAR(100), salary INT);
INSERT INTO employees VALUES (1, 'Alice', 120000), (2, 'Bob', 95000), (3, 'Charlie', 70000), (4, 'Diana', 85000), (5, 'Eve', 60000);`,
    referenceSolutionSQL: 'SELECT name, salary, LAG(salary) OVER (ORDER BY salary) AS prev_salary, LEAD(salary) OVER (ORDER BY salary) AS next_salary FROM employees;',
    hiddenInputStateSQL: "INSERT INTO employees VALUES (6, 'Frank', 50000);",
  },
  {
    title: 'Row Number',
    slug: 'row-number',
    description: 'Assign a row number to each employee within their department ordered from highest to lowest salary using ROW_NUMBER with PARTITION BY department. Return name, department, salary, and row_num.',
    schemaSetupSQL: `CREATE TABLE employees (id INT, name VARCHAR(100), salary INT, department VARCHAR(100));
INSERT INTO employees VALUES (1, 'Alice', 120000, 'Engineering'), (2, 'Bob', 95000, 'Sales'), (3, 'Charlie', 70000, 'Engineering'), (4, 'Diana', 85000, 'HR'), (5, 'Eve', 105000, 'Sales');`,
    referenceSolutionSQL: 'SELECT name, department, salary, ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) AS row_num FROM employees;',
    hiddenInputStateSQL: "INSERT INTO employees VALUES (6, 'Frank', 100000, 'Sales');",
  },
  {
    title: 'NTILE Function',
    slug: 'ntile-function',
    description: 'Split all employees into four quartiles by salary from highest to lowest using NTILE(4). Return name, salary, and quartile for each employee.',
    schemaSetupSQL: `CREATE TABLE employees (id INT, name VARCHAR(100), salary INT);
INSERT INTO employees VALUES (1, 'Alice', 120000), (2, 'Bob', 95000), (3, 'Charlie', 70000), (4, 'Diana', 85000), (5, 'Eve', 60000), (6, 'Frank', 130000);`,
    referenceSolutionSQL: 'SELECT name, salary, NTILE(4) OVER (ORDER BY salary DESC) AS quartile FROM employees;',
    hiddenInputStateSQL: "INSERT INTO employees VALUES (7, 'Grace', 55000);",
  },
  {
    title: 'RIGHT JOIN',
    slug: 'right-join',
    description: 'Return every department together with the name of an employee in that department using a RIGHT JOIN, so departments with no employees still appear with a NULL employee. Return the columns as employee_name and department_name.',
    schemaSetupSQL: `CREATE TABLE employees (id INT, name VARCHAR(100), department_id INT);
CREATE TABLE departments (id INT, name VARCHAR(100));
INSERT INTO departments VALUES (1, 'Engineering'), (2, 'Sales'), (3, 'Research');
INSERT INTO employees VALUES (1, 'Alice', 1), (2, 'Bob', 2), (3, 'Charlie', 1);`,
    referenceSolutionSQL: 'SELECT e.name AS employee_name, d.name AS department_name FROM employees e RIGHT JOIN departments d ON e.department_id = d.id;',
    hiddenInputStateSQL: "INSERT INTO departments VALUES (4, 'Legal');",
  },
  {
    title: 'Cross JOIN',
    slug: 'cross-join',
    description: 'Return the Cartesian product of employees and departments: every employee paired with every department. Return the columns as name and department.',
    schemaSetupSQL: `CREATE TABLE employees (id INT, name VARCHAR(100));
CREATE TABLE departments (id INT, name VARCHAR(100));
INSERT INTO employees VALUES (1, 'Alice'), (2, 'Bob'), (3, 'Charlie');
INSERT INTO departments VALUES (1, 'Engineering'), (2, 'Sales');`,
    referenceSolutionSQL: 'SELECT e.name, d.name AS department FROM employees e CROSS JOIN departments d;',
    hiddenInputStateSQL: "INSERT INTO departments VALUES (3, 'HR');",
  },
  {
    title: 'FULL OUTER JOIN',
    slug: 'full-outer-join',
    description: 'Return all employees paired with their department using a FULL OUTER JOIN, so employees without a department and departments without employees both appear with NULL on the missing side. Return the columns as employee_name and department_name.',
    schemaSetupSQL: `CREATE TABLE employees (id INT, name VARCHAR(100), department_id INT);
CREATE TABLE departments (id INT, name VARCHAR(100));
INSERT INTO departments VALUES (1, 'Engineering'), (2, 'Sales'), (3, 'Research');
INSERT INTO employees VALUES (1, 'Alice', 1), (2, 'Bob', 2), (3, 'Grace', NULL);`,
    referenceSolutionSQL: 'SELECT e.name AS employee_name, d.name AS department_name FROM employees e FULL OUTER JOIN departments d ON e.department_id = d.id;',
    hiddenInputStateSQL: "INSERT INTO employees VALUES (4, 'Henry', NULL);",
  },
  {
    title: 'Min Max Values',
    slug: 'min-max-values',
    description: 'Return the minimum and maximum salary across all employees as min_sal and max_sal in a single row.',
    schemaSetupSQL: `CREATE TABLE employees (id INT, name VARCHAR(100), salary INT);
INSERT INTO employees VALUES (1, 'Alice', 120000), (2, 'Bob', 95000), (3, 'Charlie', 70000), (4, 'Diana', 85000), (5, 'Eve', 60000);`,
    referenceSolutionSQL: 'SELECT MIN(salary) AS min_sal, MAX(salary) AS max_sal FROM employees;',
    hiddenInputStateSQL: "INSERT INTO employees VALUES (6, 'Frank', 130000);",
  },
  {
    title: 'Self JOIN',
    slug: 'self-join',
    description: 'Pair up employees who share the same department by self-joining the employees table on department, using id ordering so each pair appears once. Return emp1, emp2, and the first employee salary.',
    schemaSetupSQL: `CREATE TABLE employees (id INT, name VARCHAR(100), salary INT, department VARCHAR(100));
INSERT INTO employees VALUES (1, 'Alice', 120000, 'Engineering'), (2, 'Bob', 95000, 'Sales'), (3, 'Charlie', 70000, 'Engineering'), (4, 'Diana', 85000, 'HR'), (5, 'Eve', 105000, 'Sales');`,
    referenceSolutionSQL: 'SELECT e1.name AS emp1, e2.name AS emp2, e1.salary FROM employees e1 JOIN employees e2 ON e1.department = e2.department AND e1.id < e2.id;',
    hiddenInputStateSQL: "INSERT INTO employees VALUES (6, 'Frank', 78000, 'HR');",
  },
  {
    title: 'Conditional Aggregation',
    slug: 'conditional-aggregation',
    description: 'For each department, count how many employees earn more than 80000 as high_earners and how many earn 80000 or less as others, using conditional CASE expressions inside COUNT.',
    schemaSetupSQL: `CREATE TABLE employees (id INT, name VARCHAR(100), salary INT, department VARCHAR(100));
INSERT INTO employees VALUES (1, 'Alice', 120000, 'Engineering'), (2, 'Bob', 75000, 'Engineering'), (3, 'Charlie', 90000, 'Sales'), (4, 'Diana', 60000, 'Sales');`,
    referenceSolutionSQL: 'SELECT department, COUNT(CASE WHEN salary > 80000 THEN 1 END) AS high_earners, COUNT(CASE WHEN salary <= 80000 THEN 1 END) AS others FROM employees GROUP BY department;',
    hiddenInputStateSQL: "INSERT INTO employees VALUES (5, 'Eve', 95000, 'Engineering');",
  },
  {
    title: 'Subquery in FROM',
    slug: 'subquery-in-from',
    description: 'Compute the average salary per department by first deriving a subquery of department and salary columns in the FROM clause, then grouping the derived table by department. Return dept and avg_sal.',
    schemaSetupSQL: `CREATE TABLE employees (id INT, name VARCHAR(100), salary INT, department VARCHAR(100));
INSERT INTO employees VALUES (1, 'Alice', 120000, 'Engineering'), (2, 'Bob', 95000, 'Sales'), (3, 'Charlie', 70000, 'Engineering'), (4, 'Diana', 85000, 'HR');`,
    referenceSolutionSQL: 'SELECT dept, AVG(salary) AS avg_sal FROM (SELECT department AS dept, salary FROM employees) AS emp_dept GROUP BY dept;',
    hiddenInputStateSQL: "INSERT INTO employees VALUES (5, 'Eve', 55000, 'HR');",
  },
  {
    title: 'Recursive CTE',
    slug: 'recursive-cte',
    description: 'Build the management org chart with a recursive CTE: start from employees who have no manager at level 1 and recurse through manager_id links. Return id, name, manager_id, and level for every employee.',
    schemaSetupSQL: `CREATE TABLE employees (id INT, name VARCHAR(100), manager_id INT);
INSERT INTO employees VALUES (1, 'Alice', NULL), (2, 'Bob', 1), (3, 'Charlie', 1), (4, 'Diana', 2);`,
    referenceSolutionSQL: 'WITH RECURSIVE org_chart AS (SELECT id, name, manager_id, 1 AS level FROM employees WHERE manager_id IS NULL UNION ALL SELECT e.id, e.name, e.manager_id, oc.level + 1 FROM employees e JOIN org_chart oc ON e.manager_id = oc.id) SELECT * FROM org_chart;',
    hiddenInputStateSQL: "INSERT INTO employees VALUES (5, 'Eve', 3);",
  },
  {
    title: 'Filtering Window Results',
    slug: 'filtering-window-results',
    description: 'Number all employees by salary from highest to lowest with ROW_NUMBER, then keep only the top 10, which requires a CTE or subquery because window functions cannot be filtered in the same SELECT WHERE clause. Return name, salary, and rn.',
    schemaSetupSQL: `CREATE TABLE employees (id INT, name VARCHAR(100), salary INT);
INSERT INTO employees VALUES (1, 'Alice', 120000), (2, 'Bob', 95000), (3, 'Charlie', 70000), (4, 'Diana', 85000), (5, 'Eve', 60000), (6, 'Frank', 130000), (7, 'Grace', 55000), (8, 'Heidi', 110000), (9, 'Ivan', 45000), (10, 'Judy', 100000), (11, 'Mallory', 75000), (12, 'Niaj', 65000);`,
    referenceSolutionSQL: 'WITH ranked AS (SELECT name, salary, ROW_NUMBER() OVER (ORDER BY salary DESC) AS rn FROM employees) SELECT name, salary, rn FROM ranked WHERE rn <= 10;',
    hiddenInputStateSQL: "INSERT INTO employees VALUES (13, 'Olivia', 140000);",
  },
  {
    title: 'Multiple Conditions',
    slug: 'multiple-conditions',
    description: 'Return name and salary for employees who earn more than 80000 and work in the Engineering department, combining both predicates with AND.',
    schemaSetupSQL: `CREATE TABLE employees (id INT, name VARCHAR(100), salary INT, department VARCHAR(100));
INSERT INTO employees VALUES (1, 'Alice', 120000, 'Engineering'), (2, 'Bob', 75000, 'Sales'), (3, 'Charlie', 90000, 'Engineering'), (4, 'Diana', 85000, 'HR');`,
    referenceSolutionSQL: "SELECT name, salary FROM employees WHERE salary > 80000 AND department = 'Engineering';",
    hiddenInputStateSQL: "INSERT INTO employees VALUES (5, 'Eve', 95000, 'Engineering');",
  },
  {
    title: 'Order By Multiple Columns',
    slug: 'order-by-multiple-columns',
    description: 'Return name, department, and salary for all employees sorted first by department alphabetically and then by salary descending within each department.',
    schemaSetupSQL: `CREATE TABLE employees (id INT, name VARCHAR(100), salary INT, department VARCHAR(100));
INSERT INTO employees VALUES (1, 'Alice', 120000, 'Engineering'), (2, 'Bob', 95000, 'Sales'), (3, 'Charlie', 70000, 'Engineering'), (4, 'Diana', 85000, 'HR'), (5, 'Eve', 105000, 'Sales');`,
    referenceSolutionSQL: 'SELECT name, department, salary FROM employees ORDER BY department ASC, salary DESC;',
    hiddenInputStateSQL: "INSERT INTO employees VALUES (6, 'Frank', 80000, 'HR');",
  },
  {
    title: 'Sum of Sales',
    slug: 'sum-of-sales',
    description: 'Return total_sales, the sum of the amount column across every row in the orders table.',
    schemaSetupSQL: `CREATE TABLE orders (id INT, amount INT);
INSERT INTO orders VALUES (1, 250), (2, 400), (3, 150);`,
    referenceSolutionSQL: 'SELECT SUM(amount) AS total_sales FROM orders;',
    hiddenInputStateSQL: 'INSERT INTO orders VALUES (4, 300);',
  },
  {
    title: 'Cumulative Distribution',
    slug: 'cumulative-distribution',
    description: 'For each employee, compute the cumulative distribution of their salary in descending order with CUME_DIST. Return name, salary, and cum_dist.',
    schemaSetupSQL: `CREATE TABLE employees (id INT, name VARCHAR(100), salary INT);
INSERT INTO employees VALUES (1, 'Alice', 120000), (2, 'Bob', 95000), (3, 'Charlie', 70000), (4, 'Diana', 85000), (5, 'Eve', 60000);`,
    referenceSolutionSQL: 'SELECT name, salary, CUME_DIST() OVER (ORDER BY salary DESC) AS cum_dist FROM employees;',
    hiddenInputStateSQL: "INSERT INTO employees VALUES (6, 'Frank', 50000);",
  },
  {
    title: 'Distinct Values',
    slug: 'distinct-values',
    description: 'Return every distinct department value in the employees data exactly once, using SELECT DISTINCT.',
    schemaSetupSQL: `CREATE TABLE employees (id INT, name VARCHAR(100), department VARCHAR(100));
INSERT INTO employees VALUES (1, 'Alice', 'Engineering'), (2, 'Bob', 'Sales'), (3, 'Charlie', 'Engineering'), (4, 'Diana', 'HR'), (5, 'Eve', 'Sales');`,
    referenceSolutionSQL: 'SELECT DISTINCT department FROM employees;',
    hiddenInputStateSQL: "INSERT INTO employees VALUES (6, 'Frank', 'Marketing');",
  },
  {
    title: 'Group By with Having',
    slug: 'group-by-with-having',
    description: 'Group employees by department and return only the departments whose average salary is greater than 60000, along with that average as avg_sal, using HAVING.',
    schemaSetupSQL: `CREATE TABLE employees (id INT, name VARCHAR(100), salary INT, department VARCHAR(100));
INSERT INTO employees VALUES (1, 'Alice', 90000, 'Engineering'), (2, 'Bob', 70000, 'Engineering'), (3, 'Charlie', 50000, 'HR'), (4, 'Diana', 40000, 'HR');`,
    referenceSolutionSQL: 'SELECT department, AVG(salary) AS avg_sal FROM employees GROUP BY department HAVING AVG(salary) > 60000;',
    hiddenInputStateSQL: "INSERT INTO employees VALUES (5, 'Eve', 100000, 'HR');",
  },
  {
    title: 'SQL Problem Needs Review',
    slug: 'sql-problem-needs-review',
    descriptionOnly: true,
    description: 'Inactive workflow record used to exercise the content review queue: it stays out of the active bank while reviewers verify promotion and repair steps on a minimal document.',
  },
];
