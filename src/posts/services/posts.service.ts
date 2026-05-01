import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from '../entities/post.entity';
import { Category } from '../entities/category.entity';
import { User } from '../../users/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

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

  async create(createPostDto: CreatePostDto): Promise<Post> {
    const { authorId, categoryIds, ...postData } = createPostDto;
    const newPost = await this.postRepository.save({
      ...postData,
      author: { id: authorId } as User,
      categories: (categoryIds ?? []).map((id) => ({ id }) as Category),
    });
    return this.findOne(newPost.id);
  }

  async findAll(): Promise<Post[]> {
    return this.postRepository.find({
      relations: ['author.profile', 'categories'],
    });
  }

  async getPostById(id: number): Promise<Post> {
    return this.findOne(id);
  }

  async update(id: number, updatePostDto: UpdatePostDto): Promise<Post> {
    const post = await this.findOne(id);
    const { categoryIds, authorId, ...postData } = updatePostDto;
    if (categoryIds) {
      post.categories = categoryIds.map((id) => ({ id }) as Category);
    }
    if (authorId) {
      post.author = { id: authorId } as User;
    }
    const updatedPost = this.postRepository.merge(post, postData);
    return this.postRepository.save(updatedPost);
  }

  async remove(id: number): Promise<{ message: string }> {
    const post = await this.findOne(id);
    await this.postRepository.remove(post);
    return { message: `Post with id ${id} deleted successfully` };
  }
}
