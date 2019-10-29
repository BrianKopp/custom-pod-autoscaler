FROM node:10.16-alpine

RUN mkdir -p /usr/src/app/node_modules && \
    chmod -R 755 /usr/src/app

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --production

COPY . .

EXPOSE 3000

USER node

CMD ["node", "index.js"]
