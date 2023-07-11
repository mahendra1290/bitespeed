import { expect, request, use } from 'chai';
import { sequelize } from '../src/db';
import Contact from '../src/model';
import { addContact } from '../src/utils';
import chaiHttp from 'chai-http';
import server from '../index';
import { validateIdentityResponse } from './test-utils';

use(chaiHttp);

before(async () => {
  await sequelize.authenticate();
  await Contact.sync();
});

beforeEach(async () => {
  await Contact.truncate({
    restartIdentity: true,
  });
});

after(async () => {
  await sequelize.close();
});

describe('Contact utils', () => {
  it('should be able to add a contact', async () => {
    const email = 'hello@g.com';
    const phoneNumber = '1234567890';
    const linkedId = null;
    const linkPrecedence = 'primary';
    await addContact(email, phoneNumber, linkedId, linkPrecedence);
    const contact = await Contact.findOne({
      where: {
        email,
      },
    });
    expect(contact).to.not.be.null;
    expect(contact).to.have.property('email', email);
  });
});

describe('POST/identify', () => {
  it('Return 400 in case of no email or phone', (done) => {
    request(server)
      .post('/identify')
      .send({})
      .end((err, res) => {
        expect(res).to.have.status(400);
        done();
      });
  });

  it('Correct response in case of new email phone', (done) => {
    const email = 'hello@g.com';
    const phoneNumber = '1234567890';

    const expectedResponse = {
      primaryContactId: 1,
      emails: [email],
      phoneNumbers: [phoneNumber],
      secondaryContactIds: [],
    };

    request(server)
      .post('/identify')
      .send({
        email,
        phoneNumber,
      })
      .end((err, res) => {
        validateIdentityResponse(res, expectedResponse);
        done();
      });
  });

  it('Correct response in case of existing email phone', async () => {
    const email = 'hello@g.com';
    const phoneNumber = '1234567890';

    const expectedResponse = {
      primaryContactId: 1,
      emails: [email],
      phoneNumbers: [phoneNumber],
      secondaryContactIds: [],
    };

    await request(server).post('/identify').send({
      email,
      phoneNumber,
    });
    const res = await request(server).post('/identify').send({
      email,
      phoneNumber,
    });
    validateIdentityResponse(res, expectedResponse);
  });

  it('Correct response in case of existing email', async () => {
    const data = [
      {
        email: 'b@test.com',
        phoneNumber: '456',
      },
      {
        email: 'b@test.com',
        phoneNumber: '789',
      },
    ];

    const expectedResponse = {
      primaryContactId: 1,
      emails: ['b@test.com'],
      phoneNumbers: ['456', '789'],
      secondaryContactIds: [2],
    };

    await request(server).post('/identify').send(data[0]);
    const res = await request(server).post('/identify').send(data[1]);
    validateIdentityResponse(res, expectedResponse);
  });

  it('Correct response in case of existing phone', async () => {
    const data = [
      {
        email: 'b@test.com',
        phoneNumber: '456',
      },
      {
        email: 'c@test.com',
        phoneNumber: '456',
      },
    ];

    const expectedResponse = {
      primaryContactId: 1,
      emails: ['b@test.com', 'c@test.com'],
      phoneNumbers: ['456'],
      secondaryContactIds: [2],
    };

    await request(server).post('/identify').send(data[0]);
    const res = await request(server).post('/identify').send(data[1]);
    validateIdentityResponse(res, expectedResponse);
  });

  it('Correct response in case of existing email and phone', async () => {
    const data = [
      {
        email: 'b@test.com',
        phoneNumber: '456',
      },
      {
        email: 'c@test.com',
        phoneNumber: '567',
      },
      {
        email: 'b@test.com',
        phoneNumber: '567',
      },
    ];

    const expectedResponse = {
      primaryContactId: 1,
      emails: ['b@test.com', 'c@test.com'],
      phoneNumbers: ['456', '567'],
      secondaryContactIds: [2],
    };

    await request(server).post('/identify').send(data[0]);
    await request(server).post('/identify').send(data[1]);
    const res = await request(server).post('/identify').send(data[2]);

    validateIdentityResponse(res, expectedResponse);
  });

  it('Correct response in case of existing email and null phone and null email and existing phone', async () => {
    const data = [
      {
        email: 'a@t.com',
        phoneNumber: null,
      },
      {
        email: null,
        phoneNumber: '456',
      },
      {
        email: 'a@t.com',
        phoneNumber: '456',
      },
    ];

    const expectedResponse = {
      primaryContactId: 1,
      emails: ['a@t.com'],
      phoneNumbers: ['456'],
      secondaryContactIds: [2],
    };

    await request(server).post('/identify').send(data[0]);
    await request(server).post('/identify').send(data[1]);
    const res = await request(server).post('/identify').send(data[2]);

    validateIdentityResponse(res, expectedResponse);
  });
});
