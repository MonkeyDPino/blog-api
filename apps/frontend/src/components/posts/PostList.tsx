import type { IPost } from '@blog/types';
import { PostCard } from './PostCard';

interface PostListProps {
  posts: IPost[];
}

export function PostList({ posts }: PostListProps) {
  if (posts.length === 0) {
    return <p className="py-12 text-center text-muted">No posts found.</p>;
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
