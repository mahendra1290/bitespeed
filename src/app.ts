import express, { Express, Request, Response } from 'express';
import morgan from 'morgan';
import Contact from './model';
import {
  addContact,
  findPrimaryContact,
  findPrimaryContacts,
  generateRespone,
  getContactsWithEmailOrPhoneNumber,
} from './utils';
import { Op } from 'sequelize';
import './middlewares/validations';
import validateRequestBody from './middlewares/validations';

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

Contact.sync();

app.post(
  '/identify',
  validateRequestBody,
  async (req: Request, res: Response) => {
    const { email, phoneNumber } = req.body;
    let primaryContactId: number | null = null;
    try {
      const matches = await getContactsWithEmailOrPhoneNumber(
        email,
        phoneNumber
      );

      const existingContact = matches.find(
        (item) => item.email === email && item.phoneNumber === phoneNumber
      );

      if (existingContact) {
        primaryContactId = findPrimaryContact(existingContact);
      }

      const withSameEmail = matches.filter(
        (contact) => contact.email === email
      );
      const withSamePhoneNumber = matches.filter(
        (contact) => contact.phoneNumber === phoneNumber
      );

      if (existingContact) {
        primaryContactId = findPrimaryContact(existingContact);
      } else if (matches.length === 0) {
        primaryContactId = (await addContact(email, phoneNumber)).id;
      } else if (email === null || phoneNumber === null) {
        primaryContactId = findPrimaryContacts(matches)[0];
      } else if (
        withSamePhoneNumber.length === 0 ||
        withSameEmail.length === 0
      ) {
        const oldestContact = matches[0];
        primaryContactId = findPrimaryContact(oldestContact);
        await addContact(email, phoneNumber, primaryContactId, 'secondary');
      } else {
        const parents = findPrimaryContacts(matches);
        if (parents.length === 1) {
          primaryContactId = parents[0];
        } else {
          const p1 = await Contact.findByPk(parents[0]);
          const p2 = await Contact.findByPk(parents[1]);

          if (!p1 || !p2) {
            throw new Error('Internal server error');
          }

          if (p1.createdAt < p2.createdAt) {
            await Contact.update(
              { linkedId: p1.id, linkPrecedence: 'secondary' },
              { where: { [Op.or]: [{ id: p2.id }, { linkedId: p2.id }] } }
            );
            primaryContactId = p1.id;
          } else {
            await Contact.update(
              { linkedId: p2.id, linkPrecedence: 'secondary' },
              { where: { [Op.or]: [{ id: p1.id }, { linkedId: p1.id }] } }
            );
            primaryContactId;
          }
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
