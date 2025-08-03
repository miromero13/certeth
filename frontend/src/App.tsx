import { useState } from "react";
import { Hero } from "@/components/Hero";
import { RealCertificateManager } from "@/components/RealCertificateManager";
import { ToastProvider } from "@/hooks/use-toast";

type UserRole = 'hero' | 'realSystem';

const App = () => {
  const [currentView, setCurrentView] = useState<UserRole>('hero');

  const handleRoleSelect = (_role: 'issuer' | 'holder' | 'verifier') => {
    // Ahora todos los roles van al sistema real
    setCurrentView('realSystem');
  };

  const handleBackToHero = () => {
    setCurrentView('hero');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'realSystem':
        return (
          <div className="container mx-auto px-4 py-8">
            <button 
              onClick={handleBackToHero}
              className="mb-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm"
            >
              ← Volver al inicio
            </button>
            <RealCertificateManager />
          </div>
        );
      default:
        return <Hero onRoleSelect={handleRoleSelect} />;
    }
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        {renderCurrentView()}
      </div>
    </ToastProvider>
  );
};

export default App;
