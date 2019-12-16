#!/bin/bash

BUNDLE_LIFE_PERIOD="$1"

if [ $BUNDLE_LIFE_PERIOD -gt 0 ]; then
  echo "deleting bundles older than $BUNDLE_LIFE_PERIOD seconds"
else
  BUNDLE_LIFE_PERIOD=300
  echo "deleting bundles older than $BUNDLE_LIFE_PERIOD seconds"
fi

CURRENT_TIME=$(date +%s)

for DIR in prebid.js/prebid_*;
  do
    echo "checking $DIR"
    BUNDLE_DIR="${DIR}/build/dist/prebid.*.js"
    for FILE in $BUNDLE_DIR;
      do
      FILE_LAST_MODIFIED=$(stat -c%Y $FILE)
        if [ "$(($CURRENT_TIME-$FILE_LAST_MODIFIED))" -gt $BUNDLE_LIFE_PERIOD ]; then
        echo "deleting file $FILE"
        rm -f $FILE
        fi
      done
    done

echo "Bundles clean up complete"