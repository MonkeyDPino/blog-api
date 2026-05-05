import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity({
  name: 'profiles',
})
export class Profile {
  @ApiProperty({ description: 'Unique identifier of the profile', example: 1 })
  @PrimaryGeneratedColumn()
  id!: number;

  @ApiProperty({ description: 'First name of the user', example: 'Juan' })
  @Column({ type: 'varchar', length: 255, name: 'first_name' })
  firstName!: string;

  @ApiProperty({ description: 'Last name of the user', example: 'Pino' })
  @Column({ type: 'varchar', length: 255, name: 'last_name' })
  lastName!: string;

  @ApiProperty({
    description: 'Avatar URL of the user',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'avatar_url' })
  avatarUrl!: string;

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
}
