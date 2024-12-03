import React from 'react';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useBouquetStore } from '../store/bouquetStore';
import { generateBouquet } from '../services/api';
import toast from 'react-hot-toast';

export const GenerateStep: React.FC = () => {
  const { bouquet, setGenerated, setStep } = useBouquetStore();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleGenerate = async () => {
    const isYandexModel = (modelId: string) => modelId.startsWith('yandex');
    
    if (isYandexModel(bouquet.selectedModel)) {
      if (!bouquet.yandexKey || !bouquet.yandexFolderId) {
        toast.error('Необходимо указать API ключ и ID папки Яндекса');
        setStep(1); // Go back to customize step
        return;
      }
    } else {
      if (!bouquet.openaiKey) {
        toast.error('Необходимо указать API ключ OpenAI');
        setStep(1); // Go back to customize step
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const result = await generateBouquet(bouquet);
      setGenerated(result);
      setStep(3);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate bouquet';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    let mounted = true;

    const generate = async () => {
      if (mounted) {
        await handleGenerate();
      }
    };

    generate();

    return () => {
      mounted = false;
    };
  }, []);

  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <div className="text-red-500 mb-4">
          <p>{error}</p>
        </div>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => setStep(1)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:border-rose-300"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Settings
          </button>
          <button
            onClick={handleGenerate}
            className="px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto text-center">
      {loading ? (
        <div className="space-y-6">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-rose-500" />
          <div className="space-y-2">
            <h3 className="text-xl font-medium">Создаём ваш идеальный букет</h3>
            <p className="text-gray-600">
              Наш ИИ тщательно создаёт прекрасную композицию специально для вас...
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <button
            onClick={() => setStep(1)}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            Вернуться к настройке
          </button>
          <button
            onClick={handleGenerate}
            className="bg-rose-500 text-white py-2 px-6 rounded-md hover:bg-rose-600 transition-colors"
          >
            Попробовать снова
          </button>
        </div>
      )}
    </div>
  );
};