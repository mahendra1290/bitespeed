import { Op } from 'sequelize';
import Contact from './model';
import { filter, map, uniq } from 'lodash';

/**
 * Add a new contact to the database
 * @param email
 * @param phoneNumber
 * @param linkedId
 * @param linkPrecedence
 * @returns Promise<Contact>
 */
const addContact = async (
  email: string | null,
  phoneNumber: string | null,
  linkedId: number | null = null,
  linkPrecedence: 'primary' | 'secondary' = 'primary'
): Promise<Contact> => {
  return Contact.create({
    email,
    phoneNumber,
    linkedId,
    linkPrecedence,
  });
};

/**
 * Get all contacts with the same email or phone number
 * @param email
 * @param phoneNumber
 * @returns Promise<Contact[]>
 */
const getContactsWithEmailOrPhoneNumber = async (
  email: string,
  phoneNumber: string
) => {
  return Contact.findAll({
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
};

const findAllPrimaryContactIds = (contacts: Contact[]) => {
  const ids = contacts.map(findPrimaryContactId);
  return uniq(ids);
};

const findPrimaryContactId = (contact: Contact) => {
  return contact.linkedId ? contact.linkedId : contact.id;
};

const findContactByEmailAndPhoneNumber = async (
  email: string | null,
  phoneNumber: string | null
) => {
  return Contact.findOne({
    where: {
      email,
      phoneNumber,
    },
  });
};

/**
 * Update the primary contact id of the contact with id or linkedId = id
 * @param primaryContactId new primary contact id
 * @param id old id which is either primary or secondary
 * @returns Promise<[number]>
 */
const updatePrimaryContact = async (primaryContactId: number, id: number) => {
  return Contact.update(
    { linkedId: primaryContactId, linkPrecedence: 'secondary' },
    { where: { [Op.or]: [{ id }, { linkedId: id }] } }
  );
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
  getContactsWithEmailOrPhoneNumber,
  findAllPrimaryContactIds,
  findPrimaryContactId,
  findContactByEmailAndPhoneNumber,
  generateRespone,
  updatePrimaryContact,
};
