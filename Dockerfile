FROM node:10-alpine

ENV NPM_CONFIG_PREFIX=/home/node/.npm-global
ENV PATH=$PATH:/home/node/.npm-global/bin

# RUN mkdir -p /home/node/schedule_service && chown -R node:node /home/node/schedule_service

WORKDIR /home/node/1capi

# USER node

ADD . /home/node/1capi

RUN mkdir /home/node/1capi/logs
RUN chmod 755 /home/node/1capi/logs
RUN npm install pm2 -g

EXPOSE 3000

CMD [ "pm2-runtime", "index.js" ]