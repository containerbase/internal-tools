#!/usr/bin/env bash
# Checks if a pull request or merge group needs the build, see `action.yml`.
# Writes the `skip-build` and `changed-files` outputs.

set -euo pipefail

# set by `action.yml`
: "${EVENT_NAME:?}" "${SKIP_PATHS:?}" "${SKIP_LABEL:?}" "${REPOSITORY:?}"

# Writes the skip-build output.
output() {
  echo "skip-build=$1" >> "${GITHUB_OUTPUT}"
}

# Succeeds when the changed files all match the skip paths from the base.
# A missing file never skips, an invalid one fails the step.
paths_skip() {
  local skip_paths="${RUNNER_TEMP}/build-skip-paths"
  local raw_paths="${RUNNER_TEMP}/build-skip-paths.raw"
  if ! git show "${BASE_SHA}:${SKIP_PATHS}" > "${raw_paths}"; then
    echo "::warning::The base has no ${SKIP_PATHS}, running the full build"
    return 1
  fi
  # an empty pattern matches every path, so drop empty and comment lines
  grep -vE '^[[:space:]]*(#|$)' "${raw_paths}" > "${skip_paths}" || true
  if [[ ! -s "${skip_paths}" ]]; then
    echo "::warning::${SKIP_PATHS} in the base has no patterns, running the full build"
    return 1
  fi
  # 0: some file needs the build, 1: none does, else an invalid pattern
  local status=0
  grep -vE -f "${skip_paths}" "${RUNNER_TEMP}/changed-files" || status=$?
  case "${status}" in
    0) return 1 ;;
    1) return 0 ;;
    *)
      echo "::error::Invalid ${SKIP_PATHS} in the base"
      exit 1
      ;;
  esac
}

# Succeeds when the pull request has the skip label.
# The labels come from the event payload.
pull_request_labeled() {
  jq -e --arg label "${SKIP_LABEL}" 'index($label) != null' <<< "${PR_LABELS}" > /dev/null
}

# Succeeds when every pull request of the merge group has the skip label.
# The pull requests are read from the subjects of the commits between the base and the
# group head, `(#123)` for squash merges and `Merge pull request #123` for merge commits,
# because the group ref only names its last pull request. Each pull request must also be in
# the merge queue, so a subject citing an older, labeled pull request can't skip the build.
# A commit without a pull request number or a failing lookup never skips.
merge_group_labeled() {
  local number_re='\(#([0-9]+)\)$'
  local merge_re='^Merge pull request #([0-9]+)'
  # shellcheck disable=SC2016 # GraphQL variables, not shell expansions
  local query='query($owner: String!, $name: String!, $number: Int!) {
    repository(owner: $owner, name: $name) {
      pullRequest(number: $number) { isInMergeQueue labels(first: 100) { nodes { name } } }
    }
  }'
  local subjects subject number pr
  subjects="$(gh api --paginate "repos/${REPOSITORY}/compare/${BASE_SHA}...${HEAD_SHA}" \
    --jq '.commits[].commit.message | split("\n")[0]')" || return 1
  [[ -n "${subjects}" ]] || return 1
  while IFS= read -r subject; do
    if [[ "${subject}" =~ ${number_re} || "${subject}" =~ ${merge_re} ]]; then
      number="${BASH_REMATCH[1]}"
    else
      echo "No pull request found for commit: ${subject}"
      return 1
    fi
    pr="$(gh api graphql -f query="${query}" -f owner="${REPOSITORY%%/*}" \
      -f name="${REPOSITORY#*/}" -F number="${number}" --jq '.data.repository.pullRequest')" \
      || return 1
    jq -e --arg label "${SKIP_LABEL}" \
      '.isInMergeQueue and ([.labels.nodes[].name] | index($label) != null)' \
      <<< "${pr}" > /dev/null || return 1
  done <<< "${subjects}"
}

if [[ "${EVENT_NAME}" != 'pull_request' && "${EVENT_NAME}" != 'merge_group' ]]; then
  output false
  exit 0
fi

git fetch --no-tags --depth=1 origin "${BASE_SHA}"
git diff --no-renames --name-only "${BASE_SHA}" HEAD > "${RUNNER_TEMP}/changed-files"
echo "changed-files=${RUNNER_TEMP}/changed-files" >> "${GITHUB_OUTPUT}"

if paths_skip; then
  output true
elif [[ "${EVENT_NAME}" == 'pull_request' ]] && pull_request_labeled; then
  output true
elif [[ "${EVENT_NAME}" == 'merge_group' ]] && merge_group_labeled; then
  output true
else
  output false
fi
