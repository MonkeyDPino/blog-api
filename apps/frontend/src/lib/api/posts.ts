import type { IPaginated, IPost } from '@blog/types';
import { apiClient } from './client';

export const postsApi = {
  getAll: (page = 1, limit = 12) =>
    apiClient<IPaginated<IPost>>(`/posts?page=${page}&limit=${limit}`),

  getOne: (id: number) => apiClient<IPost>(`/posts/${id}`),

  search: (q: string, page = 1, limit = 12) =>
    apiClient<IPaginated<IPost>>(
      `/posts/search?q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`,
    ),

  create: (data: Partial<IPost> & { title: string; categoryIds?: number[] }) =>
    apiClient<IPost>('/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<IPost> & { categoryIds?: number[] }) =>
    apiClient<IPost>(`/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) => apiClient<void>(`/posts/${id}`, { method: 'DELETE' }),

  publish: (id: number) =>
    apiClient<IPost>(`/posts/${id}/publish`, { method: 'PATCH' }),

  suggestCategories: (id: number) =>
    apiClient<{ suggestions: string[] }>(`/posts/${id}/suggest-categories`, {
      method: 'POST',
    }),
};
