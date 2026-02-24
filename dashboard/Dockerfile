FROM node:20-alpine
WORKDIR /app
RUN npm init -y && npm install express ioredis
COPY server.js .
EXPOSE 4000
CMD ["node", "server.js"]
