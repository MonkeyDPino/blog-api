import { UsersService } from './users.service';
import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Delete,
  Put,
  ParseIntPipe,
} from '@nestjs/common';
import { CreateUserDto, UpdateUserDto } from './dtos/user.dto';
import { User } from './entities/user.entity';
import { Profile } from './entities/profile.entity';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  async getUsers(): Promise<User[]> {
    return await this.usersService.findAll();
  }

  @Get(':id')
  async getUser(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return await this.usersService.getUserById(id);
  }

  @Get(':id/profile')
  async getUserProfile(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Profile> {
    return await this.usersService.getUserProfile(id);
  }

  @Post()
  async createUser(@Body() userData: CreateUserDto): Promise<User> {
    return await this.usersService.create(userData);
  }

  @Delete(':id')
  async deleteUser(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    return await this.usersService.delete(id);
  }

  @Put(':id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() userData: UpdateUserDto,
  ): Promise<User> {
    return await this.usersService.update(id, userData);
  }
}
