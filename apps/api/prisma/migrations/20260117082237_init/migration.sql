-- CreateTable
CREATE TABLE "cards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "problem" TEXT NOT NULL,
    "successCriteria" TEXT NOT NULL,
    "outOfScope" TEXT,
    "stakeholders" TEXT,
    "risks" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEEDS_CLARIFICATION',
    "dueDate" DATETIME,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);
