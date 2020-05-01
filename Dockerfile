FROM renovate/renovate:19.225.3-slim

FROM scratch

# renovate: datasource=npm depName=yarn versioning=npm
ARG YARN_VERSION=1.22.0

# renovate: datasource=npm depName=pnpm versioning=npm
ARG PNPM_VERSION=4.0.0

# renovate: datasource=docker depName=python versioning=docker
ARG PYTHON_VERSION=3.7.7
