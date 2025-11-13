const { hello } = require('../utils/smoke');

describe('smoke', () => {
  test('hello returns ok', () => {
    expect(hello()).toBe('ok');
  });
});
