import js from '@eslint/js'
import tsParser from '@typescript-eslint/parser'
import globals from 'globals'

/* L'elenco di globali era scritto a mano e mancavano API standard
   (AbortController, URLSearchParams, clearTimeout, BeforeUnloadEvent…):
   il lint falliva su codice corretto. `globals.browser` è la fonte
   aggiornata per l'ambiente del browser. */
export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'src/**/*.vue', '../export/**']
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
        ...globals.browser
      }
    },
    rules: {
      'no-unused-vars': 'off',
      /* Con TypeScript il controllo dei simboli non definiti lo fa il
         compilatore: no-undef segnala solo i tipi della lib DOM
         (RequestInit, AbortSignal…) usati come annotazione. */
      'no-undef': 'off'
    }
  }
]
