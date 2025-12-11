// Minimal test extension
const vscode = require('vscode');

function activate(context) {
    console.log('✅ TEST EXTENSION ACTIVATED SUCCESSFULLY!');
    vscode.window.showInformationMessage('Test Extension Works!');
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
