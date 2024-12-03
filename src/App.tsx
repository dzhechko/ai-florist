import { Header } from './components/Header';
import { StepIndicator } from './components/StepIndicator';
import { DetailsStep } from './components/DetailsStep';
import { CustomizeStep } from './components/CustomizeStep';
import { GenerateStep } from './components/GenerateStep';
import { PreviewStep } from './components/PreviewStep';
import { useBouquetStore } from './store/bouquetStore';
import { Toaster } from 'react-hot-toast';

function App() {
  const step = useBouquetStore((state) => state.step);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <StepIndicator />
        
        <div className="mt-8">
          {step === 0 && <DetailsStep />}
          {step === 1 && <CustomizeStep />}
          {step === 2 && <GenerateStep />}
          {step === 3 && <PreviewStep />}
        </div>
      </main>
      <Toaster position="bottom-right" />
    </div>
  );
}

export default App;