import {
  PrimaryGeneratedColumn,
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
} from 'typeorm';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Post } from './post.entity';

@Entity({
  name: 'categories',
})
export class Category {
  @ApiProperty({ description: 'Unique identifier of the category', example: 1 })
  @PrimaryGeneratedColumn()
  id!: number;

  @ApiProperty({ description: 'Name of the category', example: 'Technology' })
  @Column({ type: 'varchar', length: 255, unique: true })
  name!: string;

  @ApiProperty({
    description: 'Description of the category',
    example: 'Tech-related posts',
    required: false,
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  description!: string;

  @ApiProperty({
    description: 'Cover image URL of the category',
    example: 'https://example.com/image.jpg',
    required: false,
  })
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'cover_image' })
  coverImage!: string;

  @ApiHideProperty()
  @ManyToMany(() => Post, (post) => post.categories)
  posts!: Post[];

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createAt!: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  @UpdateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updateAt!: Date;
}
