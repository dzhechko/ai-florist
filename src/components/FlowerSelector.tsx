import React from 'react';
import { Plus, X, Loader2, Sparkles } from 'lucide-react';
import { useBouquetStore } from '../store/bouquetStore';
import { generateSuggestions } from '../services/api';
import toast from 'react-hot-toast';

const commonFlowers = [
  'Роза', 'Тюльпан', 'Лилия', 'Подсолнух', 'Маргаритка',
  'Гвоздика', 'Орхидея', 'Пион', 'Гортензия', 'Хризантема'
];

const isYandexModel = (modelId: string) => modelId.startsWith('yandex');

export const FlowerSelector: React.FC = () => {
  const { bouquet, setBouquet } = useBouquetStore();
  const [newFlower, setNewFlower] = React.useState('');
  const [suggestions, setSuggestions] = React.useState<string[][]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = React.useState(false);

  const hasRequiredCredentials = () => {
    if (isYandexModel(bouquet.selectedModel)) {
      return !!(bouquet.yandexKey && bouquet.yandexFolderId);
    }
    return !!bouquet.openaiKey;
  };

  const getCredentialsMessage = () => {
    if (isYandexModel(bouquet.selectedModel)) {
      return 'Пожалуйста, укажите учетные данные Яндекса в настройках ИИ для получения предложений';
    }
    return 'Пожалуйста, укажите API ключ в настройках ИИ для получения предложений';
  };

  const addCustomFlower = (flower: string) => {
    if (flower && !bouquet.customFlowers.includes(flower)) {
      setBouquet({
        customFlowers: [...bouquet.customFlowers, flower]
      });
    }
    setNewFlower('');
  };

  const removeFlower = (flower: string) => {
    setBouquet({
      customFlowers: bouquet.customFlowers.filter(f => f !== flower)
    });
  };

  const addSuggestion = (flowers: string[]) => {
    const newFlowers = [...new Set([...bouquet.customFlowers, ...flowers])];
    setBouquet({ customFlowers: newFlowers });
  };

  const getSuggestions = async () => {
    if (!hasRequiredCredentials()) {
      toast.error(getCredentialsMessage());
      return;
    }

    setLoadingSuggestions(true);
    try {
      const result = await generateSuggestions(bouquet);
      setSuggestions(result);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate suggestions');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  React.useEffect(() => {
    if (hasRequiredCredentials() && bouquet.occasion && bouquet.recipient) {
      getSuggestions();
    }
  }, [bouquet.openaiKey, bouquet.yandexKey, bouquet.yandexFolderId, bouquet.occasion, bouquet.recipient, bouquet.selectedModel]);

  return (
    <div className="space-y-6">
      {/* AI Suggestions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Предложения ИИ</h3>
          <button
            onClick={getSuggestions}
            disabled={loadingSuggestions || !hasRequiredCredentials()}
            className="inline-flex items-center gap-2 text-sm text-rose-600 hover:text-rose-700 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            Обновить предложения
          </button>
        </div>

        {loadingSuggestions ? (
          <div className="flex items-center justify-center h-24">
            <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
          </div>
        ) : suggestions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => addSuggestion(suggestion)}
                className="p-4 border border-gray-200 rounded-lg hover:border-rose-300 transition-colors text-left"
              >
                <div className="text-sm font-medium text-gray-500 mb-2">
                  Вариант {index + 1}
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestion.map((flower) => (
                    <span
                      key={flower}
                      className="px-2 py-1 bg-rose-50 text-rose-700 rounded-md text-sm"
                    >
                      {flower}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-4">
            {!hasRequiredCredentials() ? (
              <p>{getCredentialsMessage()}</p>
            ) : (
              <p>Нажмите обновить для получения предложений ИИ</p>
            )}
          </div>
        )}
      </div>

      {/* Common Flowers */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Популярные цветы</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {commonFlowers.map(flower => (
            <button
              key={flower}
              onClick={() => addCustomFlower(flower)}
              className={`p-3 text-sm rounded-md border transition-colors
                ${bouquet.customFlowers.includes(flower)
                  ? 'border-rose-500 bg-rose-50 text-rose-700'
                  : 'border-gray-300 hover:border-rose-300'}`}
            >
              {flower}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Flowers */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Свои цветы</h3>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newFlower}
            onChange={(e) => setNewFlower(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
            placeholder="Добавить свой цветок..."
          />
          <button
            onClick={() => addCustomFlower(newFlower)}
            className="bg-rose-500 text-white p-2 rounded-md hover:bg-rose-600 transition-colors"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {bouquet.customFlowers.map(flower => (
            <span
              key={flower}
              className="inline-flex items-center gap-1 px-3 py-1 bg-rose-100 text-rose-700 rounded-full"
            >
              {flower}
              <button
                onClick={() => removeFlower(flower)}
                className="p-0.5 hover:bg-rose-200 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};