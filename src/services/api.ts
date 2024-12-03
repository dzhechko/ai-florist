import { Bouquet, GeneratedBouquet } from '../types';

const isYandexModel = (modelId: string) => modelId.startsWith('yandex');

const getYandexModelUri = (folderId: string, modelId: string) => {
  switch (modelId) {
    case 'yandexgpt-pro':
      return `gpt://${folderId}/yandexgpt/latest`;
    case 'yandexgpt-pro-32k':
      return `gpt://${folderId}/yandexgpt-32k/latest`;
    default:
      throw new Error('Invalid YandexGPT model');
  }
};

async function generateWithOpenAI(bouquet: Bouquet): Promise<GeneratedBouquet> {
  if (!bouquet.openaiKey) {
    throw new Error('OpenAI API key is required');
  }

  // Generate description using OpenAI
  const descriptionResponse = await fetch('/api/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${bouquet.openaiKey}`
    },
    body: JSON.stringify({
      model: bouquet.selectedModel,
      messages: [
        {
          role: 'system',
          content: bouquet.systemPrompt
        },
        {
          role: 'user',
          content: `Create a beautiful description for a ${bouquet.occasion} bouquet for ${bouquet.recipient}. The bouquet contains: ${bouquet.customFlowers.join(', ')}.`
        }
      ],
      temperature: bouquet.temperature,
      max_tokens: 300
    })
  });

  if (!descriptionResponse.ok) {
    const errorData = await descriptionResponse.json();
    throw new Error(errorData.error?.message || `Description API Error: ${descriptionResponse.status}`);
  }

  const descriptionData = await descriptionResponse.json();
  const description = descriptionData.choices?.[0]?.message?.content;
  
  if (!description) {
    throw new Error('Invalid description response format');
  }

  // Generate images using DALL-E
  const apiKey = bouquet.dalleKey || bouquet.openaiKey;
  const imagePrompt = `A professional, high-quality photograph of a beautiful flower bouquet containing ${bouquet.customFlowers.join(', ')}. The bouquet is designed for ${bouquet.occasion} for ${bouquet.recipient}. Photorealistic style, studio lighting, white background.`;

  const images = [];
  const numImages = bouquet.imageModel === 'dall-e-3' ? 1 : 3;

  for (let i = 0; i < numImages; i++) {
    const imageResponse = await fetch('/api/openai/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: bouquet.imageModel,
        prompt: imagePrompt,
        n: 1,
        size: '1024x1024',
        quality: 'hd',
        style: 'natural'
      })
    });

    if (!imageResponse.ok) {
      const errorData = await imageResponse.json();
      throw new Error(errorData.error?.message || `Image API Error: ${imageResponse.status}`);
    }

    const imageData = await imageResponse.json();
    const imageUrl = imageData.data?.[0]?.url;
    
    if (!imageUrl) {
      throw new Error('No image was generated');
    }

    images.push(imageUrl);
  }

  return { flowerList: bouquet.customFlowers, description, images };
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const DEBUG = import.meta.env.DEBUG === 'true';

const log = (message: string, data?: any) => {
  if (DEBUG) {
    console.log(`[Client Debug] ${new Date().toISOString()} ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
};

async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  try {
    log('Making request to:', { url, options: { ...options, body: JSON.parse(options.body as string) } });
    const response = await fetch(url, options);
    
    log('Response status:', response.status);
    log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    // If the request was successful, return the response
    if (response.ok) return response;

    // If we get a 429 (Too Many Requests) or 500+ error, retry
    if ((response.status === 429 || response.status >= 500) && retries > 0) {
      log(`Request failed with status ${response.status}. Retrying in ${RETRY_DELAY}ms...`);
      await sleep(RETRY_DELAY);
      return fetchWithRetry(url, options, retries - 1);
    }

    // For other errors, throw
    const data = await response.json();
    log('Error response data:', data);
    throw new Error(data.error?.message || `API Error: ${response.status}`);
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (retries > 0 && (error instanceof TypeError || error.name === 'AbortError')) {
        log(`Request failed with error ${error.message}. Retrying in ${RETRY_DELAY}ms...`);
        await sleep(RETRY_DELAY);
        return fetchWithRetry(url, options, retries - 1);
      }
      throw error;
    }
    throw new Error('Unknown error occurred');
  }
}

async function generateWithYandex(bouquet: Bouquet): Promise<GeneratedBouquet> {
  if (!bouquet.yandexKey || !bouquet.yandexFolderId) {
    throw new Error('YandexGPT API key and Folder ID are required');
  }

  log('Starting YandexART generation', {
    folderId: bouquet.yandexFolderId,
    hasKey: !!bouquet.yandexKey,
    imageModel: bouquet.imageModel,
    selectedModel: bouquet.selectedModel
  });

  // Создаем базовое описание
  const basicDescription = `Красивый букет на ${bouquet.occasion} для ${bouquet.recipient}, содержащий ${bouquet.customFlowers.join(', ')}.`;
  
  // Запрос к YandexGPT для улучшения описания
  const enhanceDescriptionRequest = {
    modelUri: getYandexModelUri(bouquet.yandexFolderId, bouquet.selectedModel),
    messages: [
      {
        role: "user",
        text: `Опиши этот букет красиво и эмоционально, используя художественные обороты и эпитеты, но без фраз вроде "вот описание" или "может быть таким". Описание должно быть прямым. Основа для описания: "${basicDescription}"`
      }
    ],
    completionOptions: {
      stream: false,
      temperature: 0.7,
      maxTokens: "1000"
    }
  };

  let images: string[] = [];

  try {
    const descriptionResponse = await fetchWithRetry('/api/yandex/v1/completion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Api-Key ${bouquet.yandexKey}`,
        'x-folder-id': bouquet.yandexFolderId
      },
      body: JSON.stringify(enhanceDescriptionRequest)
    });

    const descriptionData = await descriptionResponse.json();
    const enhancedDescription = descriptionData.result.alternatives?.[0]?.message?.text || basicDescription;
    log('Enhanced description:', enhancedDescription);

    // Используем улучшенное описание для генерации изображений
    const imagePrompt = bouquet.yandexArtPrompt
      .replace('{flowers}', bouquet.customFlowers.join(', '))
      .replace('{occasion}', bouquet.occasion)
      .replace('{recipient}', bouquet.recipient);

    log('Making YandexART request with prompt:', imagePrompt);

    const yandexArtRequest = {
      modelUri: `art://${bouquet.yandexFolderId}/yandex-art/latest`,
      messages: [
        {
          text: imagePrompt,
          weight: "1"
        }
      ],
      generationOptions: {
        mimeType: "image/jpeg",
        aspectRatio: {
          widthRatio: "1",
          heightRatio: "1"
        }
      }
    };

    log('YandexART request payload:', yandexArtRequest);

    // Генерируем два изображения
    for (let i = 0; i < 2; i++) {
      const imageResponse = await fetchWithRetry('/api/yandex/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Api-Key ${bouquet.yandexKey}`,
          'x-folder-id': bouquet.yandexFolderId
        },
        body: JSON.stringify(yandexArtRequest)
      });

      const imageData = await imageResponse.json();
      log('YandexART response data:', imageData);

      if (!imageResponse.ok) {
        const errorData = imageData;
        log('YandexART error response:', errorData);
        throw new Error(errorData.error?.message || `Image API Error: ${imageResponse.status}`);
      }

      if (imageData.done && imageData.response?.image) {
        const base64Image = imageData.response.image;
        const dataUrl = `data:image/jpeg;base64,${base64Image}`;
        images.push(dataUrl);
        log('Successfully received and formatted image from YandexART');
      }
    }

    return { 
      flowerList: bouquet.customFlowers, 
      description: enhancedDescription, 
      images 
    };
  } catch (error) {
    log('Error enhancing description:', error);
    // В случае ошибки используем базовое описание и пустой массив изображений
    return { 
      flowerList: bouquet.customFlowers, 
      description: basicDescription, 
      images 
    };
  }
}

export async function generateBouquet(bouquet: Bouquet): Promise<GeneratedBouquet> {
  if (!bouquet.customFlowers.length) {
    throw new Error('At least one flower must be selected');
  }

  try {
    // Choose the appropriate generation function based on the selected model
    if (isYandexModel(bouquet.selectedModel)) {
      return await generateWithYandex(bouquet);
    } else {
      return await generateWithOpenAI(bouquet);
    }
  } catch (error) {
    console.error('Bouquet generation error:', error);
    throw error instanceof Error ? error : new Error('Failed to generate bouquet');
  }
}

export async function generateSuggestions(bouquet: Bouquet): Promise<string[][]> {
  try {
    if (isYandexModel(bouquet.selectedModel)) {
      if (!bouquet.yandexKey || !bouquet.yandexFolderId) {
        throw new Error('YandexGPT API key and Folder ID are required');
      }

      const prompt = bouquet.yandexGptPrompt
        .replace('{occasion}', bouquet.occasion)
        .replace('{recipient}', bouquet.recipient);

      const requestBody = {
        modelUri: getYandexModelUri(bouquet.yandexFolderId, bouquet.selectedModel),
        completionOptions: {
          stream: false,
          temperature: 0.7,
          maxTokens: "2000"
        },
        messages: [
          {
            role: "user",
            text: prompt
          }
        ]
      };

      log('Making YandexGPT request with body:', JSON.stringify(requestBody, null, 2));

      const response = await fetchWithRetry('/api/yandex/v1/completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Api-Key ${bouquet.yandexKey}`,
          'x-folder-id': bouquet.yandexFolderId
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      log('YandexGPT raw response:', JSON.stringify(data, null, 2));
      
      if (!response.ok) {
        const errorMessage = data.error?.message || `API Error: ${response.status}`;
        log('API error:', { errorMessage, data });
        throw new Error(errorMessage);
      }

      if (!data.result) {
        log('Missing result in response:', data);
        throw new Error('Invalid API response: missing result');
      }

      log('YandexGPT result:', JSON.stringify(data.result, null, 2));

      // Get the generated text from the response
      const alternative = data.result.alternatives?.[0];
      if (!alternative || alternative.status !== 'ALTERNATIVE_STATUS_FINAL') {
        log('No valid alternative in response:', data);
        throw new Error('Invalid API response: no valid alternative');
      }

      const text = alternative.message?.text;
      log('Generated text:', text);

      if (!text) {
        log('No text in response:', data);
        throw new Error('Invalid API response: no text in response');
      }

      try {
        log('Attempting to parse text:', text);
        // Clean up markdown formatting if present
        const cleanText = text.replace(/```(?:json)?\n?([\s\S]*?)\n?```/g, '$1').trim();
        log('Cleaned text:', cleanText);
        
        const parsedContent = JSON.parse(cleanText) as unknown;
        log('Parsed content:', parsedContent);
        
        if (!parsedContent || typeof parsedContent !== 'object' || parsedContent === null) {
          log('Invalid parsed content:', parsedContent);
          throw new Error('Invalid JSON format: not an object');
        }

        const typedContent = parsedContent as { suggestions?: unknown };
        
        if (!Array.isArray(typedContent.suggestions)) {
          log('Invalid suggestions format:', typedContent);
          throw new Error('Invalid JSON format: suggestions is not an array');
        }
        
        // Validate each suggestion array
        const isValidSuggestion = (arr: unknown): arr is string[] => {
          return Array.isArray(arr) && 
                 arr.length >= 3 && 
                 arr.length <= 5 && 
                 arr.every(item => typeof item === 'string');
        };

        if (!typedContent.suggestions.every(isValidSuggestion)) {
          log('Invalid suggestion array format:', typedContent.suggestions);
          throw new Error('Invalid suggestion array format');
        }

        log('Successfully parsed suggestions:', typedContent.suggestions);
        return typedContent.suggestions;
      } catch (error) {
        const parseError = error instanceof Error ? error : new Error('Unknown parse error');
        log('Parse error:', { error: parseError.message, text });
        throw new Error(`Failed to parse API response: ${parseError.message}`);
      }
    } else {
      if (!bouquet.openaiKey) {
        throw new Error('OpenAI API key is required');
      }

      const response = await fetch('/api/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${bouquet.openaiKey}`
        },
        body: JSON.stringify({
          model: bouquet.selectedModel,
          messages: [
            {
              role: 'system',
              content: 'You are a professional florist. Generate two different flower combinations. Each combination should contain 3-5 flowers that work well together. Return the response in the following format: {"suggestions": [["flower1", "flower2", "flower3"], ["flower1", "flower2", "flower3"]]}'
            },
            {
              role: 'user',
              content: `Create 2 different flower combinations for a ${bouquet.occasion} bouquet for ${bouquet.recipient}.`
            }
          ],
          temperature: 0.7,
          max_tokens: 300
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `API Error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('Invalid API response format');
      }

      try {
        const parsedContent = JSON.parse(content);
        if (!Array.isArray(parsedContent.suggestions)) {
          throw new Error('Invalid suggestions format');
        }
        return parsedContent.suggestions;
      } catch (parseError) {
        throw new Error('Failed to parse API response');
      }
    }
  } catch (error) {
    console.error('Suggestion generation error:', error);
    throw error instanceof Error ? error : new Error('Failed to generate suggestions');
  }
}