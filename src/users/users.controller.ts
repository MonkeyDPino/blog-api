import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Delete,
  Put,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';

interface User {
  id: number;
  name: string;
  email: string;
}

@Controller('users')
export class UsersController {
  private users: User[] = [
    { id: 1, name: 'John Doe', email: 'example@gmail.com' },
    { id: 2, name: 'Jane Doe', email: 'example2@gmail.com' },
  ];

  @Get()
  getUsers(): User[] {
    return this.users;
  }

  @Get(':id')
  getUser(@Param('id') id: string): User | undefined {
    const user = this.users.find((user) => user.id === parseInt(id));
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  @Post()
  createUser(@Body() userData: Omit<User, 'id'>): User {
    const email = userData.email;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new UnprocessableEntityException(`Invalid email format: ${email}`);
    }
    const newUser: User = {
      id: this.users.length + 1,
      ...userData,
    };
    this.users.push(newUser);
    return newUser;
  }

  @Delete(':id')
  deleteUser(@Param('id') id: string): { message: string } {
    const userIndex = this.users.findIndex((user) => user.id === parseInt(id));
    if (userIndex === -1) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    this.users.splice(userIndex, 1);
    return { message: `User with id ${id} deleted successfully` };
  }

  @Put(':id')
  updateUser(
    @Param('id') id: string,
    @Body() userData: Partial<Omit<User, 'id'>>,
  ): User | undefined {
    const userIndex = this.users.findIndex((user) => user.id === parseInt(id));
    if (userIndex === -1) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    this.users[userIndex] = {
      id: this.users[userIndex]['id'],
      name: userData.name || this.users[userIndex].name,
      email: userData.email || this.users[userIndex].email,
    };
    return this.users[userIndex];
  }
}
