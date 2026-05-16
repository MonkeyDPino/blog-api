import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Patch,
  ParseIntPipe,
  DefaultValuePipe,
  Query,
  UseGuards,
  Req,
  HttpCode,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { type Request } from 'express';
import { PostsService } from '../services/posts.service';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { Post as PostEntity } from '../entities/post.entity';
import { Payload } from '../../auth/models/payload.model';
import { ApiJwtAuth } from '../../common/decorators/api-jwt-auth.decorator';

@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @ApiJwtAuth()
  @ApiOperation({ summary: 'Create a new blog post' })
  @ApiResponse({ status: 201, description: 'Post created', type: PostEntity })
  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@Body() createPostDto: CreatePostDto, @Req() req: Request) {
    const user = req.user as Payload;
    return this.postsService.create(createPostDto, user.sub);
  }

  @ApiOperation({ summary: 'Get all published blog posts (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default 12)' })
  @ApiResponse({ status: 200, description: 'Paginated list of published posts' })
  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(12), ParseIntPipe) limit: number,
  ) {
    return this.postsService.findAll(page, limit);
  }

  @ApiOperation({ summary: 'Full-text search posts by keyword (paginated)' })
  @ApiQuery({ name: 'q', required: false, description: 'Search query' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default 12)' })
  @ApiResponse({ status: 200, description: 'Paginated search results ordered by relevance' })
  @Get('search')
  search(
    @Query('q') q: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(12), ParseIntPipe) limit: number,
  ) {
    return this.postsService.search(q, page, limit);
  }

  @ApiOperation({ summary: 'Get a blog post by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Post ID' })
  @ApiResponse({
    status: 200,
    description: 'Blog post found',
    type: PostEntity,
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.getPostById(id);
  }

  @ApiJwtAuth()
  @ApiOperation({ summary: 'Update a blog post' })
  @ApiParam({ name: 'id', type: Number, description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'Post updated', type: PostEntity })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — only the author can update',
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @UseGuards(AuthGuard('jwt'))
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePostDto: UpdatePostDto,
    @Req() req: Request,
  ) {
    const user = req.user as Payload;
    return this.postsService.update(id, updatePostDto, user.sub);
  }

  @ApiJwtAuth()
  @ApiOperation({ summary: 'Publish a blog post' })
  @ApiParam({ name: 'id', type: Number, description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'Post published', type: PostEntity })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — only the author can publish',
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/publish')
  publish(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const user = req.user as Payload;
    return this.postsService.publish(id, user.sub);
  }

  @Post(':id/suggest-categories')
  @HttpCode(200)
  @UseGuards(AuthGuard('jwt'))
  @ApiJwtAuth()
  @ApiOperation({ summary: 'Suggest categories for a post using AI' })
  @ApiResponse({
    status: 200,
    description: 'Returns AI-suggested category names',
  })
  @ApiResponse({ status: 403, description: 'Forbidden — not the post author' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  suggestCategories(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ): Promise<{ suggestions: string[] }> {
    return this.postsService.suggestCategories(id, (req.user as Payload).sub);
  }

  @ApiJwtAuth()
  @ApiOperation({ summary: 'Delete a blog post' })
  @ApiParam({ name: 'id', type: Number, description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'Post deleted' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — only the author can delete',
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const user = req.user as Payload;
    return this.postsService.remove(id, user.sub);
  }
}
