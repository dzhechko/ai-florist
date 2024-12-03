import React from 'react';
import { Flower2 } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="w-full bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 p-4 shadow-lg">
      <div className="container mx-auto flex items-center justify-center">
        <Flower2 className="h-8 w-8 text-white mr-2" />
        <h1 className="text-2xl font-bold text-white">Создание букета с ИИ</h1>
      </div>
    </header>
  );
};