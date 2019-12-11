#!/bin/bash

NUMBER_OF_LATEST_VERSIONS="&1"

if [ $NUMBER_OF_LATEST_VERSIONS -gt 0 ]; then
  echo "deleting prebid files older than last $NUMBER_OF_LATEST_VERSIONS versions"
else
  NUMBER_OF_LATEST_VERSIONS=1
  echo "deleting prebid files older than last $NUMBER_OF_LATEST_VERSIONS versions"
fi

cd prebid.js

LATEST_VERSION=0
for DIR in prebid_*;
  do
    VERSION_SUBSTRING=$(echo $DIR | cut -c8-11)
    VERSION=$(echo $VERSION_SUBSTRING | tr -d .)
      if [ $VERSION -gt $LATEST_VERSION ]; then
        LATEST_VERSION=$VERSION
      fi
  done

LAST_SUPPORTED_VERSION=$(($LATEST_VERSION-$NUMBER_OF_LATEST_VERSIONS+1))
for DIR in prebid_*;
  do
    VERSION_SUBSTRING=$(echo $DIR | cut -c8-11)
    VERSION=$(echo $VERSION_SUBSTRING | tr -d .)
      if [ $VERSION -lt $LAST_SUPPORTED_VERSION ]; then
        echo "deleting directory $DIR"
        rm -rf $DIR
      fi
  done

echo "Versions clean up complete"