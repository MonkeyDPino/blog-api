import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../../users/services/users.service';
import { RefreshToken } from '../entities/refresh-token.entity';
import { buildUser } from '../../../test/factories';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn().mockResolvedValue('hashed-value'),
}));

import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: { getUserByEmail: jest.Mock; getUserById: jest.Mock };
  let jwtService: { sign: jest.Mock };
  let refreshTokenRepo: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    delete: jest.Mock;
  };
  const mockCompare = bcrypt.compare as jest.Mock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            getUserByEmail: jest.fn(),
            getUserById: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('mock-token') },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('mock-value') },
        },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    refreshTokenRepo = module.get(getRepositoryToken(RefreshToken));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('REQ-1.1: throws UnauthorizedException when user not found', async () => {
      usersService.getUserByEmail.mockResolvedValue(null);
      await expect(
        service.validateUser('noone@example.com', 'pass'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('REQ-1.2: throws UnauthorizedException when password is wrong', async () => {
      const user = buildUser();
      usersService.getUserByEmail.mockResolvedValue(user);
      mockCompare.mockResolvedValue(false);
      await expect(
        service.validateUser('test@example.com', 'wrong-pass'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('REQ-1.3: returns user when credentials are valid', async () => {
      const user = buildUser();
      usersService.getUserByEmail.mockResolvedValue(user);
      mockCompare.mockResolvedValue(true);
      const result = await service.validateUser(
        'test@example.com',
        'correct-pass',
      );
      expect(result).toEqual(user);
    });
  });

  describe('login', () => {
    it('REQ-1.4: returns accessToken, refreshToken and user', async () => {
      const user = buildUser();
      const fakeTokenEntity = {
        tokenId: 'fake-uuid',
        tokenHash: 'fake-hash',
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };
      refreshTokenRepo.create.mockReturnValue(fakeTokenEntity);
      refreshTokenRepo.save.mockResolvedValue(fakeTokenEntity);

      const result = await service.login(user);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user', user);
      expect(jwtService.sign).toHaveBeenCalled();
    });
  });

  describe('refreshTokens', () => {
    it('REQ-1.5: throws UnauthorizedException when refresh token not found', async () => {
      refreshTokenRepo.findOne.mockResolvedValue(null);
      await expect(
        service.refreshTokens({ tokenId: 'bad-id', tokenValue: 'bad-value' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('REQ-1.6: throws UnauthorizedException when refresh token is expired', async () => {
      const user = buildUser();
      refreshTokenRepo.findOne.mockResolvedValue({
        tokenId: 'some-id',
        tokenHash: 'some-hash',
        userId: user.id,
        user,
        expiresAt: new Date(Date.now() - 1000),
      });
      await expect(
        service.refreshTokens({ tokenId: 'some-id', tokenValue: 'some-value' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('REQ-1.7: throws UnauthorizedException when token value does not match hash', async () => {
      const user = buildUser();
      refreshTokenRepo.findOne.mockResolvedValue({
        tokenId: 'some-id',
        tokenHash: 'some-hash',
        userId: user.id,
        user,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      mockCompare.mockResolvedValue(false);
      await expect(
        service.refreshTokens({
          tokenId: 'some-id',
          tokenValue: 'wrong-value',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('REQ-1.8: returns new accessToken and refreshToken on valid input', async () => {
      const user = buildUser();
      const existingToken = {
        tokenId: 'valid-id',
        tokenHash: 'valid-hash',
        userId: user.id,
        user,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };
      refreshTokenRepo.findOne.mockResolvedValue(existingToken);
      mockCompare.mockResolvedValue(true);
      refreshTokenRepo.delete.mockResolvedValue({ affected: 1 });
      const newTokenEntity = {
        tokenId: 'new-uuid',
        tokenHash: 'new-hash',
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };
      refreshTokenRepo.create.mockReturnValue(newTokenEntity);
      refreshTokenRepo.save.mockResolvedValue(newTokenEntity);

      const result = await service.refreshTokens({
        tokenId: 'valid-id',
        tokenValue: 'valid-value',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(refreshTokenRepo.delete).toHaveBeenCalledWith({
        tokenId: 'valid-id',
      });
    });
  });

  describe('logout', () => {
    it('REQ-1.9: does nothing when token not found', async () => {
      refreshTokenRepo.findOne.mockResolvedValue(null);
      await expect(
        service.logout({ tokenId: 'missing-id', tokenValue: 'value' }),
      ).resolves.toBeUndefined();
      expect(refreshTokenRepo.delete).not.toHaveBeenCalled();
    });

    it('REQ-1.10: does not delete token when value does not match hash', async () => {
      refreshTokenRepo.findOne.mockResolvedValue({
        tokenId: 'some-id',
        tokenHash: 'some-hash',
      });
      mockCompare.mockResolvedValue(false);
      await service.logout({ tokenId: 'some-id', tokenValue: 'wrong-value' });
      expect(refreshTokenRepo.delete).not.toHaveBeenCalled();
    });

    it('REQ-1.11: deletes token when value matches hash', async () => {
      refreshTokenRepo.findOne.mockResolvedValue({
        tokenId: 'some-id',
        tokenHash: 'some-hash',
      });
      mockCompare.mockResolvedValue(true);
      refreshTokenRepo.delete.mockResolvedValue({ affected: 1 });
      await service.logout({ tokenId: 'some-id', tokenValue: 'correct-value' });
      expect(refreshTokenRepo.delete).toHaveBeenCalledWith({
        tokenId: 'some-id',
      });
    });
  });
});
