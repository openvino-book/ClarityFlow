import request from 'supertest';
import { app } from '../../src/app';
import { getPrismaClient } from '../../src/lib/prisma';

const prisma = getPrismaClient();

describe('Mutation API: PUT and DELETE', () => {
  beforeEach(async () => {
    await prisma.card.deleteMany();
  });

  describe('PUT /api/cards/:id', () => {
    describe('I5: Update Guard - 防止 CONFIRMED+ 字段回退', () => {
      it('should reject clearing problem field on CONFIRMED card', async () => {
        const card = await prisma.card.create({
          data: {
            title: 'Confirmed Card',
            problem: 'Important problem',
            successCriteria: 'Clear criteria',
            status: 'CONFIRMED',
            version: 0,
          },
        });

        const response = await request(app)
          .put(`/api/cards/${card.id}`)
          .send({
            version: 0,
            problem: '', // Try to clear the field
          });

        expect(response.status).toBe(409);
        expect(response.body.error).toMatchObject({
          code: 'CONFLICT',
          message: expect.stringContaining('Cannot clear required fields'),
        });
      });

      it('should reject clearing successCriteria on IN_PROGRESS card', async () => {
        const card = await prisma.card.create({
          data: {
            title: 'In Progress Card',
            problem: 'Problem',
            successCriteria: 'Criteria',
            status: 'IN_PROGRESS',
            version: 0,
          },
        });

        const response = await request(app)
          .put(`/api/cards/${card.id}`)
          .send({
            version: 0,
            successCriteria: '', // Try to clear
          });

        expect(response.status).toBe(409);
        expect(response.body.error.code).toBe('CONFLICT');
      });

      it('should allow updating other fields on CONFIRMED card', async () => {
        const card = await prisma.card.create({
          data: {
            title: 'Confirmed Card',
            problem: 'Problem',
            successCriteria: 'Criteria',
            status: 'CONFIRMED',
            version: 0,
          },
        });

        const response = await request(app)
          .put(`/api/cards/${card.id}`)
          .send({
            version: 0,
            title: 'Updated title',
            risks: 'New risks',
          });

        expect(response.status).toBe(200);
        expect(response.body.title).toBe('Updated title');
        expect(response.body.risks).toBe('New risks');
        expect(response.body.version).toBe(1);
      });

      it('should allow clearing optional fields on CONFIRMED card', async () => {
        const card = await prisma.card.create({
          data: {
            title: 'Confirmed Card',
            problem: 'Problem',
            successCriteria: 'Criteria',
            outOfScope: 'Initial scope',
            status: 'CONFIRMED',
            version: 0,
          },
        });

        const response = await request(app)
          .put(`/api/cards/${card.id}`)
          .send({
            version: 0,
            outOfScope: '', // Optional field can be cleared
          });

        expect(response.status).toBe(200);
        expect(response.body.outOfScope).toBe('');
      });
    });

    describe('I7: Optimistic Locking - version 检查', () => {
      it('should reject update with mismatched version', async () => {
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
          .put(`/api/cards/${card.id}`)
          .send({
            version: 99, // Wrong version
            title: 'Updated title',
          });

        expect(response.status).toBe(409);
        expect(response.body.error.code).toBe('CONFLICT');
        expect(response.body.error.message).toContain('Version');
      });

      it('should reject update without version', async () => {
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
          .put(`/api/cards/${card.id}`)
          .send({
            // No version provided
            title: 'Updated title',
          });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should accept update with correct version and increment it', async () => {
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
          .put(`/api/cards/${card.id}`)
          .send({
            version: 0,
            title: 'Updated title',
          });

        expect(response.status).toBe(200);
        expect(response.body.version).toBe(1);
        expect(response.body.title).toBe('Updated title');
      });
    });

    describe('Happy Path: 部分更新', () => {
      it('should update only provided fields', async () => {
        const card = await prisma.card.create({
          data: {
            title: 'Original Title',
            problem: 'Original Problem',
            successCriteria: 'Original Criteria',
            status: 'NEEDS_CLARIFICATION',
            version: 0,
          },
        });

        const response = await request(app)
          .put(`/api/cards/${card.id}`)
          .send({
            version: 0,
            title: 'New Title',
          });

        expect(response.status).toBe(200);

        // Verify only title changed
        const dbCard = await prisma.card.findUnique({
          where: { id: card.id },
        });

        expect(dbCard?.title).toBe('New Title');
        expect(dbCard?.problem).toBe('Original Problem');
        expect(dbCard?.successCriteria).toBe('Original Criteria');
      });

      it('should allow updating NEEDS_CLARIFICATION card freely', async () => {
        const card = await prisma.card.create({
          data: {
            title: 'Initial Card',
            problem: '',
            successCriteria: '',
            status: 'NEEDS_CLARIFICATION',
            version: 0,
          },
        });

        const response = await request(app)
          .put(`/api/cards/${card.id}`)
          .send({
            version: 0,
            problem: 'Defined problem',
            successCriteria: 'Defined criteria',
          });

        expect(response.status).toBe(200);
        expect(response.body.problem).toBe('Defined problem');
        expect(response.body.successCriteria).toBe('Defined criteria');
      });

      it('should return 404 for non-existent card', async () => {
        const fakeId = '00000000-0000-0000-0000-000000000000';
        const response = await request(app)
          .put(`/api/cards/${fakeId}`)
          .send({ version: 0 });

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

        const response = await request(app)
          .put(`/api/cards/${card.id}`)
          .send({ version: 0 });

        expect(response.status).toBe(404);
      });
    });
  });

  describe('DELETE /api/cards/:id', () => {
    describe('I3: 软删除', () => {
      it('should soft delete card and return 204', async () => {
        const card = await prisma.card.create({
          data: {
            title: 'Card to Delete',
            problem: 'Problem',
            successCriteria: 'Criteria',
            status: 'NEEDS_CLARIFICATION',
          },
        });

        const response = await request(app).delete(`/api/cards/${card.id}`);

        expect(response.status).toBe(204);
        expect(response.body).toEqual({});

        // Verify soft delete in database
        const dbCard = await prisma.card.findUnique({
          where: { id: card.id },
        });

        expect(dbCard?.deletedAt).not.toBeNull();
      });

      it('should return 404 when querying soft-deleted card', async () => {
        const card = await prisma.card.create({
          data: {
            title: 'Deleted Card',
            problem: 'Problem',
            successCriteria: 'Criteria',
            status: 'NEEDS_CLARIFICATION',
          },
        });

        // Delete the card
        await request(app).delete(`/api/cards/${card.id}`);

        // Try to get it
        const getResponse = await request(app).get(`/api/cards/${card.id}`);

        expect(getResponse.status).toBe(404);
        expect(getResponse.body.error.code).toBe('NOT_FOUND');
      });

      it('should return 404 when deleting already deleted card', async () => {
        const card = await prisma.card.create({
          data: {
            title: 'Card',
            problem: 'Problem',
            successCriteria: 'Criteria',
            status: 'NEEDS_CLARIFICATION',
            deletedAt: new Date(),
          },
        });

        const response = await request(app).delete(`/api/cards/${card.id}`);

        expect(response.status).toBe(404);
        expect(response.body.error.code).toBe('NOT_FOUND');
      });

      it('should return 404 for non-existent card', async () => {
        const fakeId = '00000000-0000-0000-0000-000000000000';
        const response = await request(app).delete(`/api/cards/${fakeId}`);

        expect(response.status).toBe(404);
        expect(response.body.error.code).toBe('NOT_FOUND');
      });

      it('should not affect list after soft delete', async () => {
        // Create two cards
        const card1 = await prisma.card.create({
          data: {
            title: 'Card 1',
            problem: 'Problem 1',
            successCriteria: 'Criteria 1',
            status: 'NEEDS_CLARIFICATION',
          },
        });

        await prisma.card.create({
          data: {
            title: 'Card 2',
            problem: 'Problem 2',
            successCriteria: 'Criteria 2',
            status: 'NEEDS_CLARIFICATION',
          },
        });

        // Delete first card
        await request(app).delete(`/api/cards/${card1.id}`);

        // List should only show second card
        const listResponse = await request(app).get('/api/cards');

        expect(listResponse.status).toBe(200);
        expect(listResponse.body.cards).toHaveLength(1);
        expect(listResponse.body.cards[0].title).toBe('Card 2');
      });
    });
  });
});
