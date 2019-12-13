FROM node:10-alpine

RUN npm install -g gulp gulp-cli

RUN apk add --no-cache bash git

WORKDIR /app

VOLUME /app/prebid.js

COPY checkout.sh buildCleanup.sh bundleCleanup.sh removeVersions.sh ./

RUN echo "0 0 * * * cd /app && /app/checkout.sh 2 > /proc/1/fd/1 2>/proc/1/fd/2" > /etc/crontabs/root && \
    echo "0 1 * * * cd /app && /app/buildCleanup.sh 20 > /proc/1/fd/1 2>/proc/1/fd/2" >> /etc/crontabs/root && \
    echo "0 2 * * * cd /app && /app/bundleCleanup.sh 300 > /proc/1/fd/1 2>/proc/1/fd/2" >> /etc/crontabs/root

CMD [ "sh", "-c", "/app/checkout.sh 20 && crond -f -l 8" ]
