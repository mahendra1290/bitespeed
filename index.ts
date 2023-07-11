import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import app from './src/app';
import { sequelize } from './src/db';

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

sequelize
  .authenticate()
  .then(() => {
    console.log('Connected to database');
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log('ENV', process.env, process.env.DB_HOST);

    console.log('EVNV Error connecting to database', err);
  });

export default server;
