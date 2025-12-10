# Contributing to MemoryForge 🤝

Thank you for your interest in contributing! MemoryForge is a revolutionary AI memory system, and we welcome contributions from everyone.

## 🎯 Ways to Contribute

### 1. Report Bugs
Found a bug? Open an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Browser/OS information
- Screenshots (if applicable)

### 2. Suggest Features
Have an idea? We'd love to hear it!
- Open a feature request issue
- Describe the use case
- Explain why it would be valuable
- Consider implementation details

### 3. Improve Documentation
- Fix typos or unclear explanations
- Add examples
- Translate to other languages
- Create tutorials or guides

### 4. Write Code
- Fix bugs
- Implement new features
- Improve performance
- Add tests

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome/Edge recommended)
- Python 3.x (for local server) OR Node.js
- Git
- Text editor (VS Code recommended)

### Setup Development Environment

1. **Fork the repository**
   ```powershell
   # Click "Fork" on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/memoryforge.git
   cd memoryforge
   ```

2. **Create a branch**
   ```powershell
   git checkout -b feature/your-feature-name
   ```

3. **Start local server**
   ```powershell
   python -m http.server 8000
   ```

4. **Open in browser**
   ```
   http://localhost:8000
   ```

5. **Make your changes**
   - Edit files in `src/`
   - Test thoroughly in browser
   - Check console for errors (F12)

6. **Test your changes**
   - Test in multiple browsers
   - Test with large datasets
   - Check dark mode
   - Verify mobile responsive

7. **Commit and push**
   ```powershell
   git add .
   git commit -m "feat: add amazing feature"
   git push origin feature/your-feature-name
   ```

8. **Create Pull Request**
   - Go to GitHub
   - Click "New Pull Request"
   - Describe your changes
   - Link related issues

## 📝 Coding Guidelines

### Code Style

**JavaScript**
- Use ES6+ features (const/let, arrow functions, async/await)
- 2 spaces for indentation
- Semicolons required
- camelCase for variables and functions
- PascalCase for classes
- UPPER_CASE for constants

**Example:**
```javascript
class MemoryForge {
  constructor(options = {}) {
    this.config = {
      dbName: options.dbName || 'MemoryForgeDB',
      ...options
    };
  }
  
  async init() {
    try {
      await this.initializeDatabase();
    } catch (error) {
      console.error('Initialization failed:', error);
    }
  }
}
```

**CSS**
- Use CSS variables for theming
- Mobile-first approach
- BEM-like naming for components
- Group related properties

**Example:**
```css
.chat-container {
  max-width: 800px;
  margin: 0 auto;
}

.chat-message {
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
}

.chat-message--user {
  background: var(--accent);
  color: white;
}
```

### File Organization

```
src/
├── core/                    # Core algorithms
│   ├── MemoryForge.js      # Main integrator
│   ├── storage/            # Storage layer
│   ├── intelligence/       # AI algorithms
│   └── compression/        # Compression algorithms
├── ui/                     # UI components (future)
├── utils/                  # Utility functions
└── app.js                  # Main UI controller
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `style:` - Code style (formatting, etc.)
- `refactor:` - Code refactoring
- `perf:` - Performance improvement
- `test:` - Adding tests
- `chore:` - Maintenance tasks

**Examples:**
```
feat: add graph visualization component
fix: resolve IndexedDB initialization race condition
docs: update API documentation for SemanticFingerprint
perf: optimize hot cache lookup to <5ms
```

## 🧪 Testing

### Manual Testing Checklist

Before submitting PR, verify:

**Functionality**
- [ ] Feature works as expected
- [ ] No console errors
- [ ] No breaking changes to existing features
- [ ] Export/import still works
- [ ] Dark mode works

**Performance**
- [ ] No memory leaks
- [ ] Fast query times (<50ms for hot cache)
- [ ] Compression ratios maintained
- [ ] No UI lag

**Compatibility**
- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Works in Edge
- [ ] Works in Safari
- [ ] Mobile responsive

**Data Integrity**
- [ ] Data persists after refresh
- [ ] Import/export maintains data
- [ ] No data corruption

### Automated Tests (Coming Soon)

```javascript
// Example test structure
describe('SemanticFingerprint', () => {
  it('should create fingerprint with correct hash', () => {
    const fp = new SemanticFingerprint();
    const result = fp.fingerprint('test message');
    expect(result.hash).toBeLessThan(1000);
  });
  
  it('should calculate similarity correctly', () => {
    const fp = new SemanticFingerprint();
    const fp1 = fp.fingerprint('machine learning');
    const fp2 = fp.fingerprint('AI and ML');
    const similarity = fp.similarity(fp1, fp2);
    expect(similarity).toBeGreaterThan(0.5);
  });
});
```

## 🎨 UI/UX Guidelines

### Design Principles
1. **Simple**: Easy to understand and use
2. **Fast**: No unnecessary loading or lag
3. **Beautiful**: Clean, modern design
4. **Accessible**: Works for everyone
5. **Responsive**: Looks great on all devices

### Adding New UI Components

1. Add HTML structure in `index.html`
2. Add styles in `public/styles/main.css`
3. Add logic in `src/app.js`
4. Support dark mode (use CSS variables)
5. Make mobile responsive
6. Test accessibility (keyboard navigation, screen readers)

## 🏗️ Architecture Guidelines

### Core Principles

1. **Zero Dependencies**: Don't add npm packages
2. **Vanilla JS**: No frameworks (React, Vue, etc.)
3. **Browser APIs**: Use native browser features
4. **Modular**: Each file should have single responsibility
5. **Performance**: Optimize for speed

### Adding New Algorithms

If adding a new algorithm:

1. Create file in appropriate directory
2. Document algorithm in header comments
3. Include complexity analysis
4. Add performance metrics
5. Compare to alternatives
6. Update README.md

**Template:**
```javascript
/**
 * YourAlgorithm - Brief Description
 * 
 * Problem: What problem does this solve?
 * Solution: How does it solve it?
 * 
 * Benefits:
 * - Benefit 1
 * - Benefit 2
 * 
 * Complexity: O(n log n)
 * 
 * @class YourAlgorithm
 */
class YourAlgorithm {
  constructor() {
    // Initialize
  }
  
  yourMethod() {
    // Implementation
  }
  
  getStats() {
    // Return performance metrics
  }
}

export default YourAlgorithm;
```

## 📚 Documentation

### Inline Documentation

- Add JSDoc comments for all public methods
- Explain complex algorithms
- Include examples

**Example:**
```javascript
/**
 * Calculate similarity between two fingerprints
 * 
 * @param {Object} fp1 - First fingerprint
 * @param {Object} fp2 - Second fingerprint
 * @returns {number} Similarity score (0-1)
 * 
 * @example
 * const fp1 = fingerprint('hello world');
 * const fp2 = fingerprint('hello there');
 * const sim = similarity(fp1, fp2); // 0.65
 */
similarity(fp1, fp2) {
  // Implementation
}
```

### README Updates

When adding features, update:
- Feature list
- Usage examples
- API documentation
- Benchmarks (if applicable)

## 🐛 Bug Fixes

### Bug Fix Process

1. **Reproduce the bug**
   - Understand the issue
   - Create minimal reproduction case
   - Document steps

2. **Identify root cause**
   - Use browser dev tools
   - Check console errors
   - Review stack traces

3. **Implement fix**
   - Fix the root cause, not symptoms
   - Add defensive checks if needed
   - Update tests

4. **Verify fix**
   - Test the specific bug
   - Run full test suite
   - Check for regressions

5. **Document**
   - Update changelog
   - Add comments if complex
   - Update docs if needed

## 🚀 Feature Development

### Feature Process

1. **Discuss first**
   - Open issue to discuss idea
   - Get feedback from maintainers
   - Agree on approach

2. **Design**
   - Plan architecture
   - Consider edge cases
   - Think about performance

3. **Implement**
   - Break into small commits
   - Write tests alongside code
   - Document as you go

4. **Review**
   - Self-review before submitting
   - Address PR feedback
   - Iterate until approved

## 🎯 Priority Areas

Looking for where to contribute? These areas need help:

### High Priority
- **Unit tests**: We need test coverage!
- **Graph visualization**: D3.js or Canvas-based graph viewer
- **Mobile optimization**: Better mobile UX
- **Performance**: Optimize query times
- **Documentation**: More examples and tutorials

### Medium Priority
- **AI integrations**: ChatGPT/Claude/Ollama examples
- **Browser extensions**: Chrome/Firefox extensions
- **P2P sync**: WebRTC-based sync between devices
- **Advanced search**: Filters, date ranges, etc.

### Nice to Have
- **Themes**: More color themes
- **Keyboard shortcuts**: Power user features
- **Voice input**: Speech-to-text
- **Notifications**: Desktop notifications for events

## 💬 Communication

### Where to Ask Questions

- **General questions**: [GitHub Discussions](https://github.com/yourusername/memoryforge/discussions)
- **Bug reports**: [GitHub Issues](https://github.com/yourusername/memoryforge/issues)
- **Feature requests**: [GitHub Issues](https://github.com/yourusername/memoryforge/issues)
- **Security issues**: Email directly (see SECURITY.md)

### Be Respectful

- Be kind and welcoming
- Respect different viewpoints
- Accept constructive criticism gracefully
- Focus on what's best for the project

## 🏆 Recognition

Contributors will be:
- Listed in README.md
- Credited in release notes
- Given shoutouts on social media
- Considered for maintainer role

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to MemoryForge!** 🙏

Every contribution, no matter how small, makes a difference. We appreciate your time and effort in making MemoryForge better for everyone.

Questions? Open an issue or discussion. We're here to help!
