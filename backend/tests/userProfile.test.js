const test = require('node:test');
const assert = require('node:assert/strict');
const User = require('../models/user');
const { validatePassword } = require('../utils/passwordValidation');

test('user safe object includes profile and names', () => {
  const user = new User({
    name: 'Labes Admin',
    email: 'admin@labes.local',
    password: 'password123',
    firstName: 'Labes',
    lastName: 'Admin',
    profileImage: '/uploads/profiles/test.png',
    mustChangePassword: true,
  });

  const safeUser = user.toSafeObject();

  assert.equal(safeUser.firstName, 'Labes');
  assert.equal(safeUser.lastName, 'Admin');
  assert.equal(safeUser.profileImage, '/uploads/profiles/test.png');
  assert.equal(safeUser.mustChangePassword, true);
});

test('password validation requires uppercase, lowercase, number and symbol', () => {
  assert.equal(validatePassword('Weak123').valid, false);
  assert.equal(validatePassword('StrongPass!123').valid, true);
});
