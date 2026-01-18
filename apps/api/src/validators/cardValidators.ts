import { z } from 'zod';

export const createCardSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(120, 'Title must be less than 120 characters'),
});

export type CreateCardInput = z.infer<typeof createCardSchema>;

// Card status enum
export const cardStatusEnum = z.enum([
  'NEEDS_CLARIFICATION',
  'CONFIRMED',
  'IN_PROGRESS',
  'DONE',
]);

// Query parameters for list endpoint
export const listCardsQuerySchema = z.object({
  status: cardStatusEnum.optional(),
  q: z.string().optional(), // Search keyword
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
});

export type ListCardsQuery = z.infer<typeof listCardsQuerySchema>;

// UUID validation
export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid UUID format'),
});

export type UuidParam = z.infer<typeof uuidParamSchema>;

// Status transition request
export const transitionSchema = z.object({
  status: cardStatusEnum,
});

export type TransitionInput = z.infer<typeof transitionSchema>;

// Update card request - version is REQUIRED for optimistic locking
export const updateCardSchema = z.object({
  version: z.number().int().min(0, 'Version must be non-negative'),
  title: z.string().min(1).max(120).optional(),
  problem: z.string().max(1000).optional(),
  successCriteria: z.string().max(2000).optional(),
  outOfScope: z.string().max(2000).optional(),
  stakeholders: z.string().max(1000).optional(),
  risks: z.string().max(2000).optional(),
  dueDate: z.coerce.date().optional(),
});

export type UpdateCardInput = z.infer<typeof updateCardSchema>;

