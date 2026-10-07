const js = require('@eslint/js');
const globals = require('globals');
const tseslint = require('typescript-eslint');
const { defineConfig, globalIgnores } = require('eslint/config');
const prettier = require('eslint-config-prettier');

module.exports = defineConfig([
    globalIgnores(['dist', 'node_modules']),
    {
        files: ['**/*.ts'],
        extends: [js.configs.recommended, tseslint.configs.recommended, prettier],
        languageOptions: {
            globals: globals.node,
        },
    },
]);