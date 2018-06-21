#!/bin/bash

NUMBER_OF_PREVIOUS_VERSIONS="$1"

if [ $NUMBER_OF_PREVIOUS_VERSIONS -gt 0 ]; then
  echo "checking out $NUMBER_OF_PREVIOUS_VERSIONS previous versions of prebid.js"
else
  NUMBER_OF_PREVIOUS_VERSIONS=2
  echo "checking out $NUMBER_OF_PREVIOUS_VERSIONS previous versions of prebid.js"
fi

mkdir prebid.js
cd prebid.js
git clone https://github.com/prebid/Prebid.js.git working_master
cd working_master
git pull

for TAG in `git tag --sort=-version:refname | head -n $NUMBER_OF_PREVIOUS_VERSIONS`;
  do 
    git clone https://github.com/prebid/Prebid.js.git ../prebid_${TAG}
    cd ../prebid_${TAG}
    git checkout ${TAG}
    npm install
    gulp build
  done
