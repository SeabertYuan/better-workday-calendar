const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const outputRoot = path.join(projectRoot, "dist", "firefox");
const manifestSource = path.join(projectRoot, "firefox", "manifest.json");

fs.rmSync(outputRoot, { recursive: true, force: true });
fs.mkdirSync(outputRoot, { recursive: true });

for (const directory of ["src", "icons"]) {
  fs.cpSync(
    path.join(projectRoot, directory),
    path.join(outputRoot, directory),
    { recursive: true },
  );
}

fs.copyFileSync(manifestSource, path.join(outputRoot, "manifest.json"));
fs.copyFileSync(
  path.join(projectRoot, "LICENSE.md"),
  path.join(outputRoot, "LICENSE.md"),
);

const manifest = JSON.parse(
  fs.readFileSync(path.join(outputRoot, "manifest.json"), "utf8"),
);
const iconFiles = Object.values(manifest.icons || {});
const contentScriptFiles = (manifest.content_scripts || []).flatMap(
  (script) => script.js || [],
);
const requiredFiles = [...iconFiles, ...contentScriptFiles];
const missingFiles = requiredFiles.filter(
  (file) => !fs.existsSync(path.join(outputRoot, file)),
);

if (missingFiles.length) {
  throw new Error(`Firefox package is missing: ${missingFiles.join(", ")}`);
}

console.log(`Firefox extension prepared at ${path.relative(projectRoot, outputRoot)}`);
