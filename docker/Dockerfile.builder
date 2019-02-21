FROM node:11

RUN npm install -g gulp gulp-cli

RUN apt-get update \
 && apt-get install -y git \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

VOLUME /app/prebid.js

COPY checkout.sh ./

CMD [ "./checkout.sh", "2" ]
