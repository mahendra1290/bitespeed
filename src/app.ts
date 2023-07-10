import express, { Express, Request, Response } from 'express';
import client from './db';
import morgan from 'morgan';
import { log } from 'console';

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

const addContact = async (
  email: string,
  phoneNumber: string,
  linkedId: number | null = null,
  linkPrecendence: 'primary' | 'secondary' = 'primary'
) => {
  try {
    const res = await client.query(
      'INSERT INTO contacts (email, phone_number, linked_id, link_precedence, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [email, phoneNumber, linkedId, linkPrecendence, new Date(), new Date()]
    );
    log(res);
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};

const unique = (arr: any[]) => {
  return arr.filter((v, i, a) => a.indexOf(v) === i);
};

const generateRespone = async (contactId: number) => {
  const { rows } = await client.query(
    'SELECT * from contacts where id = $1 OR linked_id = $1 ORDER BY updated_at',
    [contactId]
  );

  const primaryContact = rows.find(
    (contact) => contact.link_precedence === 'primary'
  );
  const secondaryContacts = rows.filter(
    (contact) => contact.link_precedence === 'secondary'
  );

  const emails = [primaryContact.email]
    .concat(secondaryContacts.map((contact) => contact.email))
    .filter((v, i, a) => v && a.indexOf(v) === i);

  const phoneNumbers = [primaryContact.phone_number]
    .concat(secondaryContacts.map((contact) => contact.phone_number))
    .filter((v, i, a) => v && a.indexOf(v) === i);

  const secondaryContactIds = secondaryContacts
    .map((contact) => contact.id)
    .filter((v, i, a) => v && a.indexOf(v) === i);

  const response = {
    contact: {
      primaryContatctId: primaryContact.id,
      emails, // first element being email of primary contact
      phoneNumbers,
      secondaryContactIds, // Array of all Contact IDs that are "secondary" to the primary contact
    },
  };

  return response;
};

app.get('/', (_: Request, res: Response) => {
  res.json({
    message: 'Hello World!',
  });
});

app.post('/identify', async (req: Request, res: Response) => {
  const { email, phoneNumber } = req.body;
  try {
    if (email || phoneNumber) {
      const { rows: withSameEmail } = await client.query(
        'SELECT * from contacts where email = $1 AND email IS NOT NULL ORDER BY updated_at',
        [email]
      );

      const { rows: withSamePhoneNumber } = await client.query(
        'SELECT * from contacts where phone_number = $1 AND phone_number IS NOT NULL ORDER BY updated_at',
        [phoneNumber]
      );

      console.log(withSameEmail, withSamePhoneNumber);

      if (withSameEmail.length == 0 && withSamePhoneNumber.length == 0) {
        await addContact(email, phoneNumber);
        const { rows } = await client.query(
          'SELECT * from contacts where email = $1 AND phone_number = $2',
          [email, phoneNumber]
        );
        const contact = rows[0];

        const response = {
          contact: {
            primaryContatctId: contact.id,
            emails: [contact.email],
            phoneNumbers: [contact.phone_number],
            secondaryContactIds: [], // Array of all Contact IDs that are "secondary" to the primary contact
          },
        };
        res.status(200).json(response);
        return;
      } else {
        if (withSameEmail.length > 0 && withSamePhoneNumber.length > 0) {
          const alreadyPresent = withSameEmail.find(
            (contact) =>
              withSamePhoneNumber.find((c) => c.id === contact.id) !== undefined
          );
          const email = withSameEmail[0];
          const phoneNumber = withSamePhoneNumber[0];
          if (alreadyPresent) {
            const response = await generateRespone(
              email.link_precedence === 'secondary' ? email.linked_id : email.id
            );
            res.status(200).json(response);
            return;
          } else {
            if (email.updated_at < phoneNumber.updated_at) {
              await client.query(
                'UPDATE contacts SET linked_id = $1, link_precedence = $2, updated_at = $3 WHERE id = $4',
                [email.id, 'secondary', new Date(), phoneNumber.id]
              );
              const response = await generateRespone(email.id);
              res.status(200).json(response);
              return;
            } else {
              await client.query(
                'UPDATE contacts SET linked_id = $1, link_precedence = $2, updated_at = $3 WHERE id = $4 OR linked_id = $5',
                [
                  phoneNumber.id,
                  'secondary',
                  new Date(),
                  email.id,
                  email.linked_id,
                ]
              );
              // await client.query(
              //   'UPDATE contacts SET linked_id = $1, link_precedence = $2, updated_at = $3 WHERE linked_id = $4',
              //   [phoneNumber.id, 'secondary', new Date(), email.id]
              // )
              const response = await generateRespone(phoneNumber.id);
              res.status(200).json(response);
              return;
            }
          }
        } else {
          let linkedId = null;
          if (withSameEmail.length > 0) {
            const oldestContact = withSameEmail[0];
            linkedId =
              oldestContact.link_precedence === 'primary'
                ? oldestContact.id
                : oldestContact.linked_id;
          }
          if (withSamePhoneNumber.length > 0) {
            const oldestContact = withSamePhoneNumber[0];
            linkedId =
              oldestContact.link_precedence === 'primary'
                ? oldestContact.id
                : oldestContact.linked_id;
          }
          if (email && phoneNumber) {
            await addContact(email, phoneNumber, linkedId, 'secondary');
          }
          const response = await generateRespone(linkedId);
          res.status(200).json(response);
          return;
        }
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
