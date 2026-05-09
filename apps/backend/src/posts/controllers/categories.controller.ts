import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiJwtAuth } from '../../common/decorators/api-jwt-auth.decorator';
import { AuthGuard } from '@nestjs/passport';
import { CategoriesService } from '../services/categories.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { Category } from '../entities/category.entity';
import { PostsService } from '../services/posts.service';
import { Post as PostEntity } from '../entities/post.entity';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly postsService: PostsService,
  ) {}

  @ApiJwtAuth()
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({ status: 201, description: 'Category created', type: Category })
  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({
    status: 200,
    description: 'List of categories',
    type: [Category],
  })
  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @ApiOperation({ summary: 'Get a category by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Category found', type: Category })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.getCategoryById(id);
  }

  @ApiOperation({ summary: 'Get all posts belonging to a category' })
  @ApiParam({ name: 'id', type: Number, description: 'Category ID' })
  @ApiResponse({
    status: 200,
    description: 'List of posts in the category',
    type: [PostEntity],
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @Get(':id/posts')
  findPostsByCategory(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.findByCategory(id);
  }

  @ApiJwtAuth()
  @ApiOperation({ summary: 'Update a category' })
  @ApiParam({ name: 'id', type: Number, description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Category updated', type: Category })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @UseGuards(AuthGuard('jwt'))
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @ApiJwtAuth()
  @ApiOperation({ summary: 'Delete a category' })
  @ApiParam({ name: 'id', type: Number, description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Category deleted' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.remove(id);
  }
}
