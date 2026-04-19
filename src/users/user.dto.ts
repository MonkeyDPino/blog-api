import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

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
  @IsOptional()
  avatarUrl?: string;
}

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
export class UpdateUserDto extends PartialType(CreateUserDto) {
  // @ApiPropertyOptional({ description: 'Email of the user' })
  // @IsOptional()
  // @IsEmail({}, { message: 'Formato de correo no válido' })
  // @Transform(({ value }) =>
  //   value === '' ? undefined : (value as string | undefined),
  // )
  // email?: string;
}
