# Renovate docker builder action

[![Build status](https://github.com/renovatebot/internal-tools/workflows/build/badge.svg)](https://github.com/renovatebot/internal-tools/actions?query=workflow%3Abuild)
![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/containerbase/internal-tools)
![Licence: AGPL-3.0](https://img.shields.io/github/license/containerbase/internal-tools)
[![codecov](https://codecov.io/gh/containerbase/internal-tools/branch/main/graph/badge.svg?token=NF90aCGVDB)](https://codecov.io/gh/containerbase/internal-tools)

Github Action used to build the [renovate](https://github.com/renovatebot/renovate) docker images

## Inputs

### `command`

**Required** The name of the command to execute. Default `"build"`.

## Example usage

### docker-publish

Publish image to docker registry only if image id has changed.

```yml
- uses: renovatebot/gh-action@v0
  with:
    command: docker-publish
    image: renovate/ubuntu
    tags: latest;18.04
    dry-run: ${{github.ref != 'refs/heads/main'}}
```

### docker-config

Configure docker with buildx on second harddrive.

```yml
- uses: renovatebot/gh-action@v0
  with:
    command: docker-config
```

### binary-builder

Build each missing version with the repository's `builder.sh`, then upload the archive and its checksum to the GitHub release.
The versions to build are configured in `builder.json` (see `schema.json`).
The `build-limit` input caps the number of versions built in one run (default `99`), so a run fits the job timeout.

To test an archive before it gets uploaded, set `test` in `builder.json` to a script path relative to the workspace.
The script runs on the host after each build, also in dry-run mode, with the absolute archive path and the version as arguments and with the environment of the action, e.g. `DISTRO` and `ARCH`.
It can start the distro images to test in itself.
When it fails, the version is marked as failed and nothing gets uploaded for it.

```json
{
  "image": "git",
  "startVersion": "2.40.0",
  "test": "bin/test.sh"
}
```

### trigger-file

Updates the rebuild trigger file (`renovate.Dockerfile`) of a prebuild repository from [endoflife.date](https://endoflife.date).
The file has one block per supported release stream: an optional `# EOL:` comment, a `# renovate:` comment and an `ENV` or `RUN install-tool` line.
The command drops the blocks of EOL streams and duplicates, adds a block with the latest version for every new supported cycle and normalizes the comments to `# EOL: yyyy-mm` (`TBD` without an EOL date).
Streams unknown to endoflife.date are kept with a warning.

It is configured by `eol` in `builder.json` (see `schema.json`), without it the command does nothing:

```json
{
  "eol": { "product": "python", "stream": "minor", "file": "renovate.Dockerfile" }
}
```

`stream` is `major` or `minor` and defines which part of the version identifies a block, `file` is optional.
The command sets the outputs `changed` and `summary`, a markdown list to use as pull request body. With `dry-run: true` it only logs the result.

```yml
- uses: containerbase/internal-tools@v5.5.0
  id: trigger
  with:
    command: trigger-file
    dry-run: ${{ github.ref != 'refs/heads/main' }}
```

### changes

The `changes` action checks if a pull request or merge group needs the build, so the workflow can skip the expensive jobs.
Its output `skip-build` is `true` when all changed files match the patterns of the `skip-paths` file or when the skip label is set, `changed-files` is the path of the list of changed files.
The skip paths file is one extended regex per line and always read from the base commit, so a pull request can't skip its own build.
Empty lines and `#` comments are ignored, a file without patterns never skips the build.
For merge groups, the pull requests are read from the subjects of the commits between the base and the group head (`(#123)` or `Merge pull request #123`) and all of them need the label.
A commit without a pull request number or a failing lookup never skips the build.
The action needs a checkout and the `pull-requests: read` permission for the lookup in merge groups.

```yml
permissions:
  contents: read
  pull-requests: read

steps:
  - uses: actions/checkout@v7
  - uses: containerbase/internal-tools/changes@v5.5.0
    id: changes
    with:
      skip-paths: .github/build-skip-paths # default
      skip-label: ci:skip-build # default
  - run: echo "${SKIP_BUILD}"
    env:
      SKIP_BUILD: ${{ steps.changes.outputs.skip-build }}
```

## local testing

Without setting `CI=true` the action will always run in dry-run mode. Input must be prefixed with `INPUT_` and uppercase name.

```sh
export INPUT_COMMAND=docker-builder
pnpm start
```

## Development

`mise install` installs Node.js, pnpm, jactionlint, shellcheck and zizmor, then `pnpm install --frozen-lockfile` installs the dependencies.

```sh
pnpm lint                                # oxlint and oxfmt
jactionlint                              # the GitHub workflows
zizmor --config .github/zizmor.yml .     # security audit of the workflows and actions
```

CI runs jactionlint and zizmor through mise in the `setup` job, and the commit hook runs them on staged workflow and action files.
