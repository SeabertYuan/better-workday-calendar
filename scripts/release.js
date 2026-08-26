/*
 * `npm run release -- X.Y.Z [--yes]`
 *
 * 1. Accept exactly one numeric X.Y.Z version and optional `--yes` flag.
 * 2. Require a clean working tree on `main` (or RELEASE_BRANCH) at the same
 *    commit as origin/main (or the configured release branch).
 * 3. Verify the package/manifests, ensure the vX.Y.Z tag does not exist, run
 *    the tests, and build both browser packages.
 * 4. Ask for confirmation unless `--yes` was supplied, then create an
 *    annotated vX.Y.Z tag locally and push only that tag to origin.
 *
 * This command never pushes a branch or creates the GitHub Release directly.
 * Pushing the tag triggers the GitHub release workflow.
 */

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { createInterface } = require("node:readline/promises");

const projectRoot = path.resolve(__dirname, "..");
const packagePath = path.join(projectRoot, "package.json");
const buildScriptPath = path.join(projectRoot, "scripts", "build.js");
const remoteName = "origin";
const releaseBranch = process.env.RELEASE_BRANCH || "main";
const versionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

function run(command, argumentsList, options = {}) {
  return execFileSync(command, argumentsList, {
    cwd: projectRoot,
    encoding: "utf8",
    ...options,
  });
}

function git(argumentsList, options = {}) {
  return run("git", argumentsList, options);
}

function npm(argumentsList, options = {}) {
  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  return run(npmCommand, argumentsList, options);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function parseArguments() {
  const argumentsList = process.argv.slice(2);
  const skipConfirmation = argumentsList.includes("--yes");
  const versions = argumentsList.filter(
    (argument) => argument !== "--yes",
  );

  if (versions.length !== 1 || !versionPattern.test(versions[0])) {
    throw new Error("Usage: npm run release -- X.Y.Z [--yes]");
  }
  return { version: versions[0], skipConfirmation };
}

function assertCleanWorkingTree() {
  const status = git(["status", "--porcelain"]).trim();
  if (status) {
    throw new Error(
      "The working tree is not clean. Commit or stash all changes before releasing.",
    );
  }
}

function assertOnReleaseBranch() {
  const branch = git(["branch", "--show-current"]).trim();
  if (branch !== releaseBranch) {
    throw new Error(
      `Release must run on ${releaseBranch}; current branch is ${branch || "detached HEAD"}.`,
    );
  }
}

function assertAtRemoteHead() {
  git(["fetch", "--quiet", remoteName, releaseBranch], { stdio: "inherit" });
  const localHead = git(["rev-parse", "HEAD"]).trim();
  const remoteHead = git(["rev-parse", `${remoteName}/${releaseBranch}`]).trim();
  if (localHead !== remoteHead) {
    throw new Error(
      `Local ${releaseBranch} is not at ${remoteName}/${releaseBranch}. Pull the latest merged commit first.`,
    );
  }
}

function assertTagDoesNotExist(tagName) {
  try {
    git(["rev-parse", "--verify", `refs/tags/${tagName}`], { stdio: "ignore" });
    throw new Error(`Tag ${tagName} already exists locally.`);
  } catch (error) {
    if (error.message.startsWith("Tag ")) throw error;
  }

  let remoteTags;
  try {
    remoteTags = git([
      "ls-remote",
      "--tags",
      remoteName,
      `refs/tags/${tagName}`,
    ]).trim();
  } catch (_error) {
    throw new Error(`Could not query ${remoteName} for tag ${tagName}.`);
  }
  if (remoteTags) {
    throw new Error(`Tag ${tagName} already exists on ${remoteName}.`);
  }
}

function assertVersionMatches(version) {
  const packageJson = readJson(packagePath);
  if (packageJson.version !== version) {
    throw new Error(
      `package.json has version ${packageJson.version}; expected ${version}.`,
    );
  }

  run(process.execPath, [buildScriptPath, "--check"], { stdio: "inherit" });
}

async function confirmRelease(tagName) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error("Use --yes when release confirmation cannot be displayed.");
  }

  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  try {
    const answer = await readline.question(
      `Create and push ${tagName} from ${releaseBranch}? [y/N] `,
    );
    if (!/^y(?:es)?$/i.test(answer.trim())) {
      throw new Error("Release cancelled.");
    }
  } finally {
    readline.close();
  }
}

async function main() {
  const { version, skipConfirmation } = parseArguments();
  const tagName = `v${version}`;

  assertCleanWorkingTree();
  assertOnReleaseBranch();
  assertAtRemoteHead();
  assertVersionMatches(version);
  assertTagDoesNotExist(tagName);

  console.log("Running release preflight checks...");
  npm(["test", "--", "--runInBand"], { stdio: "inherit" });
  npm(["run", "build"], { stdio: "inherit" });

  assertCleanWorkingTree();
  if (!skipConfirmation) await confirmRelease(tagName);

  git(["tag", "-a", tagName, "-m", `Release ${tagName}`], {
    stdio: "inherit",
  });
  try {
    git(["push", remoteName, tagName], { stdio: "inherit" });
  } catch (error) {
    console.error(
      `The local tag ${tagName} was created, but pushing it failed. You can retry with: git push ${remoteName} ${tagName}`,
    );
    throw error;
  }

  console.log(`Pushed ${tagName}. The GitHub release workflow will now run.`);
}

main().catch((error) => {
  console.error(`Release failed: ${error.message}`);
  process.exitCode = 1;
});
