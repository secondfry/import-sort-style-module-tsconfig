import { IImport } from 'import-sort-parser';
import { IMatcherFunction, IStyleAPI, IStyleItem } from 'import-sort-style';
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

/**
 * 1. Node modules.
 * 2. Absolute imports without members.
 * 3. Absolute imports with members.
 * 4. Typescript path imports.
 * 6. Relative imports with members.
 * 7. Relative imports without members.
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
    { match: and(hasNoMember, isAbsoluteModule, not(isTypescriptPathsModule(workingDir))) },
    { separator: true },

    // import … from "foo";
    {
      match: and(isAbsoluteModule, not(isTypescriptPathsModule(workingDir))),
      sort: moduleName(naturally),
      sortNamedMembers: alias(unicode),
    },
    { separator: true },

    // import "foo"; // import … from "foo";
    ...isolatePaths
      ? getTypescriptPaths(workingDir).map(path => ({
        match: and(isAbsoluteModule, isTypescriptPathModule(path)),
        sort: moduleName(naturally),
        sortNamedMembers: alias(unicode),
      }))
      : [{
        match: and(isAbsoluteModule, isTypescriptPathsModule(workingDir)),
        sort: moduleName(naturally),
        sortNamedMembers: alias(unicode),
      }],

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

export default styleModuleTsconfig;
