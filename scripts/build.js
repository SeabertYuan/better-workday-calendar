/*
 * Commands:
 * - `npm run check:manifests`: validate the source manifests and required
 *   package files without writing to dist/.
 * - `npm run build`: validate both manifests, clear dist/, copy the shared
 *   files, write the selected manifest as manifest.json, validate each staged
 *   package, and create one versioned zip per browser.
 * - `npm run build:chrome` / `npm run build:firefox`: do the same for one
 *   browser, clearing only that browser's existing output.
 *
 * The build only writes generated files under dist/ and uses the system `zip`
 * command. It never changes source files or Git state.
 */

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const projectRoot = path.resolve(__dirname, "..");
const distRoot = path.join(projectRoot, "dist");
const packageJsonPath = path.join(projectRoot, "package.json");
const manifestFiles = {
  chrome: "manifest.chrome.json",
  firefox: "manifest.firefox.json",
};
const browsers = Object.keys(manifestFiles);
const commonPackageEntries = ["src", "icons", "LICENSE.md"];

const packageJson = readJson(packageJsonPath, "package.json");

function readJson(filePath, label) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
}

function relativeToProject(filePath) {
  return path.relative(projectRoot, filePath) || ".";
}

function getRequestedBrowsers(argumentsList) {
  const checkOnly = argumentsList.includes("--check");
  const targetArguments = argumentsList.filter((argument) => argument !== "--check");

  if (targetArguments.length > 1) {
    throw new Error("Choose one target: chrome, firefox, or all.");
  }

  const requestedTarget = targetArguments[0] || "all";
  if (requestedTarget === "all") {
    return { browsers, checkOnly };
  }
  if (!browsers.includes(requestedTarget)) {
    throw new Error(
      `Unknown target "${requestedTarget}". Choose chrome, firefox, or all.`,
    );
  }
  return { browsers: [requestedTarget], checkOnly };
}

function addIconReferences(value, references) {
  if (typeof value === "string") {
    references.add(value);
    return;
  }
  if (value && typeof value === "object") {
    Object.values(value).forEach((entry) => addIconReferences(entry, references));
  }
}

function getManifestFileReferences(manifest) {
  const references = new Set();
  addIconReferences(manifest.icons, references);
  addIconReferences(manifest.action?.default_icon, references);
  addIconReferences(manifest.browser_action?.default_icon, references);

  for (const contentScript of manifest.content_scripts || []) {
    for (const file of contentScript.js || []) references.add(file);
    for (const file of contentScript.css || []) references.add(file);
  }

  references.add(manifest.background?.service_worker);
  references.add(manifest.options_page);
  references.add(manifest.options_ui?.page);
  references.add(manifest.devtools_page);
  references.add(manifest.side_panel?.default_path);

  for (const resourceGroup of manifest.web_accessible_resources || []) {
    for (const resource of resourceGroup.resources || []) references.add(resource);
  }

  references.delete(undefined);
  references.delete(null);
  return references;
}

function resolveManifestReference(root, reference) {
  if (typeof reference !== "string" || reference.includes("*")) return null;
  if (/^[a-z][a-z\d+.-]*:/i.test(reference)) return null;

  const rootPath = path.resolve(root);
  const resolvedPath = path.resolve(rootPath, reference);
  const relativePath = path.relative(rootPath, resolvedPath);
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error(`Manifest reference escapes the package root: ${reference}`);
  }
  return resolvedPath;
}

function validateManifest(manifest, browser, packageRoot) {
  if (!manifest || Array.isArray(manifest)) {
    throw new Error(`${browser} manifest must contain a JSON object.`);
  }
  if (manifest.manifest_version !== 3) {
    throw new Error(`${browser} manifest must use manifest_version 3.`);
  }
  if (manifest.version !== packageJson.version) {
    throw new Error(
      `${browser} manifest version ${manifest.version} does not match package.json version ${packageJson.version}.`,
    );
  }

  const missingFiles = [];
  for (const reference of getManifestFileReferences(manifest)) {
    const resolvedPath = resolveManifestReference(packageRoot, reference);
    if (resolvedPath && !fs.existsSync(resolvedPath)) {
      missingFiles.push(reference);
    }
  }
  if (missingFiles.length) {
    throw new Error(
      `${browser} manifest references missing files: ${missingFiles.join(", ")}`,
    );
  }
}

function validateCommonPackageEntries(packageRoot) {
  const missingEntries = commonPackageEntries.filter(
    (entry) => !fs.existsSync(path.join(packageRoot, entry)),
  );
  if (missingEntries.length) {
    throw new Error(`Package is missing: ${missingEntries.join(", ")}`);
  }
}

function validateSourceManifests(targetBrowsers) {
  validateCommonPackageEntries(projectRoot);
  for (const browser of targetBrowsers) {
    const manifestPath = path.join(projectRoot, manifestFiles[browser]);
    const manifest = readJson(manifestPath, manifestFiles[browser]);
    validateManifest(manifest, browser, projectRoot);
  }
}

function copyCommonPackageEntries(outputDirectory) {
  for (const entry of commonPackageEntries) {
    fs.cpSync(
      path.join(projectRoot, entry),
      path.join(outputDirectory, entry),
      { recursive: true },
    );
  }
}

function createZip(browser, outputDirectory, archivePath) {
  fs.rmSync(archivePath, { force: true });
  try {
    execFileSync(
      "zip",
      ["-qrX", archivePath, ".", "-x", "*.DS_Store"],
      { cwd: outputDirectory, stdio: "inherit" },
    );
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(
        "The build requires the zip command. Install it and try again.",
      );
    }
    throw new Error(`Could not create the ${browser} zip archive.`);
  }
}

function buildBrowser(browser) {
  const outputDirectory = path.join(distRoot, browser);
  const manifestSource = path.join(projectRoot, manifestFiles[browser]);
  const manifestDestination = path.join(outputDirectory, "manifest.json");
  const archivePath = path.join(
    distRoot,
    `better-workday-calendar-v${packageJson.version}-${browser}.zip`,
  );

  fs.rmSync(outputDirectory, { recursive: true, force: true });
  fs.mkdirSync(outputDirectory, { recursive: true });
  copyCommonPackageEntries(outputDirectory);
  fs.copyFileSync(manifestSource, manifestDestination);

  const builtManifest = readJson(manifestDestination, `${browser} manifest`);
  validateManifest(builtManifest, browser, outputDirectory);
  createZip(browser, outputDirectory, archivePath);

  console.log(
    `Built ${browser}: ${relativeToProject(archivePath)} (${relativeToProject(outputDirectory)}/)`,
  );
}

function main() {
  const { browsers: requestedBrowsers, checkOnly } = getRequestedBrowsers(
    process.argv.slice(2),
  );

  validateSourceManifests(requestedBrowsers);
  if (checkOnly) {
    console.log(`Validated ${requestedBrowsers.join(" and ")} manifest(s).`);
    return;
  }

  if (requestedBrowsers.length === browsers.length) {
    fs.rmSync(distRoot, { recursive: true, force: true });
  }
  fs.mkdirSync(distRoot, { recursive: true });
  requestedBrowsers.forEach(buildBrowser);
}

try {
  main();
} catch (error) {
  console.error(`Build failed: ${error.message}`);
  process.exitCode = 1;
}
