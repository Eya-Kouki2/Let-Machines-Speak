const crypto = require('crypto');

const PASSWORD_MIN_LENGTH = 8;

function validatePassword(password) {
  if (typeof password !== 'string') {
    return { valid: false, message: 'Password is required.' };
  }

  const value = password.trim();

  if (!value) {
    return { valid: false, message: 'Password is required.' };
  }

  if (value.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, message: 'Password must be at least 8 characters long.' };
  }

  if (!/[A-Z]/.test(value)) {
    return { valid: false, message: 'Password must include at least one uppercase letter.' };
  }

  if (!/[a-z]/.test(value)) {
    return { valid: false, message: 'Password must include at least one lowercase letter.' };
  }

  if (!/\d/.test(value)) {
    return { valid: false, message: 'Password must include at least one number.' };
  }

  if (!/[^A-Za-z0-9]/.test(value)) {
    return { valid: false, message: 'Password must include at least one special character.' };
  }

  return { valid: true, message: 'Password meets requirements.' };
}

function generateTemporaryPassword() {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()-_=+[]{};:,.<>?';
  const required = [
    uppercase[crypto.randomInt(uppercase.length)],
    lowercase[crypto.randomInt(lowercase.length)],
    numbers[crypto.randomInt(numbers.length)],
    symbols[crypto.randomInt(symbols.length)],
  ];

  const all = uppercase + lowercase + numbers + symbols;
  const passwordChars = [...required];

  while (passwordChars.length < 16) {
    passwordChars.push(all[crypto.randomInt(all.length)]);
  }

  for (let index = passwordChars.length - 1; index > 0; index -= 1) {
    const swapIndex = crypto.randomInt(index + 1);
    [passwordChars[index], passwordChars[swapIndex]] = [passwordChars[swapIndex], passwordChars[index]];
  }

  return passwordChars.join('');
}

module.exports = {
  PASSWORD_MIN_LENGTH,
  validatePassword,
  generateTemporaryPassword,
};
