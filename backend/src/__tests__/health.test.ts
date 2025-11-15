import { buildServer } from '../server';

describe('Health Endpoints', () => {
  const server = buildServer();

  afterAll(async () => {
    await server.then((s) => s.close());
  });

  describe('GET /api/health', () => {
    it('should return healthy status', async () => {
      const app = await server;
      const response = await app.inject({
        method: 'GET',
        url: '/api/health',
      });

      expect(response.statusCode).toBe(200);
      const payload = JSON.parse(response.payload);
      expect(payload).toHaveProperty('status', 'healthy');
      expect(payload).toHaveProperty('timestamp');
      expect(payload).toHaveProperty('uptime');
    });
  });

  describe('GET /api/health/live', () => {
    it('should return alive status', async () => {
      const app = await server;
      const response = await app.inject({
        method: 'GET',
        url: '/api/health/live',
      });

      expect(response.statusCode).toBe(200);
      const payload = JSON.parse(response.payload);
      expect(payload).toHaveProperty('alive', true);
    });
  });

  describe('GET /', () => {
    it('should return service info', async () => {
      const app = await server;
      const response = await app.inject({
        method: 'GET',
        url: '/',
      });

      expect(response.statusCode).toBe(200);
      const payload = JSON.parse(response.payload);
      expect(payload).toHaveProperty('service', 'NaviKid Backend API');
      expect(payload).toHaveProperty('version');
      expect(payload).toHaveProperty('status', 'running');
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const app = await server;
      const response = await app.inject({
        method: 'GET',
        url: '/api/nonexistent',
      });

      expect(response.statusCode).toBe(404);
      const payload = JSON.parse(response.payload);
      expect(payload).toHaveProperty('error', 'Not Found');
    });
  });
});
