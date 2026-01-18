import axios from 'axios';
import type {
  Card,
  CreateCardRequest,
  ListCardsQuery,
  PaginatedResponse,
  ApiError,
  UpdateCardRequest,
} from '../types';

// Create axios instance with base URL
export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Card API endpoints
export const cardApi = {
  // List all cards with optional filters
  list: async (params?: ListCardsQuery) => {
    const response = await api.get<PaginatedResponse<Card>>('/cards', { params });
    return response.data;
  },

  // Get single card by ID
  get: async (id: string) => {
    const response = await api.get<Card>(`/cards/${id}`);
    return response.data;
  },

  // Create new card
  create: async (data: CreateCardRequest) => {
    const response = await api.post<Card>('/cards', data);
    return response.data;
  },

  // Update card (partial update supported)
  update: async (id: string, data: UpdateCardRequest) => {
    const response = await api.put<Card>(`/cards/${id}`, data);
    return response.data;
  },

  // Transition card status
  transition: async (id: string, status: string) => {
    const response = await api.post<Card>(`/cards/${id}/transition`, { status });
    return response.data;
  },

  // Soft delete card
  delete: async (id: string) => {
    await api.delete(`/cards/${id}`);
  },

  // Export card as Markdown
  export: async (id: string) => {
    const response = await api.get<string>(`/cards/${id}/export`, {
      headers: {
        Accept: 'text/markdown',
      },
      responseType: 'text',
    });
    return response.data as string;
  },
};

// Type guard for API errors
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    typeof (error as ApiError).error === 'object'
  );
}
