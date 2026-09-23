import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        globalSetup: './tests/setup/globalSetup.ts',
        testTimeout: 10000,
        exclude: ['dist/**', '**\/node_modules/**', '**\/.git/**'],
    }
})