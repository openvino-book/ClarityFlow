import request from 'supertest';
import { app } from '../../src/app';
import { getPrismaClient } from '../../src/lib/prisma';

const prisma = getPrismaClient();

describe('POST /api/cards', () => {
  beforeEach(async () => {
    // Clean up database before each test
    await prisma.card.deleteMany();
  });

  describe('Case 1: 失败路径 - 验证错误', () => {
    it('should return 400 and VALIDATION_ERROR when title is missing', async () => {
      const response = await request(app)
        .post('/api/cards')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatchObject({
        code: 'VALIDATION_ERROR',
        message: expect.any(String),
      });
    });

    it('should return 400 when title is empty string', async () => {
      const response = await request(app)
        .post('/api/cards')
        .send({ title: '' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when title exceeds 120 characters', async () => {
      const response = await request(app)
        .post('/api/cards')
        .send({ title: 'a'.repeat(121) });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Case 2: 成功路径 - 创建卡片', () => {
    it('should return 201 and create card with default status', async () => {
      const cardData = {
        title: 'Fix login bug',
      };

      const response = await request(app)
        .post('/api/cards')
        .send(cardData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toMatchObject({
        title: 'Fix login bug',
        status: 'NEEDS_CLARIFICATION',
      });
      expect(response.body.id).toBeDefined();
      expect(typeof response.body.id).toBe('string');
    });

    it('should create card with all required fields initialized', async () => {
      const response = await request(app)
        .post('/api/cards')
        .send({ title: 'Test card' });

      expect(response.status).toBe(201);

      // Verify all required fields are present
      const card = await prisma.card.findUnique({
        where: { id: response.body.id },
      });

      expect(card).toBeDefined();
      expect(card?.title).toBe('Test card');
      expect(card?.status).toBe('NEEDS_CLARIFICATION');
      expect(card?.version).toBe(0);
      expect(card?.deletedAt).toBeNull();
      expect(card?.createdAt).toBeDefined();
      expect(card?.updatedAt).toBeDefined();
    });
  });
});
