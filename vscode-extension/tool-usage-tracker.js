// Tool Usage Tracker
// Tracks mentions of development tools, VS Code extensions, commands, and services

class ToolUsageTracker {
    constructor() {
        // Common development tools
        this.tools = {
            versionControl: ['git', 'github', 'gitlab', 'bitbucket', 'svn', 'mercurial'],
            containers: ['docker', 'kubernetes', 'k8s', 'podman', 'containerd'],
            buildTools: ['webpack', 'vite', 'rollup', 'parcel', 'esbuild', 'babel', 'gradle', 'maven', 'make', 'cmake'],
            packageManagers: ['npm', 'yarn', 'pnpm', 'pip', 'poetry', 'cargo', 'go mod', 'composer', 'nuget'],
            testing: ['jest', 'mocha', 'pytest', 'junit', 'cypress', 'selenium', 'playwright', 'vitest'],
            cicd: ['jenkins', 'github actions', 'gitlab ci', 'circle ci', 'travis ci', 'azure pipelines'],
            cloud: ['aws', 'azure', 'gcp', 'google cloud', 'heroku', 'vercel', 'netlify', 'digitalocean'],
            databases: ['mongodb', 'postgresql', 'mysql', 'redis', 'sqlite', 'dynamodb', 'firebase', 'supabase'],
            apis: ['rest api', 'graphql', 'grpc', 'soap', 'websocket', 'postman', 'insomnia'],
            monitoring: ['sentry', 'datadog', 'new relic', 'prometheus', 'grafana', 'logstash', 'elk'],
            ides: ['vscode', 'visual studio code', 'intellij', 'pycharm', 'webstorm', 'sublime', 'atom', 'vim', 'emacs'],
            terminals: ['terminal', 'powershell', 'bash', 'zsh', 'cmd', 'wsl', 'iterm'],
            linters: ['eslint', 'prettier', 'pylint', 'black', 'rubocop', 'stylelint', 'tslint']
        };
        
        // VS Code specific
        this.vscodeExtensions = [
            'copilot', 'github copilot', 'prettier', 'eslint', 'python', 'pylance',
            'live server', 'git lens', 'gitlens', 'debugger', 'remote ssh', 'remote containers',
            'docker', 'kubernetes', 'rest client', 'thunder client', 'bracket pair colorizer',
            'indent rainbow', 'auto rename tag', 'path intellisense', 'intellisense'
        ];
        
        this.vscodeCommands = [
            'format document', 'go to definition', 'find all references', 'rename symbol',
            'quick fix', 'refactor', 'organize imports', 'toggle comment', 'toggle terminal',
            'git commit', 'git push', 'git pull', 'debug', 'run', 'build', 'test'
        ];
        
        this.vscodeFeatures = [
            'intellisense', 'code completion', 'debugging', 'terminal', 'source control',
            'extensions', 'settings', 'keybindings', 'tasks', 'workspace', 'snippets',
            'emmet', 'multi-cursor', 'split editor', 'zen mode'
        ];
    }
    
    /**
     * Track tool usage in a conversation
     * @param {Array} messages - Array of message objects
     * @returns {Object} Summary of tool usage
     */
    trackConversation(messages) {
        const usage = {
            tools: {},
            vscodeExtensions: [],
            vscodeCommands: [],
            vscodeFeatures: [],
            categories: {}
        };
        
        messages.forEach((msg, index) => {
            const content = msg.content.toLowerCase();
            
            // Track general tools by category
            Object.entries(this.tools).forEach(([category, toolList]) => {
                toolList.forEach(tool => {
                    if (content.includes(tool.toLowerCase())) {
                        if (!usage.tools[tool]) {
                            usage.tools[tool] = {
                                count: 0,
                                category: category,
                                mentions: []
                            };
                        }
                        usage.tools[tool].count++;
                        usage.tools[tool].mentions.push(index);
                        
                        // Count by category
                        usage.categories[category] = (usage.categories[category] || 0) + 1;
                    }
                });
            });
            
            // Track VS Code extensions
            this.vscodeExtensions.forEach(ext => {
                if (content.includes(ext.toLowerCase())) {
                    if (!usage.vscodeExtensions.includes(ext)) {
                        usage.vscodeExtensions.push(ext);
                    }
                }
            });
            
            // Track VS Code commands
            this.vscodeCommands.forEach(cmd => {
                if (content.includes(cmd.toLowerCase())) {
                    if (!usage.vscodeCommands.includes(cmd)) {
                        usage.vscodeCommands.push(cmd);
                    }
                }
            });
            
            // Track VS Code features
            this.vscodeFeatures.forEach(feature => {
                if (content.includes(feature.toLowerCase())) {
                    if (!usage.vscodeFeatures.includes(feature)) {
                        usage.vscodeFeatures.push(feature);
                    }
                }
            });
        });
        
        return usage;
    }
    
    /**
     * Generate a formatted summary of tool usage
     * @param {Object} usage - Tool usage data from trackConversation()
     * @returns {string} Markdown formatted summary
     */
    generateSummary(usage) {
        let summary = '';
        
        // General tools
        const toolEntries = Object.entries(usage.tools);
        if (toolEntries.length > 0) {
            summary += '**Development Tools:**\n';
            
            toolEntries
                .sort((a, b) => b[1].count - a[1].count)
                .slice(0, 10)
                .forEach(([tool, data]) => {
                    summary += `- ${tool} (${data.count}x, ${data.category})\n`;
                });
            
            summary += '\n';
        }
        
        // VS Code extensions
        if (usage.vscodeExtensions.length > 0) {
            summary += '**VS Code Extensions:**\n';
            usage.vscodeExtensions.forEach(ext => {
                summary += `- ${ext}\n`;
            });
            summary += '\n';
        }
        
        // VS Code commands
        if (usage.vscodeCommands.length > 0) {
            summary += '**VS Code Commands:**\n';
            usage.vscodeCommands.forEach(cmd => {
                summary += `- ${cmd}\n`;
            });
            summary += '\n';
        }
        
        // VS Code features
        if (usage.vscodeFeatures.length > 0) {
            summary += '**VS Code Features:**\n';
            usage.vscodeFeatures.forEach(feature => {
                summary += `- ${feature}\n`;
            });
            summary += '\n';
        }
        
        // Category breakdown
        const categoryEntries = Object.entries(usage.categories);
        if (categoryEntries.length > 0) {
            summary += '**Tool Categories:**\n';
            categoryEntries
                .sort((a, b) => b[1] - a[1])
                .forEach(([category, count]) => {
                    summary += `- ${category}: ${count} mentions\n`;
                });
        }
        
        if (summary === '') {
            return 'No specific tools mentioned.';
        }
        
        return summary.trim();
    }
    
    /**
     * Get the primary tool category
     * @param {Object} usage - Tool usage data
     * @returns {string|null} Primary category name
     */
    getPrimaryCategory(usage) {
        const entries = Object.entries(usage.categories);
        if (entries.length === 0) return null;
        
        entries.sort((a, b) => b[1] - a[1]);
        return entries[0][0];
    }
}

// Export for use in Node.js or browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ToolUsageTracker;
}
