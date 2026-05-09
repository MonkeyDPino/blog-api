import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ description: 'Token ID returned from login' })
  @IsNotEmpty()
  @IsString()
  tokenId!: string;

  @ApiProperty({ description: 'Raw refresh token value returned from login' })
  @IsNotEmpty()
  @IsString()
  tokenValue!: string;
}
