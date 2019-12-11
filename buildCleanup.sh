#!/bin/bash

NUMBER_OF_LATEST_VERSIONS="$1"

if [ $NUMBER_OF_LATEST_VERSIONS -gt 0 ]; then
  echo "deleting prebid files older than last $NUMBER_OF_LATEST_VERSIONS versions"
else
  NUMBER_OF_LATEST_VERSIONS=20
  echo "deleting prebid files older than last $NUMBER_OF_LATEST_VERSIONS versions"
fi

cd prebid.js

VERSION_DIRECTORIES="$(ls -d prebid_* | sort -r)"

ITERATION=0
for DIR in $VERSION_DIRECTORIES;
  do
    if [ $ITERATION -lt $NUMBER_OF_LATEST_VERSIONS ]; then
      ITERATION=$[ITERATION+1]
      continue
    fi
  echo "deleting directory $DIR"
  rm -rf $DIR
  done

echo "Versions clean up complete"