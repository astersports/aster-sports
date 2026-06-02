#!/bin/bash
# Blocks commit if any staged .jsx or .js file in src/ exceeds 150 lines.
# Per CLAUDE.md rule 11. Invoked by lint-staged with staged file paths as args.
#
# Exception list (per CLAUDE.md §6 "Known >150 LOC exceptions"): these files
# are documented exceptions waiting for cap-pressure-triggered splits. The
# §0 verification grep exempts the same set; this script mirrors it so the
# pre-commit hook doesn't fight the doctrine.
EXEMPT='(AuthContext\.jsx|BriefingComposer\.jsx|kindMetadata\.js|familyGuideHelpers\.js|registry\.js)$'

exit_code=0
for file in "$@"; do
  if [[ "$file" =~ ^src/.*\.(jsx|js)$ ]]; then
    if [[ "$file" =~ $EXEMPT ]]; then
      continue
    fi
    lines=$(wc -l < "$file")
    if [ "$lines" -gt 150 ]; then
      echo "FAIL: $file is $lines lines (max 150). Split before committing."
      exit_code=1
    fi
  fi
done
exit $exit_code
