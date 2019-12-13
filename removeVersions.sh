#!/bin/bash

if [ "$#" == 0 ];
  then
    echo "No arguments provided. Please specify folders for deletion."
    exit 1
  else
    echo "Deleting folders $@"
fi

cd prebid.js

for DIR in "$@";
  do
    if [ ! -d "$DIR" ]; then
      echo "Provided param $DIR is not a directory"
    else
      echo "Removing directory $DIR"
      rm -rf "$DIR"
    fi
  done

echo "Deletion complete"