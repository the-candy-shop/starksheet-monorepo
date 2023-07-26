FROM node:16

WORKDIR /app/starksheet/packages/starksheet-webapp

COPY . .
RUN npm install

CMD ["npm", "start", "--omit=dev"]
