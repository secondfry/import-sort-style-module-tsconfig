import { IImport } from 'forked-import-sort-parser';
import { IMatcherFunction, IStyleAPI, IStyleItem } from 'forked-import-sort-style';
import { loadConfig } from 'tsconfig-paths';
import * as vscodeType from 'vscode';

type TOptions = {
  isolatePaths?: boolean,
  workingDir?: string
};

let vscode: typeof vscodeType;
try {
  vscode = require('vscode');
} catch (e) { /* it's ok */ }

const findVscodeWorkspace = () => {
  if (!vscode || !vscode.workspace.workspaceFolders) {
    return null;
  }

  for (let i = 0; i < vscode.workspace.workspaceFolders.length; i++) {
    const folder = vscode.workspace.workspaceFolders[i];
    if (folder.uri.scheme === 'file') {
      return folder.uri.path;
    }
  }

  return null;
}

const getTypescriptPaths = (workingDir?: string): string[] => {
  const res = loadConfig(workingDir ?? findVscodeWorkspace() ?? process.cwd());

  if (res.resultType === 'failed') {
    console.error(res);
    return [];
  }

  const paths = Object.keys(res.paths);

  for (let i = 0; i < paths.length; i++) {
    paths[i] = paths[i].replace('*', '');
  }

  return paths;
};

const isTypescriptPathModule: (path: string) => IMatcherFunction = (path: string) => (imp: IImport): boolean => {
  return imp.moduleName.startsWith(path);
}

const isTypescriptPathsModule: (workingDir?: string) => IMatcherFunction = (workingDir: string) => (imp: IImport): boolean => {
  const paths = getTypescriptPaths(workingDir);

  for (let i = 0; i < paths.length; i++) {
    if (imp.moduleName.startsWith(paths[i])) {
      return true;
    }
  }

  return false;
};

const makeTsRules = (styleApi: IStyleAPI, isolatePaths = true, workingDir?: string) => {
  const {
    alias,
    and,
    hasMember,
    isAbsoluteModule,
    moduleName,
    naturally,
    unicode,
  } = styleApi;

  if (isolatePaths) {
    const paths = getTypescriptPaths(workingDir);
    const retWithMembers: IStyleItem[] = [];
    const retRest: IStyleItem[] = [];

    for (let i = 0; i < paths.length; i++) {
      retWithMembers.push({
        match: and(hasMember, isAbsoluteModule, isTypescriptPathModule(paths[i])),
        sort: moduleName(naturally),
        sortNamedMembers: alias(unicode),
      });
      retWithMembers.push({
        separator: true
      });
      retRest.push({
        match: and(isAbsoluteModule, isTypescriptPathModule(paths[i])),
        sort: moduleName(naturally),
        sortNamedMembers: alias(unicode),
      });
      retRest.push({
        separator: true
      });
    }

    return [
      ...retWithMembers,
      ...retRest
    ];
  }

  return [
    // import MyComponent from "src/..."
    {
      match: and(hasMember, isAbsoluteModule, isTypescriptPathsModule(workingDir)),
      sort: moduleName(naturally),
      sortNamedMembers: alias(unicode),
    },
    { separator: true },

    // import "src/..."
    {
      match: and(isAbsoluteModule, isTypescriptPathsModule(workingDir)),
      sort: moduleName(naturally),
      sortNamedMembers: alias(unicode),
    },
    { separator: true },
  ];
};

/**
 * 1. Absolute imports without members.
 * 2. Node modules.
 * 3. Absolute imports with members.
 * 4. Typescript path imports.
 * 5. Relative imports with members.
 * 6. Relative imports without members.
 */
const styleModuleTsconfig = (
  styleApi: IStyleAPI,
  _filename: string,
  {
    isolatePaths = true,
    workingDir
  }: TOptions
): IStyleItem[] => {
  const {
    alias,
    and,
    dotSegmentCount,
    hasMember,
    hasNoMember,
    isAbsoluteModule,
    isNodeModule,
    isRelativeModule,
    moduleName,
    not,
    naturally,
    unicode,
  } = styleApi;

  const preTs = [
    // import "foo"
    { match: and(hasNoMember, isAbsoluteModule, not(isTypescriptPathsModule(workingDir))) },
    { separator: true },

    // import ??? from "fs";
    {
      match: isNodeModule,
      sort: moduleName(naturally),
      sortNamedMembers: alias(unicode),
    },
    { separator: true },

    // import ??? from "foo";
    {
      match: and(isAbsoluteModule, not(isTypescriptPathsModule(workingDir))),
      sort: moduleName(naturally),
      sortNamedMembers: alias(unicode),
    },
    { separator: true },
  ];

  const postTs = [
    // import ??? from "./foo";
    // import ??? from "../foo";
    {
      match: and(hasMember, isRelativeModule),
      sort: [dotSegmentCount, moduleName(naturally)],
      sortNamedMembers: alias(unicode),
    },
    { separator: true },

    // import "./foo"
    {
      match: isRelativeModule,
      sort: [dotSegmentCount, moduleName(naturally)],
    },
    { separator: true },
  ]

  return [
    ...preTs,
    ...makeTsRules(styleApi, isolatePaths, workingDir),
    ...postTs
  ];
}

export default styleModuleTsconfig;
