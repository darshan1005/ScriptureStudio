import { ipcMain, app, BrowserWindow } from 'electron';
import fs from 'fs';
import path from 'path';
import {
  GetBibleBooksRequest,
  GetBibleChapterRequest,
  GetVerseRangeRequest,
  DownloadBibleVersionRequest,
  DownloadBibleProgressEvent,
} from '@scripture-studio/shared-types';
import { BibleRepository, DatabaseClient } from '@scripture-studio/database';
import { CANONICAL_BOOKS } from '@scripture-studio/bible-engine';
import { createLogger } from '@scripture-studio/logger';

const logger = createLogger('BibleIpcHandlers');

function broadcastDownloadProgress(versionCode: string, progress: number, stage: string): void {
  const evt: DownloadBibleProgressEvent = { versionCode, progress, stage };
  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed()) {
      win.webContents.send('bible:download-progress', evt);
    }
  });
}

export function registerBibleIpcHandlers(dbClient: DatabaseClient): void {
  const repo = new BibleRepository(dbClient.rawDb);

  // Seed baseline sample KJV data if empty
  seedInitialScriptureData(repo);

  ipcMain.handle('bible:get-versions', () => {
    return { versions: repo.getVersions() };
  });

  ipcMain.handle('bible:get-books', (_e, req: GetBibleBooksRequest) => {
    return { books: repo.getBooks(req.versionId) };
  });

  ipcMain.handle('bible:get-chapter', (_e, req: GetBibleChapterRequest) => {
    const data = repo.getChapter(req.versionId, req.bookId, req.chapterNumber);
    if (!data) {
      throw new Error(`Chapter not found: ${req.bookId} ${req.chapterNumber}`);
    }
    return data;
  });

  ipcMain.handle('bible:get-verse-range', (_e, req: GetVerseRangeRequest) => {
    return {
      verses: repo.getVerseRange(
        req.versionId,
        req.bookId,
        req.chapterNumber,
        req.startVerse,
        req.endVerse
      ),
    };
  });

  ipcMain.handle('bible:delete-version', (_e, versionId: string) => {
    repo.deleteVersion(versionId);
    try {
      const biblesDir = path.join(app.getPath('userData'), 'bibles');
      const destFile = path.join(biblesDir, `${versionId.toLowerCase()}.json`);
      if (fs.existsSync(destFile)) {
        fs.unlinkSync(destFile);
      }
    } catch (err) {
      logger.warn(`Could not delete file for version ${versionId}`, err);
    }
    return true;
  });

  ipcMain.handle('bible:download-version', async (_e, req: DownloadBibleVersionRequest) => {
    try {
      const vCode = req.versionCode.toUpperCase();
      broadcastDownloadProgress(vCode, 10, `Connecting to cloud repository for ${vCode}...`);

      const biblesDir = path.join(app.getPath('userData'), 'bibles');
      if (!fs.existsSync(biblesDir)) {
        fs.mkdirSync(biblesDir, { recursive: true });
      }

      // Check if version already installed
      const existing = repo.getVersions().find((v) => v.abbreviation.toUpperCase() === vCode);
      if (existing) {
        broadcastDownloadProgress(vCode, 100, `${vCode} is already installed.`);
        return { success: true, versionId: existing.id, verseCount: 31102 };
      }

      const thiagobodrukMapping: Record<string, string> = {
        // Best Known Translations
        KJV: 'en_kjv',
        ESV: 'en_esv',
        NIV: 'en_niv',
        NKJV: 'en_nkjv',
        NLT: 'en_nlt',
        CSB: 'en_csb',
        NASB: 'en_nasb',
        NASB95: 'en_nasb',
        AMP: 'en_amp',

        // Modern Translations
        BBE: 'en_bbe',
        BSB: 'en_bsb',
        GNT: 'en_gnt',
        LEB: 'en_leb',
        JUB: 'en_jub',
        WEB: 'en_web',
        WEBBE: 'en_webbe',
        YLT: 'en_ylt98',
        CEV: 'en_cev',
        CEB: 'en_cev',
        OJB: 'en_tojb2011',
        FBV: 'en_fbv',
        LSV: 'en_lsv',
        GNV: 'en_gnv',

        // Older & Canonical Texts
        ASV: 'en_asv',
        DBY: 'en_darby',
        DRA: 'en_dra',
        RHE: 'en_dra',
        ERV: 'en_engrv',
        RSV: 'en_engrv',
        VUL: 'la_vulg',
        GRCTR: 'grc_grctr',
        LXX: 'grc_grcbrent',
        WLC: 'he_wlc',

        // Spanish & Portuguese
        RVR: 'es_rvr1960',
        RV09: 'es_rvr1960',
        AA: 'pt_aa',
        ALM: 'pt_aa',
        'NVI-PT': 'pt_nvi',
        ARA: 'pt_ara',
        ACF: 'pt_acf',
        NVT: 'pt_nvt',
        KJA: 'pt_kja',

        // European
        FR: 'fr_apee',
        LS1910: 'fr_apee',
        LSG: 'fr_apee',
        DE: 'de_sch1951',
        LUT: 'de_sch1951',
        SCH: 'de_sch1951',
        IT: 'it_irb20',
        RIV: 'it_irb20',
        GDB: 'it_irb20',
        NL: 'nl_nld1939',
        SVV: 'nl_nld1939',
        VDC: 'ro_vdc',
        RUS: 'ru_synod',
        UKR: 'uk_vnpu',

        // Asian
        CUV: 'zh_cunpss-shen',
        CUVS: 'zh_cnvs',
        NCV: 'zh_cnvs',
        KRV: 'ko_krv',
        KO: 'ko_krv',
        JNIV: 'ja_jniv',
        JA: 'ja_jniv',
        TL: 'tl_abtag',
        VIE: 'vi_vie',
        VI: 'vi_vie',
        TSI: 'id_tsi',
        THAI: 'th_kjvthai',

        // Indian Languages
        TEL: 'te_irvtel',
        HIN: 'hi_irvhin',
        TAM: 'ta_irvtam',
        MAL: 'ml_irvmal',
        KAN: 'kn_irvkan',
        BEN: 'bn_irvben',
        GUJ: 'gu_irvguj',
        MAR: 'mr_irvmar',
        PUN: 'pa_irvpun',
        URD: 'ur_irvurd',
        ASM: 'as_irvasm',
        ORY: 'or_irvory',
      };

      const openSourceUrls: Record<string, string[]> = {};
      for (const [code, file] of Object.entries(thiagobodrukMapping)) {
        const mirrors = [
          `https://raw.githubusercontent.com/thiagobodruk/bible/master/json/${file}.json`,
          `https://cdn.jsdelivr.net/gh/thiagobodruk/bible@master/json/${file}.json`,
        ];
        if (code === 'TEL') {
          mirrors.push(
            'https://raw.githubusercontent.com/godlytalias/Bible-Database/master/Telugu/bible.json',
            'https://cdn.jsdelivr.net/gh/godlytalias/Bible-Database@master/Telugu/bible.json'
          );
        } else if (code === 'HIN') {
          mirrors.push(
            'https://raw.githubusercontent.com/godlytalias/Bible-Database/master/Hindi/bible.json',
            'https://cdn.jsdelivr.net/gh/godlytalias/Bible-Database@master/Hindi/bible.json'
          );
        } else if (code === 'TAM') {
          mirrors.push(
            'https://raw.githubusercontent.com/godlytalias/Bible-Database/master/Tamil/bible.json',
            'https://cdn.jsdelivr.net/gh/godlytalias/Bible-Database@master/Tamil/bible.json'
          );
        }
        openSourceUrls[code] = mirrors;
      }

      const candidateUrls = openSourceUrls[vCode];
      if (!candidateUrls || candidateUrls.length === 0) {
        throw new Error(`Translation module ${vCode} not available for automatic download.`);
      }

      broadcastDownloadProgress(vCode, 15, `Connecting to repository for ${vCode}...`);
      const destFile = path.join(biblesDir, `${req.versionCode.toLowerCase()}.json`);

      let rawText = '';
      let downloadSuccess = false;
      let lastErrMsg = '';

      for (const targetUrl of candidateUrls) {
        try {
          logger.info(`Attempting download of Bible ${vCode} from ${targetUrl}...`);
          const resp = await fetch(targetUrl);
          if (resp.ok) {
            rawText = await resp.text();
            fs.writeFileSync(destFile, rawText, 'utf8');
            downloadSuccess = true;
            break;
          } else {
            lastErrMsg = `HTTP status ${resp.status}`;
            logger.warn(`Failed mirror ${targetUrl}: ${lastErrMsg}`);
          }
        } catch (fetchErr) {
          lastErrMsg = String(fetchErr);
          logger.warn(`Failed mirror ${targetUrl}: ${lastErrMsg}`);
        }
      }

      if (!downloadSuccess) {
        throw new Error(`Failed to download ${vCode}: ${lastErrMsg}`);
      }

      broadcastDownloadProgress(vCode, 50, `Parsing canonical books and structure...`);
      const vId = req.versionCode.toLowerCase();

      const versionNames: Record<string, string> = {
        // Best Known
        KJV: 'King James Version (KJV)',
        ESV: 'English Standard Version (ESV)',
        NIV: 'New International Version (NIV)',
        NKJV: 'New King James Version (NKJV)',
        NLT: 'New Living Translation (NLT)',
        CSB: 'Christian Standard Bible (CSB)',
        NASB: 'New American Standard Bible (NASB)',
        NASB95: 'New American Standard Bible (NASB 1995)',
        AMP: 'Amplified Bible (AMP)',

        // Modern
        BBE: 'Bible in Basic English (BBE)',
        BSB: 'Berean Standard Bible (BSB)',
        GNT: 'Good News Translation (GNT)',
        LEB: 'Lexham English Bible (LEB)',
        JUB: 'Jubilee Bible 2000 (JUB)',
        WEB: 'World English Bible (WEB)',
        WEBBE: 'World English Bible British Edition (WEBBE)',
        YLT: "Young's Literal Translation (YLT)",
        CEV: 'Contemporary English Version (CEV)',
        CEB: 'Common English Bible / CEV (CEB)',
        OJB: 'Orthodox Jewish Bible (OJB)',
        FBV: 'Free Bible Version (FBV)',
        LSV: 'Literal Standard Version (LSV)',
        GNV: 'Geneva Bible 1599 (GNV)',

        // Older
        ASV: 'American Standard Version 1901 (ASV)',
        DBY: 'The Darby Translation (DBY)',
        DRA: 'Douay-Rheims Catholic Bible 1899 (DRA)',
        RHE: 'Douay-Rheims Catholic Bible (RHE)',
        ERV: 'English Revised Version 1885 (ERV)',
        RSV: 'Revised Standard Precursor (RSV / ERV)',
        VUL: 'The Latin Vulgate (Biblia Sacra Vulgata)',
        GRCTR: 'Greek New Testament (Textus Receptus)',
        LXX: 'Greek Septuagint with Apocrypha (Brenton)',
        WLC: 'Hebrew Westminster Leningrad Codex',

        // Spanish & Portuguese
        RVR: 'La Biblia Reina-Valera 1960 (Español)',
        RV09: 'La Biblia Reina-Valera 1909 (Español)',
        AA: 'Almeida Revista e Atualizada (Português)',
        ALM: 'Almeida Revista e Atualizada (Português)',
        'NVI-PT': 'Nova Versão Internacional (Português)',
        ARA: 'Almeida Revista e Atualizada (ARA)',
        ACF: 'Almeida Corrigida Fiel (ACF)',
        NVT: 'Nova Versão Transformadora (NVT)',
        KJA: 'King James Atualizada (KJA)',

        // European
        FR: 'Bible de Genève 1669 / Louis Segond (Français)',
        LS1910: 'Louis Segond 1910 (Français)',
        LSG: 'Louis Segond 1910 (Français)',
        DE: 'Schlachter Bibel 1951 (Deutsch)',
        LUT: 'Schlachter / Luther Bibel (Deutsch)',
        SCH: 'Schlachter Bibel 1951 (Deutsch)',
        IT: 'Versione Riveduta 1927 / Diodati (Italiano)',
        RIV: 'Versione Riveduta 1927 (Italiano)',
        GDB: 'Giovanni Diodati 1649 (Italiano)',
        NL: 'Petrus Canisiusvertaling 1939 (Nederlands)',
        SVV: 'Statenvertaling 1939 (Nederlands)',
        VDC: 'Versiunea Dumitru Cornilescu 1924 (Română)',
        RUS: 'Russian Synodal Translation (Синодальный перевод)',
        UKR: 'Ukrainian Bible (Українська Біблія)',

        // Asian
        CUV: 'Chinese Union Version Traditional (和合本 繁體)',
        CUVS: 'Chinese New Version Simplified (新譯本 簡體)',
        NCV: 'Chinese New Version Simplified (新譯本)',
        KRV: 'Korean Revised Version (개역한글)',
        KO: 'Korean Revised Version (개역한글)',
        JNIV: 'Japanese New International Version (新改訳)',
        JA: 'Japanese New International Version (新改訳)',
        TL: 'Tagalog Ang Biblia 1905 (Pilipino)',
        VIE: 'Vietnamese Bible 1926 (Bản Dịch 1926)',
        VI: 'Vietnamese Bible 1926 (Bản Dịch 1926)',
        TSI: 'Indonesian Alkitab (TSI)',
        THAI: 'Thai King James Version (พระคัมภีร์ภาษาไทย)',

        // Indian Languages
        TEL: 'Telugu Holy Bible (పరిశుద్ధ గ్రంథము IRV)',
        HIN: 'Hindi Holy Bible (पवित्र बाइबिल IRV)',
        TAM: 'Tamil Holy Bible (பரிசுத்த வேதாகமம் IRV)',
        MAL: 'Malayalam Holy Bible (സത്യവേദപുസ്തകം IRV)',
        KAN: 'Kannada Holy Bible (ಪವಿತ್ರ ಬೈಬಲ್ IRV)',
        BEN: 'Bengali Holy Bible (পবিত্র বাইবেল IRV)',
        GUJ: 'Gujarati Holy Bible (પવિત્ર બાઇબલ IRV)',
        MAR: 'Marathi Holy Bible (पवित्र बायबल IRV)',
        PUN: 'Punjabi Holy Bible (ਪਵਿੱਤਰ ਬਾਈਬਲ IRV)',
        URD: 'Urdu Holy Bible (کِتابِ مُقدّس IRV)',
        ASM: 'Assamese Holy Bible (পবিত্ৰ বাইবেল IRV)',
        ORY: 'Odia Holy Bible (ପବିତ୍ର ବାଇବଲ IRV)',
      };

      // Clean existing records if any
      try {
        repo.deleteVersion(vId);
      } catch {}

      repo.insertVersion({
        id: vId,
        name: versionNames[vCode] || `${vCode} Bible`,
        abbreviation: vCode,
        languageCode: req.languageCode || 'en',
        direction: 'ltr',
        licenseType: 'Public Domain / Open License',
        copyrightNotice: 'Public Domain',
        isActive: true,
        installedAt: new Date().toISOString(),
      });

      const books = CANONICAL_BOOKS.map((b) => ({
        id: `${vId}_${b.abbreviation.toLowerCase()}`,
        versionId: vId,
        bookOrder: b.order,
        testament: b.testament,
        name: b.name,
        abbreviation: b.abbreviation,
        chapterCount: b.chapterCount,
      }));
      repo.insertBooks(books);

      const data = JSON.parse(rawText);
      const verses: Array<{
        id: string;
        versionId: string;
        bookId: string;
        chapterNumber: number;
        verseNumber: number;
        verseText: string;
      }> = [];

      if (data.Book) {
        data.Book.forEach((b: any, bIdx: number) => {
          if (bIdx >= 66) return;
          const bookDef = CANONICAL_BOOKS[bIdx]!;
          const bookId = `${vId}_${bookDef.abbreviation.toLowerCase()}`;
          b.Chapter.forEach((ch: any, chIdx: number) => {
            const chNum = chIdx + 1;
            const verseList = Array.isArray(ch.Verse) ? ch.Verse : [ch.Verse];
            verseList.forEach((v: any, vIdx: number) => {
              const text = (v?.Verse || '').trim();
              if (text) {
                verses.push({
                  id: `${vId}_${bookDef.abbreviation.toLowerCase()}_${chNum}_${vIdx + 1}`,
                  versionId: vId,
                  bookId,
                  chapterNumber: chNum,
                  verseNumber: vIdx + 1,
                  verseText: text,
                });
              }
            });
          });
        });
      } else if (Array.isArray(data)) {
        data.forEach((b: any, bIdx: number) => {
          if (bIdx >= 66) return;
          const bookDef = CANONICAL_BOOKS[bIdx]!;
          const bookId = `${vId}_${bookDef.abbreviation.toLowerCase()}`;
          const chapters = b.chapters || [];
          chapters.forEach((versesArr: string[], chIdx: number) => {
            const chNum = chIdx + 1;
            versesArr.forEach((text: string, vIdx: number) => {
              const clean = (text || '').trim();
              if (clean) {
                verses.push({
                  id: `${vId}_${bookDef.abbreviation.toLowerCase()}_${chNum}_${vIdx + 1}`,
                  versionId: vId,
                  bookId,
                  chapterNumber: chNum,
                  verseNumber: vIdx + 1,
                  verseText: clean,
                });
              }
            });
          });
        });
      }

      broadcastDownloadProgress(vCode, 65, `Indexing ${verses.length} verses into SQLite...`);
      const chunkSize = 5000;
      for (let i = 0; i < verses.length; i += chunkSize) {
        const chunk = verses.slice(i, i + chunkSize);
        repo.insertVersesBatch(chunk);
        const processed = Math.min(i + chunkSize, verses.length);
        const pct = 65 + Math.round((processed / verses.length) * 32);
        broadcastDownloadProgress(
          vCode,
          pct,
          `Indexing verses into local SQLite (${processed} / ${verses.length})...`
        );
      }

      broadcastDownloadProgress(vCode, 100, `Complete! Successfully installed ${vCode} (${verses.length} verses).`);
      logger.info(`Successfully installed ${vCode} (${verses.length} verses)!`);
      return { success: true, versionId: vId, verseCount: verses.length };
    } catch (err) {
      logger.error(`Error downloading Bible version ${req.versionCode}`, err);
      broadcastDownloadProgress(req.versionCode.toUpperCase(), 0, `Error: ${String(err)}`);
      return { success: false, error: String(err) };
    }
  });
}

function seedInitialScriptureData(repo: BibleRepository): void {
  const versions = repo.getVersions();
  const existingKjv = versions.find((v) => v.id === 'kjv');

  // Check how many verses are present
  const verseCountRow = (repo as any).db.prepare(
    "SELECT count(*) as count FROM bible_verses WHERE version_id = 'kjv'"
  ).get() as { count: number };

  if (!existingKjv) {
    logger.info('Inserting King James Version (KJV) metadata...');
    repo.insertVersion({
      id: 'kjv',
      name: 'King James Version',
      abbreviation: 'KJV',
      languageCode: 'en',
      direction: 'ltr',
      licenseType: 'Public Domain',
      copyrightNotice: 'Public Domain',
      isActive: true,
      installedAt: new Date().toISOString(),
    });
  }

  // Insert all 66 canonical books if missing or partial
  const existingBooks = repo.getBooks('kjv');
  if (existingBooks.length < 66) {
    logger.info(`Seeding all 66 canonical Bible books for KJV...`);
    const books = CANONICAL_BOOKS.map((b) => ({
      id: `kjv_${b.abbreviation.toLowerCase()}`,
      versionId: 'kjv',
      bookOrder: b.order,
      testament: b.testament,
      name: b.name,
      abbreviation: b.abbreviation,
      chapterCount: b.chapterCount,
    }));
    repo.insertBooks(books);
  }

  // Check if KJV has corrupted apocrypha verses (e.g. Genesis chapter 1 having > 31 verses)
  const gen1Count = (repo as any).db.prepare(
    "SELECT count(*) as count FROM bible_verses WHERE version_id = 'kjv' AND book_id = 'kjv_gen' AND chapter_number = 1"
  ).get() as { count: number };

  if (gen1Count.count > 31) {
    logger.warn(`Detected corrupted Genesis 1 (${gen1Count.count} verses instead of 31). Wiping and rebuilding canonical KJV verses...`);
    (repo as any).db.prepare("DELETE FROM bible_verses WHERE version_id = 'kjv'").run();
    verseCountRow.count = 0;
  }

  // Seed verses if empty or only had sample stub (<1000 verses)
  if (verseCountRow.count < 1000) {
    logger.info('Importing complete offline KJV dataset...');
    const candidatePaths = [
      path.join(app.getAppPath(), 'resources/kjv-full.json'),
      path.join(__dirname, '../../resources/kjv-full.json'),
      path.resolve(process.cwd(), 'apps/desktop/resources/kjv-full.json'),
      path.resolve(process.cwd(), 'packages/database/src/seed/kjv-full.json'),
    ];

    let datasetPath: string | null = null;
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        datasetPath = p;
        break;
      }
    }

    if (datasetPath) {
      try {
        const raw = fs.readFileSync(datasetPath, 'utf8');
        const items = JSON.parse(raw) as Array<{
          book: number;
          chapter: number;
          verse: number;
          text: string;
        }>;

        const validCanonicalItems = items.filter((v) => v.book >= 1 && v.book <= 66);
        logger.info(`Parsed ${validCanonicalItems.length} canonical verses from ${datasetPath} (ignoring apocrypha books > 66). Writing to SQLite...`);
        const verses = validCanonicalItems.map((v) => {
          const bookDef = CANONICAL_BOOKS[v.book - 1]!;
          const cleanText = v.text.replace(/<S>\d+<\/S>/g, '').replace(/\s+/g, ' ').trim();
          return {
            id: `kjv_${bookDef.abbreviation.toLowerCase()}_${v.chapter}_${v.verse}`,
            versionId: 'kjv',
            bookId: `kjv_${bookDef.abbreviation.toLowerCase()}`,
            chapterNumber: v.chapter,
            verseNumber: v.verse,
            verseText: cleanText,
          };
        });

        repo.insertVersesBatch(verses);
        logger.info(`Successfully seeded complete KJV scripture library (${verses.length} verses)!`);
      } catch (err) {
        logger.error('Failed to parse and seed kjv-full.json dataset', err);
      }
    } else {
      logger.warn('kjv-full.json dataset not found in candidate paths; using fallback sample verses.');
      repo.insertVersesBatch([
        {
          id: 'kjv_gen_1_1',
          versionId: 'kjv',
          bookId: 'kjv_gen',
          chapterNumber: 1,
          verseNumber: 1,
          verseText: 'In the beginning God created the heaven and the earth.',
        },
        {
          id: 'kjv_jhn_1_1',
          versionId: 'kjv',
          bookId: 'kjv_john',
          chapterNumber: 1,
          verseNumber: 1,
          verseText: 'In the beginning was the Word, and the Word was with God, and the Word was God.',
        },
        {
          id: 'kjv_jhn_3_16',
          versionId: 'kjv',
          bookId: 'kjv_john',
          chapterNumber: 3,
          verseNumber: 16,
          verseText: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
        },
      ]);
    }
  }

  // ==========================================
  // Seed Telugu Bible (TEL)
  // ==========================================
  const existingTel = versions.find((v) => v.id === 'tel');
  const telVerseCountRow = (repo as any).db.prepare(
    "SELECT count(*) as count FROM bible_verses WHERE version_id = 'tel'"
  ).get() as { count: number };

  if (!existingTel) {
    logger.info('Inserting Telugu Bible (TEL) metadata...');
    repo.insertVersion({
      id: 'tel',
      name: 'Telugu Bible (పరిశుద్ధ గ్రంథము)',
      abbreviation: 'TEL',
      languageCode: 'te',
      direction: 'ltr',
      licenseType: 'Public Domain',
      copyrightNotice: 'Public Domain',
      isActive: true,
      installedAt: new Date().toISOString(),
    });
  }

  const existingTelBooks = repo.getBooks('tel');
  if (existingTelBooks.length < 66) {
    logger.info('Seeding all 66 canonical Bible books for TEL...');
    const telBooks = CANONICAL_BOOKS.map((b) => ({
      id: `tel_${b.abbreviation.toLowerCase()}`,
      versionId: 'tel',
      bookOrder: b.order,
      testament: b.testament,
      name: b.name,
      abbreviation: b.abbreviation,
      chapterCount: b.chapterCount,
    }));
    repo.insertBooks(telBooks);
  }

  const telGen1Count = (repo as any).db.prepare(
    "SELECT count(*) as count FROM bible_verses WHERE version_id = 'tel' AND book_id = 'tel_gen' AND chapter_number = 1"
  ).get() as { count: number };

  if (telGen1Count.count < 31 || telVerseCountRow.count < 30000) {
    logger.info('Wiping and cleanly seeding complete offline Telugu Bible dataset...');
    (repo as any).db.prepare("DELETE FROM bible_verses WHERE version_id = 'tel'").run();
    const telCandidatePaths = [
      path.join(app.getAppPath(), 'resources/telugu-bible.json'),
      path.join(__dirname, '../../resources/telugu-bible.json'),
      path.resolve(process.cwd(), 'apps/desktop/resources/telugu-bible.json'),
      path.resolve(process.cwd(), 'packages/database/src/seed/telugu-bible.json'),
    ];

    let telDatasetPath: string | null = null;
    for (const p of telCandidatePaths) {
      if (fs.existsSync(p)) {
        telDatasetPath = p;
        break;
      }
    }

    if (telDatasetPath) {
      try {
        const raw = fs.readFileSync(telDatasetPath, 'utf8');
        const parsed = JSON.parse(raw) as {
          Book: Array<{
            Chapter: Array<{
              Verse: Array<{ Verseid: string; Verse: string }> | { Verseid: string; Verse: string };
            }>;
          }>;
        };

        const telVerses: Array<{
          id: string;
          versionId: string;
          bookId: string;
          chapterNumber: number;
          verseNumber: number;
          verseText: string;
        }> = [];

        parsed.Book.forEach((b, bIdx) => {
          const bookDef = CANONICAL_BOOKS[bIdx] || CANONICAL_BOOKS[0]!;
          const bookId = `tel_${bookDef.abbreviation.toLowerCase()}`;
          b.Chapter.forEach((ch, chIdx) => {
            const chNum = chIdx + 1;
            const verseList = Array.isArray(ch.Verse) ? ch.Verse : [ch.Verse];
            verseList.forEach((v, vIdx) => {
              const vNum = vIdx + 1;
              const text = (v?.Verse || '').trim();
              if (text) {
                telVerses.push({
                  id: `tel_${bookDef.abbreviation.toLowerCase()}_${chNum}_${vNum}`,
                  versionId: 'tel',
                  bookId,
                  chapterNumber: chNum,
                  verseNumber: vNum,
                  verseText: text,
                });
              }
            });
          });
        });

        logger.info(`Parsed ${telVerses.length} Telugu verses. Writing to SQLite...`);
        repo.insertVersesBatch(telVerses);
        logger.info(`Successfully seeded complete Telugu Bible (${telVerses.length} verses)!`);
      } catch (err) {
        logger.error('Failed to parse and seed telugu-bible.json dataset', err);
      }
    }
  }
}

