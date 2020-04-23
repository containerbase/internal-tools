#!/bin/bash

set -e


# renovate: datasource=github-releases depName=docker/buildx
BUILDX_VERSION=v0.3.1
BUILDX_DISTRO=linux-amd64

mkdir -p $HOME/.docker/cli-plugins
TARGET=$HOME/.docker/cli-plugins/docker-buildx
curl -sSL https://github.com/docker/buildx/releases/download/${BUILDX_VERSION}/buildx-${BUILDX_VERSION}.${BUILDX_DISTRO} -o $TARGET
chmod +x $TARGET


sudo systemctl stop docker
cat /etc/docker/daemon.json | jq '. + { "data-root": "/mnt/docker" }' | sudo tee /etc/docker/daemon.json
sudo rm -rf /var/lib/docker
sudo mkdir -p /mnt/docker
sudo systemctl start docker || sudo journalctl -u docker.service

