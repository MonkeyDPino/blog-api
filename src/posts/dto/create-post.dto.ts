import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePostDto {
  @ApiProperty({ description: 'Title of the post' })
  @IsNotEmpty({ message: 'El título es obligatorio' })
  @IsString({ message: 'El título debe ser una cadena de texto' })
  title!: string;

  @ApiProperty({ description: 'Content of the post' })
  @IsOptional()
  @IsString({ message: 'El contenido debe ser una cadena de texto' })
  content!: string;

  @ApiProperty({ description: 'Cover image URL of the post' })
  @IsOptional()
  @IsString({ message: 'La imagen de portada debe ser una cadena de texto' })
  coverImage!: string;

  @ApiProperty({ description: 'Summary of the post' })
  @IsOptional()
  @IsString({ message: 'El resumen debe ser una cadena de texto' })
  summary!: string;

  @ApiPropertyOptional({ description: 'Whether the post is a draft' })
  @IsOptional()
  @IsBoolean({ message: 'El estado de borrador debe ser booleano' })
  isDraft?: boolean;
}
