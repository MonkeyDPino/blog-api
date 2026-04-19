import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

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
