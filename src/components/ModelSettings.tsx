import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useBouquetStore } from '../store/bouquetStore';

// Get the OpenAI mode from environment variable
const OPENAI_MODE = import.meta.env.VITE_OPENAI_MODE === 'true';

const textModels = [
  ...(OPENAI_MODE ? [
    { id: 'gpt-4', name: 'GPT-4 (OpenAI)' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo (OpenAI)' },
  ] : []),
  { id: 'yandexgpt-pro', name: 'YandexGPT Pro' },
  { id: 'yandexgpt-pro-32k', name: 'YandexGPT Pro 32k' },
];

const imageModels = [
  ...(OPENAI_MODE ? [
    { id: 'dall-e-3', name: 'DALL-E 3 (OpenAI)' },
    { id: 'dall-e-2', name: 'DALL-E 2 (OpenAI)' },
  ] : []),
  { id: 'yandex-art', name: 'YandexART' },
];

export const ModelSettings: React.FC = () => {
  const { bouquet, setBouquet } = useBouquetStore();
  const [showOpenAIKey, setShowOpenAIKey] = React.useState(false);
  const [showDALLEKey, setShowDALLEKey] = React.useState(false);
  const [showYandexKey, setShowYandexKey] = React.useState(false);

  // Используем sessionStorage чтобы отследить первую загрузку
  React.useEffect(() => {
    const isFirstLoad = !sessionStorage.getItem('modelSettingsInitialized');
    
    if (isFirstLoad && !OPENAI_MODE) {
      if (bouquet.selectedModel.includes('gpt')) {
        setBouquet({ selectedModel: 'yandexgpt-pro' });
      }
      if (bouquet.imageModel.includes('dall-e')) {
        setBouquet({ imageModel: 'yandex-art' });
      }
      sessionStorage.setItem('modelSettingsInitialized', 'true');
    }
  }, []);

  const handleModelChange = (type: 'text' | 'image', modelId: string) => {
    if (type === 'text') {
      setBouquet({ selectedModel: modelId });
    } else {
      setBouquet({ imageModel: modelId });
    }
  };

  const isYandexModel = (modelId: string) => modelId.startsWith('yandex');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">API Keys</h3>
        <div className="space-y-4">
          {OPENAI_MODE && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OpenAI API Key
                </label>
                <div className="relative">
                  <input
                    type={showOpenAIKey ? 'text' : 'password'}
                    value={bouquet.openaiKey}
                    onChange={(e) => setBouquet({ openaiKey: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500 pr-10"
                    placeholder="sk-..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showOpenAIKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  DALL-E API Key (optional)
                </label>
                <div className="relative">
                  <input
                    type={showDALLEKey ? 'text' : 'password'}
                    value={bouquet.dalleKey}
                    onChange={(e) => setBouquet({ dalleKey: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500 pr-10"
                    placeholder="sk-..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowDALLEKey(!showDALLEKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showDALLEKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  If not provided, will use the OpenAI API key
                </p>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              YandexGPT API Key
            </label>
            <div className="relative">
              <input
                type={showYandexKey ? 'text' : 'password'}
                value={bouquet.yandexKey}
                onChange={(e) => setBouquet({ yandexKey: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500 pr-10"
                placeholder="Enter your YandexGPT API key..."
              />
              <button
                type="button"
                onClick={() => setShowYandexKey(!showYandexKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showYandexKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              YandexGPT Folder ID
            </label>
            <input
              type="text"
              value={bouquet.yandexFolderId}
              onChange={(e) => setBouquet({ yandexFolderId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
              placeholder="Enter your YandexGPT Folder ID..."
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Text Generation Model</h3>
        <div className="space-y-3">
          {textModels.map(model => (
            <label
              key={model.id}
              className={`flex items-center p-3 border rounded-md cursor-pointer transition-colors hover:border-rose-300 ${
                isYandexModel(model.id) && (!bouquet.yandexKey || !bouquet.yandexFolderId)
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
            >
              <input
                type="radio"
                name="textModel"
                value={model.id}
                checked={bouquet.selectedModel === model.id}
                onChange={(e) => handleModelChange('text', e.target.value)}
                disabled={isYandexModel(model.id) && (!bouquet.yandexKey || !bouquet.yandexFolderId)}
                className="text-rose-500 focus:ring-rose-500"
              />
              <span className="ml-3">{model.name}</span>
              {isYandexModel(model.id) && (!bouquet.yandexKey || !bouquet.yandexFolderId) && (
                <span className="ml-auto text-sm text-gray-500">
                  Requires Yandex credentials
                </span>
              )}
            </label>
          ))}
        </div>
        {isYandexModel(bouquet.selectedModel) && bouquet.yandexKey && bouquet.yandexFolderId && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              YandexGPT System Prompt
            </label>
            <textarea
              value={bouquet.yandexGptPrompt}
              onChange={(e) => setBouquet({ yandexGptPrompt: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500 min-h-[100px]"
              placeholder="Введите системный промпт для YandexGPT..."
              defaultValue="Отвечай на русском языке. Как профессиональный флорист, предложите 2 разных комбинации цветов для букета на {occasion} для {recipient}. Каждая комбинация должна содержать от 3 до 5 цветов. ВАЖНО: используйте только русские названия цветов (например: розы, тюльпаны, пионы, лилии и т.д.). Верните ТОЛЬКО сырой JSON-объект с точно такой структурой: {'suggestions':[['цветок1','цветок2','цветок3'],['цветок1','цветок2','цветок3']]}. Не используйте markdown-форматирование, блоки кода или дополнительный текст. Верните только JSON-объект."
            />
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Image Generation Model</h3>
        <div className="space-y-3">
          {imageModels.map(model => (
            <label
              key={model.id}
              className={`flex items-center p-3 border rounded-md cursor-pointer transition-colors hover:border-rose-300 ${
                isYandexModel(model.id) && (!bouquet.yandexKey || !bouquet.yandexFolderId)
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
            >
              <input
                type="radio"
                name="imageModel"
                value={model.id}
                checked={bouquet.imageModel === model.id}
                onChange={(e) => handleModelChange('image', e.target.value)}
                disabled={isYandexModel(model.id) && (!bouquet.yandexKey || !bouquet.yandexFolderId)}
                className="text-rose-500 focus:ring-rose-500"
              />
              <span className="ml-3">{model.name}</span>
              {isYandexModel(model.id) && (!bouquet.yandexKey || !bouquet.yandexFolderId) && (
                <span className="ml-auto text-sm text-gray-500">
                  Requires Yandex credentials
                </span>
              )}
            </label>
          ))}
        </div>
        {isYandexModel(bouquet.imageModel) && bouquet.yandexKey && bouquet.yandexFolderId && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              YandexART System Prompt
            </label>
            <textarea
              value={bouquet.yandexArtPrompt}
              onChange={(e) => setBouquet({ yandexArtPrompt: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500 min-h-[100px]"
              placeholder="Введите системный промпт для YandexART..."
              defaultValue="Профессиональная, высококачественная фотография красивого букета цветов, содержащего {flowers}. Букет создан для {occasion} для {recipient}. Фотореалистичный стиль, студийное освещение, белый фон."
            />
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Advanced Settings</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Temperature ({bouquet.temperature})
              </label>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">Conservative</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={bouquet.temperature}
                onChange={(e) => setBouquet({ temperature: parseFloat(e.target.value) })}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
              <span className="text-sm text-gray-500">Creative</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};