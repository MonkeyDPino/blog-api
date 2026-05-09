export interface IProfile {
  id: number;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUser {
  id: number;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  profile: IProfile;
}
