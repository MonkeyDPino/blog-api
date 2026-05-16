export interface IPaginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  error?: string;
}

export interface AiImproveResponse {
  improved: string;
}

export interface AiSuggestCategoriesResponse {
  suggestions: string[];
}
