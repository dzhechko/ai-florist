import React from 'react';
import { X, Download } from 'lucide-react';

interface ImageModalProps {
  imageUrl: string;
  onClose: () => void;
  onDownload: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, onClose, onDownload }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="relative max-w-7xl w-full">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
        >
          <X className="w-8 h-8" />
        </button>
        <button
          onClick={onDownload}
          className="absolute top-4 left-4 text-white hover:text-gray-300 z-10 flex items-center gap-2"
        >
          <Download className="w-6 h-6" />
          <span>Download</span>
        </button>
        <img
          src={imageUrl}
          alt="Full size bouquet"
          className="w-full h-auto max-h-[90vh] object-contain"
        />
      </div>
    </div>
  );
};