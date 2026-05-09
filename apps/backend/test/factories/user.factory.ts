import { Profile } from '../../src/users/entities/profile.entity';
import { User } from '../../src/users/entities/user.entity';

export function buildProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    avatarUrl: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  } as Profile;
}

export function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    email: 'test@example.com',
    password: 'hashed-password',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    profile: buildProfile(),
    posts: [],
    ...overrides,
  } as User;
}
