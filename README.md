# Unused Packages Finder

## Overview

`nextjs-unused-file-finder` is a CLI tool designed specifically for **Next.js** projects to identify unused dependencies, functions, and files. It helps developers keep their codebase clean by detecting unnecessary imports and functions that are no longer in use.

## Features

- **Find unused dependencies** from `package.json`
- **Detect unused functions** across JavaScript and TypeScript files
- **Identify unused files** in the project (excluding Next.js-specific files under `src/app/**`)

## Installation

You can install the package globally using NPM:

```sh
npm install -g nextjs-unused-file-finder
```

## Usage

Run the following command inside your Next.js project root:

```sh
unused-finder
```

Or specify a directory to scan:

```sh
unused-finder /path/to/project
```

Or specify a the file to be run:

```sh
node /path/to/node_module/unused-finder/file
```

## How It Works

1. **Scans all JavaScript/TypeScript files** in the project
2. **Extracts imported dependencies and functions**
3. **Compares against `package.json` and function calls** to detect unused items
4. **Lists out unused files**, excluding Next.js routing files under `src/app/**`

## Example Output

```sh
Scanning directory: /your/nextjs/project

Unused dependencies found:
- lodash
- moment

Unused functions found:
- formatDate in utils/date.ts
- fetchUserData in services/api.ts

Unused files found:
- src/components/OldComponent.tsx
- src/utils/unusedHelper.ts
```

## Ignored Files

The following Next.js-specific files are **automatically ignored**:

- `middleware.ts`
- `layout.tsx`
- `global.css`
- `template.tsx`

Additionally, files under `src/app/**` are not considered unused (since they may be used via Next.js routing).

## Contributing

Feel free to open issues and submit pull requests to improve the tool!

## License

MIT License
