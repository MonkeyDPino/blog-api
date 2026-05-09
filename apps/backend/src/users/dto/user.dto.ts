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
  Matches,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { CreateProfileDto, UpdateProfileDto } from './profile.dto';

export class CreateUserDto {
  @ApiProperty({ description: 'Email of the user' })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Invalid email format' })
  email!: string;

  @ApiProperty({ description: 'Password of the user' })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/, {
    message:
      'Password must include at least 1 uppercase letter, 1 digit, and 1 special character',
  })
  password!: string;

  @ApiProperty({ description: 'Profile information of the user' })
  @IsNotEmpty({ message: 'Profile is required' })
  @ValidateNested()
  @Type(() => CreateProfileDto)
  profile!: CreateProfileDto;
}

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['profile'] as const),
) {
  @ApiPropertyOptional({ description: 'Profile information of the user' })
  @ValidateNested()
  @Type(() => UpdateProfileDto)
  @IsOptional()
  profile?: UpdateProfileDto;
}
