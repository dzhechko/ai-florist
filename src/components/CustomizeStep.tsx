import React from 'react';
import { Settings, Flower, Sparkles } from 'lucide-react';
import { useBouquetStore } from '../store/bouquetStore';
import { FlowerSelector } from './FlowerSelector';
import { ModelSettings } from './ModelSettings';

export const CustomizeStep: React.FC = () => {
  const { setStep, bouquet } = useBouquetStore();
  const [activeTab, setActiveTab] = React.useState<'flowers' | 'settings'>('settings');

  const hasRequiredCredentials = () => {
    if (bouquet.selectedModel.startsWith('yandex')) {
      return !!(bouquet.yandexKey && bouquet.yandexFolderId);
    }
    return !!bouquet.openaiKey;
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg border transition-colors
            ${activeTab === 'settings' ? 'bg-rose-500 text-white border-rose-500' : 'border-gray-300 hover:border-rose-300'}`}
        >
          <Settings className="w-5 h-5" />
          <span>Настройки ИИ</span>
        </button>
        <button
          onClick={() => setActiveTab('flowers')}
          disabled={!hasRequiredCredentials()}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg border transition-colors
            ${activeTab === 'flowers' ? 'bg-rose-500 text-white border-rose-500' : 'border-gray-300 hover:border-rose-300'}
            ${!hasRequiredCredentials() ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Flower className="w-5 h-5" />
          <span>Выбор цветов</span>
          {!hasRequiredCredentials() && (
            <span className="ml-2 text-sm text-gray-500">
              (требуются учетные данные)
            </span>
          )}
        </button>
      </div>

      {activeTab === 'flowers' ? <FlowerSelector /> : <ModelSettings />}

      <div className="mt-8 flex gap-4">
        <button
          onClick={() => setStep(0)}
          className="flex-1 py-2 px-4 border border-gray-300 rounded-md hover:border-rose-300 transition-colors"
        >
          Назад
        </button>
        <button
          onClick={() => setStep(2)}
          disabled={bouquet.customFlowers.length === 0}
          className={`flex-1 py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-colors
            ${bouquet.customFlowers.length === 0 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-rose-500 text-white hover:bg-rose-600'}`}
        >
          <Sparkles className="w-5 h-5" />
          Создать букет
        </button>
      </div>
    </div>
  );
};