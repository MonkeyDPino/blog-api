import { Module } from '@nestjs/common';
import { GeminiService } from './services/gemini.service';
import { AiController } from './controllers/ai.controller';

@Module({
  controllers: [AiController],
  providers: [GeminiService],
  exports: [GeminiService],
})
export class AiModule {}
