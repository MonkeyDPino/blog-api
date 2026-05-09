import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ImproveContentDto {
  @ApiProperty({ description: 'The blog post content to improve' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: 'Instruction for how to improve the content' })
  @IsString()
  @IsNotEmpty()
  instruction: string;
}
