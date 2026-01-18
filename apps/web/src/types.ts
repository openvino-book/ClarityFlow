// Card status enum
export type CardStatus =
  | 'NEEDS_CLARIFICATION'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'DONE';

// Core Card interface - mirrors backend
export interface Card {
  id: string;
  title: string;
  problem: string;
  successCriteria: string;
  outOfScope: string | null;
  stakeholders: string | null;
  risks: string | null;
  status: CardStatus;
  dueDate: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// API Response types
export interface PaginatedResponse<T> {
  items?: T[];
  cards?: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// API Error type
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// Create card request
export interface CreateCardRequest {
  title: string;
}

// List cards query params
export interface ListCardsQuery {
  status?: CardStatus;
  q?: string;
  page?: number;
  pageSize?: number;
}

// Update card request
export interface UpdateCardRequest {
  version: number;
  title?: string;
  problem?: string;
  successCriteria?: string;
  outOfScope?: string;
  stakeholders?: string;
  risks?: string;
  dueDate?: string;
}
