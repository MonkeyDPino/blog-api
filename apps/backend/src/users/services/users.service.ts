import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { Profile } from '../entities/profile.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private async findOne(id: number, getPosts: boolean = false): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['profile'].concat(getPosts ? ['posts'] : []),
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({ relations: ['profile'] });
  }

  async getUserById(id: number): Promise<User> {
    return this.findOne(id);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email },
    });
    return user;
  }

  async create(userData: CreateUserDto): Promise<User> {
    const newUser = this.userRepository.create(userData);
    const CreatedUser = await this.userRepository.save(newUser);
    return this.findOne(CreatedUser.id);
  }

  async update(id: number, userData: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    const updatedUser = this.userRepository.merge(user, userData);
    const result = await this.userRepository.save(updatedUser);
    return result;
  }

  async delete(id: number): Promise<{ message: string }> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
    return { message: `User with id ${id} deleted successfully` };
  }

  async getUserProfile(id: number): Promise<Profile> {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user.profile;
  }

  async getUserPosts(id: number) {
    const user = await this.findOne(id, true);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user.posts;
  }
}
