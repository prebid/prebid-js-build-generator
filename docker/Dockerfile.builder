FROM node:11-alpine

RUN npm install -g gulp gulp-cli

RUN apk add --no-cache bash git

WORKDIR /app

VOLUME /app/prebid.js

COPY checkout.sh ./

CMD [ "./checkout.sh", "2" ]
