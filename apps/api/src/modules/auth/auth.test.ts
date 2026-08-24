import request from 'supertest';
import { app } from '../../app.js';
import { describe, it, expect, vi } from 'vitest';

// Mock Redis to avoid connection issues during tests
vi.mock('../../config/redis.js', () => ({
  connectRedis: vi.fn(),
  getRedisClient: vi.fn(() => ({
    isOpen: true,
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    on: vi.fn(),
  })),
}));

// Mock logger to avoid noise
vi.mock('../../services/logger.service.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('Authentication API', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should fail registration with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123',
        displayName: 'Test User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid request data');
    });

    it('should fail registration if email already exists', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'password123',
        displayName: 'Test User',
      };

      // First registration
      await request(app).post('/api/auth/register').send(userData);

      // Second registration with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Cet email est déjà utilisé.');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login an existing user', async () => {
      const userData = {
        email: 'login@example.com',
        password: 'password123',
        displayName: 'Login User',
      };

      // Register first
      await request(app).post('/api/auth/register').send(userData);

      // Try to login
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
    });

    it('should fail login with wrong password', async () => {
      const userData = {
        email: 'wrongpass@example.com',
        password: 'password123',
        displayName: 'Wrong Pass User',
      };

      await request(app).post('/api/auth/register').send(userData);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: 'wrongpassword',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Identifiants incorrects.');
    });
  });

  describe('WhatsApp Server Message Authentication (Zero Regression & Strict Concordance)', () => {
    it('should initialize auth session and authenticate via reverse incoming message', async () => {
      const phoneNumber = "2250708091011";

      // 1. Request WhatsApp Magic Link / Session initialization
      const reqRes = await request(app)
        .post('/api/auth/whatsapp-magic-link')
        .send({ phoneNumber, clientUrl: "http://localhost:5173" });

      expect(reqRes.status).toBe(200);
      expect(reqRes.body.success).toBe(true);
      expect(reqRes.body.authSessionId).toBeDefined();
      expect(reqRes.body.sessionCode).toBeDefined();

      const { authSessionId, sessionCode } = reqRes.body;

      // 2. Simulate incoming reverse auth message from user: "CONNEXION <sessionCode>"
      const { authService } = await import('./auth.service.js');
      const authResult = await authService.authenticateViaIncomingMessage(phoneNumber, `CONNEXION ${sessionCode}`);

      expect(authResult.success).toBe(true);
      expect(authResult.tokens).toBeDefined();
      expect(authResult.tokens.accessToken).toBeDefined();
      expect(authResult.replyMessage).toMatch(/Connexion réussie/i);

      // 3. Verify polling returns authenticated state
      const pollRes = await request(app)
        .post('/api/auth/poll-status')
        .send({ authSessionId, sessionCode, phoneNumber });

      expect(pollRes.status).toBe(200);
      expect(pollRes.body.status).toBe('authenticated');
      expect(pollRes.body.sessionData).toBeDefined();
      expect(pollRes.body.sessionData.accessToken).toBe(authResult.tokens.accessToken);
    });

    it('should strictly refuse authentication when incoming WhatsApp phone differs from requested phone', async () => {
      const requestedPhone = "2250701020304";
      const differentSenderPhone = "2250505060708";

      // 1. Request WhatsApp Magic Link for requestedPhone
      const reqRes = await request(app)
        .post('/api/auth/whatsapp-magic-link')
        .send({ phoneNumber: requestedPhone, clientUrl: "http://localhost:5173" });

      expect(reqRes.status).toBe(200);
      const { authSessionId, sessionCode } = reqRes.body;

      // 2. Simulate incoming reverse auth message sent from a DIFFERENT phone number
      const { authService } = await import('./auth.service.js');
      const authResult = await authService.authenticateViaIncomingMessage(differentSenderPhone, `CONNEXION ${sessionCode}`);

      // Strict refusal
      expect(authResult.success).toBe(false);
      expect((authResult as any).mismatch).toBe(true);
      expect(authResult.replyMessage).toMatch(/Échec de connexion/i);

      // 3. Verify polling returns mismatch status
      const pollRes = await request(app)
        .post('/api/auth/poll-status')
        .send({ authSessionId, sessionCode, phoneNumber: requestedPhone });

      expect(pollRes.status).toBe(200);
      expect(pollRes.body.status).toBe('mismatch');
      expect(pollRes.body.message).toBeDefined();
    });
  });
});
