import { expect } from 'chai';

const validateIdentityResponse = (res: any, expected: any) => {
  expect(res).to.have.status(200);
  expect(res.body)
    .to.have.property('contact')
    .to.have.property('primaryContactId', expected.primaryContactId);
  expect(res.body.contact)
    .to.have.property('emails')
    .to.have.members(expected.emails);
  expect(res.body.contact)
    .to.have.property('phoneNumbers')
    .to.have.members(expected.phoneNumbers);
  expect(res.body.contact)
    .to.to.have.property('secondaryContactIds')
    .to.have.members(expected.secondaryContactIds);
};

export { validateIdentityResponse };
