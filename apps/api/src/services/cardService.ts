import { AppError } from '../middleware/errorHandler';

// I4: 状态机规则 - 定义合法的状态流转
const STATE_TRANSITIONS: Record<string, string[]> = {
  NEEDS_CLARIFICATION: ['CONFIRMED'],
  CONFIRMED: ['IN_PROGRESS'],
  IN_PROGRESS: ['DONE'],
  DONE: [], // 终态，不允许再流转
};

/**
 * 验证状态流转是否合法 (I4)
 * @throws AppError 如果状态流转非法
 */
export function validateStateTransition(currentStatus: string, newStatus: string): void {
  const allowedTransitions = STATE_TRANSITIONS[currentStatus];

  if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
    throw new AppError(
      `Invalid state transition from ${currentStatus} to ${newStatus}. ` +
      `Allowed transitions from ${currentStatus}: ${allowedTransitions.join(', ') || 'none'}`,
      409,
      'CONFLICT',
      {
        currentStatus,
        requestedStatus: newStatus,
        allowedTransitions,
      }
    );
  }
}

/**
 * I5: 持续完整性契约 - 验证 CONFIRMED+ 状态的卡片是否拥有完整的核心字段
 * @throws AppError 如果核心字段缺失
 */
export function validateCardCompleteness(card: {
  problem: string | null;
  successCriteria: string | null;
}): void {
  const missingFields: string[] = [];

  // 检查核心字段
  if (!card.problem || card.problem.trim() === '') {
    missingFields.push('problem');
  }

  if (!card.successCriteria || card.successCriteria.trim() === '') {
    missingFields.push('successCriteria');
  }

  if (missingFields.length > 0) {
    throw new AppError(
      'Card is incomplete. All core fields must be filled before this transition.',
      409,
      'CONFLICT',
      {
        missingFields,
        message: 'Cannot proceed to CONFIRMED status without completing all required fields',
      }
    );
  }
}

/**
 * 验证状态迁移的完整业务逻辑
 */
export function validateTransition(
  card: {
    status: string;
    problem: string | null;
    successCriteria: string | null;
  },
  newStatus: string
): void {
  // I4: 验证状态流转合法性
  validateStateTransition(card.status, newStatus);

  // I5: 对于 CONFIRMED 及以上状态，验证字段完整性
  if (newStatus === 'CONFIRMED' || newStatus === 'IN_PROGRESS' || newStatus === 'DONE') {
    validateCardCompleteness(card);
  }
}

/**
 * I5: 验证更新操作 - 防止 CONFIRMED+ 状态的核心字段被清空
 * @throws AppError 如果更新会破坏完整性
 */
export function validateUpdate(
  currentCard: {
    status: string;
    problem: string | null;
    successCriteria: string | null;
  },
  updates: {
    problem?: string | null | undefined;
    successCriteria?: string | null | undefined;
  }
): void {
  // 只有 CONFIRMED 及以上状态才需要完整性检查
  if (
    currentCard.status !== 'NEEDS_CLARIFICATION' &&
    (currentCard.status === 'CONFIRMED' ||
     currentCard.status === 'IN_PROGRESS' ||
     currentCard.status === 'DONE')
  ) {
    // 检查是否试图清空核心字段
    const errors: string[] = [];

    // Check if problem is being cleared (set to empty string or null)
    if (updates.problem !== undefined) {
      if (updates.problem === '' || updates.problem === null) {
        if (currentCard.problem && currentCard.problem.trim() !== '') {
          errors.push('problem');
        }
      }
    }

    // Check if successCriteria is being cleared
    if (updates.successCriteria !== undefined) {
      if (updates.successCriteria === '' || updates.successCriteria === null) {
        if (currentCard.successCriteria && currentCard.successCriteria.trim() !== '') {
          errors.push('successCriteria');
        }
      }
    }

    if (errors.length > 0) {
      throw new AppError(
        `Cannot clear required fields (${errors.join(', ')}) for card in status "${currentCard.status}".`,
        409,
        'CONFLICT',
        {
          message: 'Core fields cannot be cleared once card is confirmed',
          fields: errors,
        }
      );
    }
  }
}
