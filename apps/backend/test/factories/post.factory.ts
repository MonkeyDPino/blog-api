import { Post } from '../../src/posts/entities/post.entity';
import { buildUser } from './user.factory';

export function buildPost(overrides: Partial<Post> = {}): Post {
  return {
    id: 1,
    title: 'Test Post',
    content: 'Some content',
    coverImage: null,
    summary: null,
    isDraft: true,
    author: buildUser(),
    categories: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  } as Post;
}
