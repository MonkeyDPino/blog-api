import type { IUser } from './user.interface';

export interface ICategory {
  id: number;
  name: string;
  description: string | null;
  coverImage: string | null;
}

export interface IPost {
  id: number;
  title: string;
  content: string | null;
  coverImage: string | null;
  summary: string | null;
  isDraft: boolean;
  author: Pick<IUser, 'id' | 'email'>;
  categories: ICategory[];
  createdAt: Date;
  updatedAt: Date;
}
