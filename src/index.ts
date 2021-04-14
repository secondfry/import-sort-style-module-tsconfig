import { IMatcherFunction, IStyleAPI, IStyleItem } from 'import-sort-style';

import { IImport } from 'import-sort-parser';
import { loadConfig } from 'tsconfig-paths';

const getTypescriptPaths = (): string[] => {
  const res = loadConfig();

  if (res.resultType === 'failed') {
    return [];
  }

  const paths = Object.keys(res.paths);

  for (let i = 0; i < paths.length; i++) {
    paths[i] = paths[i].replace('*', '');
  }

  return paths;
};

const isTypescriptPathModule: IMatcherFunction = (imp: IImport): boolean => {
  const paths = getTypescriptPaths();

  for (let i = 0; i < paths.length; i++) {
    if (imp.moduleName.startsWith(paths[i])) {
      return true;
    }
  }

  return false;
};

/**
 * 1. Node modules.
 * 2. Absolute imports without members.
 * 3. Absolute imports with members.
 * 4. Typescript path imports.
 * 6. Relative imports with members.
 * 7. Relative imports without members.
 */
export default function (styleApi: IStyleAPI): IStyleItem[] {
  const {
    alias,
    and,
    dotSegmentCount,
    hasNoMember,
    isAbsoluteModule,
    isNodeModule,
    isRelativeModule,
    moduleName,
    not,
    naturally,
    unicode,
  } = styleApi;

  return [
    // import … from "fs";
    {
      match: isNodeModule,
      sort: moduleName(naturally),
      sortNamedMembers: alias(unicode),
    },
    { separator: true },

    // import "foo"
    { match: and(hasNoMember, isAbsoluteModule, not(isTypescriptPathModule)) },
    { separator: true },

    // import … from "foo";
    {
      match: and(isAbsoluteModule, not(isTypescriptPathModule)),
      sort: moduleName(naturally),
      sortNamedMembers: alias(unicode),
    },
    { separator: true },

    // import "foo"; // import … from "foo";
    {
      match: and(isAbsoluteModule, isTypescriptPathModule),
      sort: moduleName(naturally),
      sortNamedMembers: alias(unicode),
    },
    { separator: true },

    // import … from "./foo";
    // import … from "../foo";
    {
      match: isRelativeModule,
      sort: [dotSegmentCount, moduleName(naturally)],
      sortNamedMembers: alias(unicode),
    },
    { separator: true },

    // import "./foo"
    { match: and(hasNoMember, isRelativeModule) },
    { separator: true },
  ];
}
