import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateProfileDto {
  @ApiProperty({ description: 'First name of the user' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  firstName!: string;

  @ApiProperty({ description: 'Last name of the user' })
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  @IsString({ message: 'El apellido debe ser una cadena de texto' })
  lastName!: string;

  @ApiProperty({ description: 'Avatar URL of the user', required: false })
  @IsString({ message: 'La URL del avatar debe ser una cadena de texto' })
  @IsUrl({}, { message: 'La URL del avatar no es válida' })
  @IsOptional()
  avatarUrl?: string;
}

export class UpdateProfileDto extends PartialType(CreateProfileDto) {}
