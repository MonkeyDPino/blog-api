import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { Post } from '../entities/post.entity';
import { Category } from '../entities/category.entity';
import { GeminiService } from '../../ai/services/gemini.service';
import { buildPost, buildUser } from '../../../test/factories';

describe('PostsService', () => {
  let service: PostsService;
  let postRepository: {
    findOne: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findAndCount: jest.Mock;
    merge: jest.Mock;
    remove: jest.Mock;
    query: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let categoryRepository: { find: jest.Mock };
  let geminiService: {
    generateSummary: jest.Mock;
    suggestCategories: jest.Mock;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: getRepositoryToken(Post),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findAndCount: jest.fn(),
            merge: jest.fn(),
            remove: jest.fn(),
            query: jest.fn().mockResolvedValue(undefined),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Category),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: GeminiService,
          useValue: {
            generateSummary: jest.fn(),
            suggestCategories: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    postRepository = module.get(getRepositoryToken(Post));
    categoryRepository = module.get(getRepositoryToken(Category));
    geminiService = module.get(GeminiService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('REQ-3.1: returns paginated published posts with author and categories', async () => {
      const posts = [buildPost(), buildPost({ id: 2, title: 'Second Post' })];
      postRepository.findAndCount.mockResolvedValue([posts, 2]);
      const result = await service.findAll(1, 12);
      expect(result).toEqual({
        data: posts,
        total: 2,
        page: 1,
        limit: 12,
        totalPages: 1,
      });
      expect(postRepository.findAndCount).toHaveBeenCalledWith({
        where: { isDraft: false },
        relations: ['author.profile', 'categories'],
        skip: 0,
        take: 12,
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('getPostById', () => {
    it('REQ-3.2: returns post when found', async () => {
      const post = buildPost();
      postRepository.findOne.mockResolvedValue(post);
      const result = await service.getPostById(1);
      expect(result).toEqual(post);
    });

    it('REQ-3.3: throws NotFoundException when post not found', async () => {
      postRepository.findOne.mockResolvedValue(null);
      await expect(service.getPostById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('REQ-3.4: creates and returns the new post', async () => {
      const author = buildUser({ id: 1 });
      const createDto = {
        title: 'New Post',
        content: 'Post content',
        categoryIds: [],
      };
      const savedPost = buildPost({ id: 2, title: 'New Post' });
      postRepository.save.mockResolvedValueOnce({ id: 2 });
      postRepository.findOne.mockResolvedValue(savedPost);

      const result = await service.create(createDto as any, author.id);

      expect(postRepository.save).toHaveBeenCalledWith({
        title: 'New Post',
        content: 'Post content',
        author: { id: author.id },
        categories: [],
      });
      expect(result).toEqual(savedPost);
    });
  });

  describe('update', () => {
    it('REQ-3.5: updates post when requester is the author', async () => {
      const author = buildUser({ id: 1 });
      const post = buildPost({ id: 1, author });
      const updatedPost = buildPost({ id: 1, title: 'Updated Title', author });
      postRepository.findOne.mockResolvedValue(post);
      postRepository.merge.mockReturnValue(updatedPost);
      postRepository.save.mockResolvedValue(updatedPost);

      const result = await service.update(
        1,
        { title: 'Updated Title' } as any,
        1,
      );
      expect(result).toEqual(updatedPost);
    });

    it('REQ-3.6: throws ForbiddenException when requester is not the author', async () => {
      const author = buildUser({ id: 1 });
      const post = buildPost({ id: 1, author });
      postRepository.findOne.mockResolvedValue(post);

      await expect(
        service.update(1, { title: 'Hacked' } as any, 99),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('REQ-3.7: removes post when requester is the author', async () => {
      const author = buildUser({ id: 1 });
      const post = buildPost({ id: 1, author });
      postRepository.findOne.mockResolvedValue(post);
      postRepository.remove.mockResolvedValue(post);

      const result = await service.remove(1, 1);
      expect(result).toEqual({
        message: 'Post with id 1 deleted successfully',
      });
      expect(postRepository.remove).toHaveBeenCalledWith(post);
    });

    it('REQ-3.8: throws ForbiddenException when requester is not the author', async () => {
      const author = buildUser({ id: 1 });
      const post = buildPost({ id: 1, author });
      postRepository.findOne.mockResolvedValue(post);

      await expect(service.remove(1, 99)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('publish', () => {
    it('REQ-3.9: throws ForbiddenException when requester is not the author', async () => {
      const author = buildUser({ id: 1 });
      const post = buildPost({
        id: 1,
        author,
        content: 'Some content',
        categories: [{ id: 1 } as any],
      });
      postRepository.findOne.mockResolvedValue(post);

      await expect(service.publish(1, 99)).rejects.toThrow(ForbiddenException);
    });

    it('REQ-3.10: throws BadRequestException when post has no content', async () => {
      const author = buildUser({ id: 1 });
      const post = buildPost({ id: 1, author, content: '   ', categories: [] });
      postRepository.findOne.mockResolvedValue(post);

      await expect(service.publish(1, 1)).rejects.toThrow(BadRequestException);
    });

    it('REQ-3.11: throws BadRequestException when post has no categories', async () => {
      const author = buildUser({ id: 1 });
      const post = buildPost({
        id: 1,
        author,
        content: 'Valid content',
        categories: [],
      });
      postRepository.findOne.mockResolvedValue(post);

      await expect(service.publish(1, 1)).rejects.toThrow(BadRequestException);
    });

    it('REQ-3.12: generates summary and publishes the post', async () => {
      const author = buildUser({ id: 1 });
      const post = buildPost({
        id: 1,
        author,
        content: 'This is valid content for the post',
        categories: [{ id: 1 } as any],
        isDraft: true,
      });
      const publishedPost = {
        ...post,
        isDraft: false,
        summary: 'A short summary',
      };
      postRepository.findOne.mockResolvedValue(post);
      geminiService.generateSummary.mockResolvedValue('A short summary');
      postRepository.save.mockResolvedValue(publishedPost);

      const result = await service.publish(1, 1);

      expect(geminiService.generateSummary).toHaveBeenCalledWith(post.content);
      expect(postRepository.save).toHaveBeenCalledWith({
        ...post,
        summary: 'A short summary',
        isDraft: false,
      });
      expect(result).toEqual(publishedPost);
    });

    it('REQ-3.13: truncates summary to 255 characters', async () => {
      const author = buildUser({ id: 1 });
      const longSummary = 'x'.repeat(300);
      const post = buildPost({
        id: 1,
        author,
        content: 'Content with a very long summary',
        categories: [{ id: 1 } as any],
        isDraft: true,
      });
      postRepository.findOne.mockResolvedValue(post);
      geminiService.generateSummary.mockResolvedValue(longSummary);
      const publishedPost = {
        ...post,
        isDraft: false,
        summary: longSummary.slice(0, 255),
      };
      postRepository.save.mockResolvedValue(publishedPost);

      const result = await service.publish(1, 1);

      expect(postRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ summary: longSummary.slice(0, 255) }),
      );
      expect(result.summary).toHaveLength(255);
    });
  });

  describe('search', () => {
    it('REQ-3.14: returns empty paginated result when query is empty', async () => {
      const result = await service.search('', 1, 12);
      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        limit: 12,
        totalPages: 0,
      });
    });

    it('REQ-3.15: returns empty paginated result when query is whitespace', async () => {
      const result = await service.search('   ', 1, 12);
      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        limit: 12,
        totalPages: 0,
      });
    });
  });

  describe('suggestCategories', () => {
    it('REQ-3.16: throws ForbiddenException when requester is not the author', async () => {
      const author = buildUser({ id: 1 });
      const post = buildPost({ id: 1, author });
      postRepository.findOne.mockResolvedValue(post);

      await expect(service.suggestCategories(1, 99)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('REQ-3.17: returns suggestions from GeminiService', async () => {
      const author = buildUser({ id: 1 });
      const post = buildPost({ id: 1, author, content: 'Some content' });
      postRepository.findOne.mockResolvedValue(post);
      categoryRepository.find.mockResolvedValue([
        { id: 1, name: 'Tech' },
        { id: 2, name: 'Science' },
      ]);
      geminiService.suggestCategories.mockResolvedValue(['Tech']);

      const result = await service.suggestCategories(1, 1);

      expect(result).toEqual({ suggestions: ['Tech'] });
    });
  });
});
