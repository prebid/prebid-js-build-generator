#!/bin/bash

shopt -s nullglob

if [[ "$1" -gt 0 ]]; then
  CLEANUP_BUNDLES_OLDER_THAN_SECONDS="$1"
elif [[ ! "CLEANUP_BUNDLES_OLDER_THAN_SECONDS" -gt 0 ]]; then
  CLEANUP_BUNDLES_OLDER_THAN_SECONDS=2
fi

echo "=====> Deleting bundles older than $CLEANUP_BUNDLES_OLDER_THAN_SECONDS seconds"

CURRENT_TIME=$(date +%s)

for DIR in prebid.js/prebid_*; do
  BUNDLE_DIR="$DIR/build/dist"

  echo "Checking $BUNDLE_DIR"

  if [[ ! -d "$BUNDLE_DIR" ]]; then
    echo "$BUNDLE_DIR does not exist, skipping"
    continue
  fi

  for FILE in "$BUNDLE_DIR"/prebid.*.js; do
    FILE_LAST_MODIFIED=$(stat -c%Y "$FILE")
    FILE_AGE=$((CURRENT_TIME - FILE_LAST_MODIFIED))

    if [[ "$FILE_AGE" -gt $CLEANUP_BUNDLES_OLDER_THAN_SECONDS ]]; then
      echo "Deleting file $FILE"
      rm -f "$FILE"
    fi
  done
done

echo "=====> Bundles clean up complete"
