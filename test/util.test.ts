globalThis.isDevelopment = true;
import { global, logger } from '../src/util';

test('import modules', () => {
  expect(global).toBe(globalThis);
  expect(logger.log).toBe(console.log);
});

