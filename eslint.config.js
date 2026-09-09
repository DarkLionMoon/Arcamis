import js from '@eslint/js'
import globals from 'globals'

export default [
  js.configs.recommended,
  {
    rules: {
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          varsIgnorePattern: '^_'
        }
      ],
      'no-console': 'warn',
      'no-var': 'off',
      eqeqeq: ['warn', 'always'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-empty': ['error', { allowEmptyCatch: true }]
    }
  },
  {
    ignores: [
      'node_modules/',
      'dist/',
      'export/',
      'content/',
      'images/',
      'audio/',
      'admin/',
      'scripts/sync-registry.py',
      'scripts/import-notion.js',
      'scripts/backup-kv.js',
      '.github/'
    ]
  },
  {
    files: ['scripts/js/**/*.js'],
    rules: {
      'no-redeclare': 'warn',
      'no-undef': 'warn',
      'no-func-assign': 'warn',
      'no-control-regex': 'warn',
      'no-useless-escape': 'warn',
      'no-regex-spaces': 'warn',
      'no-prototype-builtins': 'warn'
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ArcAdmin: 'readonly',
        mdRender: 'readonly',
        mdToc: 'readonly',
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
        UI_CONFIG: 'writable',
        csearch: 'readonly',
        jumpToSlide: 'readonly',
        _loadLocalDb: 'readonly',
        _loadLocalPage: 'readonly',
        _scrubHtmlString: 'readonly',
        _DB_SOURCES: 'readonly',
        _memCache: 'writable',
        cv: 'readonly',
        _mdToHtml: 'readonly',
        iconAccent: 'readonly',
        xfade: 'readonly',
        _sfxEnabled: 'readonly',
        _stopWhisper: 'readonly',
        toggleArcAudio: 'readonly',
        pages: 'readonly',
        SECTIONS: 'readonly',
        hbscSelectTab: 'readonly',
        hbscSelectClass: 'readonly',
        spSelectTab: 'readonly',
        spSelectGroup: 'readonly',
        tlCloseModal: 'readonly',
        arcPreviewCancel: 'readonly',
        showToast: 'readonly',
        applyRecentBadges: 'readonly',
        esc: 'readonly'
      }
    }
  },
  {
    files: ['functions/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.worker,
        crypto: 'readonly'
      }
    }
  },
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
        afterEach: 'readonly'
      }
    }
  }
]
