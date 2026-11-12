# Scripture Studio — Desktop Security & Hardening Model

**Document Version:** 1.0.0  
**Status:** Approved for Architecture Review (Milestone M0)  
**Security Framework:** Electron Security Checklist + Chromium Sandboxing  

---

## 1. Threat Modeling & Security Posture

Scripture Studio operates in a local desktop environment where reliability, data integrity, and host system protection are paramount. The threat landscape includes:
- **Malicious Bible Module or Theme Asset:** Injection of malicious scripts or malformed XML/JSON designed to exploit parsing vulnerabilities or escape the Chromium sandbox.
- **IPC Exploitation:** Rogue renderer compromise attempting to execute arbitrary shell commands or access sensitive filesystem directories.
- **Unintended Egress / Data Leakage:** Uncontrolled network requests transmitting user presentation history, speaker notes, or proprietary translations to third parties.

---

## 2. Electron Hardening Configuration

Every `BrowserWindow` instance in Scripture Studio is initialized with the strictest security parameters:

```typescript
const window = new BrowserWindow({
  webPreferences: {
    // 1. Mandatory Context Isolation
    contextIsolation: true,

    // 2. Disable Node.js Integration in all renderers
    nodeIntegration: false,
    nodeIntegrationInWorker: false,
    nodeIntegrationInSubFrames: false,

    // 3. Enable OS-level Chromium Sandboxing
    sandbox: true,

    // 4. Enforce Web Security
    webSecurity: true,
    allowRunningInsecureContent: false,

    // 5. Disable legacy and unsafe features
    webviewTag: false,

    // 6. Preload script restricted to typed bridge
    preload: path.join(__dirname, '../preload/index.js'),
  },
});
```

### 2.1 Navigation & Window Creation Guards
Scripture Studio renders local content only. Opening external links or opening secondary windows via `window.open` is strictly guarded:

```typescript
// Deny unexpected in-app navigation
window.webContents.on('will-navigate', (event, navigationUrl) => {
  event.preventDefault();
});

// Guard window creation: open external links in system browser
window.webContents.setWindowOpenHandler(({ url }) => {
  if (url.startsWith('https://') || url.startsWith('http://')) {
    shell.openExternal(url);
  }
  return { action: 'deny' };
});
```

---

## 3. Content Security Policy (CSP)

A strict Content Security Policy is delivered via HTTP headers in development and `<meta http-equiv="Content-Security-Policy">` in production builds:

```http
default-src 'none';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data: asset:;
media-src 'self' asset:;
font-src 'self' data:;
connect-src 'self' ws://127.0.0.1:*;
base-uri 'none';
form-action 'none';
frame-ancestors 'none';
```

---

## 4. Custom Asset Protocol (`asset://`)

To prevent arbitrary filesystem reads while allowing themes to load background images and looping video clips, Scripture Studio registers a privileged, scoped custom protocol:

```typescript
protocol.handle('asset', (request) => {
  const assetUrl = new URL(request.url);
  const assetId = assetUrl.pathname.replace(/^\//, '');

  // 1. Validate asset ID against verified theme_assets database
  const assetRecord = themeAssetRepo.getById(assetId);
  if (!assetRecord) {
    return new Response('Asset Not Found', { status: 404 });
  }

  // 2. Strict path confinement: asset must reside inside appData/assets
  const safePath = path.resolve(app.getPath('userData'), 'assets', assetRecord.fileName);
  if (!safePath.startsWith(path.resolve(app.getPath('userData'), 'assets'))) {
    return new Response('Access Denied', { status: 403 });
  }

  return net.fetch(pathToFileURL(safePath).toString());
});
```

---

## 5. IPC Input Validation & Sanitation

1. **Schema Validation:** Every IPC request handler parses incoming arguments through a strict Zod schema before dispatching to services:
   ```typescript
   const PreviewReferenceSchema = z.object({
     versionId: z.string().min(1).max(64),
     bookId: z.string().min(1).max(64),
     chapter: z.number().int().positive(),
     verse: z.number().int().positive(),
     endVerse: z.number().int().positive().optional(),
     themeId: z.string().uuid().optional(),
   });
   ```
2. **Path Traversal Guards:** File paths passed during Bible import or export operations are canonicalized using `path.resolve()` and checked against permissible operating directories.

---

## 6. Data Integrity & License Protection

1. **Attribution & Licensing Ledger:** Every Bible version imported into Scripture Studio retains immutable licensing and copyright metadata displayed on demand.
2. **Clean-Room Enforcement:** Scripture Studio does not decrypt or read encrypted proprietary file formats from closed commercial vendors, upholding intellectual property laws.
3. **Local Storage Privacy:** All presentation history, speaker notes, and playlists reside strictly in local SQLite files with standard Windows NTFS user permissions.

