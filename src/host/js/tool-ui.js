export function generateToolFormHtml(tool) {
    const properties = tool.inputSchema?.properties || {};
    const required = tool.inputSchema?.required || [];

    let formFields = '';
    for (const [key, schema] of Object.entries(properties)) {
        const isRequired = required.includes(key);
        const reqMark = isRequired ? '<span style="color: #dc3545;">*</span>' : '';

        if (schema.enum) {
            const options = schema.enum.map(v => `<option value="${v}">${v}</option>`).join('');
            formFields += `
                <div class="form-field">
                    <label>${key} ${reqMark}</label>
                    <select id="param-${key}" ${isRequired ? 'required' : ''}>
                        ${options}
                    </select>
                    <div class="field-desc">${schema.description || ''}</div>
                </div>
            `;
        } else if (schema.type === 'number') {
            formFields += `
                <div class="form-field">
                    <label>${key} ${reqMark}</label>
                    <input type="number" id="param-${key}" step="any" ${isRequired ? 'required' : ''} />
                    <div class="field-desc">${schema.description || ''}</div>
                </div>
            `;
        } else {
            formFields += `
                <div class="form-field">
                    <label>${key} ${reqMark}</label>
                    <input type="text" id="param-${key}" ${isRequired ? 'required' : ''} />
                    <div class="field-desc">${schema.description || ''}</div>
                </div>
            `;
        }
    }

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: #f5f5f5;
                    min-height: 100vh;
                    padding: 24px;
                }
                .card {
                    background: white;
                    border-radius: 12px;
                    padding: 24px;
                    max-width: 500px;
                    margin: 0 auto;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    border: 1px solid #e0e0e0;
                }
                h1 {
                    color: #111;
                    margin-bottom: 8px;
                    font-size: 24px;
                }
                .description {
                    color: #666;
                    margin-bottom: 24px;
                    font-size: 14px;
                }
                .form-field {
                    margin-bottom: 16px;
                }
                label {
                    display: block;
                    font-weight: 600;
                    margin-bottom: 6px;
                    color: #333;
                }
                input, select {
                    width: 100%;
                    padding: 12px 16px;
                    border: 1px solid #ccc;
                    border-radius: 6px;
                    font-size: 14px;
                    transition: border-color 0.2s;
                }
                input:focus, select:focus {
                    outline: none;
                    border-color: #333;
                }
                .field-desc {
                    font-size: 12px;
                    color: #888;
                    margin-top: 4px;
                }
                button {
                    background: #111;
                    color: white;
                    border: none;
                    padding: 14px 28px;
                    border-radius: 6px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    width: 100%;
                    margin-top: 8px;
                    transition: background 0.2s;
                }
                button:hover {
                    background: #333;
                }
                .result {
                    margin-top: 20px;
                    padding: 16px;
                    border-radius: 6px;
                    background: #f5f5f5;
                    font-family: 'Monaco', 'Menlo', monospace;
                    font-size: 13px;
                    white-space: pre-wrap;
                    word-break: break-all;
                    display: none;
                    border: 1px solid #e0e0e0;
                }
                .result.success { background: #f0f0f0; color: #111; }
                .result.error { background: #fff0f0; color: #c00; border-color: #fcc; }
                .loading {
                    text-align: center;
                    color: #666;
                    padding: 20px;
                    display: none;
                }
                .no-params {
                    color: #666;
                    font-style: italic;
                    margin-bottom: 16px;
                }
            </style>
        </head>
        <body>
            <div class="card">
                <h1>${tool.name}</h1>
                <p class="description">${tool.description || 'No description available'}</p>

                <form id="toolForm">
                    ${formFields || '<p class="no-params">This tool requires no parameters</p>'}
                    <button type="submit">Execute Tool</button>
                </form>

                <div class="loading" id="loading">Executing...</div>
                <div class="result" id="result"></div>
            </div>

            <scr` + `ipt>
                const toolName = '${tool.name}';
                const properties = ${JSON.stringify(properties)};
                let messageId = 0;

                document.getElementById('toolForm').addEventListener('submit', function(e) {
                    e.preventDefault();

                    const args = {};
                    for (const key of Object.keys(properties)) {
                        const el = document.getElementById('param-' + key);
                        if (el) {
                            const val = el.value;
                            if (properties[key].type === 'number') {
                                args[key] = parseFloat(val);
                            } else {
                                args[key] = val;
                            }
                        }
                    }

                    // SEP-1865: Use JSON-RPC 2.0 format
                    window.parent.postMessage({
                        jsonrpc: '2.0',
                        id: ++messageId,
                        method: 'tools/call',
                        params: { name: toolName, arguments: args }
                    }, '*');

                    document.getElementById('loading').style.display = 'block';
                    document.getElementById('result').style.display = 'none';
                });

                window.addEventListener('message', function(e) {
                    // SEP-1865: Handle JSON-RPC 2.0 responses
                    if (e.data.jsonrpc === '2.0' && e.data.id) {
                        document.getElementById('loading').style.display = 'none';
                        const resultEl = document.getElementById('result');
                        resultEl.style.display = 'block';

                        if (e.data.error) {
                            resultEl.className = 'result error';
                            resultEl.textContent = 'Error: ' + e.data.error.message;
                        } else if (e.data.result) {
                            resultEl.className = 'result success';
                            const content = e.data.result.content || [];
                            const text = content.map(c => c.text || '').join('\\n');
                            resultEl.textContent = text || JSON.stringify(e.data.result, null, 2);
                        }
                    }
                });
            </scr` + `ipt>
        </body>
        </html>
    `;
}
