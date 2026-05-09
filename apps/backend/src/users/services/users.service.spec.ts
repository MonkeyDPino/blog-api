import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from '../entities/user.entity';
import { buildUser, buildProfile } from '../../../test/factories';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    find: jest.Mock;
    merge: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            merge: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('REQ-2.1: returns all users with profiles', async () => {
      const users = [
        buildUser(),
        buildUser({ id: 2, email: 'other@example.com' }),
      ];
      userRepository.find.mockResolvedValue(users);
      const result = await service.findAll();
      expect(result).toEqual(users);
      expect(userRepository.find).toHaveBeenCalledWith({
        relations: ['profile'],
      });
    });
  });

  describe('getUserById', () => {
    it('REQ-2.2: returns user when found', async () => {
      const user = buildUser();
      userRepository.findOne.mockResolvedValue(user);
      const result = await service.getUserById(1);
      expect(result).toEqual(user);
    });

    it('REQ-2.3: throws NotFoundException when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);
      await expect(service.getUserById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserByEmail', () => {
    it('REQ-2.4: returns user when email matches', async () => {
      const user = buildUser();
      userRepository.findOne.mockResolvedValue(user);
      const result = await service.getUserByEmail('test@example.com');
      expect(result).toEqual(user);
    });

    it('REQ-2.4b: returns null when email not found', async () => {
      userRepository.findOne.mockResolvedValue(null);
      const result = await service.getUserByEmail('nobody@example.com');
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('REQ-2.5: creates and returns the new user', async () => {
      const createDto = {
        email: 'new@example.com',
        password: 'secret',
        profile: { firstName: 'Jane', lastName: 'Smith' },
      };
      const createdUser = buildUser({ id: 2, email: 'new@example.com' });
      userRepository.create.mockReturnValue(createdUser);
      userRepository.save.mockResolvedValue(createdUser);
      userRepository.findOne.mockResolvedValue(createdUser);

      const result = await service.create(createDto as any);

      expect(userRepository.create).toHaveBeenCalledWith(createDto);
      expect(userRepository.save).toHaveBeenCalledWith(createdUser);
      expect(result).toEqual(createdUser);
    });
  });

  describe('update', () => {
    it('REQ-2.6: updates user when requester owns the account', async () => {
      const user = buildUser({ id: 1 });
      const updatedUser = buildUser({ id: 1, email: 'updated@example.com' });
      userRepository.findOne.mockResolvedValue(user);
      userRepository.merge.mockReturnValue(updatedUser);
      userRepository.save.mockResolvedValue(updatedUser);

      const result = await service.update(
        1,
        { email: 'updated@example.com' } as any,
        1,
      );
      expect(result).toEqual(updatedUser);
      expect(userRepository.merge).toHaveBeenCalledWith(user, {
        email: 'updated@example.com',
      });
    });

    it('REQ-2.7: throws ForbiddenException when requester does not own the account', async () => {
      const user = buildUser({ id: 1 });
      userRepository.findOne.mockResolvedValue(user);

      await expect(
        service.update(1, { email: 'hacked@example.com' } as any, 99),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('delete', () => {
    it('REQ-2.8: deletes user when requester owns the account', async () => {
      const user = buildUser({ id: 1 });
      userRepository.findOne.mockResolvedValue(user);
      userRepository.remove.mockResolvedValue(user);

      const result = await service.delete(1, 1);
      expect(result).toEqual({
        message: 'User with id 1 deleted successfully',
      });
      expect(userRepository.remove).toHaveBeenCalledWith(user);
    });

    it('REQ-2.9: throws ForbiddenException when requester does not own the account', async () => {
      const user = buildUser({ id: 1 });
      userRepository.findOne.mockResolvedValue(user);

      await expect(service.delete(1, 99)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getUserProfile', () => {
    it('returns the profile of the user', async () => {
      const profile = buildProfile({ id: 1, firstName: 'Jane' });
      const user = buildUser({ id: 1, profile });
      userRepository.findOne.mockResolvedValue(user);

      const result = await service.getUserProfile(1);

      expect(result).toEqual(profile);
    });

    it('throws NotFoundException when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);
      await expect(service.getUserProfile(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getUserPosts', () => {
    it('returns the posts of the user', async () => {
      const user = buildUser({ id: 1, posts: [] });
      userRepository.findOne.mockResolvedValue(user);

      const result = await service.getUserPosts(1);

      expect(result).toEqual([]);
    });

    it('throws NotFoundException when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);
      await expect(service.getUserPosts(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
