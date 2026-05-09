import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiJwtAuth } from '../../common/decorators/api-jwt-auth.decorator';
import { GeminiService } from '../services/gemini.service';
import { ImproveContentDto } from '../dto/improve-content.dto';

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(private readonly geminiService: GeminiService) {}

  @Post('improve-content')
  @HttpCode(200)
  @UseGuards(AuthGuard('jwt'))
  @ApiJwtAuth()
  @ApiOperation({ summary: 'Improve blog post content using AI' })
  @ApiResponse({ status: 200, description: 'Returns AI-improved content' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async improveContent(
    @Body() dto: ImproveContentDto,
  ): Promise<{ improved: string }> {
    const improved = await this.geminiService.improveContent(
      dto.content,
      dto.instruction,
    );
    return { improved };
  }
}
