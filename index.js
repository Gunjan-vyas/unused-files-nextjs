#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { glob } from "glob";
import chalk from "chalk";

const IGNORED_FILES = ["middleware.ts", "layout.tsx", "global.css", "template.tsx"];

const getAllFiles = (dir) => {
  return glob.sync(`${dir}/**/*.{js,jsx,ts,tsx}`, { nodir: true, ignore: "**/node_modules/**" });
};

const getAllImports = (files, baseDir) => {
  const imports = new Set();
  const importRegex = /(?:import\s+.*?from\s+|require\()['"]([^'";]+)['"]\)?/g;

  files.forEach((file) => {
    const content = fs.readFileSync(file, "utf-8");
    let match;
    while ((match = importRegex.exec(content))) {
      let importPath = match[1];

      if (importPath.startsWith(".")) {
        importPath = path.resolve(path.dirname(file), importPath);
      } else if (importPath.startsWith("@/")) {
        importPath = path.resolve(baseDir, "src", importPath.slice(2));
      } else {
        continue;
      }

      const possibleExtensions = [".tsx", ".ts", ".jsx", ".js"];
      if (!fs.existsSync(importPath)) {
        importPath = possibleExtensions.map((ext) => importPath + ext).find((filePath) => fs.existsSync(filePath)) || importPath;
      }

      imports.add(importPath);
    }
  });
  return imports;
};

const findUnusedDependencies = (baseDir) => {
  const packageJsonPath = path.join(baseDir, "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    console.error(chalk.red("package.json not found!"));
    return [];
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  const allDependencies = new Set([...Object.keys(packageJson.dependencies || {}), ...Object.keys(packageJson.devDependencies || {})]);

  const usedImports = getAllImports(getAllFiles(baseDir), baseDir);
  return [...allDependencies].filter((dep) => !usedImports.has(dep));
};

const findUnusedFunctions = (files) => {
  const functionRegex = /(?:function|const|let|var)\s+([a-zA-Z0-9_]+)\s*\(/g;
  const functions = new Map();
  const usedFunctions = new Set();

  files.forEach((file) => {
    const content = fs.readFileSync(file, "utf-8");
    let match;

    while ((match = functionRegex.exec(content))) {
      functions.set(match[1], file);
    }
  });

  files.forEach((file) => {
    const content = fs.readFileSync(file, "utf-8");
    functions.forEach((filePath, fn) => {
      if (new RegExp(`\\b${fn}\\b`).test(content)) {
        usedFunctions.add(fn);
      }
    });
  });

  return [...functions.entries()].filter(([fn]) => !usedFunctions.has(fn));
};

const findUnusedFiles = (baseDir) => {
  const allFiles = getAllFiles(baseDir).filter((file) => !IGNORED_FILES.some((ignored) => file.includes(ignored)));

  const usedImports = getAllImports(allFiles, baseDir);

  // Exclude files under src/app/** from being returned as unused
  const filteredFiles = allFiles.filter((file) => !file.includes("/src/app/"));

  return filteredFiles.filter((file) => !usedImports.has(file));
};

const baseDir = process.cwd();
console.log({ baseDir }, process.argv[2], process.cwd());
console.log(chalk.blue(`Scanning directory: ${baseDir}`));

const unusedDeps = findUnusedDependencies(baseDir);
if (unusedDeps.length) {
  console.log(chalk.yellow("Unused dependencies found:"), unusedDeps);
} else {
  console.log(chalk.green("No unused dependencies found."));
}

const allFiles = getAllFiles(baseDir).filter((file) => !IGNORED_FILES.some((ignored) => file.includes(ignored)));
const unusedFunctions = findUnusedFunctions(allFiles);
if (unusedFunctions.length) {
  console.log(chalk.yellow("Unused functions found:"));
  unusedFunctions.forEach(([fn, file]) => console.log(`${chalk.red(fn)} in ${file}`));
} else {
  console.log(chalk.green("No unused functions found."));
}

const unusedFiles = findUnusedFiles(baseDir);
if (unusedFiles.length) {
  console.log(chalk.yellow("Unused files found:", unusedFiles.length));
  unusedFiles.forEach((file) => console.log(chalk.red(file)));
} else {
  console.log(chalk.green("No unused files found."));
}
