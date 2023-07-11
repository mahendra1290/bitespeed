import express, { Express, Request, Response } from 'express';
import morgan from 'morgan';
import { log } from 'console';
import Contact from './model';
import {
  addContact,
  findParents,
  generateRespone,
  getContactsWithEmailOrPhoneNumber,
} from './utils';
import { Op } from 'sequelize';

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.get('/', (_: Request, res: Response) => {
  res.json({
    message: 'Hello World!',
  });
});

app.post('/identify', async (req: Request, res: Response) => {
  const { email, phoneNumber } = req.body;
  try {
    if (email || phoneNumber) {
      const matches = await getContactsWithEmailOrPhoneNumber(
        email,
        phoneNumber
      );

      const withSameEmail = matches.filter(
        (contact) => contact.email === email
      );
      const withSamePhoneNumber = matches.filter(
        (contact) => contact.phoneNumber === phoneNumber
      );

      const contact = matches.find(
        (item) => item.email === email && item.phoneNumber === phoneNumber
      );

      if (contact) {
        const parent = findParents([contact]);
        const response = await generateRespone(parent[0]);
        res.status(200).json(response);
        return;
      }

      if (matches.length === 0) {
        const contact = await addContact(email, phoneNumber);
        if (contact) {
          const response = await generateRespone(contact.get('id'));
          res.status(200).json(response);
          return;
        }
      } else if (email === null || phoneNumber === null) {
        const parent = findParents(matches);
        const response = await generateRespone(parent[0]);
        res.status(200).json(response);
        return;
      } else if (withSameEmail.length > 0 && withSamePhoneNumber.length === 0) {
        const oldestContact = withSameEmail[0];
        const contact = await addContact(
          email,
          phoneNumber,
          oldestContact.linkPrecedence === 'primary'
            ? (oldestContact.get('id') as unknown as number)
            : oldestContact.linkedId,
          'secondary'
        );
        console.log(contact);

        if (contact && contact.linkedId) {
          const response = await generateRespone(contact.linkedId);
          log(response, 'sent');
          res.status(200).json(response);
          return;
        }
        res.status(500).json({
          message: 'Internal server error',
        });
      } else if (withSameEmail.length === 0 && withSamePhoneNumber.length > 0) {
        const oldestContact = withSamePhoneNumber[0];
        const contact = await addContact(
          email,
          phoneNumber,
          oldestContact.linkPrecedence === 'primary'
            ? (oldestContact.get('id') as unknown as number)
            : oldestContact.linkedId,
          'secondary'
        );
        console.log(contact);

        if (contact && contact.linkedId) {
          const response = await generateRespone(contact.linkedId);
          log(response, 'sent');
          res.status(200).json(response);
          return;
        }
        res.status(500).json({
          message: 'Internal server error',
        });
        return;
      } else {
        const parents = findParents(matches);

        if (parents.length === 1) {
          const response = await generateRespone(parents[0]);
          res.status(200).json(response);
          return;
        } else {
          const p1 = await Contact.findByPk(parents[0]);
          const p2 = await Contact.findByPk(parents[1]);
          console.log(p1, p2);

          if (p1 && p2) {
            if (p1.get('createdAt') < p2.get('createdAt')) {
              await Contact.update(
                { linkedId: p1.id, linkPrecedence: 'secondary' },
                { where: { [Op.or]: [{ id: p2.id }, { linkedId: p2.id }] } }
              );
              const response = await generateRespone(p1.id);
              res.status(200).json(response);
              return;
            } else {
              await Contact.update(
                { linkedId: p2.id, linkPrecedence: 'secondary' },
                { where: { [Op.or]: [{ id: p1.id }, { linkedId: p1.id }] } }
              );
              const response = await generateRespone(p2.id);
              res.status(200).json(response);

              return;
            }
          } else {
            res.json({
              message: 'Multiple contacts found',
            });
          }
        }
        return;
      }

      res.status(201).json({
        message: 'Contact created successfully',
      });
    } else {
      res.status(400).json({
        message: 'Invalid request',
      });
    }
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: 'Internal server error',
    });
  }
});

export default app;
