import { hashPassword, verifyPassword } from '../password.util';

describe('password.util', () => {
  it('hashes plain text password using argon2id and verifies successfully', async () => {
    const plain = 'Password123!';
    const hash = await hashPassword(plain);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(plain);
    expect(hash).toContain('$argon2id$');

    const isValid = await verifyPassword(hash, plain);
    expect(isValid).toBe(true);
  });

  it('fails verification with wrong password', async () => {
    const hash = await hashPassword('Password123!');
    const isValid = await verifyPassword(hash, 'WrongPassword!');
    expect(isValid).toBe(false);
  });
});
