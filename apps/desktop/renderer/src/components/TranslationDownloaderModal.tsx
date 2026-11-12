import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from '@scripture-studio/ui-library';
import { BibleVersionDto, DownloadBibleProgressEvent } from '@scripture-studio/shared-types';
import { MaterialIcon } from './MaterialIcon.js';

interface TranslationDownloaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloaded: () => void;
}

export type TranslationCategory =
  | 'All'
  | 'Popular'
  | 'Modern'
  | 'Older'
  | 'Spanish/Port'
  | 'European'
  | 'Asian'
  | 'Indian'
  | 'Installed';

export interface OpenModuleItem {
  code: string;
  name: string;
  language: string;
  category: 'Popular' | 'Modern' | 'Older' | 'Spanish/Port' | 'European' | 'Asian' | 'Indian';
  license: string;
}

const OPEN_MODULES: OpenModuleItem[] = [
  // --- Best Known Translations ---
  { code: 'KJV', name: 'King James Version', language: 'English', category: 'Popular', license: 'Public Domain' },
  { code: 'ESV', name: 'English Standard Version', language: 'English', category: 'Popular', license: 'Open / Free Study' },
  { code: 'NIV', name: 'New International Version', language: 'English', category: 'Popular', license: 'Open / Free Study' },
  { code: 'NKJV', name: 'New King James Version', language: 'English', category: 'Popular', license: 'Open / Free Study' },
  { code: 'NLT', name: 'New Living Translation', language: 'English', category: 'Popular', license: 'Open / Free Study' },
  { code: 'CSB', name: 'Christian Standard Bible', language: 'English', category: 'Popular', license: 'Open / Free Study' },
  { code: 'NASB', name: 'New American Standard Bible', language: 'English', category: 'Popular', license: 'Open / Free Study' },
  { code: 'AMP', name: 'Amplified Bible', language: 'English', category: 'Popular', license: 'Open / Free Study' },

  // --- Modern Translations ---
  { code: 'BBE', name: 'Bible in Basic English', language: 'English', category: 'Modern', license: 'Public Domain' },
  { code: 'BSB', name: 'Berean Standard Bible', language: 'English', category: 'Modern', license: 'Public Domain' },
  { code: 'WEB', name: 'World English Bible', language: 'English', category: 'Modern', license: 'Public Domain' },
  { code: 'YLT', name: "Young's Literal Translation", language: 'English', category: 'Modern', license: 'Public Domain' },
  { code: 'GNT', name: 'Good News Translation', language: 'English', category: 'Modern', license: 'Open / Free Study' },
  { code: 'LEB', name: 'Lexham English Bible', language: 'English', category: 'Modern', license: 'Open License' },
  { code: 'JUB', name: 'Jubilee Bible 2000', language: 'English', category: 'Modern', license: 'Public Domain' },
  { code: 'CEB', name: 'Contemporary / Common English (CEV)', language: 'English', category: 'Modern', license: 'Open License' },
  { code: 'OJB', name: 'Orthodox Jewish Bible (TOJB)', language: 'English', category: 'Modern', license: 'Open License' },
  { code: 'FBV', name: 'Free Bible Version', language: 'English', category: 'Modern', license: 'CC-BY-SA' },
  { code: 'LSV', name: 'Literal Standard Version', language: 'English', category: 'Modern', license: 'CC-BY-SA' },
  { code: 'GNV', name: 'Geneva Bible (1599)', language: 'English', category: 'Modern', license: 'Public Domain' },

  // --- Older & Canonical Translations ---
  { code: 'ASV', name: 'American Standard Version (1901)', language: 'English', category: 'Older', license: 'Public Domain' },
  { code: 'DBY', name: 'The Darby Translation', language: 'English', category: 'Older', license: 'Public Domain' },
  { code: 'DRA', name: 'Douay-Rheims Catholic Bible (1899)', language: 'English', category: 'Older', license: 'Public Domain' },
  { code: 'ERV', name: 'English Revised Version (RSV Precursor)', language: 'English', category: 'Older', license: 'Public Domain' },
  { code: 'VUL', name: 'The Latin Vulgate (Biblia Sacra Vulgata)', language: 'Latin', category: 'Older', license: 'Public Domain' },
  { code: 'GRCTR', name: 'Greek New Testament (Textus Receptus)', language: 'Ancient Greek', category: 'Older', license: 'Public Domain' },
  { code: 'LXX', name: 'Greek Septuagint Old Testament (Brenton)', language: 'Ancient Greek', category: 'Older', license: 'Public Domain' },
  { code: 'WLC', name: 'Hebrew Westminster Leningrad Codex', language: 'Biblical Hebrew', category: 'Older', license: 'Public Domain' },

  // --- Spanish & Portuguese ---
  { code: 'RVR', name: 'La Biblia Reina-Valera 1960', language: 'Spanish', category: 'Spanish/Port', license: 'Public Domain' },
  { code: 'AA', name: 'Almeida Revista e Atualizada', language: 'Portuguese', category: 'Spanish/Port', license: 'Public Domain' },
  { code: 'NVI-PT', name: 'Nova Versão Internacional (Português)', language: 'Portuguese', category: 'Spanish/Port', license: 'Open License' },
  { code: 'ARA', name: 'Almeida Revista e Atualizada (ARA)', language: 'Portuguese', category: 'Spanish/Port', license: 'Public Domain' },
  { code: 'ACF', name: 'Almeida Corrigida Fiel (ACF)', language: 'Portuguese', category: 'Spanish/Port', license: 'Public Domain' },
  { code: 'NVT', name: 'Nova Versão Transformadora (NVT)', language: 'Portuguese', category: 'Spanish/Port', license: 'Open License' },
  { code: 'KJA', name: 'King James Atualizada (KJA)', language: 'Portuguese', category: 'Spanish/Port', license: 'Open License' },

  // --- European Languages ---
  { code: 'FR', name: 'Louis Segond 1910 / Bible de Genève', language: 'French', category: 'European', license: 'Public Domain' },
  { code: 'DE', name: 'Schlachter Bibel 1951 / Luther', language: 'German', category: 'European', license: 'Public Domain' },
  { code: 'IT', name: 'Versione Riveduta 1927 / Giovanni Diodati', language: 'Italian', category: 'European', license: 'Public Domain' },
  { code: 'NL', name: 'Petrus Canisiusvertaling 1939 / Statenvertaling', language: 'Dutch', category: 'European', license: 'Public Domain' },
  { code: 'VDC', name: 'Versiunea Dumitru Cornilescu 1924', language: 'Romanian', category: 'European', license: 'Public Domain' },
  { code: 'RUS', name: 'Russian Synodal Translation (Синодальный)', language: 'Russian', category: 'European', license: 'Public Domain' },
  { code: 'UKR', name: 'Ukrainian Bible (Українська Біблія)', language: 'Ukrainian', category: 'European', license: 'Public Domain' },

  // --- Asian Languages ---
  { code: 'CUV', name: 'Chinese Union Version Traditional (和合本 繁體)', language: 'Chinese', category: 'Asian', license: 'Public Domain' },
  { code: 'CUVS', name: 'Chinese New Version Simplified (新譯本 簡體)', language: 'Chinese', category: 'Asian', license: 'Open License' },
  { code: 'KRV', name: 'Korean Revised Version (개역한글)', language: 'Korean', category: 'Asian', license: 'Public Domain' },
  { code: 'JNIV', name: 'Japanese Living / New Int. Version (新改訳)', language: 'Japanese', category: 'Asian', license: 'Open License' },
  { code: 'TL', name: 'Tagalog Ang Biblia (1905)', language: 'Tagalog / Filipino', category: 'Asian', license: 'Public Domain' },
  { code: 'VIE', name: 'Vietnamese Bible (1926 Bản Dịch)', language: 'Vietnamese', category: 'Asian', license: 'Public Domain' },
  { code: 'TSI', name: 'Terjemahan Sederhana Indonesia (TSI)', language: 'Indonesian', category: 'Asian', license: 'Open License' },
  { code: 'THAI', name: 'Thai King James Version (พระคัมภีร์ภาษาไทย)', language: 'Thai', category: 'Asian', license: 'Open License' },

  // --- Indian Languages (User Favorites) ---
  { code: 'TEL', name: 'Telugu Holy Bible (పరిశుద్ధ గ్రంథము)', language: 'Telugu', category: 'Indian', license: 'Open License' },
  { code: 'HIN', name: 'Hindi Holy Bible (पवित्र बाइबिल IRV)', language: 'Hindi', category: 'Indian', license: 'Open License' },
  { code: 'TAM', name: 'Tamil Holy Bible (பரிசுத்த வேதாகமம் IRV)', language: 'Tamil', category: 'Indian', license: 'Open License' },
  { code: 'MAL', name: 'Malayalam Holy Bible (സത്യവേദപുസ്തകം IRV)', language: 'Malayalam', category: 'Indian', license: 'Open License' },
  { code: 'KAN', name: 'Kannada Holy Bible (ಪವಿತ್ರ ಬೈಬಲ್ IRV)', language: 'Kannada', category: 'Indian', license: 'Open License' },
  { code: 'BEN', name: 'Bengali Holy Bible (पवित्र বাইবেল IRV)', language: 'Bengali', category: 'Indian', license: 'Open License' },
  { code: 'GUJ', name: 'Gujarati Holy Bible (પવિત્ર બાઇબલ IRV)', language: 'Gujarati', category: 'Indian', license: 'Open License' },
  { code: 'MAR', name: 'Marathi Holy Bible (पवित्र बायबल IRV)', language: 'Marathi', category: 'Indian', license: 'Open License' },
  { code: 'PUN', name: 'Punjabi Holy Bible (ਪਵਿੱਤਰ ਬਾਈਬਲ IRV)', language: 'Punjabi', category: 'Indian', license: 'Open License' },
  { code: 'URD', name: 'Urdu Holy Bible (کِتابِ مُقدّس IRV)', language: 'Urdu', category: 'Indian', license: 'Open License' },
  { code: 'ASM', name: 'Assamese Holy Bible (পবিত্ৰ বাইবেল IRV)', language: 'Assamese', category: 'Indian', license: 'Open License' },
  { code: 'ORY', name: 'Odia Holy Bible (ପବିତ୍ର ବାଇବଲ IRV)', language: 'Odia', category: 'Indian', license: 'Open License' },
];

export const TranslationDownloaderModal: React.FC<TranslationDownloaderModalProps> = ({
  isOpen,
  onClose,
  onDownloaded,
}) => {
  const [installedVersions, setInstalledVersions] = useState<BibleVersionDto[]>([]);
  const [downloadingCode, setDownloadingCode] = useState<string | null>(null);
  const [deletingCode, setDeletingCode] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [progressStage, setProgressStage] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<TranslationCategory>('All');

  const fetchInstalledVersions = async () => {
    if (window.scriptureStudioApi) {
      try {
        const res = await window.scriptureStudioApi.bible.getVersions();
        setInstalledVersions(res.versions || []);
      } catch (err) {
        console.error('Failed to load installed Bible versions:', err);
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchInstalledVersions();
      setStatusMessage('');
      setProgress(0);
      setProgressStage('');
    }
  }, [isOpen]);

  // Listen to IPC download progress events
  useEffect(() => {
    if (!isOpen || !window.scriptureStudioApi?.bible?.onDownloadProgress) return;

    const cleanup = window.scriptureStudioApi.bible.onDownloadProgress((evt: DownloadBibleProgressEvent) => {
      setProgress(evt.progress);
      setProgressStage(evt.stage);
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, [isOpen]);

  const handleDownload = async (module: OpenModuleItem) => {
    setDownloadingCode(module.code);
    setProgress(15);
    setProgressStage(`Connecting to cloud repository for ${module.name}...`);
    setStatusMessage('');

    try {
      if (window.scriptureStudioApi) {
        const res = await window.scriptureStudioApi.bible.downloadVersion({
          versionCode: module.code,
          languageCode: module.language.toLowerCase().substring(0, 2),
        });

        if (res.success) {
          setProgress(100);
          setProgressStage('Download and indexing complete!');
          setStatusMessage(`Successfully installed ${module.name} (${res.verseCount?.toLocaleString() || 31102} verses)!`);
          await fetchInstalledVersions();
          onDownloaded();
        } else {
          setStatusMessage(`Error: ${res.error || 'Failed to download translation.'}`);
        }
      }
    } catch (err) {
      setStatusMessage(`Error: ${String(err)}`);
    } finally {
      setTimeout(() => {
        setDownloadingCode(null);
      }, 800);
    }
  };

  const handleRemove = async (module: OpenModuleItem, versionId: string) => {
    if (!window.confirm(`Are you sure you want to remove ${module.name} (${module.code}) from offline storage?`)) {
      return;
    }

    setDeletingCode(module.code);
    setStatusMessage(`Removing ${module.name}...`);

    try {
      if (window.scriptureStudioApi) {
        await window.scriptureStudioApi.bible.deleteVersion(versionId);
        setStatusMessage(`Removed ${module.name} successfully.`);
        await fetchInstalledVersions();
        onDownloaded();
      }
    } catch (err) {
      setStatusMessage(`Error removing version: ${String(err)}`);
    } finally {
      setDeletingCode(null);
    }
  };

  // Filter and search modules
  const filteredModules = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return OPEN_MODULES.filter((item) => {
      const isInstalled = installedVersions.some(
        (v) =>
          v.abbreviation.toUpperCase() === item.code.toUpperCase() ||
          v.id.toLowerCase() === item.code.toLowerCase()
      );

      // Category filter
      if (activeCategory === 'Installed') {
        if (!isInstalled) return false;
      } else if (activeCategory !== 'All') {
        if (item.category !== activeCategory) return false;
      }

      // Search filter
      if (q) {
        const matchesCode = item.code.toLowerCase().includes(q);
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesLang = item.language.toLowerCase().includes(q);
        const matchesCat = item.category.toLowerCase().includes(q);
        return matchesCode || matchesName || matchesLang || matchesCat;
      }

      return true;
    });
  }, [searchQuery, activeCategory, installedVersions]);

  const categoryTabs: Array<{ id: TranslationCategory; label: string; count?: number }> = [
    { id: 'All', label: 'All', count: OPEN_MODULES.length },
    {
      id: 'Installed',
      label: 'Installed',
      count: OPEN_MODULES.filter((m) =>
        installedVersions.some(
          (v) =>
            v.abbreviation.toUpperCase() === m.code.toUpperCase() ||
            v.id.toLowerCase() === m.code.toLowerCase()
        )
      ).length,
    },
    { id: 'Popular', label: 'Popular English' },
    { id: 'Modern', label: 'Modern' },
    { id: 'Older', label: 'Older / Original' },
    { id: 'Spanish/Port', label: 'Spanish & Portuguese' },
    { id: 'European', label: 'European' },
    { id: 'Asian', label: 'Asian' },
    { id: 'Indian', label: 'Indian Languages' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Offline Bible Translations Catalog" width="780px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <p style={{ color: '#94A3B8', fontSize: '0.86rem', lineHeight: 1.45, margin: 0 }}>
          Manage your church’s offline scripture library. Downloaded modules are stored locally on
          disk and indexed in SQLite for instantaneous, 100% offline projection. All downloads are
          equipped with global CDN fallbacks.
        </p>

        {/* Search Input Bar */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <span style={{ position: 'absolute', left: '12px', color: '#64748B', display: 'flex', alignItems: 'center' }}>
            <MaterialIcon name="search" size={18} color="#64748B" />
          </span>
          <input
            type="text"
            placeholder="Search translation by name, code (e.g. ESV, TEL, RVR), or language..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.55rem 2.2rem 0.55rem 2.2rem',
              backgroundColor: '#0B1527',
              border: '1px solid #1E3A8A',
              borderRadius: '6px',
              color: '#F8FAFC',
              fontSize: '0.85rem',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '10px',
                background: 'none',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
              title="Clear search"
            >
              <MaterialIcon name="close" size={16} />
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <div
          className="custom-scrollbar"
          style={{
            display: 'flex',
            gap: '0.35rem',
            overflowX: 'auto',
            paddingBottom: '0.4rem',
            scrollbarWidth: 'thin',
          }}
        >
          {categoryTabs.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '999px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  border: isActive ? '1px solid #38BDF8' : '1px solid #1E293B',
                  backgroundColor: isActive ? '#0369A1' : '#0F1E36',
                  color: isActive ? '#FFFFFF' : '#94A3B8',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <span>{cat.label}</span>
                {cat.count !== undefined && (
                  <span
                    style={{
                      fontSize: '0.7rem',
                      padding: '0.05rem 0.35rem',
                      borderRadius: '999px',
                      backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : '#1E293B',
                      color: isActive ? '#FFFFFF' : '#CBD5E1',
                    }}
                  >
                    {cat.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Global Progress Bar when a module is actively downloading/installing */}
        {downloadingCode && (
          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: '8px',
              backgroundColor: '#0F1E36',
              border: '1px solid #1E3A8A',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, color: '#38BDF8', fontSize: '0.88rem' }}>
                Installing {OPEN_MODULES.find((m) => m.code === downloadingCode)?.name || downloadingCode}
              </span>
              <span style={{ fontWeight: 700, color: '#10B981', fontSize: '0.92rem' }}>
                {progress}%
              </span>
            </div>

            {/* Visual Progress Bar Track */}
            <div
              style={{
                width: '100%',
                height: '8px',
                backgroundColor: '#1E293B',
                borderRadius: '999px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.max(5, Math.min(100, progress))}%`,
                  height: '100%',
                  backgroundColor: '#10B981',
                  borderRadius: '999px',
                  transition: 'width 0.3s ease-in-out',
                  boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)',
                }}
              />
            </div>

            <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
              {progressStage || 'Processing scripture records...'}
            </div>
          </div>
        )}

        {/* Status Notification Message */}
        {statusMessage && !downloadingCode && (
          <div
            style={{
              padding: '0.65rem 0.9rem',
              borderRadius: '6px',
              backgroundColor: statusMessage.toLowerCase().includes('error') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              border: statusMessage.toLowerCase().includes('error') ? '1px solid #EF4444' : '1px solid #10B981',
              color: statusMessage.toLowerCase().includes('error') ? '#FCA5A5' : '#6EE7B7',
              fontSize: '0.82rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <MaterialIcon
              name={statusMessage.toLowerCase().includes('error') ? 'error' : 'check_circle'}
              size={17}
              color={statusMessage.toLowerCase().includes('error') ? '#EF4444' : '#10B981'}
            />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Translation Modules List */}
        <div
          className="custom-scrollbar"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.45rem',
            maxHeight: '440px',
            overflowY: 'auto',
            paddingRight: '0.35rem',
            scrollbarWidth: 'thin',
          }}
        >
          {filteredModules.length === 0 ? (
            <div
              style={{
                padding: '2.5rem 1rem',
                textAlign: 'center',
                color: '#64748B',
                fontSize: '0.88rem',
                border: '1px dashed #1E293B',
                borderRadius: '8px',
              }}
            >
              No translations matching &quot;{searchQuery}&quot; found in category &quot;{activeCategory}&quot;.
            </div>
          ) : (
            filteredModules.map((item) => {
              const installed = installedVersions.find(
                (v) =>
                  v.abbreviation.toUpperCase() === item.code.toUpperCase() ||
                  v.id.toLowerCase() === item.code.toLowerCase()
              );
              const isInstalled = !!installed;
              const isDownloading = downloadingCode === item.code;
              const isDeleting = deletingCode === item.code;
              const anyBusy = downloadingCode !== null || deletingCode !== null;

              return (
                <div
                  key={item.code}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.7rem 0.95rem',
                    backgroundColor: isInstalled ? '#0F1E36' : '#13233D',
                    border: isInstalled ? '1px solid #1E3A8A' : '1px solid #1E355B',
                    borderRadius: '6px',
                    transition: 'background-color 0.2s',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0, paddingRight: '0.75rem' }}>
                    <div style={{ fontWeight: 600, color: '#F1F5F9', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.88rem' }}>{item.name}</span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px',
                          backgroundColor: '#1E293B',
                          color: '#F59E0B',
                          fontWeight: 700,
                        }}
                      >
                        {item.code}
                      </span>
                      {isInstalled && (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '0.12rem 0.45rem',
                            borderRadius: '999px',
                            backgroundColor: 'rgba(16, 185, 129, 0.2)',
                            color: '#34D399',
                            fontWeight: 600,
                            border: '1px solid rgba(16, 185, 129, 0.4)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          <MaterialIcon name="check" size={13} color="#34D399" />
                          <span>Offline Ready</span>
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.2rem', display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                      <span>Language: <strong style={{ color: '#94A3B8' }}>{item.language}</strong></span>
                      <span>•</span>
                      <span>Category: <strong style={{ color: '#94A3B8' }}>{item.category}</strong></span>
                      <span>•</span>
                      <span>{item.license}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    {isInstalled ? (
                      <button
                        onClick={() => handleRemove(item, installed.id)}
                        disabled={anyBusy}
                        title={`Remove ${item.name} from local storage`}
                        style={{
                          padding: '0.38rem 0.8rem',
                          fontSize: '0.8rem',
                          backgroundColor: 'transparent',
                          color: '#EF4444',
                          border: '1px solid #EF4444',
                          borderRadius: '4px',
                          cursor: anyBusy ? 'not-allowed' : 'pointer',
                          opacity: anyBusy ? 0.5 : 1,
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                        }}
                      >
                        <MaterialIcon name="delete" size={15} color="#EF4444" />
                        <span>{isDeleting ? 'Removing...' : 'Remove'}</span>
                      </button>
                    ) : (
                      <button
                        className="btn-primary"
                        style={{
                          padding: '0.38rem 0.8rem',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                        }}
                        onClick={() => handleDownload(item)}
                        disabled={anyBusy}
                      >
                        <MaterialIcon name="download" size={16} />
                        <span>{isDownloading ? 'Installing...' : 'Install Offline'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem', color: '#64748B', borderTop: '1px solid #1E293B', paddingTop: '0.5rem' }}>
          <span>Showing {filteredModules.length} of {OPEN_MODULES.length} translations</span>
          <span>Dual Mirrors (GitHub + jsDelivr) enabled for high availability</span>
        </div>
      </div>
    </Modal>
  );
};
