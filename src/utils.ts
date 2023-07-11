import { Op } from 'sequelize';
import Contact from './model';
import { filter, map, uniq } from 'lodash';

const addContact = async (
  email: string | null,
  phoneNumber: string | null,
  linkedId: number | null = null,
  linkPrecedence: 'primary' | 'secondary' = 'primary'
) => {
  try {
    const res = await Contact.create({
      email,
      phoneNumber,
      linkedId,
      linkPrecedence,
    });
    return res;
  } catch (err) {
    console.log(err);
    return null;
  }
};

const checkIfContactExists = (
  email: string,
  phoneNumber: string,
  contacts: Contact[]
) => {
  const index = contacts.findIndex(
    (contact) => contact.email === email && contact.phoneNumber === phoneNumber
  );
  return index !== -1;
};

const getContactsWithEmail = async (email: string) => {
  try {
    const contacts = await Contact.findAll({
      where: {
        email,
      },
    });
    return contacts;
  } catch (err) {
    console.log(err);
    return [];
  }
};

const getContactsWithPhoneNumber = async (phoneNumber: string) => {
  try {
    const contacts = await Contact.findAll({
      where: {
        phoneNumber,
      },
    });
    return contacts;
  } catch (err) {
    console.log(err);
    return [];
  }
};

const getContactsWithEmailOrPhoneNumber = async (
  email: string,
  phoneNumber: string
) => {
  try {
    const contacts = await Contact.findAll({
      where: {
        [Op.or]: [
          {
            email: { [Op.ne]: null, [Op.eq]: email },
          },
          { phoneNumber: { [Op.ne]: null, [Op.eq]: phoneNumber } },
        ],
      },
      order: [['createdAt', 'ASC']],
    });
    return contacts;
  } catch (err) {
    console.log(err);
    return [];
  }
};

const findParents = (contacts: Contact[]) => {
  const parentIds = new Set<number>();
  contacts.forEach((contact) => {
    if (contact.linkedId) {
      parentIds.add(contact.linkedId);
    } else {
      parentIds.add(contact.id);
    }
  });

  return Array.from(parentIds);
};

const generateRespone = async (primaryContactId: number) => {
  const rows = await Contact.findAll({
    where: {
      [Op.or]: [{ id: primaryContactId }, { linkedId: primaryContactId }],
    },
  });

  const primaryContact = rows.find((row) => row.linkPrecedence === 'primary');
  const secondaryContacts = rows.filter(
    (row) => row.linkPrecedence === 'secondary'
  );

  if (!primaryContact) {
    return null;
  }

  const emails = uniq(
    filter([primaryContact.email].concat(map(secondaryContacts, 'email')), null)
  );

  const phoneNumbers = uniq(
    filter(
      [primaryContact.phoneNumber].concat(
        map(secondaryContacts, 'phoneNumber')
      ),
      null
    )
  );

  const secondaryContactIds = uniq(map(secondaryContacts, 'id'));

  const response = {
    contact: {
      primaryContactId: primaryContact.id,
      emails,
      phoneNumbers,
      secondaryContactIds,
    },
  };

  return response;
};

export {
  addContact,
  getContactsWithEmail,
  getContactsWithPhoneNumber,
  checkIfContactExists,
  getContactsWithEmailOrPhoneNumber,
  findParents,
  generateRespone,
};
