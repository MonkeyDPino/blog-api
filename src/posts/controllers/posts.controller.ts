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
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
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

  @ApiOperation({ summary: 'Get all blog posts' })
  @ApiResponse({
    status: 200,
    description: 'List of blog posts',
    type: [PostEntity],
  })
  @Get()
  findAll() {
    return this.postsService.findAll();
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
  @ApiResponse({ status: 404, description: 'Post not found' })
  @UseGuards(AuthGuard('jwt'))
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.postsService.update(id, updatePostDto);
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

  @ApiJwtAuth()
  @ApiOperation({ summary: 'Delete a blog post' })
  @ApiParam({ name: 'id', type: Number, description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'Post deleted' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.remove(id);
  }
}
