# Scripture Studio — Risk Register & Mitigation Matrix

**Document Version:** 1.0.0  
**Status:** Approved for Architecture Review (Milestone M0)  
**Risk Categories:** Legal & Licensing, System Architecture, Windows Hardware & Multi-Monitor, Live Broadcast, Performance  

---

## 1. Risk Evaluation Matrix

| Risk ID | Category | Description | Prob. | Impact | Severity | Mitigation Strategy |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| **RSK-01** | Legal / IP | Accidental reverse engineering of proprietary binaries or copying protected BibleShow assets. | Low | High | **Critical** | Strict clean-room implementation. Zero decompilation, disassembly, or asset extraction of BibleShow.exe. All code and designs created independently. |
| **RSK-02** | Legal / IP | Distribution of copyrighted Bible translations without explicit publisher rights. | Med | High | **High** | Ship only public-domain or open-licensed translations (e.g. KJV, ASV, WEB, Cornilescu PD). Explicit licensing metadata and attribution ledger for all user-imported modules. |
| **RSK-03** | Windows OS | Mixed-DPI scaling across multi-monitor setups causing window offset or blurriness on projectors. | High | High | **High** | Use physical pixel coordinate bounds from Electron `screen.getDisplayMatching()`; enable Per-Monitor V2 DPI awareness in Electron process. |
| **RSK-04** | Hardware | External projector or HDMI cable disconnects during a live church service. | High | High | **High** | Dedicated disconnect handler in `DisplayManager`. Cleanly hide disconnected output window; preserve active state in memory; prompt to restore upon reconnect without crashing. |
| **RSK-05** | Performance | Video memory leak or CPU spike during continuous 4-hour looping background video. | Med | High | **High** | Use hardware-accelerated Chromium HTML5 video with explicit garbage collection and asset reuse in `MediaEngine`. Tested with endurance memory profiling. |
| **RSK-06** | Concurrency | Rapid operator keystrokes creating race conditions in presentation state transitions. | Med | Med | **Medium** | Centralized `PresentationController` serializes incoming commands via an internal FIFO Promise queue. Atomic state transitions with event bus confirmation. |
| **RSK-07** | Integration | Host machine lacks NewTek NDI runtime, causing application crash or startup failure. | High | Med | **Medium** | Abstract NDI behind `INdiAdapter` interface with dynamic runtime loading. If NDI libraries are absent, fall back gracefully to a disabled/null adapter with diagnostic warning. |
| **RSK-08** | Broadcast | File locking contention when OBS Studio or vMix reads `current_slide.png` or `current_verse.xml` while being written. | High | Med | **Medium** | Atomic write-and-replace strategy: Write to temporary file (`current_slide.png.tmp`) and perform atomic filesystem rename (`renameSync`), preventing partial read locks. |
| **RSK-09** | Data | SQLite database corruption due to sudden power loss during a live service. | Low | High | **Medium** | Enable SQLite WAL (Write-Ahead Logging) mode and `synchronous = NORMAL`. Automatic startup integrity check and automatic database backup snapshots. |
| **RSK-10** | Domain | Versification discrepancies across different translations during multi-version comparison. | Med | Med | **Medium** | Canonical book-chapter-verse alignment metadata table (`versification_alignments`). Fallback warning displayed if a specific translation omits a compared verse. |

---

## 2. In-Depth Technical Mitigation Strategies

### 2.1 Mixed-DPI Windows Multi-Monitor Rendering (RSK-03)
On Windows 10/11, when an operator's laptop has a 4K display scaled at 150% or 200%, but the sanctuary projector is 1080p at 100%, Chromium standard windows can experience blurriness or incorrect coordinate offsets.
* **Mitigation Implementation:**
  ```typescript
  // In Electron Main process before app.ready
  app.commandLine.appendSwitch('high-dpi-support', '1');
  app.commandLine.appendSwitch('force-device-scale-factor', '1');
  
  // Window placement using dipRect to physical pixel conversion:
  const targetDisplay = screen.getAllDisplays().find(d => d.id === targetDisplayId);
  const bounds = targetDisplay.bounds;
  audienceWindow.setBounds({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height
  });
  ```

### 2.2 NDI Native Dynamic Linking (RSK-07)
The NewTek NDI SDK requires native DLLs (`Processing.NDI.Lib.x64.dll`). If a user runs Scripture Studio on a church machine without installing the NDI runtime, direct static linking would crash the entire application upon startup.
* **Mitigation Implementation:**
  The `streaming-engine` package probes for NDI runtime presence dynamically at runtime:
  ```typescript
  export class NdiAdapterFactory {
    static create(): INdiAdapter {
      try {
        if (NdiNativeModule.isRuntimeAvailable()) {
          return new NativeNdiAdapter();
        }
      } catch (err) {
        logger.warn('NDI runtime not detected. Running in Fallback Null Mode.');
      }
      return new NullNdiAdapter();
    }
  }
  ```

### 2.3 Atomic Disk Export for External Broadcast Switchers (RSK-08)
External video mixers like vMix or OBS monitor folders for changed images. If Scripture Studio writes a 2MB PNG file directly to disk, vMix may attempt to read the file while the write stream is only 40% complete, causing a file read error or visual glitch on the live broadcast.
* **Mitigation Implementation:**
  ```typescript
  export function atomicWriteFileSync(finalPath: string, buffer: Buffer): void {
    const tempPath = `${finalPath}.tmp.${Date.now()}`;
    fs.writeFileSync(tempPath, buffer);
    fs.renameSync(tempPath, finalPath); // Atomic OS file swap
  }
  ```

