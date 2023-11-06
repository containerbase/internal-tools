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

## local testing

Without setting `CI=true` the action will always run in dry-run mode. Input must be prefixed with `INPUT_` and uppercase name.

```sh
export INPUT_COMMAND=docker-builder
pnpm start
```
