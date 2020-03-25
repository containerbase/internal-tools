![Build status](https://github.com/renovatebot/gh-action/workflows/build/badge.svg)

# Renovate docker builder action

Github Action used to build the [renovate](https://github.com/renovatebot/renovate) docker images

## Inputs

### `command`

**Required** The name of the command to execute. Default `"build"`.

## Example usage

Stop previous pending and running workflows.

```yml
- uses: renovatebot/gh-action@v0
  with:
    command: github-cleanup
```

Publish image to docker registry only if image id has changed.

```yml
- uses: renovatebot/gh-action@v0
  with:
    image: renovate/ubuntu
    tags: latest;18.04
  dry-run: ${{github.ref != 'refs/heads/master'}}
```
