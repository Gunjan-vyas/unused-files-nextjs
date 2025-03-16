#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { glob } from "glob";
import chalk from "chalk";
import parser from "@babel/parser";
import _traverse from "@babel/traverse";
const traverse = _traverse.default;

const IGNORED_FILES = ["middleware.ts", "layout.tsx", "global.css", "template.tsx"];

const baseDir = process.cwd();
console.log(chalk.blue(`Scanning directory: ${baseDir}`));

const getAllFiles = (dir) => {
  return glob.sync(`${dir}/**/*.{js,jsx,ts,tsx}`, { nodir: true, ignore: "**/node_modules/**" });
};

const getAllFunctionsAndUsages = (files) => {
  const allFunctions = new Set();
  const usedFunctions = new Set();

  files.forEach((file) => {
    const content = fs.readFileSync(file, "utf-8");

    const ast = parser.parse(content, {
      sourceType: "module",
      plugins: ["jsx", "typescript"], // if using React/TypeScript
    });

    traverse(ast, {
      // Collect function declarations
      FunctionDeclaration(path) {
        if (path.node.id && path.node.id.name) {
          allFunctions.add(path.node.id.name);
        }
      },
      // Collect arrow function assigned to variables
      VariableDeclarator(path) {
        if (path.node.id.name && (path.node.init?.type === "ArrowFunctionExpression" || path.node.init?.type === "FunctionExpression")) {
          allFunctions.add(path.node.id.name);
        }
      },
      // Collect class methods
      ClassMethod(path) {
        if (path.node.key.name) {
          allFunctions.add(path.node.key.name);
        }
      },
      // Collect used function calls
      CallExpression(path) {
        if (path.node.callee.type === "Identifier") {
          usedFunctions.add(path.node.callee.name);
        } else if (path.node.callee.type === "MemberExpression" && path.node.callee.property.type === "Identifier") {
          usedFunctions.add(path.node.callee.property.name);
        }
      },
      // Collect functions used in JSX
      JSXIdentifier(path) {
        usedFunctions.add(path.node.name);
      },
      // Collect exported functions
      ExportNamedDeclaration(path) {
        if (path.node.declaration && path.node.declaration.declarations) {
          path.node.declaration.declarations.forEach((declarator) => {
            if (declarator.id && declarator.id.name) {
              usedFunctions.add(declarator.id.name);
            }
          });
        }
      },
    });
  });

  return { allFunctions, usedFunctions };
};

const getAllImports = (files, baseDir) => {
  const localImports = new Set();
  const packageImports = new Set();

  const importRegex = /(?:import\s+(?:.*?\s+from\s+)?|require\()\s*['"]([^'"]+)['"]\)?/g;

  files.forEach((file) => {
    const content = fs.readFileSync(file, "utf-8");
    let match;

    while ((match = importRegex.exec(content))) {
      let importPath = match[1];

      // -------------------------
      // 1. Handle Relative & Alias imports
      // -------------------------
      if (importPath.startsWith(".") || importPath.startsWith("@/")) {
        // Resolve alias @/ to src/
        if (importPath.startsWith("@/")) {
          importPath = path.resolve(baseDir, "src", importPath.slice(2));
        } else {
          // Resolve relative path
          importPath = path.resolve(path.dirname(file), importPath);
        }

        // Normalize and resolve possible extensions
        const possibleExtensions = ["", ".tsx", ".ts", ".jsx", ".js"];
        const resolvedPath = possibleExtensions.map((ext) => importPath + ext).find((fullPath) => fs.existsSync(fullPath));

        if (resolvedPath) {
          localImports.add(path.normalize(resolvedPath));
        }
      }
      // -------------------------
      // 2. Handle Package imports
      // -------------------------
      else {
        let packageName = importPath;

        // Handle scoped packages like "@mui/material" — get first two segments
        if (importPath.startsWith("@")) {
          const parts = importPath.split("/");
          if (parts.length >= 2) {
            packageName = parts.slice(0, 2).join("/");
          }
        } else {
          // Normal package: first segment
          packageName = importPath.split("/")[0];
        }

        packageImports.add(packageName);
      }
    }
  });

  return { localImports, packageImports };
};

const findUnusedDependencies = (baseDir) => {
  const packageJsonPath = path.join(baseDir, "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    console.error(chalk.red("package.json not found!"));
    return [];
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

  // Only consider regular dependencies (not devDependencies)
  const allDependencies = new Set(Object.keys(packageJson.dependencies || {}));

  const { packageImports } = getAllImports(getAllFiles(baseDir), baseDir);

  return [...allDependencies].filter((dep) => !packageImports.has(dep));
};

const findUnusedFunctions = (allFunctions, usedFunctions) => {
  return Array.from(allFunctions).filter((fn) => !usedFunctions.has(fn));
};

const files = getAllFiles(baseDir); // Assuming getAllFiles is implemented to get .js/.ts/.jsx/.tsx

const { allFunctions, usedFunctions } = getAllFunctionsAndUsages(files);
const unusedFunctions = findUnusedFunctions(allFunctions, usedFunctions);

console.log("Unused Functions:", unusedFunctions);

const findUnusedFiles = (baseDir) => {
  const allFiles = getAllFiles(baseDir).filter((file) => !IGNORED_FILES.some((ignored) => file.includes(ignored)));

  const { localImports } = getAllImports(allFiles, baseDir);

  // Exclude critical folders like src/app/
  const filteredFiles = allFiles.filter((file) => !file.includes("/src/app/"));

  // Files not imported anywhere
  return filteredFiles.filter((file) => !localImports.has(path.normalize(file)));
};

// Unused dependencies
const unusedDeps = findUnusedDependencies(baseDir);
if (unusedDeps.length) {
  console.log(chalk.yellow("Unused dependencies found:"), unusedDeps);
} else {
  console.log(chalk.green("No unused dependencies found."));
}

// Unused files
const allFiles = getAllFiles(baseDir).filter((file) => !IGNORED_FILES.some((ignored) => file.includes(ignored)));
const unusedFiles = findUnusedFiles(baseDir);
if (unusedFiles.length) {
  console.log(chalk.yellow("Unused files found:", unusedFiles.length));
  unusedFiles.forEach((file) => console.log(chalk.red(file)));
} else {
  console.log(chalk.green("No unused files found."));
}
