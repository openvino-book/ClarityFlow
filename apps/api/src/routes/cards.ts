import { Router, Request, Response, NextFunction } from 'express';
import { getPrismaClient } from '../lib/prisma';
import {
  createCardSchema,
  listCardsQuerySchema,
  uuidParamSchema,
  transitionSchema,
  updateCardSchema,
} from '../validators/cardValidators';
import { AppError } from '../middleware/errorHandler';
import { validateTransition, validateUpdate } from '../services/cardService';

const router = Router();
const prisma = getPrismaClient();

// POST /api/cards - Create a new card
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const validatedData = createCardSchema.parse(req.body);

    // Create card with default status
    const card = await prisma.card.create({
      data: {
        title: validatedData.title,
        problem: '', // Placeholder - will be filled during clarification
        successCriteria: '', // Placeholder
        status: 'NEEDS_CLARIFICATION',
      },
    });

    // Return created card
    res.status(201).json({
      id: card.id,
      title: card.title,
      status: card.status,
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/cards - List cards with filtering, search, and pagination
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate query parameters
    const query = listCardsQuerySchema.parse(req.query);

    // Build where clause with I3: Ghost Defense (deletedAt filter)
    const where: any = {
      deletedAt: null, // CRITICAL: Always filter out soft-deleted cards
    };

    // Add status filter if provided
    if (query.status) {
      where.status = query.status;
    }

    // Add search filter if provided (search in title OR problem)
    // Note: SQLite search is case-insensitive by default, no need for mode parameter
    if (query.q) {
      where.OR = [
        { title: { contains: query.q } },
        { problem: { contains: query.q } },
      ];
    }

    // Calculate pagination
    const skip = (query.page - 1) * query.pageSize;

    // Get total count for pagination metadata
    const total = await prisma.card.count({ where });

    // Get cards with pagination
    const cards = await prisma.card.findMany({
      where,
      skip,
      take: query.pageSize,
      orderBy: { createdAt: 'desc' },
    });

    // Calculate total pages
    const totalPages = Math.ceil(total / query.pageSize);

    res.json({
      cards,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/cards/:id - Get card details by id
router.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate UUID parameter
      const { id } = uuidParamSchema.parse(req.params);

      // Find card with I3: Ghost Defense (deletedAt filter)
      const card = await prisma.card.findFirst({
        where: {
          id,
          deletedAt: null, // CRITICAL: Do not return soft-deleted cards
        },
      });

      if (!card) {
        throw new AppError('Card not found', 404, 'NOT_FOUND');
      }

      res.json(card);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/cards/:id/transition - Transition card status
router.post(
  '/:id/transition',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate parameters
      const { id } = uuidParamSchema.parse(req.params);
      const { status: newStatus } = transitionSchema.parse(req.body);

      // Find current card with I3: Ghost Defense
      const currentCard = await prisma.card.findFirst({
        where: {
          id,
          deletedAt: null, // CRITICAL: Cannot transition soft-deleted cards
        },
      });

      if (!currentCard) {
        throw new AppError('Card not found', 404, 'NOT_FOUND');
      }

      // Validate transition (I4 + I5: State machine + Completeness)
      validateTransition(currentCard, newStatus);

      // I7: 并发保护 - 使用乐观锁更新
      // 注意：这里使用 findFirst + update 组合来确保原子性
      const updatedCard = await prisma.card.update({
        where: {
          id,
          version: currentCard.version, // CRITICAL: Optimistic lock check
        },
        data: {
          status: newStatus,
          version: { increment: 1 }, // Increment version for each update
        },
      });

      res.json(updatedCard);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/cards/:id - Update card (partial update supported)
router.put(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate parameters
      const { id } = uuidParamSchema.parse(req.params);
      const updates = updateCardSchema.parse(req.body);

      // Find current card with I3: Ghost Defense
      const currentCard = await prisma.card.findFirst({
        where: {
          id,
          deletedAt: null, // CRITICAL: Cannot update soft-deleted cards
        },
      });

      if (!currentCard) {
        throw new AppError('Card not found', 404, 'NOT_FOUND');
      }

      // I7: 乐观锁 - 验证 version
      if (updates.version !== currentCard.version) {
        throw new AppError(
          `Version mismatch. Expected ${currentCard.version}, got ${updates.version}`,
          409,
          'CONFLICT',
          {
            currentVersion: currentCard.version,
            providedVersion: updates.version,
          }
        );
      }

      // I5: 验证更新不会破坏完整性（CONFIRMED+ 状态）
      validateUpdate(currentCard, updates);

      // I7: 使用乐观锁更新，version 自动递增
      const updatedCard = await prisma.card.update({
        where: {
          id,
          version: currentCard.version, // CRITICAL: Optimistic lock
        },
        data: {
          ...updates,
          version: { increment: 1 }, // Always increment version on update
        },
      });

      res.json(updatedCard);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/cards/:id - Soft delete card
router.delete(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate UUID parameter
      const { id } = uuidParamSchema.parse(req.params);

      // Find current card with I3: Ghost Defense
      const currentCard = await prisma.card.findFirst({
        where: {
          id,
          deletedAt: null, // CRITICAL: Can only delete active cards
        },
      });

      if (!currentCard) {
        throw new AppError('Card not found', 404, 'NOT_FOUND');
      }

      // I3: 软删除 - 设置 deletedAt 而不是物理删除
      await prisma.card.update({
        where: { id },
        data: {
          deletedAt: new Date(),
        },
      });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/cards/:id/export - Export card as Markdown
router.get(
  '/:id/export',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate UUID parameter
      const { id } = uuidParamSchema.parse(req.params);

      // Find card with I3: Ghost Defense
      const card = await prisma.card.findFirst({
        where: {
          id,
          deletedAt: null, // CRITICAL: Do not export soft-deleted cards
        },
      });

      if (!card) {
        throw new AppError('Card not found', 404, 'NOT_FOUND');
      }

      // I6: Export Completeness - Build Markdown with all context fields
      const markdown = generateMarkdownExport(card);

      // Set content type for Markdown
      res.header('Content-Type', 'text/markdown; charset=utf-8');
      res.send(markdown);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Generate Markdown export from card data (I6: Export Completeness)
 */
function generateMarkdownExport(card: {
  title: string;
  status: string;
  problem: string | null;
  successCriteria: string | null;
  outOfScope: string | null;
  stakeholders: string | null;
  risks: string | null;
  dueDate: Date | null;
  updatedAt: Date;
  version: number;
}): string {
  const sections: string[] = [];

  // Title with status badge
  sections.push(`# [${card.status}] ${card.title}\n`);

  // Problem statement
  sections.push('## 🎯 背景与问题');
  sections.push(card.problem || '_待补充_');
  sections.push('');

  // Success criteria
  sections.push('## ✅ 成功标准 (Definition of Done)');
  sections.push(card.successCriteria || '_待补充_');
  sections.push('');

  // Out of scope
  sections.push('## 🚫 边界 (Out of Scope)');
  sections.push(card.outOfScope || '_无_');
  sections.push('');

  // Stakeholders
  sections.push('## 👥 关键人');
  sections.push(card.stakeholders || '_待确认_');
  sections.push('');

  // Risks
  sections.push('## ⚠️ 风险');
  sections.push(card.risks || '_无_');
  sections.push('');

  // Metadata section
  sections.push('---');
  sections.push('');
  sections.push('**元数据**');
  sections.push(`- **当前状态**: ${card.status}`);
  sections.push(`- **版本**: ${card.version}`);
  sections.push(`- **最后更新**: ${card.updatedAt.toISOString().split('T')[0]}`);

  if (card.dueDate) {
    sections.push(`- **截止日期**: ${card.dueDate.toISOString().split('T')[0]}`);
  }

  return sections.join('\n');
}

export default router;



