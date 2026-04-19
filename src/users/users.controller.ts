import { UsersService } from './users.service';
import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Delete,
  Put,
} from '@nestjs/common';
import { CreateUserDto, UpdateUserDto } from './user.dto';
import { type User } from './user.model';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  getUsers(): User[] {
    return this.usersService.findAll();
  }

  @Get(':id')
  getUser(@Param('id') id: string): User | undefined {
    return this.usersService.findOne(parseInt(id));
  }

  @Post()
  createUser(@Body() userData: CreateUserDto): User {
    return this.usersService.create(userData);
  }

  @Delete(':id')
  deleteUser(@Param('id') id: string): { message: string } {
    return this.usersService.delete(parseInt(id))
      ? { message: `User with id ${id} deleted successfully` }
      : { message: `User with id ${id} not found` };
  }

  @Put(':id')
  updateUser(
    @Param('id') id: string,
    @Body() userData: UpdateUserDto,
  ): User | undefined {
    return this.usersService.update(parseInt(id), userData);
  }
}
