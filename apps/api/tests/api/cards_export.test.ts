import request from 'supertest';
import { app } from '../../src/app';
import { getPrismaClient } from '../../src/lib/prisma';

const prisma = getPrismaClient();

describe('GET /api/cards/:id/export', () => {
  beforeEach(async () => {
    await prisma.card.deleteMany();
  });

  describe('I6: Export Completeness - 导出完整性', () => {
    it('should return markdown with all required fields', async () => {
      // Create a complete card with all fields
      const card = await prisma.card.create({
        data: {
          title: 'Implement user authentication',
          problem: 'Users cannot log in to the system',
          successCriteria: 'Users can log in with email and password',
          outOfScope: 'Social login integration',
          stakeholders: 'Product team, Security team',
          risks: 'Security vulnerabilities if not implemented correctly',
          status: 'IN_PROGRESS',
          version: 2,
        },
      });

      const response = await request(app).get(`/api/cards/${card.id}/export`);

      // Assertion 1: Content-Type must be text/markdown
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/markdown');

      const markdown = response.text;

      // Assertion 2: Must contain all key fields
      expect(markdown).toContain('Implement user authentication');
      expect(markdown).toContain('Users cannot log in to the system');
      expect(markdown).toContain('Users can log in with email and password');
      expect(markdown).toContain('Social login integration');
      expect(markdown).toContain('Product team, Security team');
      expect(markdown).toContain('Security vulnerabilities if not implemented correctly');

      // Assertion 3: Must contain current status and last updated time
      expect(markdown).toContain('IN_PROGRESS');
      expect(markdown).toContain('最后更新');
    });

    it('should include proper markdown structure with emojis', async () => {
      const card = await prisma.card.create({
        data: {
          title: 'Test Card',
          problem: 'Test problem',
          successCriteria: 'Test criteria',
          status: 'CONFIRMED',
          version: 1,
        },
      });

      const response = await request(app).get(`/api/cards/${card.id}/export`);

      expect(response.status).toBe(200);
      const markdown = response.text;

      // Check for markdown headers
      expect(markdown).toContain('# [CONFIRMED] Test Card');
      expect(markdown).toContain('## 🎯 背景与问题');
      expect(markdown).toContain('## ✅ 成功标准');
      expect(markdown).toContain('## 🚫 边界');
      expect(markdown).toContain('## 👥 关键人');
      expect(markdown).toContain('## ⚠️ 风险');
    });

    it('should handle optional fields that are empty', async () => {
      const card = await prisma.card.create({
        data: {
          title: 'Minimal Card',
          problem: 'Simple problem',
          successCriteria: 'Simple criteria',
          outOfScope: '',
          stakeholders: '',
          risks: '',
          status: 'NEEDS_CLARIFICATION',
          version: 0,
        },
      });

      const response = await request(app).get(`/api/cards/${card.id}/export`);

      expect(response.status).toBe(200);
      const markdown = response.text;

      // Should still have all sections even if empty
      expect(markdown).toContain('## 🚫 边界');
      expect(markdown).toContain('## 👥 关键人');
      expect(markdown).toContain('## ⚠️ 风险');
    });

    it('should format updatedAt timestamp correctly', async () => {
      const card = await prisma.card.create({
        data: {
          title: 'Timestamp Test',
          problem: 'Problem',
          successCriteria: 'Criteria',
          status: 'DONE',
          version: 3,
        },
      });

      const response = await request(app).get(`/api/cards/${card.id}/export`);

      expect(response.status).toBe(200);
      const markdown = response.text;

      // Should contain timestamp
      expect(markdown).toMatch(/\d{4}-\d{2}-\d{2}/); // ISO date format
    });
  });

  describe('Error Cases', () => {
    it('should return 404 for non-existent card', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app).get(`/api/cards/${fakeId}/export`);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 404 for soft-deleted card', async () => {
      const card = await prisma.card.create({
        data: {
          title: 'Deleted Card',
          problem: 'Problem',
          successCriteria: 'Criteria',
          status: 'NEEDS_CLARIFICATION',
          deletedAt: new Date(),
        },
      });

      const response = await request(app).get(`/api/cards/${card.id}/export`);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app).get('/api/cards/invalid-uuid/export');

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
