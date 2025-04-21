import * as vscode from 'vscode';
import axios from 'axios';

interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface GroqError {
  error?: {
    message?: string;
  };
}

export function activate(context: vscode.ExtensionContext) {
    const groqApiUrl = 'https://api.groq.com/openai/v1/chat/completions';
    
    // Register command to set API key
    let setApiKey = vscode.commands.registerCommand('credbot.setApiKey', async () => {
        const apiKey = await vscode.window.showInputBox({
            prompt: 'YOUR API KEY HERE',
            password: true
        });
        if (apiKey) {
            await context.globalState.update('groqApiKey', apiKey);
            vscode.window.showInformationMessage('Groq API Key saved successfully!');
        }
    });

    // Register main command
    let startCommand = vscode.commands.registerCommand('credbot.start', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found.');
            return;
        }

        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);
        if (!selectedText) {
            vscode.window.showErrorMessage('Please select some code first.');
            return;
        }

        const apiKey = context.globalState.get('groqApiKey') as string | undefined;
        if (!apiKey) {
            vscode.window.showErrorMessage('Please set your Groq API Key first using CredBot: Set API Key command.');
            return;
        }

        // Detect language
        const language = editor.document.languageId;
        if (!['java', 'kotlin', 'typescript'].includes(language)) {
            vscode.window.showWarningMessage('CredBot is optimized for Java, Kotlin, and TypeScript.');
        }

        // Create WebView panel
        const panel = vscode.window.createWebviewPanel(
            'credbot',
            'CredBot AI Assistant',
            vscode.ViewColumn.Beside,
            { enableScripts: true }
        );

        // Initial WebView content
        panel.webview.html = getWebviewContent();

        // Handle messages from WebView
        panel.webview.onDidReceiveMessage(
            async message => {
                if (message.command === 'applySuggestion') {
                    const editor = vscode.window.activeTextEditor;
                    if (editor && message.response) {
                        editor.edit(editBuilder => {
                            const selection = editor.selection;
                            editBuilder.replace(selection, message.response);
                        });
                    }
                    return;
                }

                try {
                    vscode.window.showInformationMessage('Generating response...');
                    
                    let prompt = '';
                    switch (message.command) {
                        case 'complete':
                            prompt = `Complete the following ${language} code for a fintech Spring Boot microservice:\n\n${selectedText}`;
                            break;
                        case 'explain':
                            prompt = `Explain the following ${language} code in simple terms, focusing on fintech use cases:\n\n${selectedText}`;
                            break;
                        case 'explainError':
                            prompt = `Explain potential errors in this ${language} code and how to fix them for a fintech application:\n\n${selectedText}`;
                            break;
                        case 'improve':
                            prompt = `Suggest improvements for this ${language} code to optimize for fintech Spring Boot microservices (consider performance, security, and maintainability):\n\n${selectedText}`;
                            break;
                        case 'refactor':
                            prompt = `Refactor this ${language} code to follow best practices for fintech Spring Boot microservices:\n\n${selectedText}`;
                            break;
                    }

                    const response = await axios.post<GroqResponse>(
                        groqApiUrl,
                        {
                            model: 'llama-3.3-70b-versatile',
                            messages: [{ role: 'user', content: prompt }],
                            max_tokens: 1000,
                            temperature: 0.7
                        },
                        {
                            headers: {
                                'Authorization': `Bearer ${apiKey}`,
                                'Content-Type': 'application/json'
                            },
                            timeout: 30000
                        }
                    );

                    const aiResponse = response.data.choices[0].message.content;
                    panel.webview.postMessage({
                        command: 'displayResponse',
                        response: aiResponse,
                        originalCode: selectedText
                    });
                } catch (error: any) {
                    let errorMessage = 'Failed to generate response. ';
                    if (error.response) {
                        errorMessage += `API error: ${error.response.status} - ${(error.response.data as GroqError)?.error?.message || 'Unknown error'}`;
                    } else if (error.code === 'ECONNABORTED') {
                        errorMessage += 'Request timed out.';
                    } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
                        errorMessage += 'No internet connection or API unreachable.';
                    } else {
                        errorMessage += error.message || 'Unexpected error occurred.';
                    }
                    vscode.window.showErrorMessage(errorMessage);
                    panel.webview.postMessage({
                        command: 'error',
                        message: errorMessage
                    });
                }
            },
            undefined,
            context.subscriptions
        );
    });

    context.subscriptions.push(setApiKey, startCommand);
}

function getWebviewContent() {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>CredBot</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; background-color: #1e1e1e; color: #d4d4d4; }
                button { 
                    margin: 5px; 
                    padding: 8px 16px; 
                    background-color: #007acc; 
                    color: white; 
                    border: none; 
                    cursor: pointer; 
                    border-radius: 4px;
                }
                button:hover { background-color: #005f99; }
                #response { 
                    margin-top: 20px; 
                    padding: 10px; 
                    background-color: #252526; 
                    border-radius: 4px; 
                    white-space: pre-wrap; 
                    font-family: 'Consolas', monospace;
                }
                #loading { display: none; color: #569cd6; }
                #actions { display: none; }
                .error { color: #f44747; }
            </style>
        </head>
        <body>
            <h2>CredBot AI Assistant</h2>
            <p>Select an action for the highlighted code:</p>
            <button onclick="sendMessage('complete')">Code Completion</button>
            <button onclick="sendMessage('explain')">Explain Code</button>
            <button onclick="sendMessage('explainError')">Explain Error</button>
            <button onclick="sendMessage('improve')">Improve Code</button>
            <button onclick="sendMessage('refactor')">Refactor Code</button>
            <div id="loading">Generating response...</div>
            <div id="response"></div>
            <div id="actions">
                <button onclick="acceptSuggestion()">Accept</button>
                <button onclick="rejectSuggestion()">Reject</button>
            </div>
            <script>
                const vscode = acquireVsCodeApi();
                function sendMessage(command) {
                    document.getElementById('loading').style.display = 'block';
                    document.getElementById('response').style.display = 'none';
                    document.getElementById('actions').style.display = 'none';
                    vscode.postMessage({ command });
                }
                window.addEventListener('message', event => {
                    const message = event.data;
                    document.getElementById('loading').style.display = 'none';
                    switch (message.command) {
                        case 'displayResponse':
                            document.getElementById('response').textContent = message.response;
                            document.getElementById('response').style.display = 'block';
                            document.getElementById('actions').style.display = 'block';
                            window.currentResponse = message.response;
                            window.originalCode = message.originalCode;
                            break;
                        case 'error':
                            document.getElementById('response').textContent = message.message;
                            document.getElementById('response').className = 'error';
                            document.getElementById('response').style.display = 'block';
                            break;
                    }
                });
                function acceptSuggestion() {
                    vscode.postMessage({ 
                        command: 'applySuggestion', 
                        response: window.currentResponse,
                        originalCode: window.originalCode
                    });
                }
                function rejectSuggestion() {
                    document.getElementById('response').style.display = 'none';
                    document.getElementById('actions').style.display = 'none';
                }
            </script>
        </body>
        </html>`;
}

export function deactivate() {}