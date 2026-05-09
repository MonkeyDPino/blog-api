import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { Env } from '../../env.model';

@Injectable()
export class GeminiService {
  private readonly client: GoogleGenAI;
  private readonly model: string;

  constructor(private readonly configService: ConfigService<Env>) {
    this.client = new GoogleGenAI({
      apiKey: this.configService.get('GEMINI_API_KEY', { infer: true }),
    });
    this.model =
      this.configService.get('GEMINI_MODEL', { infer: true }) ??
      'gemini-2.0-flash-lite';
  }

  async generateSummary(content: string): Promise<string> {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: content,
      config: {
        systemInstruction:
          'You are a blog editor. Generate a concise summary of the provided blog post content. The summary must be strictly under 255 characters. Return only the summary, no additional commentary. end your idea before 255 characters.',
        temperature: 0.4,
      },
    });

    return response.text ?? '';
  }

  async suggestCategories(
    content: string,
    availableCategories: string[],
  ): Promise<string[]> {
    try {
      const prompt = `Given these blog post categories: [${availableCategories.join(', ')}], suggest which ones apply to this content. Reply with ONLY a JSON array of category names, e.g. ["Tech","Science"]. Content:\n\n${content}`;
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: prompt,
        config: { temperature: 0.2 },
      });
      const text = (response.text ?? '')
        .replace(/```json\n?|\n?```/g, '')
        .trim();
      return JSON.parse(text) as string[];
    } catch {
      return [];
    }
  }

  async improveContent(content: string, instruction: string): Promise<string> {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: `Instruction: ${instruction}\n\nContent:\n${content}`,
      config: {
        systemInstruction:
          'You are a professional blog editor. Improve the provided content according to the given instruction. Return only the improved content, no additional commentary.',
      },
    });
    return response.text ?? '';
  }
}
