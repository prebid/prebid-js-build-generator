#!/bin/bash
TAG="$1"

if [ -z "$TAG" ]; then
  TAG="latest"
fi

set -x
docker build -t prebid/pbjs-bundle-service-api:"$TAG" -f docker/Dockerfile.api .
docker build -t prebid/pbjs-bundle-service-builder:"$TAG" -f docker/Dockerfile.builder .
