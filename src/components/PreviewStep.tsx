import React from 'react';
import { Download, RefreshCw, Maximize2, ArrowLeft } from 'lucide-react';
import { useBouquetStore } from '../store/bouquetStore';
import { ImageModal } from './ImageModal';
import { toast } from 'react-hot-toast';

export const PreviewStep: React.FC = () => {
  const { bouquet, generated, setStep } = useBouquetStore();
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
  const [, setDownloading] = React.useState(false);
  
  if (!generated) {
    return null;
  }

  const downloadImage = async (url: string) => {
    try {
      setDownloading(true);
      
      let blob: Blob;
      
      // Check if the URL is a data URL (base64)
      if (url.startsWith('data:')) {
        // Extract base64 data and convert to blob
        const base64Data = url.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        blob = new Blob([byteArray], { type: 'image/jpeg' });
      } else {
        // For remote URLs, use the proxy
        const headers: Record<string, string> = {};
        
        const isYandexModel = (modelId: string) => modelId.startsWith('yandex');
        if (isYandexModel(bouquet.imageModel)) {
          headers['Authorization'] = `Api-Key ${bouquet.yandexKey}`;
          headers['x-folder-id'] = bouquet.yandexFolderId;
        } else {
          headers['Authorization'] = `Bearer ${bouquet.openaiKey}`;
        }

        const response = await fetch(`/api/proxy-image?url=${encodeURIComponent(url)}`, {
          headers
        });
        
        if (!response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to download image');
          } else {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to download image');
          }
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('image/')) {
          throw new Error('Invalid response: not an image');
        }
        
        blob = await response.blob();
      }
      
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `bouquet-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success('Image downloaded successfully');
    } catch (error) {
      console.error('Error downloading image:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to download image');
    } finally {
      setDownloading(false);
    }
  };

  const downloadAllImages = async () => {
    setDownloading(true);
    try {
      for (const url of generated.images) {
        await downloadImage(url);
      }
      toast.success('Все изображения успешно скачаны');
    } catch (error) {
      toast.error('Ошибка при скачивании изображений');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <button
        onClick={() => setStep(1)}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-5 h-5" />
        Вернуться к настройке
      </button>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Ваш букет</h2>
        <div className="space-y-4">
          <p className="text-gray-600">
            Для: <span className="font-medium text-gray-900">{bouquet.recipient}</span>
          </p>
          <p className="text-gray-600">
            Повод: <span className="font-medium text-gray-900">{bouquet.occasion}</span>
          </p>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Выбранные цветы:</h3>
            <div className="flex flex-wrap gap-2">
              {generated.flowerList.map((flower) => (
                <span
                  key={flower}
                  className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm"
                >
                  {flower}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Описание:</h3>
            <p className="text-gray-600">{generated.description}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {generated.images.map((image, index) => (
          <div key={index} className="relative group">
            <div className="aspect-square rounded-lg overflow-hidden shadow-md cursor-pointer">
              <img
                src={image}
                alt={`Вариант букета ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onClick={() => setSelectedImage(image)}
              />
            </div>
            <button
              onClick={() => setSelectedImage(image)}
              className="absolute top-2 right-2 p-1 bg-white/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <Maximize2 className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={() => downloadImage(image)}
              className="absolute bottom-2 right-2 p-2 bg-white/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white"
            >
              <Download className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        ))}
      </div>

      {selectedImage && (
        <ImageModal
          imageUrl={selectedImage}
          onClose={() => setSelectedImage(null)}
          onDownload={() => downloadImage(selectedImage)}
        />
      )}

      <div className="flex justify-center gap-4">
        <button
          onClick={() => setStep(2)}
          className="py-2 px-6 border border-gray-300 rounded-md hover:border-rose-300 transition-colors inline-flex items-center gap-2"
        >
          <RefreshCw className="w-5 h-5" />
          Создать заново
        </button>
        <button
          onClick={downloadAllImages}
          className="bg-rose-500 text-white py-2 px-6 rounded-md hover:bg-rose-600 transition-colors inline-flex items-center gap-2"
        >
          <Download className="w-5 h-5" />
          Скачать все изображения
        </button>
      </div>
    </div>
  );
};