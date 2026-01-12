// This script depends on sql.js being loaded first.

// --- 1. Sample Database ---
const createDbSql = `
-- Create Customers Table
CREATE TABLE Customers (
    CustomerID int, CustomerName varchar(255), ContactName varchar(255),
    Address varchar(255), City varchar(255), PostalCode varchar(255), Country varchar(255)
);
INSERT INTO Customers VALUES (1, 'Kumar Retail', 'Priya Kumar', '123 MG Road', 'Mumbai', '400001', 'India');
INSERT INTO Customers VALUES (2, 'Sharma Sweets', 'Anjali Sharma', '456 Connaught Place', 'Delhi', '110001', 'India');
INSERT INTO Customers VALUES (3, 'Gupta General Store', 'Rohan Gupta', '789 Park Street', 'Kolkata', '700016', 'India');
INSERT INTO Customers VALUES (4, 'Patel Provisions', 'Sanjay Patel', '101 Brigade Road', 'Bangalore', '560001', 'India');
INSERT INTO Customers VALUES (5, 'Singh & Sons', 'Aarav Singh', '212 Sector 17', 'Chandigarh', '160017', 'India');

-- Create Products Table
CREATE TABLE Products (
    ProductID int, ProductName varchar(255), SupplierID int,
    CategoryID int, Unit varchar(255), Price float
);
INSERT INTO Products VALUES (1, 'Chais', 1, 1, '10 boxes x 20 bags', 18);
INSERT INTO Products VALUES (2, 'Chang', 1, 1, '24 - 12 oz bottles', 19);
INSERT INTO Products VALUES (3, 'Aniseed Syrup', 1, 2, '12 - 550 ml bottles', 10);
INSERT INTO Products VALUES (4, 'Chef Anton''s Cajun Seasoning', 2, 2, '48 - 6 oz jars', 22);
INSERT INTO Products VALUES (5, 'Grandma''s Boysenberry Spread', 2, 2, '12 - 8 oz jars', 25);

-- Create Orders Table
CREATE TABLE Orders (
    OrderID int, CustomerID int, EmployeeID int, OrderDate varchar(255), ShipperID int
);
INSERT INTO Orders VALUES (10248, 2, 5, '1996-07-04', 3);
INSERT INTO Orders VALUES (10249, 4, 6, '1996-07-05', 1);
INSERT INTO Orders VALUES (10250, 5, 4, '1996-07-08', 2);

-- Create Employees Table
CREATE TABLE Employees (
    EmployeeID int, LastName varchar(255), FirstName varchar(255), BirthDate varchar(255)
);
INSERT INTO Employees VALUES (4, 'Joshi', 'Meera', '1985-09-19');
INSERT INTO Employees VALUES (5, 'Verma', 'Sameer', '1990-03-04');
INSERT INTO Employees VALUES (6, 'Das', 'Rahul', '1988-07-02');

-- Create Suppliers Table
CREATE TABLE Suppliers (
    SupplierID int, SupplierName varchar(255), ContactName varchar(255), Country varchar(255)
);
INSERT INTO Suppliers VALUES (1, 'Himalayan Beverages', 'Vikram Rana', 'India');
INSERT INTO Suppliers VALUES (2, 'Deccan Spices', 'Aisha Khan', 'India');

-- Create OrderDetails Table
CREATE TABLE OrderDetails (
    OrderDetailID int, OrderID int, ProductID int, Quantity int
);
INSERT INTO OrderDetails VALUES (1, 10248, 1, 12);
INSERT INTO OrderDetails VALUES (2, 10248, 2, 10);
INSERT INTO OrderDetails VALUES (3, 10249, 3, 5);
INSERT INTO OrderDetails VALUES (4, 10250, 4, 35);
INSERT INTO OrderDetails VALUES (5, 10250, 5, 15);
`;

let db; // Global database object

// --- Helper function to render SQL results into an HTML table ---
function renderTableHTML(results) {
    let html = '';
    if (results.length > 0) {
        results.forEach(result => {
            html += '<table style="width:100%; border-collapse:collapse;"><thead><tr>';
            result.columns.forEach(col => html += `<th style="border:1px solid var(--glass-border); padding: 8px; text-align:left; background-color: rgba(0,0,0,0.1);">${col}</th>`);
            html += '</tr></thead><tbody>';
            result.values.forEach(row => {
                html += '<tr>';
                row.forEach(val => html += `<td style="border:1px solid var(--glass-border); padding: 8px;">${val === null ? 'NULL' : val}</td>`);
                html += '</tr>';
            });
            html += '</tbody></table>';
        });
    } else {
        html = '<p>Query executed successfully. No results to display.</p>';
    }
    return html;
}

// --- 2. SQL Execution Logic ---
async function initSqlDb() {
    if (db) return; // Already initialized
    try {
        const SQL = await initSqlJs({ locateFile: file => `https://sql.js.org/dist/${file}` });
        db = new SQL.Database();
        db.run(createDbSql);
    } catch (e) {
        console.error("Failed to initialize SQL.js", e);
    }
}

async function runSqlCode() {
    await initSqlDb();
    const code = document.getElementById('code-html').value;
    const outputFrame = document.getElementById('preview-frame');
    const outputDoc = outputFrame.contentDocument || outputFrame.contentWindow.document;

    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#f1f5f9' : '#1e293b';
    const bgColor = isDarkMode ? '#0f172a' : '#ffffff';
    const borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.2)' : '#ddd';
    const headerBgColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#f2f2f2';

    let resultsHtml = `<style>
        body { font-family: sans-serif; color: ${textColor}; background-color: ${bgColor}; margin: 0; padding: 10px; }
        .error { color: #ef4444; font-weight: bold; }
    </style>`;

    try {
        const results = db.exec(code); // Execute SQL
        resultsHtml += renderTableHTML(results);
    } catch (e) {
        resultsHtml += `<p class="error">Error: ${e.message}</p>`;
    }

    outputDoc.open();
    outputDoc.write(resultsHtml);
    outputDoc.close();
}

// --- 3. Schema Viewer Modal ---
function initSchemaViewer() {
    if (document.getElementById('schema-modal')) return;

    const schemaContent = `
        <div class="schema-tables">
            <h3 data-table="Customers">Customers</h3>
            <h3 data-table="Products">Products</h3>
            <h3 data-table="Orders">Orders</h3>
            <h3 data-table="Employees">Employees</h3>
            <h3 data-table="Suppliers">Suppliers</h3>
            <h3 data-table="OrderDetails">OrderDetails</h3>
        </div>
        <div id="schema-data-preview" style="margin-top: 20px; max-height: 300px; overflow-y: auto;"></div>
    `;

    const modalHtml = `<div id="schema-modal" style="display:none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.4);"><div style="background-color: var(--bg-body); color: var(--text-main); margin: 10% auto; padding: 20px; border: 1px solid var(--glass-border); width: 80%; max-width: 700px; border-radius: var(--radius); position: relative;"><style>.schema-tables h3 { cursor: pointer; color: var(--primary); } .schema-tables h3:hover { text-decoration: underline; }</style><span class="schema-modal-close" style="color: #aaa; float: right; font-size: 28px; font-weight: bold; cursor: pointer;">&times;</span><h2>Demo Database Schema</h2><p style="font-size:0.9rem; color: var(--text-muted); margin-bottom: 1rem;">Click on a table name to preview its data.</p>${schemaContent}</div></div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modal = document.getElementById('schema-modal');
    const closeBtn = document.querySelector('.schema-modal-close');
    const schemaTablesDiv = modal.querySelector('.schema-tables');

    closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
    window.addEventListener('click', (event) => { if (event.target == modal) { modal.style.display = 'none'; } });

    schemaTablesDiv.addEventListener('click', async (e) => {
        if (e.target.tagName === 'H3' && e.target.dataset.table) {
            const tableName = e.target.dataset.table;
            const previewDiv = document.getElementById('schema-data-preview');
            previewDiv.innerHTML = 'Loading table data...';
            
            await initSqlDb();
            
            const query = `SELECT * FROM ${tableName} LIMIT 10;`;
            try {
                const results = db.exec(query);
                previewDiv.innerHTML = renderTableHTML(results);
            } catch (err) {
                previewDiv.innerHTML = `<p style="color: red;">Error: ${err.message}</p>`;
            }
        }
    });
}

document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'view-schema-btn') {
        initSchemaViewer();
        const modal = document.getElementById('schema-modal');
        if (modal) modal.style.display = 'block';
    }
});