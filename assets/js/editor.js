/* 
  Av_eSAFE Gurukul - Live Editor
  Sandboxed execution for HTML/CSS/JS
*/

// --- Mock Database for SQL Simulation ---
const mockDatabase = {
    customers: [
        { customerid: 1, customername: 'Alfreds Futterkiste', contactname: 'Maria Anders', address: 'Obere Str. 57', city: 'Berlin', postalcode: '12209', country: 'Germany' },
        { customerid: 2, customername: 'Ana Trujillo Emparedados', contactname: 'Ana Trujillo', address: 'Avda. de la Constitución 2222', city: 'México D.F.', postalcode: '05021', country: 'Mexico' },
        { customerid: 3, customername: 'Antonio Moreno Taquería', contactname: 'Antonio Moreno', address: 'Mataderos 2312', city: 'México D.F.', postalcode: '05023', country: 'Mexico' },
        { customerid: 4, customername: 'Around the Horn', contactname: 'Thomas Hardy', address: '120 Hanover Sq.', city: 'London', postalcode: 'WA1 1DP', country: 'UK' },
        { customerid: 5, customername: 'Berglunds snabbköp', contactname: 'Christina Berglund', address: 'Berguvsvägen 8', city: 'Luleå', postalcode: 'S-958 22', country: 'Sweden' }
    ],
    employees: [
        { employeeid: 1, lastname: 'Davolio', firstname: 'Nancy', birthdate: '1968-12-08', photo: 'EmpID1.pic', notes: 'Education includes a BA in psychology.' },
        { employeeid: 2, lastname: 'Fuller', firstname: 'Andrew', birthdate: '1952-02-19', photo: 'EmpID2.pic', notes: 'Andrew received his BTS commercial in 1974.' },
        { employeeid: 3, lastname: 'Leverling', firstname: 'Janet', birthdate: '1963-08-30', photo: 'EmpID3.pic', notes: 'Janet has a BS degree in chemistry.' },
        { employeeid: 4, lastname: 'Peacock', firstname: 'Margaret', birthdate: '1937-09-19', photo: 'EmpID4.pic', notes: 'Margaret holds a BA in English literature.' },
        { employeeid: 5, lastname: 'Buchanan', firstname: 'Steven', birthdate: '1955-03-04', photo: 'EmpID5.pic', notes: 'Steven Buchanan graduated from St. Andrews University.' }
    ],
    products: [
        { productid: 1, productname: 'Chai', supplierid: 1, categoryid: 1, unit: '10 boxes x 20 bags', price: 18 },
        { productid: 2, productname: 'Chang', supplierid: 1, categoryid: 1, unit: '24 - 12 oz bottles', price: 19 },
        { productid: 3, productname: 'Aniseed Syrup', supplierid: 1, categoryid: 2, unit: '12 - 550 ml bottles', price: 10 }
    ]
};
// Allow singular table names for better user experience
mockDatabase.customer = mockDatabase.customers;
mockDatabase.employee = mockDatabase.employees;
mockDatabase.product = mockDatabase.products;

function runCode() {
    const codeInput = document.getElementById('code-html');
    const frame = document.getElementById('preview-frame');
    
    // Safety check: Ensure elements exist and frame is actually an iframe
    if (!codeInput || !frame || frame.tagName !== 'IFRAME') return;

    const code = codeInput.value;
    // Create a sandboxed document
    const frameDoc = frame.contentDocument || frame.contentWindow.document;
    
    const isDarkMode = document.body.classList.contains('dark-mode');
    
    // Error Handler Script to inject into iframe
    const errorHandlerScript = `
        <script>
            (function() {
                function showError(msg) {
                    var div = document.createElement("div");
                    div.style.position = "fixed";
                    div.style.bottom = "10px";
                    div.style.left = "10px";
                    div.style.right = "10px";
                    div.style.zIndex = "2147483647";
                    div.style.color = "#ef4444";
                    div.style.backgroundColor = "${isDarkMode ? 'rgba(40, 10, 10, 0.95)' : '#fee2e2'}";
                    div.style.border = "1px solid #ef4444";
                    div.style.padding = "12px";
                    div.style.borderRadius = "6px";
                    div.style.fontFamily = "Consolas, monospace";
                    div.style.fontSize = "13px";
                    div.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                    div.innerHTML = "<strong>⚠️ Error:</strong> " + msg + '<button onclick="this.parentElement.remove()" style="float:right;background:none;border:none;cursor:pointer;color:inherit;font-size:16px;line-height:1;">&times;</button>';
                    
                    if (document.body) document.body.appendChild(div);
                    else if (document.documentElement) document.documentElement.appendChild(div);
                }

                window.onerror = function(msg, url, line, col, error) {
                    showError(msg + (line ? " (Line " + line + ")" : ""));
                    return false;
                };

                window.addEventListener('unhandledrejection', function(event) {
                    showError("Unhandled Promise Rejection: " + event.reason);
                });
            })();
        </script>
    `;

    const consoleTextColor = isDarkMode ? '#e2e8f0' : '#1e293b';
    const consoleBgColor = isDarkMode ? '#0f172a' : '#ffffff';
    const metaTextColor = isDarkMode ? '#94a3b8' : '#666';
    const tableHeaderBg = isDarkMode ? 'rgba(255,255,255,0.1)' : '#f2f2f2';
    const tableBorderColor = isDarkMode ? 'rgba(255,255,255,0.2)' : '#dddddd';
    
    const path = window.location.pathname.toLowerCase();

    // --- Java Simulation Logic ---
    if (path.includes('/java/')) {
        let output = '';
        const lines = code.split('\n');
        const variables = {};

        // A simple evaluator for basic expressions
        const evaluate = (expr) => {
            try {
                // Replace variable names with their values
                let safeExpr = expr.replace(/[a-zA-Z_][a-zA-Z0-9_]*/g, (match) => {
                    // Don't replace Math
                    if (match.toLowerCase() === 'math') return 'Math';
                    return variables.hasOwnProperty(match) ? variables[match] : match;
                });
                // Handle Math.max, Math.min etc.
                return new Function(`return ${safeExpr}`)();
            } catch (e) {
                // If it looks like a string literal, return it. Otherwise, return error.
                if ((expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'"))) {
                    return expr;
                }
                return `<span style="color: #ef4444;">Error: ${e.message}</span>`;
            }
        };

        lines.forEach(line => {
            // Remove comments
            line = line.split('//')[0].trim();
            if (!line) return;

            // Variable Parsing (Improved)
            let strMatch = line.match(/String\s+([a-zA-Z0-9_]+)\s*=\s*"([^"]*)"/);
            if (strMatch) variables[strMatch[1]] = `"${strMatch[2]}"`; // Keep quotes for eval

            let intMatch = line.match(/(?:int|double|float)\s+([a-zA-Z0-9_]+)\s*=\s*([^;]+)/);
            if (intMatch) variables[intMatch[1]] = evaluate(intMatch[2]);

            // System.out.println(...)
            let printMatch = line.match(/System\.out\.println\s*\((.*)\);/);
            if (printMatch) {
                let content = printMatch[1].trim();
                let result = evaluate(content);
                // remove quotes from string results
                if (typeof result === 'string' && result.startsWith('"') && result.endsWith('"')) {
                    result = result.slice(1, -1);
                }
                output += result + '<br>';
            }
        });

        if (output === '') output = '<span style="color:green">> Program compiled successfully.</span>';

        frameDoc.open();
        frameDoc.write(`<style>body{font-family:monospace;padding:10px;color:${consoleTextColor};background-color:${consoleBgColor};}</style><strong>Output:</strong><br>${output}`);
        frameDoc.close();
        return;
    }

    // --- Python Simulation Logic ---
    if (path.includes('/python/')) {
        let output = '';
        const lines = code.split('\n');
        const variables = {};

        lines.forEach(line => {
            // Remove comments and whitespace
            line = line.split('#')[0].trim();
            if (!line) return;

            // Variable Parsing (Basic Support)
            let assignMatch = line.match(/^([a-zA-Z0-9_]+)\s*=\s*(.*)$/);
            if (assignMatch) {
                let key = assignMatch[1].trim();
                let value = assignMatch[2].trim();
                // Try to convert to number if possible
                if (!isNaN(value) && value.trim() !== '') {
                     variables[key] = Number(value);
                } else {
                    // Strip quotes if string
                    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                        variables[key] = value.slice(1, -1);
                    } else {
                        variables[key] = value; // Store as is (e.g., for variable assignments like x=y)
                    }
                }
            }

            // print(...)
            let printMatch = line.match(/^print\s*\((.*)\)$/);
            if (printMatch) {
                let content = printMatch[1].trim();

                // Handle type(x)
                let typeMatch = content.match(/^type\((.*)\)$/);
                if (typeMatch) {
                    let varName = typeMatch[1].trim();
                    let val = variables.hasOwnProperty(varName) ? variables[varName] : undefined;
                    if (typeof val === 'number') output += "&lt;class 'int'&gt;<br>";
                    else if (typeof val === 'string') output += "&lt;class 'str'&gt;<br>";
                    else output += "&lt;class 'NoneType'&gt;<br>";
                }
                // Handle f-strings (basic)
                else if (content.startsWith('f"') || content.startsWith("f'")) {
                    let fstring = content.slice(2, -1);
                    let formatted = fstring.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, varName) => {
                        return variables.hasOwnProperty(varName) ? variables[varName] : match;
                    });
                    output += formatted + '<br>';
                }
                // Check if string literal
                else if ((content.startsWith('"') && content.endsWith('"')) || (content.startsWith("'") && content.endsWith("'"))) {
                    output += content.slice(1, -1) + '<br>';
                }
                // Check if variable
                else if (variables.hasOwnProperty(content)) {
                    output += variables[content] + '<br>';
                }
                // Fallback for expressions (very basic)
                else {
                    try {
                        let expr = content.replace(/[a-zA-Z_][a-zA-Z0-9_]*/g, (match) => {
                             return variables.hasOwnProperty(match) ? variables[match] : match;
                        });
                        output += new Function(`return ${expr}`)() + '<br>';
                    } catch(e) {
                        output += content + '<br>';
                        output += `<span style="color: #ef4444;">Error: ${e.message}</span><br>`;
                    }
                }
            }
        });

        if (output === '') output = '<span style="color:green">> Program executed successfully.</span>';

        frameDoc.open();
        frameDoc.write(`<style>body{font-family:monospace;padding:10px;color:${consoleTextColor};background-color:${consoleBgColor};}</style><strong>Output:</strong><br>${output}`);
        frameDoc.close();
        return;
    }

    // --- React Simulation Logic ---
    if (path.includes('/react/')) {
        // Remove imports that might break the standalone Babel environment
        let reactCode = code.replace(/import\s+.*?from\s+['"]react['"];?/g, '')
                            .replace(/import\s+.*?from\s+['"]react-dom\/client['"];?/g, '')
                            .replace(/import\s+.*?from\s+['"]react-dom['"];?/g, '');

        frameDoc.open();
        frameDoc.write(`
            <!DOCTYPE html><html><head>
                <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
                <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
                <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
                <style>body { font-family: 'Segoe UI', sans-serif; padding: 1rem; color: #333; }</style>
                ${errorHandlerScript}
            </head><body>
                <div id="root"></div>
                <script type="text/babel">
                    const { useState, useEffect, useRef, useMemo, useCallback, useContext, createContext } = React;
                    ${reactCode}
                </script>
            </body></html>
        `);
        frameDoc.close();
        return;
    }

    // --- SQL Simulation Logic ---
    if (path.includes('/sql/')) {
        let output = '';
        const upperCode = code.trim().toUpperCase();

        try {
            if (upperCode.startsWith('SELECT')) {
                const fromMatch = upperCode.match(/FROM\s+([A-Z0-9_]+)/);
                const tableName = fromMatch ? fromMatch[1].toLowerCase() : null;

                if (tableName && mockDatabase[tableName]) {
                    let data = [...mockDatabase[tableName]];
                    
                    // Basic WHERE clause parser
                    const whereMatch = upperCode.match(/WHERE\s+(.*)/);
                    if (whereMatch) {
                        const condition = whereMatch[1];
                        // Supports: =, >, <, >=, <=
                        const condParts = condition.match(/([A-Z0-9_]+)\s*(=|>=|<=|>|<)\s*(?:'([^']*)'|([0-9.]+))/);
                        if (condParts) {
                            const key = condParts[1].toLowerCase();
                            const op = condParts[2];
                            const valStr = condParts[3];
                            const valNum = condParts[4];
                            
                            data = data.filter(row => {
                                const rowVal = row[key];
                                const compareVal = valNum ? parseFloat(valNum) : valStr;
                                
                                if (op === '=') return String(rowVal).toLowerCase() == String(compareVal).toLowerCase();
                                if (op === '>') return rowVal > compareVal;
                                if (op === '<') return rowVal < compareVal;
                                if (op === '>=') return rowVal >= compareVal;
                                if (op === '<=') return rowVal <= compareVal;
                                return true;
                            });
                        }
                    }

                    // Column selector
                    const selectPart = upperCode.substring(6, upperCode.indexOf('FROM')).trim();
                    const headers = selectPart === '*' ? Object.keys(data[0] || {}) : selectPart.split(',').map(h => h.trim().toLowerCase());
                    
                    if (data.length > 0) {
                        output += `<table border="1" style="border-collapse: collapse; width: 100%; font-family: sans-serif; font-size: 14px; border-color: ${tableBorderColor};">`;
                        output += `<tr style="background-color: ${tableHeaderBg};">`;
                        headers.forEach(header => output += `<th style="padding: 8px;">${header}</th>`);
                        output += '</tr>';
                        data.forEach(row => {
                            output += '<tr>';
                            headers.forEach(header => output += `<td style="padding: 8px;">${row[header] === undefined ? 'NULL' : row[header]}</td>`);
                            output += '</tr>';
                        });
                        output += '</table>';
                        output += `<p style="color: ${metaTextColor}; font-size: 0.8rem; margin-top: 10px;">${data.length} records returned.</p>`;
                    } else {
                        output = `<div style="padding: 10px; color: ${consoleTextColor}; font-family: sans-serif;">Query executed successfully.<br>0 records returned.</div>`;
                    }
                } else {
                    output = `<div style="padding: 10px; color: red; font-family: sans-serif;">Error: Table '${tableName}' not found in simulation.</div>`;
                }
            } else if (upperCode.startsWith('INSERT') || upperCode.startsWith('UPDATE') || upperCode.startsWith('DELETE')) {
                output = `<div style="padding: 10px; color: green; font-family: sans-serif;">✓ Query executed successfully.<br>1 row affected. (Simulation)</div>`;
            } else {
                output = `<div style="padding: 10px; color: #333; font-family: sans-serif;">Command executed successfully.</div>`;
            }
        } catch (e) {
            output = `<div style="padding: 10px; color: red; font-family: sans-serif;">Error parsing SQL query. Please check syntax.</div>`;
        }

        frameDoc.open();
        frameDoc.write(`<style>body{font-family:sans-serif;padding:10px;color:${consoleTextColor}; background-color:${consoleBgColor};} table, th, td { border: 1px solid ${tableBorderColor}; color: ${consoleTextColor}; } th { padding: 8px; }</style><strong>Query Result:</strong><hr>${output}`);
        frameDoc.close();
        return;
    }

    // --- Default HTML Logic ---
    frameDoc.open();
    let finalCode = code;
    // Inject error handler as early as possible to catch load-time errors
    // We prioritize injecting into <head> or <html>, but fallback to prepending
    // to ensure it runs before any user scripts that might be at the top.
    if (finalCode.toLowerCase().includes('<head')) {
        finalCode = finalCode.replace(/<head[^>]*>/i, (match) => match + errorHandlerScript);
    } else if (finalCode.toLowerCase().includes('<html')) {
        finalCode = finalCode.replace(/<html[^>]*>/i, (match) => match + errorHandlerScript);
    } else if (finalCode.toLowerCase().includes('<!doctype')) {
        finalCode = finalCode.replace(/>/, '>' + errorHandlerScript);
    } else {
        finalCode = errorHandlerScript + finalCode;
    }
    frameDoc.write(finalCode);
    frameDoc.close();
}

// Auto-run on load if editor exists
document.addEventListener('DOMContentLoaded', () => {
    if(document.getElementById('code-html')) {
        runCode();
    }
});