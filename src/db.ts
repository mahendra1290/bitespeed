import { Client } from 'pg';
import { Sequelize } from 'sequelize';

const DB_HOST = process.env.DB_HOST || '';
const DB_PORT = process.env.DB_PORT as unknown as number;
const DB_NAME = process.env.DB_NAME || '';
const DB_USER = process.env.DB_USER || '';
const DB_PASSWORD = process.env.DB_PASSWORD || '';

const client = new Client({
  host: DB_HOST,
  port: DB_PORT,
  database: DB_NAME,
  user: DB_USER,
  password: DB_PASSWORD,
});

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  dialect: 'postgres',
  port: DB_PORT,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
});

export { client, sequelize };
