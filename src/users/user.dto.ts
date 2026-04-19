import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @ApiProperty({ description: 'Full name of the user' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  name!: string;

  @ApiProperty({ description: 'Email of the user' })
  @IsNotEmpty({ message: 'El email es obligatorio' })
  @IsEmail({}, { message: 'Formato de correo no válido' })
  email!: string;
}

export class UserDto {
  @ApiProperty({ description: 'User ID' })
  @IsNotEmpty({ message: 'El ID es obligatorio' })
  id!: string;

  @ApiProperty({ description: 'Full name of the user' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  name!: string;

  @ApiPropertyOptional({ description: 'Email of the user' })
  @IsOptional()
  @IsEmail({}, { message: 'Formato de correo no válido' })
  @Transform(({ value }) =>
    value === '' ? undefined : (value as string | undefined),
  )
  email?: string;
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
