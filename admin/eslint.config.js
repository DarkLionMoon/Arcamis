import js from '@eslint/js'
import tsParser from '@typescript-eslint/parser'

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'src/**/*.vue']
  },
  js.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      },
      globals: {
        browser: 'readonly',
        document: 'readonly',
        window: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        HeadersInit: 'readonly',
        Response: 'readonly',
        File: 'readonly',
        Image: 'readonly',
        URL: 'readonly',
        btoa: 'readonly',
        atob: 'readonly',
        crypto: 'readonly',
        TextEncoder: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': 'off'
    }
  }
]
