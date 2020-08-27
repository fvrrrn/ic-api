FROM node:12

WORKDIR /usr/src/ic-api

COPY package*.json ./

RUN npm ci --only=production

COPY . .

EXPOSE 8450
CMD [ "node", "index.js" ]