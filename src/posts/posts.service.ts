import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
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
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    return post;
  }

  async create(createPostDto: CreatePostDto): Promise<Post> {
    const newPost = await this.postRepository.save(createPostDto);
    return newPost;
  }

  async findAll(): Promise<Post[]> {
    return this.postRepository.find();
  }

  async getPostById(id: number): Promise<Post> {
    return this.findOne(id);
  }

  async update(id: number, updatePostDto: UpdatePostDto): Promise<Post> {
    const post = await this.findOne(id);
    const updatedPost = this.postRepository.merge(post, updatePostDto);
    const result = await this.postRepository.save(updatedPost);
    return result;
  }

  async remove(id: number): Promise<{ message: string }> {
    const post = await this.findOne(id);
    await this.postRepository.remove(post);
    return { message: `Post with id ${id} deleted successfully` };
  }
}
