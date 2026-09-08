import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    rules: {
      'no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      'no-console': 'warn',
      'no-var': 'off',
      eqeqeq: ['warn', 'always'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
  {
    ignores: [
      'node_modules/',
      'dist/',
      'content/',
      'images/',
      'audio/',
      'scripts/sync-registry.py',
      'scripts/import-notion.js',
      'scripts/backup-kv.js',
      '.github/',
    ],
  },
  /* ═══════════════════════════════════
     Sito principale (scripts/js/)
     Globals condivisi tra script tag
  ═══════════════════════════════════ */
  {
    files: ['scripts/js/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
        /* Namespace globali */
        ArcAdmin: 'readonly',
        mdRender: 'readonly',
        mdToc: 'readonly',
        /* app.js / app-ui.js — navigazione SPA */
        gp: 'readonly',
        showHome: 'readonly',
        closeDd: 'readonly',
        closeMobileNav: 'readonly',
        toggleMobileNav: 'readonly',
        setBnavActive: 'readonly',
        toggleDd: 'readonly',
        _openOptionsPanel: 'readonly',
        setNav: 'readonly',
        getPage: 'readonly',
        navStack: 'writable',
        _pathMap: 'writable',
        afterPageRender: 'readonly',
        UI_CONFIG: 'writable',
        csearch: 'readonly',
        jumpToSlide: 'readonly',
        /* notion-render.js — DB/contenuti locali */
        _loadLocalDb: 'readonly',
        _loadLocalPage: 'readonly',
        _scrubHtmlString: 'readonly',
        _DB_SOURCES: 'readonly',
        _memCache: 'writable',
        /* md-render.js */
        cv: 'readonly',
        _mdToHtml: 'readonly',
        /* fx.js / effetti */
        iconAccent: 'readonly',
        xfade: 'readonly',
        _sfxEnabled: 'readonly',
        _stopWhisper: 'readonly',
        toggleArcAudio: 'readonly',
        /* data.js */
        pages: 'readonly',
        SECTIONS: 'readonly',
        /* subclass-gallery.js */
        hbscSelectTab: 'readonly',
        hbscSelectClass: 'readonly',
        spSelectTab: 'readonly',
        spSelectGroup: 'readonly',
        /* timeline.js */
        tlCloseModal: 'readonly',
        /* admin-overlay / admin-preview */
        arcPreviewCancel: 'readonly',
        showToast: 'readonly',
        applyRecentBadges: 'readonly',
        /* timeline.js / altri */
        esc: 'readonly',
        tlCloseModal: 'readonly',
      },
    },
  },
  /* ═══════════════════════════════════
     Admin legacy (admin/js/)
     Globals condivisi tra script tag
  ═══════════════════════════════════ */
  {
    files: ['admin/js/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
        /* core.js — UI helpers */
        esc: 'readonly',
        escAttr: 'readonly',
        escJsAttr: 'readonly',
        toast: 'readonly',
        setStatus: 'readonly',
        setActive: 'readonly',
        closeSidebar: 'readonly',
        setCrumb: 'readonly',
        setTitle: 'readonly',
        setBadge: 'readonly',
        modalHtml: 'readonly',
        closeModal: 'readonly',
        uiConfirm: 'readonly',
        uiConfirmChoice: 'readonly',
        viewHead: 'readonly',
        dateFmt: 'readonly',
        compressImg: 'readonly',
        startDeployTimer: 'readonly',
        /* core.js — GitHub / auth */
        ghGet: 'readonly',
        ghPut: 'readonly',
        ghPutQueued: 'readonly',
        ghDeleteQueued: 'readonly',
        ghDelete: 'readonly',
        ghPutBinary: 'readonly',
        ghCommitMulti: 'readonly',
        ghCommits: 'readonly',
        ghGetAt: 'readonly',
        _authPost: 'readonly',
        _fetchCsrf: 'readonly',
        b64decode: 'readonly',
        b64encode: 'readonly',
        _checkPerm: 'readonly',
        _logAudit: 'readonly',
        GH_REPO: 'readonly',
        GH_BRANCH: 'readonly',
        /* core.js — stato editor */
        _modified: 'writable',
        _current: 'writable',
        _bulkMode: 'writable',
        _bulkSelected: 'writable',
        _saveInProgress: 'writable',
        _lastSavedContent: 'writable',
        _autosaveStore: 'writable',
        _autosaveClear: 'readonly',
        _startAutosave: 'readonly',
        _undo: 'writable',
        _redo: 'writable',
        _undoBase: 'writable',
        _currentUser: 'writable',
        _currentHead: 'writable',
        _userRole: 'writable',
        _mapActive: 'writable',
        _viewMode: 'writable',
        _contentIndex: 'writable',
        _loadContentIndex: 'readonly',
        _rewriteIndexForPage: 'readonly',
        /* immagini admin */
        _imgFilter: 'writable',
        _imgSortBy: 'writable',
        _imgViewMode: 'writable',
        _imgFilterItems: 'readonly',
        _imgSortItems: 'readonly',
        _imgCard: 'readonly',
        _imgPageOffset: 'writable',
        _imgAllItems: 'writable',
        _imgPageSize: 'writable',
        /* utenti (system.js) */
        _loadUsers: 'readonly',
        _addUser: 'readonly',
        _updateUser: 'readonly',
        _deleteUser: 'readonly',
        /* site.js / data */
        PAGES: 'readonly',
        CONTENT: 'readonly',
        SECTIONS: 'readonly',
        /* editors.js */
        LAYOUT_REGISTRY: 'readonly',
        _layoutLabel: 'readonly',
        _stSetKind: 'readonly',
        _applyEdPrefs: 'readonly',
        _paneHeadTools: 'readonly',
        buildToolbar: 'readonly',
        renderPreview: 'readonly',
        updateStats: 'readonly',
        setViewMode: 'readonly',
        renderDashboard: 'readonly',
        _checkRemoteSha: 'readonly',
        /* editor modali */
        openNewPageModal: 'readonly',
        openImportModal: 'readonly',
        exportAllPages: 'readonly',
        openImages: 'readonly',
        openCarousel: 'readonly',
        openCovers: 'readonly',
        openMapEditor: 'readonly',
        openNav: 'readonly',
        openInterfaceUI: 'readonly',
        openChangelog: 'readonly',
        openSettings: 'readonly',
        openUserManagement: 'readonly',
        openActiveSessions: 'readonly',
        openAudit: 'readonly',
        openOrphanMedia: 'readonly',
        openTrash: 'readonly',
        openLinkScanner: 'readonly',
        openLinkGraph: 'readonly',
        openGlobalFindReplace: 'readonly',
        /* structured.js */
        initStructuredEditor: 'readonly',
        _stLayoutFor: 'readonly',
        _stSyncPreview: 'readonly',
        _getPageId: 'readonly',
        /* site.js */
        renameInRegistry: 'readonly',
        renameInIndex: 'readonly',
        removeFromRegistry: 'readonly',
        removeFromIndex: 'readonly',
        openPage: 'readonly',
        openByType: 'readonly',
        buildSidebar: 'readonly',
        /* Namespace */
        ArcAdmin: 'readonly',
      },
    },
  },
  /* Cloudflare Pages Functions: runtime Workers (Fetch API) */
  {
    files: ['functions/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.worker,
        crypto: 'readonly',
      },
    },
  },
  /* Test Vitest */
  {
    files: ['**/__tests__/**/*.test.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        vi: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
      },
    },
  },
];
