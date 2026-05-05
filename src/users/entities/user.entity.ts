import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { Profile } from './profile.entity';
import { Post } from '../../posts/entities/post.entity';

@Entity({
  name: 'users',
})
export class User {
  @ApiProperty({ description: 'Unique identifier of the user', example: 1 })
  @PrimaryGeneratedColumn()
  id!: number;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'user@example.com',
  })
  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @ApiHideProperty()
  @Exclude()
  @Column({ type: 'varchar', length: 255 })
  password!: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  @CreateDateColumn({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'created_at',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  @UpdateDateColumn({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'updated_at',
  })
  updatedAt!: Date;

  @ApiHideProperty()
  @OneToMany(() => Post, (post) => post.author)
  posts!: Post[];

  @ApiProperty({
    description: 'Profile information of the user',
    type: () => Profile,
  })
  @OneToOne(() => Profile, {
    cascade: true,
    nullable: false,
  })
  @JoinColumn({ name: 'profile_id' })
  profile!: Profile;

  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 10);
  }
}
