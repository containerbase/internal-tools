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

## local testing

Without setting `CI=true` the action will always run in dry-run mode. Input must be prefixed with `INPUT_` and uppercase name.

```sh
export INPUT_COMMAND=docker-builder
pnpm start
```

## Development

`mise install` installs Node.js, pnpm, jactionlint, shellcheck, zizmor and the dependencies.

```sh
pnpm lint                                # eslint and prettier
jactionlint                              # the GitHub workflows
zizmor --config .github/zizmor.yml .     # security audit of the workflows and actions
```

CI runs jactionlint and zizmor through mise in the `setup` job, and the commit hook runs them on staged workflow and action files.
