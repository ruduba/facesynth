import { hashPassword, verifyPassword, generateToken, verifyToken } from '../lib/auth';

describe('Auth utilities', () => {
  describe('Password hashing', () => {
    it('should hash password', async () => {
      const password = 'testpassword123';
      const hash = await hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should verify correct password', async () => {
      const password = 'testpassword123';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);
      
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'testpassword123';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword('wrongpassword', hash);
      
      expect(isValid).toBe(false);
    });
  });

  describe('JWT tokens', () => {
    it('should generate valid token', () => {
      const token = generateToken('user123', 'test@example.com');
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should verify valid token', () => {
      const userId = 'user123';
      const email = 'test@example.com';
      const token = generateToken(userId, email);
      const decoded = verifyToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(userId);
      expect(decoded.email).toBe(email);
    });

    it('should reject invalid token', () => {
      const decoded = verifyToken('invalid-token');
      expect(decoded).toBeNull();
    });
  });
});