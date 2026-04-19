import { Injectable, NotFoundException } from '@nestjs/common';
import { type User } from './user.model';
import { CreateUserDto, UpdateUserDto } from './user.dto';

@Injectable()
export class UsersService {
  private users: User[] = [
    { id: 1, name: 'John Doe', email: 'example@gmail.com' },
    { id: 2, name: 'Jane Doe', email: 'example2@gmail.com' },
  ];

  getUserById(id: number): number {
    const position = this.users.findIndex((user) => user.id === id);
    if (position === -1) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return position;
  }

  findAll(): User[] {
    return this.users;
  }

  findOne(id: number): User | undefined {
    const position = this.getUserById(id);
    return this.users[position];
  }

  create(userData: CreateUserDto): User {
    const newUser: User = {
      id: this.users.length + 1,
      ...userData,
    };
    this.users.push(newUser);
    return newUser;
  }

  delete(id: number): boolean {
    const userIndex = this.getUserById(id);
    this.users.splice(userIndex, 1);
    return true;
  }

  update(id: number, userData: UpdateUserDto): User | undefined {
    const userIndex = this.getUserById(id);
    this.users[userIndex] = {
      ...this.users[userIndex],
      ...userData,
    };
    return this.users[userIndex];
  }
}
