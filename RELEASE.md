# Release process

## Update the version

The following files must contain the same `version` value:

- `package.json`
- `package-lock.json`
- `manifest.chrome.json`
- `manifest.firefox.json`

Use the following command to update all four files without creating a commit,
tag, or push:

```sh
npm run bump-version -- 3.1.0
```

The command updates `package.json`, `package-lock.json`,
`manifest.chrome.json`, and `manifest.firefox.json`, then validates the
manifests.

Run the local checks:

```sh
npm run check:manifests
npm test
```

To inspect the generated zip files locally, also run:

```sh
npm run build
```

## Merge and publish

Commit the version update, open a pull request, and merge it into the default
branch (usually `main`) after CI passes. After the merge, update your local
default branch and run:

```sh
git switch main
git pull --ff-only origin main
npm run release -- 3.1.0
```

The release command requires a clean, up-to-date `main` branch. It verifies the
version and manifests, runs the tests, builds both browser packages, asks for
confirmation, creates the annotated `v3.1.0` tag, and pushes that tag to
`origin`. Use `--yes` to skip the confirmation prompt.

Pushing the tag starts the release workflow. It verifies the tag again, builds
the packages from the tagged revision, creates a GitHub Release, and attaches
the Chrome and Firefox zip files.
