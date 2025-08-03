import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, Lock, Zap } from "lucide-react";

interface HeroProps {
  onRoleSelect: (role: 'issuer' | 'holder' | 'verifier') => void;
}

export const Hero = ({ onRoleSelect }: HeroProps) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-secondary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent/5 rounded-full blur-3xl animate-blockchain-pulse"></div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-block mb-6">
            <div className="flex items-center justify-center w-20 h-20 bg-gradient-blockchain rounded-2xl glow-primary animate-pulse-glow">
              <Shield className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <h1 className="text-6xl font-bold mb-6">
            <span className="gradient-text">CERTETH</span>
            {/* <br /> */}
            {/* <span className="text-secondary">ZK-EAS</span> */}
          </h1>
          
          <p className="text-xl text-muted-foreground mb-4 leading-relaxed">
            Sistema descentralizado para certificados profesionales con{" "}
            <span className="text-primary font-semibold">Pruebas de Conocimiento Cero</span>
          </p>
          
          <p className="text-lg text-muted-foreground mb-12">
            Verifica credenciales sin revelar información sensible usando ZK-SNARKs y Ethereum Attestation Service
          </p>

          {/* Key Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="glass-effect p-6 hover:glow-primary transition-all duration-300 cursor-pointer group">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/30 transition-colors">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Privacidad Total</h3>
                <p className="text-sm text-muted-foreground">
                  Los datos sensibles nunca se exponen en blockchain
                </p>
              </div>
            </Card>

            <Card className="glass-effect p-6 hover:glow-zk transition-all duration-300 cursor-pointer group">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-secondary/30 transition-colors">
                  <Zap className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="font-semibold mb-2">ZK-SNARKs</h3>
                <p className="text-sm text-muted-foreground">
                  Pruebas criptográficas verificables
                </p>
              </div>
            </Card>

            <Card className="glass-effect p-6 hover:glow-primary transition-all duration-300 cursor-pointer group">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-accent/30 transition-colors">
                  <Shield className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-semibold mb-2">Descentralizado</h3>
                <p className="text-sm text-muted-foreground">
                  Resistente a censura y manipulación
                </p>
              </div>
            </Card>
          </div>

          {/* Role Selection */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold mb-8">Selecciona tu rol</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <Button 
                variant="outline" 
                size="lg" 
                className="h-16 glass-effect hover:glow-primary group"
                onClick={() => onRoleSelect('issuer')}
              >
                <div className="text-center">
                  <div className="font-semibold text-primary group-hover:text-primary-glow">
                    Institución Emisora
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Emitir certificados
                  </div>
                </div>
              </Button>

              <Button 
                variant="outline" 
                size="lg" 
                className="h-16 glass-effect hover:glow-zk group"
                onClick={() => onRoleSelect('holder')}
              >
                <div className="text-center">
                  <div className="font-semibold text-secondary group-hover:text-secondary-glow">
                    Titular
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Gestionar certificados
                  </div>
                </div>
              </Button>

              <Button 
                variant="outline" 
                size="lg" 
                className="h-16 glass-effect hover:glow-primary group"
                onClick={() => onRoleSelect('verifier')}
              >
                <div className="text-center">
                  <div className="font-semibold text-accent group-hover:text-accent">
                    Verificador
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Validar certificados
                  </div>
                </div>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
