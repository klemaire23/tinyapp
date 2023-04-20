const { assert } = require('chai');
const { getUserByEmail } = require('../helpers.js');

const testUsers = {
  'userRandomID': {
    id: 'userRandomID',
    email: 'a@a.com',
    password: 'purple-monkey-dinosaur'
  },
  'user2RandomID': {
    id: 'user2RandomID',
    email: 'b@b.com',
    password: 'dishwasher-funk'
  }
};

describe('getUserByEmail', function() {
  it('should return a user with a valid email', function() {
    const user = getUserByEmail('a@a.com', testUsers);
    const expectedUserID = 'userRandomID';
    assert.equal(user.id, expectedUserID);
  });

  it('should return undefined when passed an email that is not in the database', function() {
    const user = getUserByEmail('hello@sunshine.ca', testUsers);
    assert.isUndefined(user);
  });


});