import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, User, Shield, FileCheck, Key, Download, Share } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { web3Service, Certificate, ZKProofData } from "@/lib/web3Service";

interface HolderDashboardProps {
  onBack: () => void;
}

export const HolderDashboard = ({ onBack }: HolderDashboardProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'certificates' | 'generate'>('certificates');
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<string>('');
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  useEffect(() => {
    checkWalletConnection();
    loadCertificates();
  }, []);

  const checkWalletConnection = async () => {
    try {
      const accounts = await web3Service.connectWallet();
      if (accounts.length > 0) {
        setIsConnected(true);
        setCurrentAccount(accounts[0]);
      }
    } catch (error) {
      console.error('Error connecting to wallet:', error);
    }
  };

  const loadCertificates = async () => {
    try {
      // For demo purposes, we'll use mock data
      const mockCertificates: Certificate[] = [
        {
          id: '1',
          courseName: 'Desarrollo Blockchain Avanzado',
          institutionName: 'TechCert University',
          recipientName: 'Ana García Rodríguez',
          description: 'Certificado de completación del programa avanzado',
          isValid: true,
          issuedAt: '2024-01-15',
          issuer: '0x123...',
          recipient: currentAccount,
          certificateHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d',
          easUID: '0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
          zkProofHash: '0x...',
          privateDataHash: '0x...'
        },
        {
          id: '2',
          courseName: 'Smart Contracts con Solidity',
          institutionName: 'TechCert University',
          recipientName: 'Ana García Rodríguez',
          description: 'Especialización en contratos inteligentes',
          isValid: true,
          issuedAt: '2023-12-20',
          issuer: '0x456...',
          recipient: currentAccount,
          certificateHash: '0x9f8e7d6c5b4a3918273645e6f7a8b9c0',
          easUID: '0x2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f',
          zkProofHash: '0x...',
          privateDataHash: '0x...'
        }
      ];
      setCertificates(mockCertificates);
    } catch (error) {
      console.error('Error loading certificates:', error);
    }
  };

  const connectWallet = async () => {
    try {
      const accounts = await web3Service.connectWallet();
      if (accounts.length > 0) {
        setIsConnected(true);
        setCurrentAccount(accounts[0]);
        toast({
          title: "Wallet conectada",
          description: `Conectado a ${accounts[0].substring(0, 10)}...`,
        });
        loadCertificates();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo conectar la wallet",
        variant: "destructive"
      });
    }
  };

  const handleGenerateProof = async (cert: Certificate) => {
    if (!isConnected) {
      toast({
        title: "Error",
        description: "Conecta tu wallet para continuar",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setSelectedCert(cert);

    try {
      // Simulate ZK proof generation
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Generate mock ZK proof
      const zkProof = web3Service.generateMockZKProof();
      
      toast({
        title: "¡Prueba ZK generada exitosamente!",
        description: "Tu prueba de conocimiento cero está lista para compartir",
      });

      // Update certificate to show ZK proof is generated
      setCertificates(prev => 
        prev.map(c => 
          c.id === cert.id 
            ? { ...c, zkProofHash: zkProof } 
            : c
        )
      );
    } catch (error) {
      console.error('Error generating ZK proof:', error);
      toast({
        title: "Error",
        description: "No se pudo generar la prueba ZK",
        variant: "destructive"
      });
    }

    setIsGenerating(false);
  };

  const handleShareProof = (cert: Certificate) => {
    const proofData = {
      proof: cert.zkProofHash || web3Service.generateMockZKProof(),
      publicInputs: [cert.certificateHash, cert.easUID],
      verificationKey: "vk_proof_key",
      certificateId: cert.id,
      issuer: cert.institutionName
    };

    // Copy to clipboard
    navigator.clipboard?.writeText(JSON.stringify(proofData, null, 2));

    toast({
      title: "Prueba copiada al portapapeles",
      description: "Comparte estos datos con el verificador",
    });
  };

  const hasZKProof = (cert: Certificate) => {
    return cert.zkProofHash && cert.zkProofHash !== '0x...';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 glass-effect">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold">Panel de Titular</h1>
                  <p className="text-sm text-muted-foreground">Ana García Rodríguez</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {!isConnected ? (
                <Button onClick={connectWallet} className="glow-zk">
                  Conectar Wallet
                </Button>
              ) : (
                <div className="text-sm text-muted-foreground">
                  {certificates.length} certificados
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8">
          <Button 
            variant={activeTab === 'certificates' ? 'default' : 'outline'}
            onClick={() => setActiveTab('certificates')}
            className={activeTab === 'certificates' ? 'glow-zk' : ''}
          >
            <FileCheck className="w-4 h-4 mr-2" />
            Mis Certificados
          </Button>
          <Button 
            variant={activeTab === 'generate' ? 'default' : 'outline'}
            onClick={() => setActiveTab('generate')}
            className={activeTab === 'generate' ? 'glow-zk' : ''}
          >
            <Key className="w-4 h-4 mr-2" />
            Generar Prueba ZK
          </Button>
        </div>

        {activeTab === 'certificates' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-2">Mis Certificados</h2>
              <p className="text-muted-foreground">
                Gestiona tus certificados y genera pruebas de conocimiento cero
              </p>
            </div>

            {!isConnected ? (
              <Card className="glass-effect text-center p-8">
                <CardContent>
                  <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Conecta tu Wallet</h3>
                  <p className="text-muted-foreground mb-4">
                    Conecta tu wallet para ver tus certificados
                  </p>
                  <Button onClick={connectWallet} className="glow-zk">
                    Conectar Wallet
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {certificates.map((cert) => (
                  <Card key={cert.id} className="glass-effect hover:glow-zk transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Certificate Info */}
                        <div className="lg:col-span-2">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-xl font-semibold mb-2">{cert.courseName}</h3>
                              <p className="text-muted-foreground">{cert.institutionName}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">{cert.issuedAt}</p>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs text-muted-foreground">Commitment</Label>
                              <p className="font-mono text-sm bg-muted/50 p-2 rounded mt-1">
                                {cert.certificateHash}
                              </p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Attestation UID</Label>
                              <p className="font-mono text-sm bg-muted/50 p-2 rounded mt-1">
                                {cert.easUID}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-4">
                          <div className="text-center">
                            {hasZKProof(cert) ? (
                              <div className="flex items-center justify-center gap-2 text-accent mb-4">
                                <Shield className="w-4 h-4" />
                                <span className="text-sm font-medium">Prueba ZK Lista</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4">
                                <Shield className="w-4 h-4" />
                                <span className="text-sm">Sin prueba ZK</span>
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Button 
                              onClick={() => handleGenerateProof(cert)}
                              disabled={isGenerating && selectedCert?.id === cert.id}
                              className="w-full"
                              variant="secondary"
                            >
                              {isGenerating && selectedCert?.id === cert.id ? (
                                "Generando..."
                              ) : (
                                <>
                                  <Key className="w-4 h-4 mr-2" />
                                  Generar Prueba ZK
                                </>
                              )}
                            </Button>

                            {hasZKProof(cert) && (
                              <Button 
                                onClick={() => handleShareProof(cert)}
                                className="w-full"
                                variant="outline"
                              >
                                <Share className="w-4 h-4 mr-2" />
                                Compartir Prueba
                              </Button>
                            )}

                            <Button 
                              className="w-full"
                              variant="outline"
                              size="sm"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Exportar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'generate' && (
          <div className="max-w-2xl mx-auto">
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="gradient-text">Generar Prueba de Conocimiento Cero</CardTitle>
                <CardDescription>
                  Crea una prueba ZK para verificar tu certificado sin revelar información sensible
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted/30 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-secondary" />
                    ¿Cómo funciona?
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Tus datos privados permanecen en tu dispositivo</li>
                    <li>• Se genera una prueba criptográfica que verifica la posesión del certificado</li>
                    <li>• El verificador puede validar tu credencial sin ver los datos sensibles</li>
                    <li>• La prueba es verificable en blockchain usando el commitment de EAS</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <Label>Seleccionar Certificado</Label>
                  <div className="space-y-2">
                    {certificates.map((cert) => (
                      <Card 
                        key={cert.id} 
                        className={`cursor-pointer hover:bg-muted/20 transition-colors p-4 ${
                          selectedCert?.id === cert.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setSelectedCert(cert)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{cert.courseName}</p>
                            <p className="text-sm text-muted-foreground">{cert.institutionName}</p>
                          </div>
                          {hasZKProof(cert) && (
                            <Shield className="w-4 h-4 text-accent" />
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                {selectedCert && (
                  <div className="space-y-4 p-4 bg-muted/20 rounded-lg">
                    <h4 className="font-semibold">Datos del Certificado Seleccionado</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-xs text-muted-foreground">Curso</Label>
                        <p>{selectedCert.courseName}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Institución</Label>
                        <p>{selectedCert.institutionName}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Fecha de Emisión</Label>
                        <p>{selectedCert.issuedAt}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Estado</Label>
                        <p>{selectedCert.isValid ? 'Válido' : 'Inválido'}</p>
                      </div>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={() => selectedCert && handleGenerateProof(selectedCert)}
                  disabled={!selectedCert || isGenerating || !isConnected}
                  className="w-full glow-zk"
                  size="lg"
                >
                  {isGenerating ? (
                    "Generando prueba ZK..."
                  ) : (
                    <>
                      <Key className="w-4 h-4 mr-2" />
                      Generar Prueba ZK
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
