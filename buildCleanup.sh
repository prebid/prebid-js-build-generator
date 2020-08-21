#!/bin/bash

if [[ "$1" -gt 0 ]]; then
  NUMBER_OF_PREVIOUS_VERSIONS="$1"
elif [[ ! "$NUMBER_OF_PREVIOUS_VERSIONS" -gt 0 ]]; then
  NUMBER_OF_PREVIOUS_VERSIONS=2
fi

echo "=====> Deleting old versions, number of versions to keep is $NUMBER_OF_PREVIOUS_VERSIONS"

VERSION_DIRECTORIES="$(ls -d prebid.js/prebid_* | sort -rV)"

ITERATION=0
for DIR in $VERSION_DIRECTORIES; do
  if [[ "$ITERATION" -lt "$NUMBER_OF_PREVIOUS_VERSIONS" ]]; then
    ITERATION=$((ITERATION + 1))
    continue
  fi
  echo "Deleting directory $DIR"
  rm -rf "$DIR"
done

echo "=====> Old versions clean up complete"
