[![Build status](https://github.com/renovatebot/internal-tools/workflows/build/badge.svg)](https://github.com/renovatebot/internal-tools/actions?query=workflow%3Abuild)

# Renovate docker builder action

Github Action used to build the [renovate](https://github.com/renovatebot/renovate) docker images

## Inputs

### `command`

**Required** The name of the command to execute. Default `"build"`.

## Example usage

### github-cleanup

Stop previous pending and running workflows.

```yml
- uses: renovatebot/gh-action@v0
  with:
    command: github-cleanup
```

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
yarn start
```
