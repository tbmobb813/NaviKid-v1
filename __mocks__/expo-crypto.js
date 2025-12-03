// Mock for expo-crypto
export const digestStringAsync = jest.fn(async (algo, input) => {
  const crypto = require('crypto');
  const hash = crypto.createHash(algo.replace('SHA', 'sha'));
  return hash.update(input).digest('hex');
});

export const getRandomBytesAsync = jest.fn(async (length) => {
  const crypto = require('crypto');
  return crypto.randomBytes(length);
});
