#!/bin/bash
# RLS smoke test: verifies that anon-key cannot read cross-org data.
# Run AFTER applying 009_fix_public_read_rls.sql. If any table returns rows,
# the fix failed and you must apply 009_revert.sql immediately.

set -e

SUPABASE_URL="${SUPABASE_URL:-https://vrwwpsbfbnveawqwbdmj.supabase.co}"
ANON_KEY="${SUPABASE_ANON_KEY:?SUPABASE_ANON_KEY env var required. Set with: export SUPABASE_ANON_KEY=eyJ...}"

TABLES=("event_rsvps" "event_rides" "event_duties" "event_comments")
EXIT_CODE=0

echo "Running RLS smoke test against $SUPABASE_URL"
echo "Using anon key (no user auth). Expect zero rows from each table."
echo ""

for TABLE in "${TABLES[@]}"; do
  RESPONSE=$(curl -s -X GET \
    "$SUPABASE_URL/rest/v1/$TABLE?select=id&limit=5" \
    -H "apikey: $ANON_KEY" \
    -H "Authorization: Bearer $ANON_KEY")

  COUNT=$(echo "$RESPONSE" | jq 'if type == "array" then length else 0 end' 2>/dev/null || echo "0")

  if [ "$COUNT" -eq 0 ]; then
    echo "PASS: $TABLE returned 0 rows (RLS blocking anon correctly)"
  else
    echo "FAIL: $TABLE returned $COUNT rows to anon key — RLS HOLE STILL OPEN"
    echo "Response: $RESPONSE"
    EXIT_CODE=1
  fi
done

echo ""
if [ $EXIT_CODE -eq 0 ]; then
  echo "All RLS smoke tests passed. Cross-org data is not leaking via anon key."
else
  echo "SMOKE TEST FAILED. Apply 009_revert.sql immediately and investigate."
fi

exit $EXIT_CODE
