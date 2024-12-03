import { create } from 'zustand';
import { BouquetStore, Bouquet } from '../types';

const initialBouquet: Bouquet = {
  occasion: '',
  recipient: '',
  customFlowers: [],
  selectedModel: 'yandexgpt-pro',
  imageModel: 'yandex-art',
  temperature: 0.7,
  systemPrompt: 'You are a professional florist with extensive knowledge of flower arrangements.',
  yandexGptPrompt: "Отвечай на русском языке. Как профессиональный флорист, предложите 2 разных комбинации цветов для букета на {occasion} для {recipient}. Каждая комбинация должна содержать от 3 до 5 цветов. ВАЖНО: используйте только русские названия цветов (например: розы, тюльпаны, пионы, лилии и т.д.). Верните ТОЛЬКО сырой JSON-объект с точно такой структурой: {\"suggestions\":[[\"цветок1\",\"цветок2\",\"цветок3\"],[\"цветок1\",\"цветок2\",\"цветок3\"]]}. Не используйте markdown-форматирование, блоки кода или дополнительный текст. Верните только JSON-объект.",
  yandexArtPrompt: "Профессиональная, высококачественная фотография красивого букета цветов, содержащего {flowers}. Букет создан для {occasion} для {recipient}. Фотореалистичный стиль, студийное освещение, белый фон.",
  openaiKey: '',
  dalleKey: '',
  yandexKey: '',
  yandexFolderId: ''
};

export const useBouquetStore = create<BouquetStore>((set) => ({
  bouquet: initialBouquet,
  generated: null,
  step: 0,
  setBouquet: (updates) => 
    set((state) => ({ 
      bouquet: { ...state.bouquet, ...updates }
    })),
  setGenerated: (generated) => set({ generated }),
  setStep: (step) => set({ step })
}));