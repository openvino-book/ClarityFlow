import request from 'supertest';
import { app } from '../../src/app';
import { getPrismaClient } from '../../src/lib/prisma';

const prisma = getPrismaClient();

describe('GET /api/cards', () => {
  beforeEach(async () => {
    // Clean up database before each test
    await prisma.card.deleteMany();
  });

  describe('I3: 幽灵防御 - 软删除过滤', () => {
    it('should NOT return soft-deleted cards in list', async () => {
      // Create two cards: one active, one soft-deleted
      await prisma.card.create({
        data: {
          title: 'Active Card',
          problem: 'Problem A',
          successCriteria: 'Criteria A',
          status: 'NEEDS_CLARIFICATION',
          deletedAt: null,
        },
      });

      await prisma.card.create({
        data: {
          title: 'Deleted Card',
          problem: 'Problem B',
          successCriteria: 'Criteria B',
          status: 'NEEDS_CLARIFICATION',
          deletedAt: new Date(),
        },
      });

      const response = await request(app).get('/api/cards');

      expect(response.status).toBe(200);
      expect(response.body.cards).toHaveLength(1);
      expect(response.body.cards[0].title).toBe('Active Card');
      expect(response.body.cards.some((c: any) => c.title === 'Deleted Card')).toBe(false);
    });

    it('should return 404 when accessing soft-deleted card by id', async () => {
      // Create a soft-deleted card
      const card = await prisma.card.create({
        data: {
          title: 'Deleted Card',
          problem: 'Problem',
          successCriteria: 'Criteria',
          status: 'NEEDS_CLARIFICATION',
          deletedAt: new Date(),
        },
      });

      const response = await request(app).get(`/api/cards/${card.id}`);

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        error: {
          code: 'NOT_FOUND',
          message: expect.any(String),
        },
      });
    });
  });

  describe('状态过滤', () => {
    beforeEach(async () => {
      // Create cards with different statuses
      await prisma.card.createMany({
        data: [
          {
            title: 'Card 1 - Needs Clarification',
            problem: 'Problem 1',
            successCriteria: 'Criteria 1',
            status: 'NEEDS_CLARIFICATION',
          },
          {
            title: 'Card 2 - Confirmed',
            problem: 'Problem 2',
            successCriteria: 'Criteria 2',
            status: 'CONFIRMED',
          },
          {
            title: 'Card 3 - In Progress',
            problem: 'Problem 3',
            successCriteria: 'Criteria 3',
            status: 'IN_PROGRESS',
          },
        ],
      });
    });

    it('should filter cards by status=CONFIRMED', async () => {
      const response = await request(app).get('/api/cards?status=CONFIRMED');

      expect(response.status).toBe(200);
      expect(response.body.cards).toHaveLength(1);
      expect(response.body.cards[0].status).toBe('CONFIRMED');
      expect(response.body.cards[0].title).toBe('Card 2 - Confirmed');
    });

    it('should return all cards when no status filter is provided', async () => {
      const response = await request(app).get('/api/cards');

      expect(response.status).toBe(200);
      expect(response.body.cards).toHaveLength(3);
    });

    it('should return 400 for invalid status value', async () => {
      const response = await request(app).get('/api/cards?status=INVALID_STATUS');

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('关键词搜索', () => {
    beforeEach(async () => {
      await prisma.card.createMany({
        data: [
          {
            title: 'Fix login bug',
            problem: 'Users cannot login with SSO',
            successCriteria: 'Criteria',
            status: 'NEEDS_CLARIFICATION',
          },
          {
            title: 'Update payment flow',
            problem: 'Payment integration issue',
            successCriteria: 'Criteria',
            status: 'NEEDS_CLARIFICATION',
          },
          {
            title: 'Add dark mode',
            problem: 'UI enhancement request',
            successCriteria: 'Criteria',
            status: 'NEEDS_CLARIFICATION',
          },
        ],
      });
    });

    it('should search in title field', async () => {
      const response = await request(app).get('/api/cards?q=login');

      expect(response.status).toBe(200);
      expect(response.body.cards).toHaveLength(1);
      expect(response.body.cards[0].title).toBe('Fix login bug');
    });

    it('should search in problem field', async () => {
      const response = await request(app).get('/api/cards?q=SSO');

      expect(response.status).toBe(200);
      expect(response.body.cards).toHaveLength(1);
      expect(response.body.cards[0].title).toBe('Fix login bug');
    });

    it('should be case-insensitive', async () => {
      const response = await request(app).get('/api/cards?q=PAYMENT');

      expect(response.status).toBe(200);
      expect(response.body.cards).toHaveLength(1);
      expect(response.body.cards[0].title).toBe('Update payment flow');
    });

    it('should return empty array when no matches found', async () => {
      const response = await request(app).get('/api/cards?q=nonexistent');

      expect(response.status).toBe(200);
      expect(response.body.cards).toHaveLength(0);
    });
  });

  describe('分页', () => {
    beforeEach(async () => {
      // Create 15 cards
      await Promise.all(
        Array.from({ length: 15 }, (_, i) =>
          prisma.card.create({
            data: {
              title: `Card ${i + 1}`,
              problem: `Problem ${i + 1}`,
              successCriteria: `Criteria ${i + 1}`,
              status: 'NEEDS_CLARIFICATION',
            },
          })
        )
      );
    });

    it('should return first page with default page size', async () => {
      const response = await request(app).get('/api/cards?page=1&pageSize=10');

      expect(response.status).toBe(200);
      expect(response.body.cards).toHaveLength(10);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        pageSize: 10,
        total: 15,
        totalPages: 2,
      });
    });

    it('should return second page with remaining items', async () => {
      const response = await request(app).get('/api/cards?page=2&pageSize=10');

      expect(response.status).toBe(200);
      expect(response.body.cards).toHaveLength(5);
      expect(response.body.pagination.page).toBe(2);
    });

    it('should return 400 for invalid page parameters', async () => {
      const response = await request(app).get('/api/cards?page=0');

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});

describe('GET /api/cards/:id', () => {
  beforeEach(async () => {
    await prisma.card.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should return card by id', async () => {
    const card = await prisma.card.create({
      data: {
        title: 'Test Card',
        problem: 'Test problem',
        successCriteria: 'Test criteria',
        status: 'NEEDS_CLARIFICATION',
      },
    });

    const response = await request(app).get(`/api/cards/${card.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: card.id,
      title: 'Test Card',
      status: 'NEEDS_CLARIFICATION',
    });
  });

  it('should return 404 for non-existent id', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const response = await request(app).get(`/api/cards/${fakeId}`);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('should return 400 for invalid uuid format', async () => {
    const response = await request(app).get('/api/cards/invalid-uuid');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
