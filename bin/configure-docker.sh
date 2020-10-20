#!/bin/bash

set -e


# renovate: datasource=github-releases depName=docker/buildx
BUILDX_VERSION=v0.4.2
BUILDX_DISTRO=linux-amd64

mkdir -p $HOME/.docker/cli-plugins
TARGET=$HOME/.docker/cli-plugins/docker-buildx
curl -sSL https://github.com/docker/buildx/releases/download/${BUILDX_VERSION}/buildx-${BUILDX_VERSION}.${BUILDX_DISTRO} -o $TARGET
chmod +x $TARGET

docker system prune --force --all
