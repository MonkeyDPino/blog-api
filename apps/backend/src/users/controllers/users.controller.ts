import { UsersService } from '../services/users.service';
import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Delete,
  Put,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiJwtAuth } from '../../common/decorators/api-jwt-auth.decorator';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { type Request } from 'express';
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto';
import { User } from '../entities/user.entity';
import { Profile } from '../entities/profile.entity';
import { Post as PostEntity } from '../../posts/entities/post.entity';
import { Payload } from '../../auth/models/payload.model';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @ApiJwtAuth()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'List of users', type: [User] })
  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getUsers(): Promise<User[]> {
    return await this.usersService.findAll();
  }

  @ApiJwtAuth()
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User found', type: User })
  @ApiResponse({ status: 404, description: 'User not found' })
  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async getUser(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return await this.usersService.getUserById(id);
  }

  @ApiJwtAuth()
  @ApiOperation({ summary: "Get a user's profile" })
  @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User profile', type: Profile })
  @ApiResponse({ status: 404, description: 'User not found' })
  @UseGuards(AuthGuard('jwt'))
  @Get(':id/profile')
  async getUserProfile(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Profile> {
    return await this.usersService.getUserProfile(id);
  }

  @ApiOperation({ summary: 'Get all posts by a user' })
  @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'List of posts by the user',
    type: [PostEntity],
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Get(':id/posts')
  async getUserPosts(@Param('id', ParseIntPipe) id: number) {
    return await this.usersService.getUserPosts(id);
  }

  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created', type: User })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post()
  async createUser(@Body() userData: CreateUserDto): Promise<User> {
    return await this.usersService.create(userData);
  }

  @ApiJwtAuth()
  @ApiOperation({ summary: 'Delete a user' })
  @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User deleted' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — can only delete own account',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async deleteUser(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    const requestingUserId = (req.user as Payload).sub;
    return await this.usersService.delete(id, requestingUserId);
  }

  @ApiJwtAuth()
  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User updated', type: User })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — can only update own account',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @UseGuards(AuthGuard('jwt'))
  @Put(':id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() userData: UpdateUserDto,
    @Req() req: Request,
  ): Promise<User> {
    const requestingUserId = (req.user as Payload).sub;
    return await this.usersService.update(id, userData, requestingUserId);
  }
}
