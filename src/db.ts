import { Client } from 'pg';

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'contacts',
  user: 'postgres',
  password: 'helloworld',
});

// const client = new Pool({
//   host: 'localhost',
//   port: 5432,
//   database: 'contacts',
//   user: 'postgres',
//   password: 'helloworld',
//   max: 5,
//   idleTimeoutMillis: 30000,
//   connectionTimeoutMillis: 2000,
// });

export default client;
