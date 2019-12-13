FROM node:10-alpine

RUN npm install -g gulp gulp-cli

RUN apk add --no-cache bash git

ENV PERIODIC_BUILD_VERSIONS_NUM=5 \
    INITIAL_BUILD_VERSIONS_NUM=20 \
    KEEP_LATEST_VERSIONS_NUM=20 \
    CLEANUP_BUNDLES_OLDER_THAN_SECONDS=300

WORKDIR /app

VOLUME /app/prebid.js

RUN echo "0 0 * * * cd /app && /app/checkout.sh $PERIODIC_BUILD_VERSIONS_NUM > /proc/1/fd/1 2>/proc/1/fd/2" \
        > /etc/crontabs/root && \
    echo "0 1 * * * cd /app && /app/buildCleanup.sh $KEEP_LATEST_VERSIONS_NUM > /proc/1/fd/1 2>/proc/1/fd/2" \
        >> /etc/crontabs/root && \
    echo "0 2 * * * cd /app && /app/bundleCleanup.sh $CLEANUP_BUNDLES_OLDER_THAN_SECONDS > /proc/1/fd/1 2>/proc/1/fd/2" \
        >> /etc/crontabs/root

COPY checkout.sh buildCleanup.sh bundleCleanup.sh removeVersions.sh ./

CMD [ "sh", "-c", "/app/checkout.sh $INITIAL_BUILD_VERSIONS_NUM && crond -f -l 8" ]
