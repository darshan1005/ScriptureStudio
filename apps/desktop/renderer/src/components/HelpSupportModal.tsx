import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '@scripture-studio/ui-library';
import { MaterialIcon } from './MaterialIcon.js';

export type HelpModalTab = 'guide' | 'bug' | 'enhancement' | 'qa';

interface HelpSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: HelpModalTab;
  displaysCount?: number;
  primaryVersion?: string;
  secondaryVersion?: string;
  activeThemeName?: string;
}

interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string | React.ReactNode;
}

const DEVELOPER_EMAIL = 'battuladarshan7838@gmail.com';
const GITHUB_REPO_URL = 'https://github.com/darshan1005/ScriptureStudio';
const GITHUB_ISSUES_URL = 'https://github.com/darshan1005/ScriptureStudio/issues';
const APP_VERSION = '1.2.0';

export const HelpSupportModal: React.FC<HelpSupportModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'guide',
  displaysCount = 1,
  primaryVersion = 'KJV',
  secondaryVersion = 'TEL',
  activeThemeName = 'Sanctuary Navy & Gold',
}) => {
  const [activeTab, setActiveTab] = useState<HelpModalTab>(initialTab);
  const [appVersion, setAppVersion] = useState<string>(APP_VERSION);

  useEffect(() => {
    if (window.scriptureStudioApi?.help?.getAppVersion) {
      window.scriptureStudioApi.help.getAppVersion().then((ver) => {
        if (ver) setAppVersion(ver);
      });
    }
  }, []);

  // Bug report state
  const [bugTitle, setBugTitle] = useState('');
  const [bugDescription, setBugDescription] = useState('');
  const [bugSeverity, setBugSeverity] = useState<'minor' | 'normal' | 'major' | 'critical'>('normal');
  const [bugCopied, setBugCopied] = useState(false);

  // Enhancement state
  const [enhancementTitle, setEnhancementTitle] = useState('');
  const [enhancementCategory, setEnhancementCategory] = useState('Themes & Visuals');
  const [enhancementDescription, setEnhancementDescription] = useState('');
  const [enhancementCopied, setEnhancementCopied] = useState(false);

  // Q&A search and accordion state
  const [faqSearch, setFaqSearch] = useState('');
  const [expandedFaqIds, setExpandedFaqIds] = useState<Record<string, boolean>>({
    'proj-setup': true,
    'dual-trans': true,
  });

  // Sync initialTab when modal opens or initialTab changes
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  const handleOpenExternal = (url: string) => {
    if (window.scriptureStudioApi?.help?.openExternal) {
      window.scriptureStudioApi.help.openExternal(url);
    } else {
      window.open(url, '_blank');
    }
  };

  const diagnosticText = useMemo(() => {
    return [
      `### Scripture Studio Diagnostic Environment`,
      `- **Application Version**: Scripture Studio v${appVersion}`,
      `- **Operating System**: Windows (Platform: ${navigator.platform || 'Win32'})`,
      `- **Connected Displays**: ${displaysCount} display(s) detected`,
      `- **Active Primary Translation**: ${primaryVersion}`,
      `- **Active Secondary Translation**: ${secondaryVersion || 'None'}`,
      `- **Active Presentation Theme**: ${activeThemeName || 'Default'}`,
      `- **User Agent**: ${navigator.userAgent}`,
      `- **Timestamp**: ${new Date().toISOString()}`,
    ].join('\n');
  }, [appVersion, displaysCount, primaryVersion, secondaryVersion, activeThemeName]);

  const handleSendBugReportEmail = () => {
    const subject = encodeURIComponent(`[Bug Report v${appVersion}] ${bugTitle || 'Issue Report'}`);
    const bodyContent = [
      `=== BUG SUMMARY ===`,
      bugTitle || 'Not specified',
      ``,
      `=== SEVERITY ===`,
      bugSeverity.toUpperCase(),
      ``,
      `=== DESCRIPTION & STEPS TO REPRODUCE ===`,
      bugDescription || 'No additional steps provided.',
      ``,
      `========================================`,
      diagnosticText,
      `========================================`,
    ].join('\n');

    const mailto = `mailto:${DEVELOPER_EMAIL}?subject=${subject}&body=${encodeURIComponent(bodyContent)}`;
    handleOpenExternal(mailto);
  };

  const handleCopyBugReport = () => {
    const textToCopy = [
      `## Scripture Studio Bug Report`,
      `**Title**: ${bugTitle || 'Issue Report'}`,
      `**Severity**: ${bugSeverity.toUpperCase()}`,
      ``,
      `### Description & Steps to Reproduce`,
      bugDescription || 'N/A',
      ``,
      diagnosticText,
    ].join('\n');

    navigator.clipboard.writeText(textToCopy);
    setBugCopied(true);
    setTimeout(() => setBugCopied(false), 2500);
  };

  const handleSendEnhancementEmail = () => {
    const subject = encodeURIComponent(`[Enhancement Request] ${enhancementTitle || 'Feature Suggestion'}`);
    const bodyContent = [
      `=== FEATURE ENHANCEMENT SUGGESTION ===`,
      `Category: ${enhancementCategory}`,
      `Title: ${enhancementTitle || 'Not specified'}`,
      ``,
      `=== DESCRIPTION / USE CASE ===`,
      enhancementDescription || 'No description provided.',
      ``,
      `=== CURRENT APP VERSION ===`,
      `Scripture Studio v${appVersion}`,
    ].join('\n');

    const mailto = `mailto:${DEVELOPER_EMAIL}?subject=${subject}&body=${encodeURIComponent(bodyContent)}`;
    handleOpenExternal(mailto);
  };

  const handleCopyEnhancement = () => {
    const textToCopy = [
      `## Scripture Studio Feature Suggestion`,
      `**Category**: ${enhancementCategory}`,
      `**Title**: ${enhancementTitle || 'Feature Suggestion'}`,
      ``,
      `### Details / Church Use Case`,
      enhancementDescription || 'N/A',
    ].join('\n');

    navigator.clipboard.writeText(textToCopy);
    setEnhancementCopied(true);
    setTimeout(() => setEnhancementCopied(false), 2500);
  };

  const toggleFaq = (id: string) => {
    setExpandedFaqIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const faqList: FaqItem[] = [
    {
      id: 'proj-setup',
      category: 'Display & Projector',
      question: 'How do I project scripture onto a church projector or secondary TV without mirroring my screen?',
      answer: (
        <div>
          <ol style={{ margin: '0.4rem 0 0.4rem 1.2rem', padding: 0, lineHeight: 1.6 }}>
            <li>Connect your projector or TV using HDMI, DisplayPort, or wireless display.</li>
            <li>Press <strong>Win + P</strong> on Windows and select <strong>Extend</strong> (not Duplicate).</li>
            <li>In Scripture Studio, notice the top bar will show: <em>"Projector Ready (2 Displays - Extended Mode)"</em>.</li>
            <li>In the <strong>Screen</strong> dropdown in the top header, select Display 2.</li>
            <li>Click <strong>Open Output</strong> (or double-click any scripture or press <strong>F12</strong>). The audience window opens in true borderless full-screen on the projector while your operator controls remain private on your laptop!</li>
          </ol>
        </div>
      ),
    },
    {
      id: 'dual-trans',
      category: 'Bilingual / Translations',
      question: 'How do I display two Bible translations simultaneously (e.g. English + Telugu)?',
      answer: (
        <div>
          <p style={{ margin: '0 0 0.5rem 0', lineHeight: 1.5 }}>
            Scripture Studio is built with native bilingual and dual-translation support for multicultural and regional church services:
          </p>
          <ul style={{ margin: '0 0 0 1.2rem', padding: 0, lineHeight: 1.6 }}>
            <li>In the right-hand <strong>Preview Monitor</strong>, locate the <strong>Translations</strong> selectors.</li>
            <li>Select your <strong>Primary</strong> translation (e.g. <em>KJV</em> or <em>NIV</em>) and your <strong>Secondary</strong> translation (e.g. <em>TEL - Telugu Bible</em>).</li>
            <li>Both versions will be rendered side-by-side or stacked on the live screen with synchronized verse numbering.</li>
            <li>Click the <strong>⇄ Swap</strong> button anytime to instantly swap which translation is positioned on top!</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'offline-mode',
      category: 'Offline Reliability',
      question: 'Does Scripture Studio work 100% offline during Sunday services?',
      answer: (
        <div>
          <p style={{ margin: 0, lineHeight: 1.5 }}>
            <strong>Yes, absolutely!</strong> Scripture Studio is engineered offline-first. All installed Bible translations, custom presentation themes, and service playlists are stored locally on your hard drive in an embedded SQLite database. Once you download your translations via the "Download Bibles" catalog, you never need an active internet connection to run presentations.
          </p>
        </div>
      ),
    },
    {
      id: 'verse-stepper',
      category: 'Presentation Flow',
      question: 'How do I advance verses one-by-one during a sermon or scripture reading?',
      answer: (
        <div>
          <p style={{ margin: '0 0 0.4rem 0', lineHeight: 1.5 }}>
            When you add a range like <strong>Psalms 100:1-5</strong> or <strong>John 3:16-17</strong> to your Service Program:
          </p>
          <ul style={{ margin: '0 0 0 1.2rem', padding: 0, lineHeight: 1.6 }}>
            <li>The program tile displays an interactive verse stepper bar: <strong>◀ 1 2 3 4 5 ▶</strong>.</li>
            <li>Click any specific verse number to jump to that verse immediately.</li>
            <li>Click <strong>◀</strong> or <strong>▶</strong> to step through verses sequentially.</li>
            <li>You can also use your keyboard's <strong>Left Arrow</strong> and <strong>Right Arrow</strong> keys (or <strong>Spacebar</strong> / <strong>PageDown</strong>) while presenting live.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'freeze-hide',
      category: 'Live Control',
      question: 'How do I freeze the screen or blank it to black during prayer or communion?',
      answer: (
        <div>
          <ul style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: 1.6 }}>
            <li><strong>Freeze Screen (F9)</strong>: Press <strong>F9</strong> to lock the audience screen with the current slide. You can then navigate, search, and stage other scriptures privately in the Preview monitor without the congregation seeing your edits. Press F9 again or Take Live (F12) to release.</li>
            <li><strong>Black / Hide Screen (F10)</strong>: Press <strong>F10</strong> to instantly blank the audience projector to solid black during prayer, communion, or praise. Press F10 again to immediately restore the verse slide.</li>
            <li><strong>Close Output (Esc)</strong>: Press <strong>Escape</strong> to close the live projection window completely.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'edit-program',
      category: 'Playlists & Programs',
      question: 'Can I edit a program item or add notes for the technician after adding it?',
      answer: (
        <div>
          <p style={{ margin: '0 0 0.4rem 0', lineHeight: 1.5 }}>
            Yes! On each item in the <strong>Programs</strong> workspace:
          </p>
          <ul style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: 1.6 }}>
            <li>Click <strong>✏️ Edit</strong> to change the scripture reference, custom title, or optional operator notes.</li>
            <li>Click <strong>📖 Reader</strong> to open that passage directly in the full Bible Reader workspace to see surrounding context.</li>
            <li>Operator notes appear as a clean cyan badge with text ellipsis. Hover over the badge anytime to read the full note in a tooltip!</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'download-bibles',
      category: 'Translations',
      question: 'How do I download more Bible versions (e.g. Telugu, Spanish, Hindi, French)?',
      answer: (
        <div>
          <p style={{ margin: 0, lineHeight: 1.5 }}>
            Click the <strong>Download Bibles</strong> button in the top navigation bar. Browse by category (Popular English, Indian Languages, Spanish/Portuguese, European, Asian, etc.) or search by name. Click <strong>Install Offline</strong> on any translation. Once finished, click <strong>Reload</strong> in the top header and your new version is ready for instant use!
          </p>
        </div>
      ),
    },
    {
      id: 'contact-developer',
      category: 'Support & Community',
      question: 'Who maintains Scripture Studio and how do I report bugs or suggest enhancements?',
      answer: (
        <div>
          <p style={{ margin: '0 0 0.4rem 0', lineHeight: 1.5 }}>
            Scripture Studio is maintained by <strong>Battula Darshan</strong> (GitHub: <em>darshan1005</em>).
          </p>
          <ul style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: 1.6 }}>
            <li>Default email for bug reports & suggestions: <strong>battuladarshan7838@gmail.com</strong>.</li>
            <li>GitHub Repository & Issues: <a href="#" onClick={(e) => { e.preventDefault(); handleOpenExternal(GITHUB_ISSUES_URL); }} style={{ color: '#60A5FA', textDecoration: 'underline' }}>github.com/darshan1005/ScriptureStudio/issues</a>.</li>
            <li>Use the <strong>Report a Bug</strong> or <strong>Any Enhancements</strong> tabs in this dialog to send pre-filled diagnostic reports directly!</li>
          </ul>
        </div>
      ),
    },
  ];

  const filteredFaqs = useMemo(() => {
    if (!faqSearch.trim()) return faqList;
    const q = faqSearch.toLowerCase();
    return faqList.filter(
      (item) =>
        item.question.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (typeof item.answer === 'string' && item.answer.toLowerCase().includes(q))
    );
  }, [faqSearch, faqList]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Scripture Studio — Help & Support Center" width="900px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '78vh' }}>
        {/* Navigation Tabs Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            borderBottom: '1px solid #1E293B',
            paddingBottom: '0.5rem',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 0.85rem',
              borderRadius: '6px',
              border: activeTab === 'guide' ? '1px solid #3B82F6' : '1px solid transparent',
              backgroundColor: activeTab === 'guide' ? '#1E3A8A' : 'transparent',
              color: activeTab === 'guide' ? '#FFFFFF' : '#94A3B8',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <MaterialIcon name="menu_book" size={17} color={activeTab === 'guide' ? '#60A5FA' : '#94A3B8'} />
            <span>📖 Guide To Use Software</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bug')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 0.85rem',
              borderRadius: '6px',
              border: activeTab === 'bug' ? '1px solid #EF4444' : '1px solid transparent',
              backgroundColor: activeTab === 'bug' ? '#7F1D1D' : 'transparent',
              color: activeTab === 'bug' ? '#FFFFFF' : '#94A3B8',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <MaterialIcon name="bug_report" size={17} color={activeTab === 'bug' ? '#F87171' : '#94A3B8'} />
            <span>🐛 Report a Bug</span>
            <span
              style={{
                fontSize: '0.65rem',
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                padding: '0.1rem 0.35rem',
                borderRadius: '4px',
                marginLeft: '0.2rem',
              }}
            >
              Default to Me
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('enhancement')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 0.85rem',
              borderRadius: '6px',
              border: activeTab === 'enhancement' ? '1px solid #F59E0B' : '1px solid transparent',
              backgroundColor: activeTab === 'enhancement' ? '#78350F' : 'transparent',
              color: activeTab === 'enhancement' ? '#FFFFFF' : '#94A3B8',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <MaterialIcon name="lightbulb" size={17} color={activeTab === 'enhancement' ? '#FBBF24' : '#94A3B8'} />
            <span>💡 Any Enhancements</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('qa')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 0.85rem',
              borderRadius: '6px',
              border: activeTab === 'qa' ? '1px solid #10B981' : '1px solid transparent',
              backgroundColor: activeTab === 'qa' ? '#064E3B' : 'transparent',
              color: activeTab === 'qa' ? '#FFFFFF' : '#94A3B8',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <MaterialIcon name="quiz" size={17} color={activeTab === 'qa' ? '#34D399' : '#94A3B8'} />
            <span>❓ Q&A (FAQ)</span>
          </button>
        </div>

        {/* Tab Content Area (Scrollable) */}
        <div
          className="custom-scrollbar"
          style={{
            overflowY: 'auto',
            paddingRight: '0.35rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {/* TAB 1: GUIDE TO USE SOFTWARE */}
          {activeTab === 'guide' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Quick Start Card */}
              <div
                style={{
                  backgroundColor: '#0F172A',
                  border: '1px solid #1E293B',
                  borderRadius: '8px',
                  padding: '1rem 1.2rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                  <MaterialIcon name="rocket_launch" size={20} color="#38BDF8" />
                  <h3 style={{ margin: 0, fontSize: '1rem', color: '#F8FAFC', fontWeight: 700 }}>
                    Quick Start Guide — 4 Steps to Live Presentation
                  </h3>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '0.75rem',
                    marginTop: '0.75rem',
                  }}
                >
                  <div style={{ backgroundColor: '#090E1A', padding: '0.75rem', borderRadius: '6px', border: '1px solid #1E293B' }}>
                    <div style={{ color: '#38BDF8', fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.25rem' }}>1. Select Passage</div>
                    <div style={{ color: '#94A3B8', fontSize: '0.78rem', lineHeight: 1.45 }}>
                      Browse via <strong>Bible Reader (F5)</strong>, type in <strong>Search (F6)</strong>, or pick a cue from <strong>Programs</strong>.
                    </div>
                  </div>
                  <div style={{ backgroundColor: '#090E1A', padding: '0.75rem', borderRadius: '6px', border: '1px solid #1E293B' }}>
                    <div style={{ color: '#38BDF8', fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.25rem' }}>2. Stage in Preview</div>
                    <div style={{ color: '#94A3B8', fontSize: '0.78rem', lineHeight: 1.45 }}>
                      Passage is staged immediately in the <strong>Preview Monitor</strong> with selected theme & dual translations.
                    </div>
                  </div>
                  <div style={{ backgroundColor: '#090E1A', padding: '0.75rem', borderRadius: '6px', border: '1px solid #1E293B' }}>
                    <div style={{ color: '#38BDF8', fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.25rem' }}>3. Take Live (F12)</div>
                    <div style={{ color: '#94A3B8', fontSize: '0.78rem', lineHeight: 1.45 }}>
                      Press <strong>F12</strong> or click the green <strong>Take Live</strong> button to project onto secondary screen or projector.
                    </div>
                  </div>
                  <div style={{ backgroundColor: '#090E1A', padding: '0.75rem', borderRadius: '6px', border: '1px solid #1E293B' }}>
                    <div style={{ color: '#38BDF8', fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.25rem' }}>4. Step Through</div>
                    <div style={{ color: '#94A3B8', fontSize: '0.78rem', lineHeight: 1.45 }}>
                      Use <strong>Left / Right Arrow</strong> keys or verse pills (<strong>1 2 3...</strong>) to advance one verse at a time.
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature Modules Breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Bible Reader & Search */}
                <div style={{ backgroundColor: '#0B132B', border: '1px solid #1E293B', borderRadius: '8px', padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#60A5FA', fontWeight: 700 }}>
                    <MaterialIcon name="auto_stories" size={18} />
                    <span>Bible Reader & Smart Search</span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#94A3B8', fontSize: '0.82rem', lineHeight: 1.55 }}>
                    <li><strong>Single-Click</strong>: Immediately stages passage in Preview.</li>
                    <li><strong>Double-Click</strong> in Reader: Immediately opens output and takes scripture Live.</li>
                    <li><strong>Smart Reference Parser</strong>: Type references like <em>"Jn 3 16"</em>, <em>"Ps 23 1-4"</em>, or <em>"Rom 8:28"</em>.</li>
                    <li><strong>Full-Text Search</strong>: Search words or phrases across all installed offline translations.</li>
                  </ul>
                </div>

                {/* Service Programs & Playlists */}
                <div style={{ backgroundColor: '#0B132B', border: '1px solid #1E293B', borderRadius: '8px', padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#34D399', fontWeight: 700 }}>
                    <MaterialIcon name="playlist_play" size={18} />
                    <span>Service Playlists & Programs</span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#94A3B8', fontSize: '0.82rem', lineHeight: 1.55 }}>
                    <li><strong>Service Order</strong>: Group scriptures for Sunday worship, sermon, and benediction.</li>
                    <li><strong>Single-Verse Steppers</strong>: Tiles feature <code>◀ 1 2 3 ▶</code> buttons for precise verse pacing.</li>
                    <li><strong>Operator Notes</strong>: Add tech cues with ellipsis preview and hover tooltips.</li>
                    <li><strong>Open in Reader</strong>: Instant jump to surrounding chapter context.</li>
                    <li><strong>Edit Button</strong>: Modify reference, title, or notes anytime.</li>
                  </ul>
                </div>

                {/* Dual Translations */}
                <div style={{ backgroundColor: '#0B132B', border: '1px solid #1E293B', borderRadius: '8px', padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#FBBF24', fontWeight: 700 }}>
                    <MaterialIcon name="translate" size={18} />
                    <span>Dual Translations & Instant Swap</span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#94A3B8', fontSize: '0.82rem', lineHeight: 1.55 }}>
                    <li>Pair <strong>Primary</strong> (e.g. KJV, ESV, NIV) with <strong>Secondary</strong> (e.g. Telugu TEL, Hindi, Spanish).</li>
                    <li>Bilingual scriptures are projected stacked or side-by-side with synchronized verse numbering.</li>
                    <li>Click <strong>⇄ Swap</strong> in Preview Pane to instantly flip which translation is on top.</li>
                  </ul>
                </div>

                {/* Live Controls */}
                <div style={{ backgroundColor: '#0B132B', border: '1px solid #1E293B', borderRadius: '8px', padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#A78BFA', fontWeight: 700 }}>
                    <MaterialIcon name="tune" size={18} />
                    <span>Live Output & Safety Controls</span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#94A3B8', fontSize: '0.82rem', lineHeight: 1.55 }}>
                    <li><strong>F9 (Freeze)</strong>: Locks projector screen so operator can stage other passages privately.</li>
                    <li><strong>F10 (Hide/Blank)</strong>: Blanks audience screen to black during prayer without closing window.</li>
                    <li><strong>Esc</strong>: Safely dismisses audience window.</li>
                    <li><strong>Download HD</strong>: Save crisp PNG slide captures of current scripture for social media or bulletin.</li>
                  </ul>
                </div>
              </div>

              {/* Keyboard Shortcuts Reference Table */}
              <div
                style={{
                  backgroundColor: '#0F172A',
                  border: '1px solid #1E293B',
                  borderRadius: '8px',
                  padding: '1rem 1.2rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <MaterialIcon name="keyboard" size={20} color="#CBD5E1" />
                  <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#F8FAFC', fontWeight: 700 }}>
                    Keyboard Shortcuts Cheat Sheet
                  </h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.5rem' }}>
                  {[
                    { key: 'F12', desc: 'Take Live (Crossfade to Projector)' },
                    { key: 'F9', desc: 'Freeze / Unfreeze Live Output' },
                    { key: 'F10', desc: 'Black / Hide Screen (Toggle)' },
                    { key: 'Esc', desc: 'Close Output Window' },
                    { key: '→ / PageDown / Space', desc: 'Next Verse' },
                    { key: '← / PageUp', desc: 'Previous Verse' },
                    { key: 'F5', desc: 'Switch to Bible Reader Workspace' },
                    { key: 'F6', desc: 'Switch to Scripture Search' },
                    { key: 'F1', desc: 'Open Help & Support Dialog' },
                    { key: 'Ctrl + R', desc: 'Reload Studio & Translations' },
                  ].map((sc, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.4rem 0.6rem',
                        backgroundColor: '#070D18',
                        borderRadius: '4px',
                        border: '1px solid #1E293B',
                      }}
                    >
                      <span
                        style={{
                          backgroundColor: '#1E293B',
                          color: '#F8FAFC',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontFamily: 'monospace',
                          fontWeight: 700,
                        }}
                      >
                        {sc.key}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: '#94A3B8', textAlign: 'right' }}>{sc.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: REPORT A BUG */}
          {activeTab === 'bug' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Recipient Notice */}
              <div
                style={{
                  backgroundColor: '#18181B',
                  border: '1px solid #3F3F46',
                  borderRadius: '8px',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <MaterialIcon name="contact_mail" size={22} color="#F87171" />
                  <div>
                    <div style={{ color: '#F43F5E', fontWeight: 700, fontSize: '0.86rem' }}>
                      Default Recipient: Battula Darshan ({DEVELOPER_EMAIL})
                    </div>
                    <div style={{ color: '#A1A1AA', fontSize: '0.78rem' }}>
                      Bug reports are addressed directly by the developer. All diagnostics are compiled automatically below.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenExternal(GITHUB_ISSUES_URL)}
                  className="btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                >
                  <MaterialIcon name="open_in_new" size={16} />
                  <span>GitHub Issues</span>
                </button>
              </div>

              {/* Environment Diagnostics Box */}
              <div
                style={{
                  backgroundColor: '#090E1A',
                  border: '1px solid #1E293B',
                  borderRadius: '6px',
                  padding: '0.75rem 1rem',
                }}
              >
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#38BDF8', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <MaterialIcon name="developer_board" size={16} color="#38BDF8" />
                  <span>Auto-Detected Diagnostics (Included with Report)</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', fontSize: '0.76rem', color: '#94A3B8' }}>
                  <div><strong>App Version:</strong> Scripture Studio v{appVersion}</div>
                  <div><strong>Platform:</strong> Windows ({navigator.platform || 'Win32'})</div>
                  <div><strong>Displays:</strong> {displaysCount} display(s) detected</div>
                  <div><strong>Translations:</strong> {primaryVersion} / {secondaryVersion || 'None'}</div>
                  <div><strong>Active Theme:</strong> {activeThemeName}</div>
                </div>
              </div>

              {/* Bug Form */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#F1F5F9', marginBottom: '0.35rem' }}>
                    Bug Title / Short Summary *
                  </label>
                  <input
                    type="text"
                    value={bugTitle}
                    onChange={(e) => setBugTitle(e.target.value)}
                    placeholder="e.g. Display output does not update when selecting verse 3 in program..."
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      backgroundColor: '#0B1527',
                      border: '1px solid #1E3A8A',
                      borderRadius: '6px',
                      color: '#F8FAFC',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#F1F5F9', marginBottom: '0.35rem' }}>
                      Severity
                    </label>
                    <select
                      value={bugSeverity}
                      onChange={(e) => setBugSeverity(e.target.value as any)}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        backgroundColor: '#0B1527',
                        border: '1px solid #1E293B',
                        borderRadius: '6px',
                        color: '#F8FAFC',
                        fontSize: '0.85rem',
                      }}
                    >
                      <option value="minor">Minor (Visual / Styling)</option>
                      <option value="normal">Normal (Feature Glitch)</option>
                      <option value="major">Major (Impacts Workflow)</option>
                      <option value="critical">Critical (Live Presentation Blocker)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#F1F5F9', marginBottom: '0.35rem' }}>
                      Expected vs What Actually Happened
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Expected verse 3 to show on screen, but screen stayed on verse 2."
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        backgroundColor: '#0B1527',
                        border: '1px solid #1E293B',
                        borderRadius: '6px',
                        color: '#F8FAFC',
                        fontSize: '0.85rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#F1F5F9', marginBottom: '0.35rem' }}>
                    Steps to Reproduce / Additional Details
                  </label>
                  <textarea
                    rows={4}
                    value={bugDescription}
                    onChange={(e) => setBugDescription(e.target.value)}
                    placeholder="1. Go to Programs workspace&#10;2. Click verse pill 3 on Psalm 100&#10;3. Notice preview changes but audience monitor did not..."
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      backgroundColor: '#0B1527',
                      border: '1px solid #1E293B',
                      borderRadius: '6px',
                      color: '#F8FAFC',
                      fontSize: '0.85rem',
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                {/* Bug Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={handleSendBugReportEmail}
                    className="btn-primary"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      backgroundColor: '#DC2626',
                      borderColor: '#EF4444',
                      fontWeight: 700,
                      padding: '0.6rem 1.25rem',
                    }}
                  >
                    <MaterialIcon name="send" size={17} />
                    <span>Email Report to Developer ({DEVELOPER_EMAIL})</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyBugReport}
                    className="btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.6rem 1rem' }}
                  >
                    <MaterialIcon name={bugCopied ? 'check' : 'content_copy'} size={17} color={bugCopied ? '#34D399' : 'currentColor'} />
                    <span>{bugCopied ? 'Copied to Clipboard!' : 'Copy Diagnostics & Details'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ANY ENHANCEMENTS */}
          {activeTab === 'enhancement' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  backgroundColor: '#1E1B4B',
                  border: '1px solid #4338CA',
                  borderRadius: '8px',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <MaterialIcon name="tips_and_updates" size={24} color="#A5B4FC" />
                <div>
                  <div style={{ color: '#C7D2FE', fontWeight: 700, fontSize: '0.86rem' }}>
                    Shape the Future of Scripture Studio
                  </div>
                  <div style={{ color: '#E0E7FF', fontSize: '0.78rem' }}>
                    Have an idea for a new feature, worship capability, or church operator workflow? Suggest it directly to the developer below.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#F1F5F9', marginBottom: '0.35rem' }}>
                      Category
                    </label>
                    <select
                      value={enhancementCategory}
                      onChange={(e) => setEnhancementCategory(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        backgroundColor: '#0B1527',
                        border: '1px solid #1E293B',
                        borderRadius: '6px',
                        color: '#F8FAFC',
                        fontSize: '0.85rem',
                      }}
                    >
                      <option value="Themes & Visuals">🎨 Themes, Typography & Visuals</option>
                      <option value="Translations & Offline Bibles">📖 Translations & Offline Bibles</option>
                      <option value="Songs & Lyrics">🎵 Song Lyrics & Hymn Projection</option>
                      <option value="Video & Motion Media">🎬 Video, Loops & Motion Media</option>
                      <option value="Stage Display & Confidence Monitor">🖥️ Stage Display & Confidence Monitor</option>
                      <option value="Remote Control & Mobile Apps">📱 Remote Control & Mobile / Tablet App</option>
                      <option value="Livestreaming & NDI / OBS">📡 Livestreaming, NDI & Lower-Thirds</option>
                      <option value="Service Planning & Export">📑 Service Planning & Cloud Sync</option>
                      <option value="General Enhancement">⚙️ General Feature Suggestion</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#F1F5F9', marginBottom: '0.35rem' }}>
                      Enhancement Title *
                    </label>
                    <input
                      type="text"
                      value={enhancementTitle}
                      onChange={(e) => setEnhancementTitle(e.target.value)}
                      placeholder="e.g. Add worship song lyrics projection with chord transposer..."
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        backgroundColor: '#0B1527',
                        border: '1px solid #1E3A8A',
                        borderRadius: '6px',
                        color: '#F8FAFC',
                        fontSize: '0.85rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#F1F5F9', marginBottom: '0.35rem' }}>
                    Describe the Feature & Church Use Case *
                  </label>
                  <textarea
                    rows={5}
                    value={enhancementDescription}
                    onChange={(e) => setEnhancementDescription(e.target.value)}
                    placeholder="Describe how this feature should function, why it would help your church service or worship team, and any specific preferences (e.g. keyboard shortcuts, formatting options)..."
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      backgroundColor: '#0B1527',
                      border: '1px solid #1E293B',
                      borderRadius: '6px',
                      color: '#F8FAFC',
                      fontSize: '0.85rem',
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                {/* Enhancement Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={handleSendEnhancementEmail}
                    className="btn-primary"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      backgroundColor: '#D97706',
                      borderColor: '#F59E0B',
                      fontWeight: 700,
                      padding: '0.6rem 1.25rem',
                    }}
                  >
                    <MaterialIcon name="send" size={17} />
                    <span>Email Enhancement Idea to Developer</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyEnhancement}
                    className="btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.6rem 1rem' }}
                  >
                    <MaterialIcon name={enhancementCopied ? 'check' : 'content_copy'} size={17} color={enhancementCopied ? '#34D399' : 'currentColor'} />
                    <span>{enhancementCopied ? 'Copied to Clipboard!' : 'Copy Suggestion Details'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenExternal(GITHUB_REPO_URL)}
                    className="btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.6rem 1rem' }}
                  >
                    <MaterialIcon name="open_in_new" size={17} />
                    <span>GitHub Discussions</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Q & A (FAQ) */}
          {activeTab === 'qa' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Search input for FAQs */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: '12px', color: '#64748B', display: 'flex', alignItems: 'center' }}>
                  <MaterialIcon name="search" size={18} color="#64748B" />
                </span>
                <input
                  type="text"
                  placeholder="Search questions (e.g. projector, dual translation, offline, freeze, steppers)..."
                  value={faqSearch}
                  onChange={(e) => setFaqSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 2.2rem 0.55rem 2.2rem',
                    backgroundColor: '#0B1527',
                    border: '1px solid #1E293B',
                    borderRadius: '6px',
                    color: '#F8FAFC',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                />
                {faqSearch && (
                  <button
                    onClick={() => setFaqSearch('')}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      background: 'none',
                      border: 'none',
                      color: '#94A3B8',
                      cursor: 'pointer',
                    }}
                  >
                    <MaterialIcon name="close" size={16} />
                  </button>
                )}
              </div>

              {/* FAQ Accordion List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {filteredFaqs.map((faq) => {
                  const isExpanded = !!expandedFaqIds[faq.id];
                  return (
                    <div
                      key={faq.id}
                      style={{
                        backgroundColor: '#0F172A',
                        border: isExpanded ? '1px solid #3B82F6' : '1px solid #1E293B',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        transition: 'border-color 0.2s ease',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => toggleFaq(faq.id)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.75rem 1rem',
                          background: 'none',
                          border: 'none',
                          color: '#F8FAFC',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.88rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span
                            style={{
                              fontSize: '0.68rem',
                              backgroundColor: '#1E293B',
                              color: '#38BDF8',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                            }}
                          >
                            {faq.category}
                          </span>
                          <span>{faq.question}</span>
                        </div>
                        <MaterialIcon
                          name={isExpanded ? 'expand_less' : 'expand_more'}
                          size={20}
                          color={isExpanded ? '#38BDF8' : '#94A3B8'}
                        />
                      </button>

                      {isExpanded && (
                        <div
                          style={{
                            padding: '0.5rem 1rem 1rem 1rem',
                            borderTop: '1px solid #1E293B',
                            backgroundColor: '#070D18',
                            color: '#CBD5E1',
                            fontSize: '0.84rem',
                            lineHeight: 1.55,
                          }}
                        >
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}

                {filteredFaqs.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>
                    No matching questions found for "{faqSearch}". Try searching with keywords like <em>projector</em>, <em>translation</em>, or <em>freeze</em>.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            borderTop: '1px solid #1E293B',
            paddingTop: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Scripture Studio v{appVersion}</span>
            <span>•</span>
            <span>Crafted by Battula Darshan ({DEVELOPER_EMAIL})</span>
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            style={{ padding: '0.45rem 1.25rem', fontSize: '0.85rem' }}
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default HelpSupportModal;
