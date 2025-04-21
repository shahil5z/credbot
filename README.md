CredBot VS Code Extension

-CredBot is an AI-powered coding assistant tailored for fintech developers, supporting Java, Kotlin, TypeScript, and Spring Boot microservices.

Features

-Code Completion Explain Code Explain Error Improve Code Refactor Code Accept/Reject Suggestions

Installation

1. Install the Extension: Download the credbot-0.0.1.vsix file from the GitHub repository releases. In VS Code, go to Extensions view (Ctrl+Shift+X). Click ... (More Actions) > Install from VSIX. Select the downloaded credbot-0.0.1.vsix file.

2. Set Groq API Key: Open the Command Palette (Ctrl+Shift+P). Run CredBot: Set API Key. Enter your API key from the Groq Console.

Usage

1. Select code in the VS Code editor.

2. Right-click or use CredBot: Start AI Assistant from the Command Palette (Ctrl+Shift+P).

3. Choose an action (e.g., Complete, Explain) in the WebView panel.

4. Accept or reject the suggestion provided.



Testing the Extension via VSIX

-To test the pre-built extension:

1. Download the credbot-0.0.1.vsix file from the GitHub repository releases.

2. Install it in VS Code (see Installation steps).

3. Test features by selecting code and using the AI assistant via the Command Palette or right-click menu.



Testing the Extension via Repository Zip

1. To test the extension by building it from the repository source:

2. Download the repository as a zip file from GitHub (click "Code" > "Download ZIP").

3. Extract the zip file to a local folder.

4. Navigate to the extracted folder in a terminal.

5. Install dependencies: npm install

6. Compile TypeScript: npm run compile

7. Package the extension: vsce package

8. Install the generated credbot-0.0.1.vsix file in VS Code (see Installation steps).

9. Test features by selecting code and using the AI assistant via the Command Palette or right-click menu.


Requirements

- VS Code 1.93.0 or higher Groq API Key (free tier available at Groq Console)


Developed by Shohrab Haque Shahil...