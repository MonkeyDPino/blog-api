import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { Category } from './category.entity';

@Entity({
  name: 'posts',
})
export class Post {
  @ApiProperty({ description: 'Unique identifier of the post', example: 1 })
  @PrimaryGeneratedColumn()
  id!: number;

  @ApiProperty({
    description: 'Title of the post',
    example: 'My first blog post',
  })
  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @ApiProperty({
    description: 'Full content of the post',
    example: 'Lorem ipsum...',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  content!: string;

  @ApiProperty({
    description: 'Cover image URL of the post',
    example: 'https://example.com/cover.jpg',
    required: false,
  })
  @Column({ type: 'varchar', length: 800, name: 'cover_image', nullable: true })
  coverImage!: string;

  @ApiProperty({
    description: 'AI-generated summary of the post',
    example: 'A short summary...',
    required: false,
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  summary!: string;

  @ApiProperty({ description: 'Whether the post is a draft', example: true })
  @Column({ type: 'boolean', default: true, name: 'is_draft' })
  isDraft!: boolean;

  @ApiHideProperty()
  @ManyToOne(() => User, (user) => user.posts, { nullable: false })
  @JoinColumn({ name: 'author_id' })
  author!: User;

  @ApiProperty({
    description: 'Categories associated with the post',
    type: () => [Category],
  })
  @ManyToMany(() => Category, (category) => category.posts)
  @JoinTable({
    name: 'posts_categories',
    joinColumn: { name: 'post_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'category_id', referencedColumnName: 'id' },
  })
  categories!: Category[];

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
