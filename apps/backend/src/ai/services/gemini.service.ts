import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { Env } from '../../env.model';

@Injectable()
export class GeminiService {
  private readonly client: GoogleGenAI;

  constructor(private readonly configService: ConfigService<Env>) {
    this.client = new GoogleGenAI({
      apiKey: this.configService.get('GEMINI_API_KEY', { infer: true }),
    });
  }

  async generateSummary(content: string): Promise<string> {
    const response = await this.client.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: content,
      config: {
        systemInstruction:
          'You are a blog editor. Generate a concise summary of the provided blog post content. The summary must be strictly under 255 characters. Return only the summary, no additional commentary. end your idea before 255 characters.',
        temperature: 0.4,
      },
    });

    return response.text ?? '';
  }
}
