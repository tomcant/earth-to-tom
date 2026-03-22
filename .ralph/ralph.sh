#!/usr/bin/env bash
set -euo pipefail

# ---------------------------------------------------------------------
# ralph.sh — iteratively calls Claude Code to implement a specification
#
# Usage:
#   cd <project-dir>
#   .ralph/ralph.sh [max-iterations]
# ---------------------------------------------------------------------

MAX_ITERS="${1:-50}"
RALPH_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$RALPH_DIR/.." && pwd)"
SPEC_PATH="$REPO_ROOT/SPEC.json"

if [[ ! -f "$SPEC_PATH" ]]; then
  echo "[ralph] error: SPEC.json not found in $REPO_ROOT" >&2
  exit 1
fi

if [[ ! -d "$REPO_ROOT/.git" ]]; then
  git -C "$REPO_ROOT" init
  echo "[ralph] initialised git repo in $REPO_ROOT"
fi

COMPLETE_MARKER="$RALPH_DIR/.complete"
rm -f "$COMPLETE_MARKER"

MEMORY_PATH="$RALPH_DIR/MEMORY.md"
PROGRESS_PATH="$RALPH_DIR/PROGRESS.json"

echo "Ralph loop starting"
echo "  Spec:      ${SPEC_PATH#$REPO_ROOT/}"
echo "  Progress:  ${PROGRESS_PATH#$REPO_ROOT/}"
echo "  Memory:    ${MEMORY_PATH#$REPO_ROOT/}"
echo "  Max iters: $MAX_ITERS"
echo ""

PROMPT=$(<"$RALPH_DIR/PROMPT.md")
PROMPT="${PROMPT//\{SPEC_PATH\}/$SPEC_PATH}"
PROMPT="${PROMPT//\{PROGRESS_PATH\}/$PROGRESS_PATH}"
PROMPT="${PROMPT//\{MEMORY_PATH\}/$MEMORY_PATH}"
PROMPT="${PROMPT//\{COMPLETE_MARKER\}/$COMPLETE_MARKER}"
PROMPT="${PROMPT//\{RALPH_DIR\}/$RALPH_DIR}"

cd "$REPO_ROOT"

for (( i=1; i<=MAX_ITERS; i++ )); do
  echo "[ralph] iteration $i / $MAX_ITERS"

  if ! claude --permission-mode acceptEdits --verbose --print --output-format stream-json "$PROMPT"; then
    echo "[ralph] Claude Code exited with non-zero code (iteration $i)"
    exit 1
  fi

  if [[ -f "$COMPLETE_MARKER" ]]; then
    rm -f "$COMPLETE_MARKER"
    echo "[ralph] all items done — loop finished at iteration $i"
    exit 0
  fi
done

echo "[ralph] max iterations ($MAX_ITERS) reached, some behaviours may remain"
exit 0
