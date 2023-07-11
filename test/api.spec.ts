import { expect, request, use } from 'chai';
import { sequelize } from '../src/db';
import Contact from '../src/model';
import { addContact } from '../src/utils';
import chaiHttp from 'chai-http';
import server from '../index';

use(chaiHttp);

before(async () => {
  await sequelize.authenticate();
  await Contact.sync();
  await Contact.destroy({
    truncate: true,
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
  it('Corrent response in case of new email phone', async (done) => {
    const email = 'hello@g.com';
    const phoneNumber = '1234567890';

    request(server)
      .post('/identify')
      .send({
        email,
        phoneNumber,
      })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body)
          .to.have.property('contact')
          .to.have.property('primaryContactId');
        expect(res.body.contact)
          .to.have.property('emails')
          .to.have.lengthOf(1)
          .to.have.members([email]);
        expect(res.body.contact)
          .to.have.property('phoneNumbers')
          .to.have.lengthOf(1)
          .to.have.members([phoneNumber]);
        expect(res.body.contact)
          .to.to.have.property('secondaryContactIds')
          .to.have.lengthOf(0);
        done();
      });
  });
});
