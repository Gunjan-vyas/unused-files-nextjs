# Next.js Unused File Finder

## Overview

`nextjs-unused-file-finder` is a powerful **CLI tool** designed to help developers **find unused files, dependencies, and functions** in **Next.js 13+ (App Router and beyond)**. By identifying unnecessary code, this tool helps you keep your project **lean, optimized, and maintainable**.

## Features

- 🛠 **Find unused files** across your Next.js project (excluding Next.js-specific files in `src/app/**`)
- 📦 **Detect unused dependencies** in `package.json`
- 🔍 **Identify unused functions** within JavaScript and TypeScript files
- ⚡ **Works with Next.js 13+ (App Router and above)**

## Installation

Install the package globally via NPM:

```sh
npm install -g nextjs-unused-file-finder
```

## Usage

### Scan Your Next.js Project

Run the following command in your project root:

```sh
unused-finder
```

### Scan a Specific Directory

Specify a directory to analyze:

```sh
unused-finder /path/to/project
```

### Run the File Directly

If needed, execute the tool directly via:

```sh
node /path/to/node_modules/unused-finder/file
```

## How It Works

1. 📂 **Scans all JavaScript & TypeScript files** in your Next.js project
2. 📑 **Extracts imported dependencies and functions**
3. 📊 **Compares against `package.json` & function calls** to detect unused items
4. 🚀 **Lists out unused files, excluding Next.js routing files under `src/app/**`\*\*

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

By default, `nextjs-unused-file-finder` **automatically ignores** certain Next.js-specific files:

- `middleware.ts`
- `layout.tsx`
- `global.css`
- `template.tsx`
- **All files inside `src/app/**`\*\* (since they may be used via Next.js routing)

## Why Use This Tool?

✅ **Improve Performance** – Reduce unnecessary dependencies and files ✅ **Optimize Build Times** – Remove unused code for faster builds ✅ **Enhance Maintainability** – Keep your Next.js 13+ project clean and structured ✅ **Easy to Use** – Just run a single command to detect unused code

## Contributing

We welcome contributions! Feel free to open issues or submit pull requests to improve the tool. 🚀

## License

Released under the **MIT License**.

---

📢 **Get started now and optimize your Next.js 13+ project with `nextjs-unused-file-finder`!**
