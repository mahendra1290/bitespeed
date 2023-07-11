import express, { Express, Request, Response } from 'express';
import morgan from 'morgan';
import Contact from './model';
import {
  addContact,
  findPrimaryContactId,
  findAllPrimaryContactIds,
  generateRespone,
  getContactsWithEmailOrPhoneNumber,
  findContactByEmailAndPhoneNumber,
  updatePrimaryContact,
} from './utils';
import './middlewares/validations';
import validateRequestBody from './middlewares/validations';
import { StatusCodes } from 'http-status-codes';

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

Contact.sync();

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});

app.post(
  '/identify',
  validateRequestBody,
  async (req: Request, res: Response) => {
    const { email, phoneNumber } = req.body;
    try {
      const existingContact = await findContactByEmailAndPhoneNumber(
        email,
        phoneNumber
      );

      if (existingContact) {
        const response = await generateRespone(
          findPrimaryContactId(existingContact)
        );
        res.status(StatusCodes.OK).send(response);
        return;
      }

      const matches = await getContactsWithEmailOrPhoneNumber(
        email,
        phoneNumber
      );

      if (matches.length === 0) {
        const id = (await addContact(email, phoneNumber)).id;
        res.status(200).send(await generateRespone(id));
        return;
      }

      const withSameEmail = matches.filter(
        (contact) => contact.email === email
      );
      const withSamePhoneNumber = matches.filter(
        (contact) => contact.phoneNumber === phoneNumber
      );

      if (withSamePhoneNumber.length === 0 || withSameEmail.length === 0) {
        const oldestContact = matches[0];
        const id = findPrimaryContactId(oldestContact);
        await addContact(email, phoneNumber, id, 'secondary');
        res.status(StatusCodes.OK).send(await generateRespone(id));
        return;
      }
      let primaryContactId: number | null = null;
      const primaryContactIds = findAllPrimaryContactIds(matches);
      if (primaryContactIds.length === 1) {
        primaryContactId = primaryContactIds[0];
      } else {
        const [p1, p2] = await Promise.all([
          Contact.findByPk(primaryContactIds[0]),
          Contact.findByPk(primaryContactIds[1]),
        ]);

        if (!p1 || !p2) {
          throw new Error('Internal server error');
        }

        if (p1.createdAt < p2.createdAt) {
          await updatePrimaryContact(p1.id, p2.id);
          primaryContactId = p1.id;
        } else {
          await updatePrimaryContact(p2.id, p1.id);
          primaryContactId = p2.id;
        }
      }

      if (primaryContactId) {
        const response = await generateRespone(primaryContactId);
        res.status(200).json(response);
        return;
      } else {
        res.status(500).json({
          message: 'Internal server error',
        });
      }
    } catch (err) {
      res.status(500).json({
        message: 'Internal server error',
      });
    }
  }
);

export default app;
