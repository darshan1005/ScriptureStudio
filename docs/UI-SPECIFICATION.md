# Scripture Studio — UI/UX Specification & Interaction Design

**Document Version:** 1.0.0  
**Status:** Approved for Architecture Review (Milestone M0)  
**Target Environments:** Control Studio (Operator Desktop), Audience Display (Projector), Stage Display (Confidence Monitor)  

---

## 1. Visual Design Philosophy & Ergonomics

Scripture Studio is designed as a **mission-critical desktop control room**. Sunday morning operators frequently handle multiple tasks under fast-paced live service conditions (listening to a dynamic speaker, selecting upcoming verses, adjusting themes, managing live streams).
* **High Information Density with Visual Hierarchy:** Key controls (`Take Live`, `Next`, `Freeze`, `Hide`) are immediately accessible with distinct color-coding.
* **Dark Mode Default:** Reduces operator eye fatigue in dim church media booths; avoids light pollution from operator laptops into sanctuary seating.
* **Keyboard-First Workflow:** Every primary action has a single-keystroke or hotkey binding (`F5`, `F9`, `F10`, `F11`, `F12`, `Enter`, arrows).
* **Fail-Safe Visual States:** Bold, unambiguous indicators displaying whether the audience output is `LIVE` (Red/Green), `FROZEN` (Cyan/Amber), or `HIDDEN` (Dark Grey).

---

## 2. Control Studio Layout (Primary Operator Window)

```
+------------------------------------------------------------------------------------------------------+
| Scripture Studio [Project: Sunday Morning]                     [Display 2: LIVE] [NDI: ON] [-] [口] [X] |
+--------+------------------------------------------+--------------------------------------------------+
| (L)    | (MAIN CONTENT WORKSPACE)                 | (RIGHT CONTROL PANEL)                            |
| SIDE   |                                          |                                                  |
| BAR    | [Quick Reference: Rom 8:28      ] [Go]   | +----------------------------------------------+ |
|        |                                          | | PREVIEW PANE                                 | |
| [Home] | Bible Navigation:                        | |  Romans 8:28 (KJV)                           | |
| [Bible]| [OT] [NT] | [Romans            v] [ 8 v] | |  "And we know that all things work           | |
| [Search|------------------------------------------| |   together for good to them that love        | |
| [Prog] | 26  Likewise the Spirit also helpeth...  | |   God, to them who are the called..."        | |
| [Theme]| 27  And he that searcheth the hearts...  | +----------------------------------------------+ |
| [Media]| >28 And we know that all things work...  | [ Take Live (F12) ]    [ Preview Next Verse ]    |
| [Hist] | 29  For whom he did foreknow, he also... |--------------------------------------------------|
| [Sett] | 30  Moreover whom he did predestinate... | Active Output: Projector 1 (1920x1080)           |
|        |                                          | Active Theme: Sanctuary Navy Gold                |
+--------+------------------------------------------+--------------------------------------------------+
| BOTTOM CONTROL BAR:                                                                                  |
| [|< Prev (PgUp)] [Next > (PgDn)]  |  [Freeze (F9)] [Hide (F10)] [Clear (F11)]  |  [AutoPlay: OFF]    |
+------------------------------------------------------------------------------------------------------+
```

### 2.1 Workspace Panels
1. **Left Sidebar (Navigation Rail):**
   - Icon + text navigation switching the central workspace between `Bible Reader`, `Search`, `Program Editor`, `Theme Editor`, `Media Library`, `History`, and `Settings`.
2. **Main Content Workspace:**
   - Contextual to the active sidebar mode. When `Bible` is selected, displays canonical book picker, chapter grid, and virtualized verse reader.
   - Allows instant single-click or multi-verse selection with shift-click range selection.
3. **Right Control Panel:**
   - **Preview Monitor:** 16:9 aspect-ratio scaled representation of the exact slide styling, line breaks, and fonts.
   - **Take Live Primary Action:** High-visibility button (Emerald Green) to push preview to audience display.
   - **Active Output & Theme Indicators:** Dropdowns to switch active output monitor or assign different presentation themes on the fly.
4. **Bottom Control Bar:**
   - Permanent dock containing high-priority transport controls (`Previous`, `Next`, `Freeze`, `Hide`, `Clear`, `AutoPlay Toggle`).

---

## 3. Dedicated Presentation Output Windows

### 3.1 Audience Presentation Window
* **Window Properties:** Frameless, borderless, always-on-top, kiosk mode on external monitor.
* **Canvas Area:** 100% viewport coverage with zero UI chrome, zero scrollbars, and disabled mouse cursor.
* **Typography & Safe Margins:**
  - Title-Safe Margin: Default 10% inset (80% title-safe area) preventing projector edge-clipping.
  - Text Auto-Fit: Dynamic font scaling algorithm computing optimal size (e.g. 48pt to 72pt) so scripture comfortably fills the safe area without trailing orphan words.
  - Multi-Translation Split: When comparing 2 to 4 translations, viewport divides into balanced vertical columns with individual translation watermarks.

### 3.2 Stage Confidence Display Window
* **Audience:** Preachers, worship leaders, and musicians facing the platform.
* **Layout Structure:**
  ```
  +-----------------------------------------------------------------------+
  | CURRENT SCRIPTURE (70% Height):                                       |
  | Romans 8:28 (KJV)                                                     |
  | "And we know that all things work together for good to them that       |
  |  love God, to them who are the called according to his purpose."      |
  +-----------------------------------------------------------------------+
  | UPCOMING SCRIPTURE: Romans 8:29           | SPEAKER NOTES / PROMPT:   |
  | "For whom he did foreknow, he also did..."| "Transition to communion" |
  |-------------------------------------------+---------------------------|
  | CLOCK: 11:15 AM                           | SERMON TIMER: 24:18       |
  +-----------------------------------------------------------------------+
  ```
* **Security & Privacy:** Speaker notes, upcoming verse prompts, and clock timers are physically isolated to this window and **can never** render on the audience projector.

---

## 4. Theme & Lower-Third Editor UI

* **WYSIWYG Live Canvas:** Visual canvas updating in real time as sliders and color pickers are adjusted.
* **Inspector Tabs:**
  - **Typography:** Font family selector (system fonts + imported church fonts), font weight, size slider, letter spacing, line height, text transform (None, UPPERCASE, Small Caps), text alignment (Left, Center, Right, Justified).
  - **Decorations:** Text outline (stroke color, width 0-10px), multi-tier drop shadows (color, blur, horizontal/vertical offset).
  - **Background Layers:** Radio selection for `Solid Color`, `Linear/Radial Gradient`, `Image Asset`, or `Video Loop`.
  - **Placement & Aspect Ratio:** Mode selection for `Full Screen (16:9)`, `Full Screen (4:3)`, or `Lower Third (Broadcast Overlay)`.
  - **Safe Margins:** Visual draggable guidelines for Top, Bottom, Left, and Right margin boundaries.

---

## 5. Interaction States & Visual Feedback

| Action / State | Visual Representation in UI | Keyboard Hotkey |
| :--- | :--- | :--- |
| **Output LIVE** | Bright Green glowing badge: `● LIVE: Display 2`. | `F12` / `Enter` |
| **Output FROZEN** | Cyan/Amber glowing badge: `❄ FROZEN`. Preview border turns cyan. | `F9` |
| **Output HIDDEN** | Dark Grey badge: `○ BLANK`. Preview displays hatched overlay. | `F10` / `Esc` |
| **Output IDLE / CLEAR** | Neutral grey badge: `IDLE`. | `F11` |
| **Search Error / Not Found** | Soft red input border with inline tooltip: *"Reference not recognized"*. | `Esc` to clear |
| **Monitor Disconnected** | Persistent warning banner across top of Control Studio with "Re-detect" button. | Automatic |
| **AutoPlay Active** | Pulsing play icon with countdown ring indicating remaining dwell seconds. | `Shift+Space` |

