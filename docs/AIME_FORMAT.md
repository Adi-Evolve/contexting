# .aime Format Specification

**AI Memory Export (AIME) Format v1.0**

Universal, portable format for exporting and importing AI conversation memories across different systems.

## 📋 Overview

The AIME format is a JSON-based specification designed to enable seamless data portability between AI memory systems. It provides a standardized way to export, share, and import conversation histories while preserving semantic relationships, metadata, and compression benefits.

### Design Goals

1. **Universal Compatibility** - Works across all AI memory systems
2. **Human Readable** - JSON format for easy inspection and editing
3. **Lossless Export** - Preserves all data and relationships
4. **Compression Support** - Optional compression for large exports
5. **Version Control** - Built-in versioning for future compatibility
6. **Privacy First** - Optional encryption for sensitive data

## 📄 Format Structure

### Basic Structure

```json
{
  "format": "aime",
  "version": "1.0",
  "metadata": {
    "created": "2025-12-04T10:00:00Z",
    "source": "MemoryForge v1.0",
    "author": "user@example.com",
    "description": "My learning journal export",
    "messageCount": 150,
    "dateRange": {
      "start": "2025-01-01T00:00:00Z",
      "end": "2025-12-04T10:00:00Z"
    },
    "tags": ["personal", "learning", "ai"],
    "compressed": false,
    "encrypted": false
  },
  "messages": [],
  "graph": {},
  "compression": {},
  "extensions": {}
}
```

## 📦 Core Sections

### 1. Metadata

Required information about the export.

```json
"metadata": {
  "created": "ISO 8601 timestamp",
  "source": "System name and version",
  "author": "User identifier (optional)",
  "description": "Export description",
  "messageCount": 150,
  "dateRange": {
    "start": "ISO 8601 timestamp",
    "end": "ISO 8601 timestamp"
  },
  "tags": ["tag1", "tag2"],
  "compressed": false,
  "encrypted": false,
  "checksum": "SHA-256 hash (optional)"
}
```

### 2. Messages

Array of conversation messages with full context.

```json
"messages": [
  {
    "id": "msg_abc123",
    "timestamp": "2025-12-04T10:00:00Z",
    "role": "user",
    "content": "What is machine learning?",
    "metadata": {
      "session": "session_001",
      "platform": "web",
      "language": "en",
      "tags": ["question", "ml"]
    },
    "nlp": {
      "entities": {
        "terms": ["machine learning"],
        "people": [],
        "places": [],
        "urls": [],
        "emails": []
      },
      "sentiment": {
        "score": 0.0,
        "label": "neutral"
      },
      "intent": "question",
      "keywords": ["machine", "learning"]
    },
    "fingerprint": {
      "hash": "a1b2c3d4",
      "terms": ["machine", "learning"],
      "buckets": [1, 5, 12, 45]
    }
  },
  {
    "id": "msg_abc124",
    "timestamp": "2025-12-04T10:00:01Z",
    "role": "assistant",
    "content": "Machine learning is...",
    "metadata": {
      "session": "session_001",
      "model": "claude-sonnet-4.5",
      "tokens": 150
    },
    "relationships": [
      {
        "type": "RESPONDS_TO",
        "target": "msg_abc123",
        "strength": 1.0
      }
    ]
  }
]
```

### 3. Graph

Temporal knowledge graph structure.

```json
"graph": {
  "nodes": [
    {
      "id": "node_001",
      "messageId": "msg_abc123",
      "timestamp": "2025-12-04T10:00:00Z",
      "type": "concept",
      "label": "Machine Learning",
      "metadata": {}
    }
  ],
  "edges": [
    {
      "id": "edge_001",
      "source": "node_001",
      "target": "node_002",
      "type": "UPDATES",
      "strength": 0.95,
      "timestamp": "2025-12-04T10:00:01Z",
      "metadata": {}
    }
  ],
  "relationshipTypes": [
    "UPDATES",
    "EXTENDS", 
    "DERIVES",
    "CAUSES",
    "CONTRADICTS",
    "SUPPORTS"
  ]
}
```

### 4. Compression

Compression metadata and compressed data (optional).

```json
"compression": {
  "enabled": true,
  "algorithm": "multi-level",
  "stages": [
    {
      "name": "semantic",
      "ratio": 0.95,
      "metadata": {}
    },
    {
      "name": "lzw",
      "ratio": 0.70,
      "metadata": {}
    }
  ],
  "totalRatio": 0.997,
  "originalSize": 50000000,
  "compressedSize": 150000,
  "snapshots": [
    {
      "id": "snap_001",
      "timestamp": "2025-12-01T00:00:00Z",
      "messageCount": 100,
      "hash": "abc123"
    }
  ]
}
```

### 5. Extensions

Custom extensions for system-specific features.

```json
"extensions": {
  "memoryforge": {
    "version": "1.0",
    "features": ["causal-tracking", "differential-compression"],
    "statistics": {
      "hotTierMessages": 10,
      "warmTierMessages": 100,
      "coldTierMessages": 40
    }
  },
  "custom": {
    "key": "value"
  }
}
```

## 🔐 Encryption (Optional)

For sensitive data exports:

```json
{
  "format": "aime",
  "version": "1.0",
  "metadata": {
    "encrypted": true,
    "encryption": {
      "algorithm": "AES-256-GCM",
      "keyDerivation": "PBKDF2",
      "iterations": 100000,
      "salt": "base64_encoded_salt",
      "iv": "base64_encoded_iv"
    }
  },
  "data": "encrypted_base64_encoded_payload"
}
```

## 📏 Field Specifications

### Message Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Unique message identifier |
| timestamp | ISO 8601 | Yes | Message creation time |
| role | string | Yes | "user", "assistant", "system" |
| content | string | Yes | Message content |
| metadata | object | No | Additional metadata |
| nlp | object | No | NLP analysis results |
| fingerprint | object | No | Semantic fingerprint |
| relationships | array | No | Related messages |

### Graph Node Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Unique node identifier |
| messageId | string | No | Reference to message |
| timestamp | ISO 8601 | Yes | Node creation time |
| type | string | Yes | "concept", "event", "entity" |
| label | string | Yes | Human-readable label |
| metadata | object | No | Additional metadata |

### Graph Edge Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Unique edge identifier |
| source | string | Yes | Source node ID |
| target | string | Yes | Target node ID |
| type | string | Yes | Relationship type |
| strength | number | Yes | 0.0 to 1.0 |
| timestamp | ISO 8601 | Yes | Edge creation time |
| metadata | object | No | Additional metadata |

## 🔄 Version Compatibility

### Version 1.0 (Current)

- Initial specification
- Core message and graph support
- Optional compression
- Optional encryption

### Future Versions

Version updates will:
1. Maintain backward compatibility
2. Add new optional fields
3. Never break existing exports
4. Follow semantic versioning

Migration path:
```javascript
function migrateAIME(data) {
  const version = parseFloat(data.version);
  
  if (version < 1.0) {
    // Upgrade to 1.0
    data.version = "1.0";
    // Add required fields
  }
  
  if (version < 2.0) {
    // Future upgrade logic
  }
  
  return data;
}
```

## 📤 Export Example

### Minimal Export

```json
{
  "format": "aime",
  "version": "1.0",
  "metadata": {
    "created": "2025-12-04T10:00:00Z",
    "source": "MemoryForge v1.0",
    "messageCount": 2
  },
  "messages": [
    {
      "id": "1",
      "timestamp": "2025-12-04T09:00:00Z",
      "role": "user",
      "content": "Hello"
    },
    {
      "id": "2",
      "timestamp": "2025-12-04T09:00:01Z",
      "role": "assistant",
      "content": "Hi! How can I help?"
    }
  ]
}
```

### Full Export

```json
{
  "format": "aime",
  "version": "1.0",
  "metadata": {
    "created": "2025-12-04T10:00:00Z",
    "source": "MemoryForge v1.0",
    "author": "user@example.com",
    "description": "Complete conversation history",
    "messageCount": 150,
    "dateRange": {
      "start": "2025-01-01T00:00:00Z",
      "end": "2025-12-04T10:00:00Z"
    },
    "tags": ["learning", "ai", "programming"],
    "compressed": true,
    "checksum": "abc123def456"
  },
  "messages": [...],
  "graph": {
    "nodes": [...],
    "edges": [...]
  },
  "compression": {
    "enabled": true,
    "totalRatio": 0.997,
    "originalSize": 50000000,
    "compressedSize": 150000
  },
  "extensions": {
    "memoryforge": {
      "version": "1.0",
      "statistics": {...}
    }
  }
}
```

## 📥 Import Guidelines

### Validation

```javascript
function validateAIME(data) {
  // Check required fields
  if (data.format !== 'aime') {
    throw new Error('Invalid format');
  }
  
  if (!data.version || !data.metadata || !data.messages) {
    throw new Error('Missing required fields');
  }
  
  // Validate version
  const version = parseFloat(data.version);
  if (version > CURRENT_VERSION) {
    console.warn('Future version detected, some features may not be supported');
  }
  
  // Validate messages
  for (const msg of data.messages) {
    if (!msg.id || !msg.timestamp || !msg.role || !msg.content) {
      throw new Error('Invalid message structure');
    }
  }
  
  return true;
}
```

### Import Process

```javascript
async function importAIME(fileData) {
  // 1. Parse JSON
  const data = JSON.parse(fileData);
  
  // 2. Validate
  validateAIME(data);
  
  // 3. Decrypt if needed
  if (data.metadata.encrypted) {
    data = await decryptAIME(data, password);
  }
  
  // 4. Decompress if needed
  if (data.metadata.compressed) {
    data = await decompressAIME(data);
  }
  
  // 5. Migrate version if needed
  if (parseFloat(data.version) < CURRENT_VERSION) {
    data = migrateAIME(data);
  }
  
  // 6. Import messages
  for (const message of data.messages) {
    await storage.add(message);
  }
  
  // 7. Import graph
  if (data.graph) {
    await importGraph(data.graph);
  }
  
  // 8. Process extensions
  if (data.extensions) {
    await processExtensions(data.extensions);
  }
  
  return {
    success: true,
    messageCount: data.messages.length
  };
}
```

## 🔗 Compatibility Matrix

| System | Export | Import | Notes |
|--------|--------|--------|-------|
| MemoryForge | ✅ | ✅ | Full support |
| Supermemory | 🔄 | 🔄 | Adapter needed |
| Mem0 | 🔄 | 🔄 | Adapter needed |
| Zep | 🔄 | 🔄 | Adapter needed |
| ChatGPT | ⚠️ | ✅ | No official export |
| Claude | ⚠️ | ✅ | No official export |

Legend:
- ✅ Native support
- 🔄 Requires adapter
- ⚠️ Limited support

## 🛠 Tools & Adapters

### MemoryForge Export

```javascript
const memoryForge = new MemoryForge();
const aimeData = await memoryForge.export('aime');

// Save to file
const blob = new Blob([JSON.stringify(aimeData, null, 2)], 
  { type: 'application/json' });
const url = URL.createObjectURL(blob);
// Download...
```

### MemoryForge Import

```javascript
const memoryForge = new MemoryForge();

// From file
const file = await selectFile();
const text = await file.text();
const aimeData = JSON.parse(text);

await memoryForge.import(aimeData);
```

### Conversion Adapters

```javascript
// Convert ChatGPT export to AIME
function chatgptToAIME(chatgptData) {
  return {
    format: 'aime',
    version: '1.0',
    metadata: {
      created: new Date().toISOString(),
      source: 'ChatGPT',
      messageCount: chatgptData.length
    },
    messages: chatgptData.map(msg => ({
      id: msg.id,
      timestamp: msg.create_time,
      role: msg.author.role,
      content: msg.content.parts.join('\n')
    }))
  };
}
```

## 📚 Best Practices

### 1. Regular Exports

```javascript
// Export weekly
setInterval(async () => {
  const aimeData = await memoryForge.export('aime');
  await saveToCloud(aimeData);
}, 7 * 24 * 60 * 60 * 1000);
```

### 2. Incremental Exports

```javascript
// Export only new messages
const lastExport = await getLastExportTimestamp();
const aimeData = await memoryForge.exportSince(lastExport);
```

### 3. Compression for Large Exports

```javascript
// Enable compression for >1000 messages
const messageCount = await memoryForge.getMessageCount();
const compress = messageCount > 1000;

const aimeData = await memoryForge.export('aime', { compress });
```

### 4. Encryption for Sensitive Data

```javascript
// Encrypt exports containing personal info
const aimeData = await memoryForge.export('aime');

if (containsSensitiveData(aimeData)) {
  const encrypted = await encryptAIME(aimeData, password);
  await saveExport(encrypted);
}
```

## 🔮 Future Extensions

Planned for v2.0:

1. **Multimedia Support** - Images, audio, video attachments
2. **Collaboration Metadata** - Multi-user conversation tracking
3. **Schema Validation** - JSON Schema for validation
4. **Streaming Export** - Large dataset support
5. **Partial Imports** - Selective message importing
6. **Merge Strategies** - Conflict resolution for imports

## 📄 License

The AIME format specification is released under CC0 (Public Domain) to ensure maximum compatibility and adoption across all AI memory systems.

## 🤝 Contributing

To propose changes to the AIME specification:

1. Open an issue describing the use case
2. Provide example JSON showing proposed changes
3. Demonstrate backward compatibility
4. Get community feedback
5. Submit specification update

## 📞 Support

- **Specification Issues**: GitHub Issues
- **Implementation Help**: GitHub Discussions
- **Format Registry**: Submit your system to compatibility matrix

---

**Version**: 1.0  
**Last Updated**: December 4, 2025  
**Status**: Stable  
**License**: CC0 (Public Domain)
