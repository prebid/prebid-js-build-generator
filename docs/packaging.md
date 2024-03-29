# Packaging instructions
This project allows to package the application in the Docker images out-of-the-box. Run the 
following commands to build the images (you will need [Docker](https://www.docker.com/) installed of course):
```shell script
docker build -t prebid/pbjs-bundle-service-api:latest -f docker/Dockerfile.api .
docker build -t prebid/pbjs-bundle-service-builder:latest -f docker/Dockerfile.builder .
```

Alternatively you can use a helper script for this purpose (should be run from the project directory):
```shell script
docker/build.sh
```

This will build the images locally and tag them as `latest`. To use a different tag, run:
```shell script
docker/build.sh <TAG>
```

Note that:

- The "dev" stack (ECS cluster "prebid-network-dev-ecs-cluster") is configured to use the "dev" tag;
- The "prod" stack (ECS cluster "prebid-network-prod-ecs-cluster") is configured to use the "latest" tag.

## Docker images description
[Builder](../docker/Dockerfile.builder) image has cron installed and crontab configured to run: 
1. "Pre-build" process that pulls latest GIT tags from https://github.com/prebid/Prebid.js, pre-builds core and modules 
and stores them in a cache on a filesystem, every three hours
2. Cleanup of old versions built except latest 20 versions, every day at 1 AM
3. Cleanup of bundles generated by the API and not needed anymore (i.e. files 
`prebid_<version>/build/dist/prebid.<uuid>.js` created more than 5 minutes ago), every day at 2 AM

[Api](../docker/Dockerfile.api) image has an application providing REST API that relies on the versions pre-built by 
Builder container. 

Builder and Api images are expected to share the volume so that directories and files created by Builder were 
accessible to Api.
