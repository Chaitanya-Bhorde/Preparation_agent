const initSqlJs = require('sql.js');

const seedData = {
  employees: [
    { id: 1, name: 'Alice', department: 'Engineering', salary: 120000 },
    { id: 2, name: 'Bob', department: 'Engineering', salary: 90000 },
    { id: 3, name: 'Charlie', department: 'Marketing', salary: 80000 },
    { id: 4, name: 'Diana', department: 'Marketing', salary: 95000 },
    { id: 5, name: 'Eve', department: 'Engineering', salary: 110000 },
    { id: 6, name: 'Frank', department: 'Sales', salary: 75000 },
  ],
  orders: [
    { order_id: 1, customer_id: 1, order_date: '2024-01-01', amount: 100 },
    { order_id: 2, customer_id: 1, order_date: '2024-01-15', amount: 200 },
    { order_id: 3, customer_id: 2, order_date: '2024-01-10', amount: 150 },
    { order_id: 4, customer_id: 2, order_date: '2024-02-01', amount: 300 },
    { order_id: 5, customer_id: 1, order_date: '2024-03-01', amount: 250 },
  ],
  products: [
    { product_id: 1, name: 'Laptop', category: 'Electronics', price: 1200 },
    { product_id: 2, name: 'Phone', category: 'Electronics', price: 800 },
    { product_id: 3, name: 'Desk', category: 'Furniture', price: 400 },
    { product_id: 4, name: 'Chair', category: 'Furniture', price: 200 },
  ],
  sales: [
    { sale_id: 1, product_id: 1, quantity: 2, sale_date: '2024-01-05' },
    { sale_id: 2, product_id: 2, quantity: 5, sale_date: '2024-01-10' },
    { sale_id: 3, product_id: 3, quantity: 1, sale_date: '2024-01-15' },
    { sale_id: 4, product_id: 1, quantity: 1, sale_date: '2024-02-01' },
    { sale_id: 5, product_id: 4, quantity: 3, sale_date: '2024-02-10' },
  ],
};

const createInMemoryDB = async () => {
  const SQL = await initSqlJs();
  const db = new SQL.Database();

  db.run(`CREATE TABLE employees (id INT, name VARCHAR, department VARCHAR, salary DECIMAL)`);
  db.run(`CREATE TABLE orders (order_id INT, customer_id INT, order_date DATE, amount DECIMAL)`);
  db.run(`CREATE TABLE products (product_id INT, name VARCHAR, category VARCHAR, price DECIMAL)`);
  db.run(`CREATE TABLE sales (sale_id INT, product_id INT, quantity INT, sale_date DATE)`);

  const insertEmployee = db.prepare('INSERT INTO employees VALUES (?, ?, ?, ?)');
  seedData.employees.forEach(e => insertEmployee.run([e.id, e.name, e.department, e.salary]));
  insertEmployee.free();

  const insertOrder = db.prepare('INSERT INTO orders VALUES (?, ?, ?, ?)');
  seedData.orders.forEach(o => insertOrder.run([o.order_id, o.customer_id, o.order_date, o.amount]));
  insertOrder.free();

  const insertProduct = db.prepare('INSERT INTO products VALUES (?, ?, ?, ?)');
  seedData.products.forEach(p => insertProduct.run([p.product_id, p.name, p.category, p.price]));
  insertProduct.free();

  const insertSale = db.prepare('INSERT INTO sales VALUES (?, ?, ?, ?)');
  seedData.sales.forEach(s => insertSale.run([s.sale_id, s.product_id, s.quantity, s.sale_date]));
  insertSale.free();

  return db;
};

exports.executeSQL = async (query, schemaSetup = null) => {
   try {
     const db = schemaSetup ? await createInMemoryDBFromSchema(schemaSetup) : await createInMemoryDB();
     let results;
     const cleanedQuery = query.trim().toLowerCase();

     if (cleanedQuery.startsWith('select') || cleanedQuery.startsWith('with')) {
       const stmt = db.prepare(query);
       const cols = stmt.getColumnNames();
       const rows = [];
       while (stmt.step()) {
         rows.push(stmt.getAsObject());
       }
       stmt.free();
       results = { columns: cols, rows, type: 'select' };
     } else {
       db.run(query);
       results = { type: 'modification', affectedRows: db.getRowsModified() };
     }

     db.close();
     return { success: true, data: results };
   } catch (error) {
     return { success: false, error: error.message };
   }
 };

 const createInMemoryDBFromSchema = async (schemaSetup) => {
   const SQL = await initSqlJs();
   const db = new SQL.Database();
   db.run(schemaSetup);
   return db;
 };
