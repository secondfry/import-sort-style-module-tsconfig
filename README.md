# import-sort-style-module-tsconfig
Finds your `tsconfig.json` and uses that to separate imports.

Sort order:
1. Node modules.
2. Absolute imports without members.
3. Absolute imports with members.
4. Typescript path imports.
5. Relative imports with members.
6. Relative imports without members.

## Installation
```
npm install --save-dev \
  import-sort \
  import-sort-cli \
  import-sort-parser-typescript \
  import-sort-style-module-tsconfig
```
Add following to your `package.json`:
```
  "lint-staged": {
    "*.{tsx,ts}": [
      /* ... */
      "import-sort --write .",
      "git add"
    ]
  },
  "importSort": {
    ".ts, .tsx": {
      "parser": "typescript",
      "style": "module-tsconfig"
    }
  }
```

## Usage
Either install [sort-imports][vsc-sort-imports] for VSCode, or use via CLI (file watcher, etc.):
```
npx import-sort --write .
```

[vcs-sort-imports]: https://marketplace.visualstudio.com/items?itemName=amatiasq.sort-imports
