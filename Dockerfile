FROM node:latest

WORKDIR /app 

COPY package.json .

COPY package-lock.json .

RUN npm install --omit=dev

COPY . .

CMD ["node", "index.js"] 

