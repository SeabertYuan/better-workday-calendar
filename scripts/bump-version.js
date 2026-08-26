/*
 * `npm run bump-version -- X.Y.Z`
 *
 * 1. Accept exactly one numeric X.Y.Z version.
 * 2. Update the version in package.json, package-lock.json, and both browser
 *    manifests.
 * 3. Run `scripts/build.js --check` to validate the result.
 * 4. Restore the original files if updating or validation fails.
 *
 * This command never creates a commit or tag and never pushes to GitHub.
 */

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const projectRoot = path.resolve(__dirname, "..");
const packagePath = path.join(projectRoot, "package.json");
const packageLockPath = path.join(projectRoot, "package-lock.json");
const manifestPaths = [
  path.join(projectRoot, "manifest.chrome.json"),
  path.join(projectRoot, "manifest.firefox.json"),
];
const buildScriptPath = path.join(projectRoot, "scripts", "build.js");
const versionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function getNextVersion() {
  const [version, ...unexpectedArguments] = process.argv.slice(2);
  if (!version || unexpectedArguments.length) {
    throw new Error("Usage: npm run bump-version -- X.Y.Z");
  }
  if (!versionPattern.test(version)) {
    throw new Error("Version must use the numeric X.Y.Z format.");
  }
  return version;
}

let expectedVersion;

function main() {
  expectedVersion = getNextVersion();
  const packageJson = readJson(packagePath);
  const packageLock = readJson(packageLockPath);

  if (packageJson.version === expectedVersion) {
    throw new Error(`Version is already ${expectedVersion}.`);
  }

  if (!packageLock.packages || !packageLock.packages[""]) {
    throw new Error("package-lock.json does not contain its root package entry.");
  }

  const originalFiles = new Map(
    [packagePath, packageLockPath, ...manifestPaths].map((filePath) => [
      filePath,
      fs.readFileSync(filePath),
    ]),
  );

  try {
    packageJson.version = expectedVersion;
    packageLock.version = expectedVersion;
    packageLock.packages[""].version = expectedVersion;
    writeJson(packagePath, packageJson);
    writeJson(packageLockPath, packageLock);

    for (const manifestPath of manifestPaths) {
      const manifest = readJson(manifestPath);
      manifest.version = expectedVersion;
      writeJson(manifestPath, manifest);
    }

    execFileSync(process.execPath, [buildScriptPath, "--check"], {
      cwd: projectRoot,
      stdio: "inherit",
    });
  } catch (error) {
    for (const [filePath, contents] of originalFiles) {
      fs.writeFileSync(filePath, contents);
    }
    throw error;
  }

  console.log(
    `Updated package.json, package-lock.json, and both browser manifests to ${expectedVersion}.`,
  );
  console.log("No commit, tag, or push was created.");
}

try {
  main();
} catch (error) {
  console.error(`Version update failed: ${error.message}`);
  process.exitCode = 1;
}
