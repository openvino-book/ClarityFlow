import request from 'supertest';
import { app } from '../../src/app';
import { getPrismaClient } from '../../src/lib/prisma';

const prisma = getPrismaClient();

describe('POST /api/cards/:id/transition', () => {
  beforeEach(async () => {
    await prisma.card.deleteMany();
  });

  describe('I4: 状态机 - 非法状态流转', () => {
    it('should reject transition from NEEDS_CLARIFICATION directly to DONE', async () => {
      const card = await prisma.card.create({
        data: {
          title: 'Test Card',
          problem: 'Test problem',
          successCriteria: 'Test criteria',
          status: 'NEEDS_CLARIFICATION',
        },
      });

      const response = await request(app)
        .post(`/api/cards/${card.id}/transition`)
        .send({ status: 'DONE' });

      // Should return 400 (validation) or 409 (conflict)
      expect([400, 409]).toContain(response.status);
      expect(response.body.error).toMatchObject({
        code: expect.stringMatching(/VALIDATION_ERROR|CONFLICT/),
        message: expect.any(String),
      });
    });

    it('should reject transition from DONE back to NEEDS_CLARIFICATION', async () => {
      const card = await prisma.card.create({
        data: {
          title: 'Test Card',
          problem: 'Test problem',
          successCriteria: 'Test criteria',
          status: 'DONE',
        },
      });

      const response = await request(app)
        .post(`/api/cards/${card.id}/transition`)
        .send({ status: 'NEEDS_CLARIFICATION' });

      expect([400, 409]).toContain(response.status);
      expect(response.body.error.code).toMatch(/VALIDATION_ERROR|CONFLICT/);
    });

    it('should reject transition to invalid status', async () => {
      const card = await prisma.card.create({
        data: {
          title: 'Test Card',
          problem: 'Test problem',
          successCriteria: 'Test criteria',
          status: 'NEEDS_CLARIFICATION',
        },
      });

      const response = await request(app)
        .post(`/api/cards/${card.id}/transition`)
        .send({ status: 'INVALID_STATUS' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('I5: 持续完整性契约 - 字段缺失检查', () => {
    it('should reject transition to CONFIRMED when core fields are missing', async () => {
      // Create card with empty core fields
      const card = await prisma.card.create({
        data: {
          title: 'Incomplete Card',
          problem: '', // Empty
          successCriteria: '', // Empty
          status: 'NEEDS_CLARIFICATION',
        },
      });

      const response = await request(app)
        .post(`/api/cards/${card.id}/transition`)
        .send({ status: 'CONFIRMED' });

      expect(response.status).toBe(409);
      expect(response.body.error).toMatchObject({
        code: 'CONFLICT',
        message: expect.stringContaining('incomplete'),
      });
      expect(response.body.error.details).toHaveProperty('missingFields');
      expect(Array.isArray(response.body.error.details.missingFields)).toBe(true);
    });

    it('should allow transition to CONFIRMED when all core fields are present', async () => {
      const card = await prisma.card.create({
        data: {
          title: 'Complete Card',
          problem: 'Well-defined problem',
          successCriteria: 'Clear criteria',
          status: 'NEEDS_CLARIFICATION',
        },
      });

      const response = await request(app)
        .post(`/api/cards/${card.id}/transition`)
        .send({ status: 'CONFIRMED' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('CONFIRMED');
    });

    it('should allow transition from CONFIRMED with empty optional fields', async () => {
      const card = await prisma.card.create({
        data: {
          title: 'Card with optional fields',
          problem: 'Problem defined',
          successCriteria: 'Criteria defined',
          outOfScope: '', // Optional field, can be empty
          stakeholders: '', // Optional field, can be empty
          risks: '', // Optional field, can be empty
          status: 'NEEDS_CLARIFICATION',
        },
      });

      // First transition to CONFIRMED
      await prisma.card.update({
        where: { id: card.id },
        data: { status: 'CONFIRMED' },
      });

      const response = await request(app)
        .post(`/api/cards/${card.id}/transition`)
        .send({ status: 'IN_PROGRESS' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('IN_PROGRESS');
    });
  });

  describe('Happy Path: 合法状态迁移', () => {
    it('should transition NEEDS_CLARIFICATION -> CONFIRMED successfully', async () => {
      const card = await prisma.card.create({
        data: {
          title: 'Valid Card',
          problem: 'Clear problem statement',
          successCriteria: 'Measurable criteria',
          status: 'NEEDS_CLARIFICATION',
          version: 0,
        },
      });

      const response = await request(app)
        .post(`/api/cards/${card.id}/transition`)
        .send({ status: 'CONFIRMED' });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: card.id,
        status: 'CONFIRMED',
        version: 1, // Version should increment
      });
      expect(response.body.updatedAt).not.toBe(card.updatedAt);
    });

    it('should transition CONFIRMED -> IN_PROGRESS successfully', async () => {
      const card = await prisma.card.create({
        data: {
          title: 'Valid Card',
          problem: 'Clear problem',
          successCriteria: 'Clear criteria',
          status: 'CONFIRMED',
          version: 0,
        },
      });

      const response = await request(app)
        .post(`/api/cards/${card.id}/transition`)
        .send({ status: 'IN_PROGRESS' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('IN_PROGRESS');
      expect(response.body.version).toBe(1);
    });

    it('should transition IN_PROGRESS -> DONE successfully', async () => {
      const card = await prisma.card.create({
        data: {
          title: 'Valid Card',
          problem: 'Clear problem',
          successCriteria: 'Clear criteria',
          status: 'IN_PROGRESS',
          version: 0,
        },
      });

      const response = await request(app)
        .post(`/api/cards/${card.id}/transition`)
        .send({ status: 'DONE' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('DONE');
      expect(response.body.version).toBe(1);
    });

    it('should return 404 for non-existent card id', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .post(`/api/cards/${fakeId}/transition`)
        .send({ status: 'CONFIRMED' });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('I7: 并发保护 - 乐观锁', () => {
    it('should increment version on successful transition', async () => {
      const card = await prisma.card.create({
        data: {
          title: 'Test Card',
          problem: 'Problem',
          successCriteria: 'Criteria',
          status: 'NEEDS_CLARIFICATION',
          version: 0,
        },
      });

      const response = await request(app)
        .post(`/api/cards/${card.id}/transition`)
        .send({ status: 'CONFIRMED' });

      expect(response.status).toBe(200);
      expect(response.body.version).toBe(1);

      // Verify in database
      const dbCard = await prisma.card.findUnique({
        where: { id: card.id },
      });
      expect(dbCard?.version).toBe(1);
    });
  });
});
