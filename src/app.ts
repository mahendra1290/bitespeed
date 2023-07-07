import express, { Express, Request, Response } from 'express';

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Hello World!',
  });
});

export default app;
