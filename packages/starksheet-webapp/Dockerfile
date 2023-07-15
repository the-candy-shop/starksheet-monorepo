FROM node:16

WORKDIR /app/starksheet/packages/starksheet-webapp

COPY package*.json ./
RUN npm install

COPY . .

CMD ["npm", "start", "--omit=dev"]
