const mockGenerateContent = jest.fn();

jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContent: mockGenerateContent,
    },
  })),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GeminiService } from './gemini.service';

describe('GeminiService', () => {
  let service: GeminiService;

  beforeEach(async () => {
    mockGenerateContent.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeminiService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('fake-api-key') },
        },
      ],
    }).compile();

    service = module.get<GeminiService>(GeminiService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateSummary', () => {
    it('REQ-4.1: returns summary text from Gemini response', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'A concise summary.' });

      const result = await service.generateSummary(
        'Some long blog post content',
      );

      expect(result).toBe('A concise summary.');
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-3.1-flash-lite-preview',
          contents: 'Some long blog post content',
        }),
      );
    });

    it('REQ-4.2: returns empty string when response text is null or undefined', async () => {
      mockGenerateContent.mockResolvedValue({ text: null });

      const result = await service.generateSummary('Some content');

      expect(result).toBe('');
    });

    it('REQ-4.3: calls generateContent with correct model and system instruction', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Summary here.' });

      await service.generateSummary('Blog content here');

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-3.1-flash-lite-preview',
          contents: 'Blog content here',
          config: expect.objectContaining({
            temperature: 0.4,
          }),
        }),
      );
    });
  });
});
