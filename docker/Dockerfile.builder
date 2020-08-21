FROM node:10-alpine

RUN npm install -g gulp gulp-cli

RUN apk add --no-cache bash git

ENV NUMBER_OF_PREVIOUS_VERSIONS=20 \
    CLEANUP_BUNDLES_OLDER_THAN_SECONDS=300

WORKDIR /app

VOLUME /app/prebid.js

RUN echo "0 */3 * * * . /app/cron.env; cd /app; /app/checkout.sh > /proc/1/fd/1 2>/proc/1/fd/2" \
        > /etc/crontabs/root && \
    echo "0 1 * * * . /app/cron.env; cd /app; /app/buildCleanup.sh > /proc/1/fd/1 2>/proc/1/fd/2" \
        >> /etc/crontabs/root && \
    echo "0 2 * * * . /app/cron.env; cd /app; /app/bundleCleanup.sh > /proc/1/fd/1 2>/proc/1/fd/2" \
        >> /etc/crontabs/root

COPY checkout.sh buildCleanup.sh bundleCleanup.sh removeVersions.sh ./

CMD [ "sh", "-c", "printenv > /app/cron.env && /app/checkout.sh && crond -f -l 8" ]
