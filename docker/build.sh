#!/bin/bash
set -x

docker build -t prebid/pbjs-bundle-service-api:latest -f docker/Dockerfile.api .
docker build -t prebid/pbjs-bundle-service-builder:latest -f docker/Dockerfile.builder .
