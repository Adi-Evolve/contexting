// Editor Context Capture - Layer 1
// Captures rich editor context around AI interactions

const vscode = require('vscode');

class EditorContextCapture {
    constructor(context) {
        this.context = context;
        this.recentEdits = [];
        this.activeFiles = [];
        this.codeSelections = [];
        this.commandHistory = [];
        this.maxHistorySize = 100;
        
        this.setupListeners();
    }
    
    setupListeners() {
        // 1. Track file edits with detailed context
        this.context.subscriptions.push(
            vscode.workspace.onDidChangeTextDocument(event => {
                this.captureEdit(event);
            })
        );
        
        // 2. Track active file switches
        this.context.subscriptions.push(
            vscode.window.onDidChangeActiveTextEditor(editor => {
                this.captureFileSwitch(editor);
            })
        );
        
        // 3. Track text selection (likely code user wants to ask about)
        this.context.subscriptions.push(
            vscode.window.onDidChangeTextEditorSelection(event => {
                this.captureSelection(event);
            })
        );
        
        // 4. Track terminal output (might contain AI responses)
        this.context.subscriptions.push(
            vscode.window.onDidOpenTerminal(terminal => {
                this.captureTerminal(terminal);
            })
        );
    }
    
    captureEdit(event) {
        const edit = {
            file: event.document.fileName,
            uri: event.document.uri.toString(),
            languageId: event.document.languageId,
            changes: event.contentChanges.map(change => ({
                text: change.text,
                rangeLength: change.rangeLength,
                rangeOffset: change.rangeOffset
            })),
            timestamp: Date.now(),
            lineCount: event.document.lineCount,
            isDirty: event.document.isDirty
        };
        
        this.recentEdits.push(edit);
        this.pruneHistory(this.recentEdits);
    }
    
    captureFileSwitch(editor) {
        if (!editor) return;
        
        const fileSwitch = {
            file: editor.document.fileName,
            uri: editor.document.uri.toString(),
            languageId: editor.document.languageId,
            timestamp: Date.now(),
            selection: {
                start: editor.selection.start.line,
                end: editor.selection.end.line,
                isEmpty: editor.selection.isEmpty
            },
            visibleRanges: editor.visibleRanges.map(range => ({
                start: range.start.line,
                end: range.end.line
            }))
        };
        
        this.activeFiles.push(fileSwitch);
        this.pruneHistory(this.activeFiles);
    }
    
    captureSelection(event) {
        if (event.selections[0].isEmpty) return;
        
        const selection = {
            file: event.textEditor.document.fileName,
            text: event.textEditor.document.getText(event.selections[0]),
            range: {
                start: event.selections[0].start.line,
                end: event.selections[0].end.line
            },
            timestamp: Date.now(),
            languageId: event.textEditor.document.languageId
        };
        
        // Only capture meaningful selections (> 10 chars)
        if (selection.text.length > 10) {
            this.codeSelections.push(selection);
            this.pruneHistory(this.codeSelections);
        }
    }
    
    captureTerminal(terminal) {
        // Terminal might contain Copilot responses or command outputs
        console.log('📟 Terminal opened:', terminal.name);
    }
    
    captureCommand(commandId, args = []) {
        this.commandHistory.push({
            command: commandId,
            args: args,
            timestamp: Date.now()
        });
        this.pruneHistory(this.commandHistory);
    }
    
    pruneHistory(array) {
        while (array.length > this.maxHistorySize) {
            array.shift();
        }
    }
    
    // Get context for the last N minutes
    getRecentContext(minutes = 5) {
        const cutoff = Date.now() - (minutes * 60 * 1000);
        
        return {
            edits: this.recentEdits.filter(e => e.timestamp > cutoff),
            files: this.activeFiles.filter(f => f.timestamp > cutoff),
            selections: this.codeSelections.filter(s => s.timestamp > cutoff),
            commands: this.commandHistory.filter(c => c.timestamp > cutoff)
        };
    }
    
    // Infer if user is likely working with AI assistant
    inferAIAssistantUsage() {
        const recent = this.getRecentContext(2); // Last 2 minutes
        
        // Heuristics:
        // 1. Multiple file switches in short time (exploring codebase)
        // 2. Code selections followed by edits (asking then implementing)
        // 3. Rapid edits in same file (AI generating code)
        
        const rapidFileSwitches = recent.files.length > 3;
        const hasSelections = recent.selections.length > 0;
        const rapidEdits = recent.edits.length > 5;
        
        let score = 0;
        if (rapidFileSwitches) score += 0.3;
        if (hasSelections) score += 0.4;
        if (rapidEdits) score += 0.3;
        
        return {
            likelyAISession: score > 0.5,
            confidence: score,
            indicators: {
                rapidFileSwitches,
                hasSelections,
                rapidEdits
            },
            context: recent
        };
    }
    
    // Get surrounding code context for a file
    getSurroundingContext(fileName, lineNumber, contextLines = 10) {
        const editor = vscode.window.visibleTextEditors.find(
            e => e.document.fileName === fileName
        );
        
        if (!editor) return null;
        
        const doc = editor.document;
        const startLine = Math.max(0, lineNumber - contextLines);
        const endLine = Math.min(doc.lineCount - 1, lineNumber + contextLines);
        
        const range = new vscode.Range(
            new vscode.Position(startLine, 0),
            new vscode.Position(endLine, 0)
        );
        
        return {
            text: doc.getText(range),
            startLine: startLine,
            endLine: endLine,
            currentLine: lineNumber,
            functionName: this.getFunctionName(doc, lineNumber)
        };
    }
    
    // Try to extract function/class name at line
    getFunctionName(document, lineNumber) {
        // Simple heuristic - look backwards for function/class definition
        for (let i = lineNumber; i >= Math.max(0, lineNumber - 20); i--) {
            const line = document.lineAt(i).text;
            
            // Match common patterns
            const patterns = [
                /function\s+(\w+)/,
                /const\s+(\w+)\s*=/,
                /let\s+(\w+)\s*=/,
                /class\s+(\w+)/,
                /def\s+(\w+)/,  // Python
                /func\s+(\w+)/,  // Go
                /fn\s+(\w+)/     // Rust
            ];
            
            for (const pattern of patterns) {
                const match = line.match(pattern);
                if (match) {
                    return match[1];
                }
            }
        }
        
        return null;
    }
    
    // Build a rich context snapshot
    buildContextSnapshot() {
        const activeEditor = vscode.window.activeTextEditor;
        
        return {
            timestamp: Date.now(),
            workspace: vscode.workspace.name,
            activeFile: activeEditor ? {
                fileName: activeEditor.document.fileName,
                languageId: activeEditor.document.languageId,
                lineCount: activeEditor.document.lineCount,
                selection: activeEditor.selection,
                visibleRange: activeEditor.visibleRanges[0]
            } : null,
            recentActivity: {
                edits: this.recentEdits.slice(-10),
                fileSwitches: this.activeFiles.slice(-5),
                selections: this.codeSelections.slice(-5),
                commands: this.commandHistory.slice(-10)
            },
            aiUsageInference: this.inferAIAssistantUsage()
        };
    }
    
    // Clear history
    clearHistory() {
        this.recentEdits = [];
        this.activeFiles = [];
        this.codeSelections = [];
        this.commandHistory = [];
    }
    
    // Export for debugging
    exportHistory() {
        return {
            edits: this.recentEdits,
            files: this.activeFiles,
            selections: this.codeSelections,
            commands: this.commandHistory
        };
    }
}

module.exports = EditorContextCapture;
