#!/bin/bash
# Blocks commit if any staged .jsx or .js file in src/ exceeds 150 lines.
# Per CLAUDE.md rule 11. Invoked by lint-staged with staged file paths as args.
exit_code=0
for file in "$@"; do
  if [[ "$file" =~ ^src/.*\.(jsx|js)$ ]]; then
    lines=$(wc -l < "$file")
    if [ "$lines" -gt 150 ]; then
      echo "FAIL: $file is $lines lines (max 150). Split before committing."
      exit_code=1
    fi
  fi
done
exit $exit_code
