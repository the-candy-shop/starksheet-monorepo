FROM node:18

WORKDIR /app/starksheet/packages/starksheet-webapp
RUN npm update -g npm

COPY . .
RUN npm install

CMD ["npm", "start", "--omit=dev"]
