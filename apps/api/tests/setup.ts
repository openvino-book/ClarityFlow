import { getPrismaClient } from '../src/lib/prisma';

const prisma = getPrismaClient();

// Global setup: Clean database before all tests
beforeAll(async () => {
  await prisma.card.deleteMany();
});

// Global teardown: Disconnect after all tests complete
afterAll(async () => {
  await prisma.$disconnect();
});
