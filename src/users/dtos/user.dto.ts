import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { CreateProfileDto, UpdateProfileDto } from './profile.dto';

export class CreateUserDto {
  @ApiProperty({ description: 'Email of the user' })
  @IsNotEmpty({ message: 'El email es obligatorio' })
  @IsEmail({}, { message: 'Formato de correo no válido' })
  email!: string;

  @ApiProperty({ description: 'Password of the user' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password!: string;

  @ApiProperty({ description: 'Profile information of the user' })
  @IsNotEmpty({ message: 'El perfil es obligatorio' })
  @ValidateNested()
  @Type(() => CreateProfileDto)
  profile!: CreateProfileDto;
}

// DTO para actualizar: email y name opcionales, ID requerido
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['profile'] as const),
) {
  @ApiPropertyOptional({ description: 'Profile information of the user' })
  @ValidateNested()
  @Type(() => UpdateProfileDto)
  @IsOptional()
  profile?: UpdateProfileDto;
}
