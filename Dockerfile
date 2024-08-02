#FROM node:16
FROM node:21

WORKDIR /usr/src/app

RUN apt-get update

COPY package*.json ./

RUN npm install
RUN npm install cors

EXPOSE 3001

CMD ["node", "--env-file=.env",  "app.js"]

