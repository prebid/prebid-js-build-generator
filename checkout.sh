#!/bin/bash

if [[ "$1" -gt 0 ]]; then
  NUMBER_OF_PREVIOUS_VERSIONS="$1"
elif [[ ! "$NUMBER_OF_PREVIOUS_VERSIONS" -gt 0 ]]; then
  NUMBER_OF_PREVIOUS_VERSIONS=2
fi

echo "=====> Checking out $NUMBER_OF_PREVIOUS_VERSIONS previous versions of prebid.js"

PREBID_DIR="prebid.js"
if [[ ! -d "$PREBID_DIR" ]]; then
  mkdir "$PREBID_DIR"
fi

cd "$PREBID_DIR"

if [[ ! -d working_master ]]; then
  git clone https://github.com/prebid/Prebid.js.git working_master
fi

cd working_master

git pull

for TAG in $(git tag --sort=-creatordate | head -n "$NUMBER_OF_PREVIOUS_VERSIONS"); do
  DIR_NAME="../prebid_${TAG}"
  if [[ -d "$DIR_NAME" ]]; then
    echo "$DIR_NAME already installed"
  else
    echo "Copying working_master to $DIR_NAME"
    cp -R ../working_master "$DIR_NAME"
    cd "$DIR_NAME"
    git checkout "${TAG}"
    npm install
    gulp build
    echo "$DIR_NAME installed"
  fi
done

echo "=====> Update complete"
