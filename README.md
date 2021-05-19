# import-sort-style-module-tsconfig
Finds your `tsconfig.json` and uses that to separate imports.

- [import-sort-style-module-tsconfig](#import-sort-style-module-tsconfig)
  - [Sort order](#sort-order)
  - [Installation](#installation)
  - [Usage](#usage)
  - [Options](#options)

## Sort order
1. Absolute imports without members.
2. Node modules.
3. Absolute imports with members.
4. Typescript path imports with members.
5. Typescript path imports without members.
6. Relative imports with members.
7. Relative imports without members.

Example:
```typescript
import 'ignore-styles';

import path from 'path';

import React from 'react';

import MyComponent from 'src/components/my';

import 'src/theme/style.css';

import Box from './box';

import './style.css';
```

## Installation
```
npm install --save-dev \
  forked-import-sort \
  forked-import-sort-cli \
  forked-import-sort-parser-typescript \
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
      "parser": "forked-import-sort-parser-typescript",
      "style": "module-tsconfig",
      "options": {}
    }
  }
```

## Usage
Either install [sort-imports][vsc-sort-imports] for VSCode, or use via CLI (file watcher, etc.):
```
npx import-sort --write .
```

## Options
You may also pass options to this style by putting them to `options` directive in `package.json`.
| Key          | Type    | Default | Description                                      |
|--------------|---------|---------|--------------------------------------------------|
| isolatePaths | boolean | true    | Separates every tsconfig path as new group       |
| workingDir   | string  | unset   | Used as directory for `tsconfig.json` resolution |

[vsc-sort-imports]: https://marketplace.visualstudio.com/items?itemName=amatiasq.sort-imports
