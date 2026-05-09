import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from '../entities/post.entity';
import { Category } from '../entities/category.entity';
import { User } from '../../users/entities/user.entity';
import { Repository } from 'typeorm';
import { GeminiService } from '../../ai/services/gemini.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly geminiService: GeminiService,
  ) {}

  private async syncSearchVector(
    post: Pick<Post, 'id' | 'title' | 'content'>,
  ): Promise<void> {
    await this.postRepository.query(
      `UPDATE posts SET search_vector = to_tsvector('english', coalesce($1, '') || ' ' || coalesce($2, '')) WHERE id = $3`,
      [post.title, post.content, post.id],
    );
  }

  private async findOne(id: number): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ['author.profile', 'categories'],
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    return post;
  }

  async create(createPostDto: CreatePostDto, authorId: number): Promise<Post> {
    const { categoryIds, ...postData } = createPostDto;
    const newPost = await this.postRepository.save({
      ...postData,
      author: { id: authorId } as User,
      categories: (categoryIds ?? []).map((id) => ({ id }) as Category),
    });
    const post = await this.findOne(newPost.id);
    await this.syncSearchVector(post);
    return post;
  }

  async findAll(): Promise<Post[]> {
    return this.postRepository.find({
      relations: ['author.profile', 'categories'],
    });
  }

  async findByCategory(categoryId: number): Promise<Post[]> {
    return this.postRepository.find({
      where: { categories: { id: categoryId } },
      relations: ['author.profile', 'categories'],
    });
  }

  async getPostById(id: number): Promise<Post> {
    return this.findOne(id);
  }

  async update(
    id: number,
    updatePostDto: UpdatePostDto,
    requestingUserId: number,
  ): Promise<Post> {
    const post = await this.findOne(id);
    if (post.author.id !== requestingUserId) {
      throw new ForbiddenException('You do not own this post');
    }
    const { categoryIds, ...postData } = updatePostDto;
    if (categoryIds) {
      post.categories = categoryIds.map((id) => ({ id }) as Category);
    }
    const updatedPost = this.postRepository.merge(post, postData);
    const saved = await this.postRepository.save(updatedPost);
    await this.syncSearchVector(saved);
    return saved;
  }

  async remove(
    id: number,
    requestingUserId: number,
  ): Promise<{ message: string }> {
    const post = await this.findOne(id);
    if (post.author.id !== requestingUserId) {
      throw new ForbiddenException('You do not own this post');
    }
    await this.postRepository.remove(post);
    return { message: `Post with id ${id} deleted successfully` };
  }

  async publish(postId: number, userId: number): Promise<Post> {
    const post = await this.findOne(postId);

    if (post.author.id !== userId) {
      throw new ForbiddenException('You do not own this post');
    }

    if (!post.content?.trim()) {
      throw new BadRequestException('Post must have content before publishing');
    }

    if (!post.categories?.length) {
      throw new BadRequestException(
        'Post must have at least one category before publishing',
      );
    }

    const summary = await this.geminiService.generateSummary(post.content);

    const saved = await this.postRepository.save({
      ...post,
      summary: summary.slice(0, 255),
      isDraft: false,
    });
    await this.syncSearchVector(saved);
    return saved;
  }

  async suggestCategories(
    postId: number,
    userId: number,
  ): Promise<{ suggestions: string[] }> {
    const post = await this.findOne(postId);
    if (post.author.id !== userId) {
      throw new ForbiddenException('You do not own this post');
    }
    const categories = await this.categoryRepository.find();
    const availableCategories = categories.map((c) => c.name);
    const suggestions = await this.geminiService.suggestCategories(
      post.content ?? '',
      availableCategories,
    );
    return { suggestions };
  }

  async search(q: string): Promise<Post[]> {
    if (!q?.trim()) return [];
    const tsquery = q
      .trim()
      .split(/\s+/)
      .map((w) => `${w}:*`)
      .join(' & ');
    return this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('author.profile', 'profile')
      .leftJoinAndSelect('post.categories', 'categories')
      .where(`post.search_vector @@ to_tsquery('english', :tsquery)`, {
        tsquery,
      })
      .orderBy(
        `ts_rank(post.search_vector, to_tsquery('english', :tsquery))`,
        'DESC',
      )
      .getMany();
  }
}
