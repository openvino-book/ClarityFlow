import { getPrismaClient } from '../src/lib/prisma';

const prisma = getPrismaClient();

describe('Database Invariants (Native Prisma Behavior)', () => {
  beforeEach(async () => {
    // Clean up database before each test
    await prisma.card.deleteMany();
  });

  describe('I2: Time Flow (createdAt ≤ updatedAt)', () => {
    it('should have createdAt <= updatedAt when creating a card', async () => {
      const card = await prisma.card.create({
        data: {
          title: 'Test Card',
          problem: 'Test problem',
          successCriteria: 'Test criteria',
        },
      });

      expect(card.createdAt.getTime()).toBeLessThanOrEqual(card.updatedAt.getTime());
    });

    it('should update updatedAt when modifying a card', async () => {
      const card = await prisma.card.create({
        data: {
          title: 'Original Title',
          problem: 'Test problem',
          successCriteria: 'Test criteria',
        },
      });

      // Wait a bit to ensure time difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      const updatedCard = await prisma.card.update({
        where: { id: card.id },
        data: { title: 'Updated Title' },
      });

      expect(updatedCard.createdAt).toEqual(card.createdAt);
      expect(updatedCard.updatedAt.getTime()).toBeGreaterThan(card.updatedAt.getTime());
    });
  });

  describe('I3: Ghost Defense (deletedAt filtering)', () => {
    it('should return soft-deleted cards in default findMany() - demonstrates need for Service layer filtering', async () => {
      // Create two cards
      await prisma.card.create({
        data: {
          title: 'Active Card',
          problem: 'Problem A',
          successCriteria: 'Criteria A',
        },
      });

      await prisma.card.create({
        data: {
          title: 'Deleted Card',
          problem: 'Problem B',
          successCriteria: 'Criteria B',
          deletedAt: new Date(),
        },
      });

      // Default findMany() returns ALL cards including soft-deleted ones
      const allCards = await prisma.card.findMany();

      // This proves we need to manually add `where: { deletedAt: null }` in Service layer
      expect(allCards).toHaveLength(2);
      expect(allCards.some((c: { deletedAt: Date | null }) => c.deletedAt !== null)).toBe(true);

      // Correct approach with explicit filter (Service layer should do this)
      const activeCards = await prisma.card.findMany({
        where: { deletedAt: null },
      });

      expect(activeCards).toHaveLength(1);
      expect(activeCards[0].title).toBe('Active Card');
    });
  });

  describe('I7: Concurrency Protection (Optimistic Locking)', () => {
    it('should demonstrate race condition: second update overwrites first without version check', async () => {
      // Create a card (v0)
      const card = await prisma.card.create({
        data: {
          title: 'Original Title',
          problem: 'Test problem',
          successCriteria: 'Test criteria',
        },
      });

      expect(card.version).toBe(0);

      // User A updates title (v0 -> v1)
      const updatedByA = await prisma.card.update({
        where: { id: card.id! },
        data: { title: 'Updated by User A' },
      });

      expect(updatedByA.version).toBe(0); // SQLite doesn't auto-increment without explicit code

      // User B updates with OLD version data (should fail, but doesn't without Service layer protection)
      // This is the RACE CONDITION: B overwrites A's changes
      const updatedByB = await prisma.card.update({
        where: { id: card.id! },
        data: { title: 'Updated by User B' },
      });

      // PROBLEM: B's update succeeded and overwrote A's changes
      expect(updatedByB.title).toBe('Updated by User B');

      // The final state only reflects B's changes; A's changes are lost
      const finalCard = await prisma.card.findUnique({
        where: { id: card.id },
      });

      expect(finalCard?.title).toBe('Updated by User B');
      // This demonstrates that WITHOUT Service layer version checking, data loss occurs
    });

    it('should demonstrate correct optimistic locking with version check', async () => {
      // Create a card (v0)
      const card = await prisma.card.create({
        data: {
          title: 'Original Title',
          problem: 'Test problem',
          successCriteria: 'Test criteria',
        },
      });

      // User A reads and updates (v0 -> v1)
      const cardV0 = await prisma.card.findUnique({
        where: { id: card.id },
      });

      const updatedByA = await prisma.card.update({
        where: {
          id: card.id!,
          version: cardV0!.version, // Optimistic lock: only update if version matches
        },
        data: {
          title: 'Updated by User A',
          version: cardV0!.version + 1, // Increment version
        },
      });

      expect(updatedByA.version).toBe(1);

      // User B tries to update with OLD version (v0)
      // This should fail because the current version is now v1
      await expect(
        prisma.card.update({
          where: {
            id: card.id!,
            version: 0, // Stale version
          },
          data: {
            title: 'Should fail',
            version: 1,
          },
        })
      ).rejects.toThrow(); // Prisma throws when record not found

      // Verify: A's changes are preserved
      const finalCard = await prisma.card.findUnique({
        where: { id: card.id },
      });

      expect(finalCard?.title).toBe('Updated by User A');
      expect(finalCard?.version).toBe(1);
    });
  });
});
