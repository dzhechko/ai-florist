import React from 'react';
import { useBouquetStore } from '../store/bouquetStore';

const steps = ['Детали', 'Настройка', 'Генерация', 'Просмотр'];

export const StepIndicator: React.FC = () => {
  const { step, setStep } = useBouquetStore();

  const handleStepClick = (index: number) => {
    // Only allow going back to previous steps
    if (index < step) {
      setStep(index);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto mb-8">
      <div className="flex justify-between items-center">
        {steps.map((text, idx) => (
          <div key={text} className="flex flex-col items-center flex-1">
            <button
              onClick={() => handleStepClick(idx)}
              disabled={idx > step}
              className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-colors
                ${idx <= step ? 'bg-rose-500 text-white' : 'bg-gray-200 text-gray-500'}
                ${idx < step ? 'cursor-pointer hover:bg-rose-600' : ''}
                ${idx > step ? 'cursor-not-allowed' : ''}`}
            >
              {idx + 1}
            </button>
            <span className={`text-sm ${idx <= step ? 'text-rose-500' : 'text-gray-500'}`}>
              {text}
            </span>
            {idx < steps.length - 1 && (
              <div className={`h-0.5 w-full mt-4
                ${idx < step ? 'bg-rose-500' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};