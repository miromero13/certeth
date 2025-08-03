import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Search, CheckCircle, XCircle, AlertTriangle, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { web3Service } from "@/lib/web3Service";

interface VerifierDashboardProps {
  onBack: () => void;
}

interface VerificationRequest {
  id: string;
  holderAddress: string;
  holderName: string;
  requestDate: string;
  status: 'pending' | 'verified' | 'failed';
  certificateType: string;
  institution: string;
}

interface VerificationResult {
  isValid: boolean;
  commitment: string;
  attestationUID: string;
  issuer: string;
  verificationDetails: {
    proofValid: boolean;
    easValid: boolean;
    issuerTrusted: boolean;
  };
}

export const VerifierDashboard = ({ onBack }: VerifierDashboardProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'verify' | 'history'>('verify');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<string>('');
  
  const [verificationData, setVerificationData] = useState({
    holderAddress: '',
    proofData: '',
    expectedIssuer: '',
    certificateType: ''
  });

  const [verificationHistory] = useState<VerificationRequest[]>([
    {
      id: '1',
      holderAddress: '0x1234...5678',
      holderName: 'Ana García',
      requestDate: '2024-02-01',
      status: 'verified',
      certificateType: 'Desarrollo Blockchain',
      institution: 'TechCert University'
    },
    {
      id: '2',
      holderAddress: '0x9876...4321',
      holderName: 'Carlos López',
      requestDate: '2024-02-02',
      status: 'verified',
      certificateType: 'Smart Contracts',
      institution: 'TechCert University'
    },
    {
      id: '3',
      holderAddress: '0x5555...7777',
      holderName: 'María Fernández',
      requestDate: '2024-02-03',
      status: 'failed',
      certificateType: 'DeFi Protocols',
      institution: 'Unknown Institution'
    }
  ]);

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
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo conectar la wallet",
        variant: "destructive"
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setVerificationData(prev => ({ ...prev, [field]: value }));
  };

  const handleVerifyProof = async () => {
    if (!verificationData.proofData) {
      toast({
        title: "Error",
        description: "Los datos de la prueba ZK son requeridos",
        variant: "destructive"
      });
      return;
    }

    if (!isConnected) {
      toast({
        title: "Error",
        description: "Conecta tu wallet para continuar",
        variant: "destructive"
      });
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      // Parse proof data (assuming it's JSON)
      let proofJson;
      try {
        proofJson = JSON.parse(verificationData.proofData);
      } catch (e) {
        throw new Error("Formato de prueba inválido. Debe ser JSON válido.");
      }

      // Simulate verification process with delay
      await new Promise(resolve => setTimeout(resolve, 3000));

      // In a real implementation, this would call the smart contract
      // For demo, we'll simulate different verification outcomes
      const isValid = Math.random() > 0.2; // 80% success rate for demo

      const result: VerificationResult = {
        isValid,
        commitment: proofJson.publicInputs?.[0] || '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d',
        attestationUID: proofJson.publicInputs?.[1] || '0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
        issuer: proofJson.issuer || 'TechCert University',
        verificationDetails: {
          proofValid: isValid,
          easValid: isValid,
          issuerTrusted: isValid
        }
      };

      setVerificationResult(result);

      if (isValid) {
        toast({
          title: "¡Verificación exitosa!",
          description: "El certificado es válido y auténtico",
        });
      } else {
        toast({
          title: "Verificación fallida",
          description: "El certificado no pudo ser verificado",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error verifying proof:', error);
      toast({
        title: "Error de verificación",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive"
      });
    }

    setIsVerifying(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-4 h-4 text-accent" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'text-accent';
      case 'failed':
        return 'text-destructive';
      default:
        return 'text-yellow-500';
    }
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
                <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                  <Search className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold">Panel de Verificador</h1>
                  <p className="text-sm text-muted-foreground">TechHire Solutions</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {!isConnected ? (
                <Button onClick={connectWallet} className="glow-primary">
                  Conectar Wallet
                </Button>
              ) : (
                <div className="text-sm text-muted-foreground">
                  {currentAccount.substring(0, 10)}...
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
            variant={activeTab === 'verify' ? 'default' : 'outline'}
            onClick={() => setActiveTab('verify')}
            className={activeTab === 'verify' ? 'glow-primary' : ''}
          >
            <Shield className="w-4 h-4 mr-2" />
            Verificar Certificado
          </Button>
          <Button 
            variant={activeTab === 'history' ? 'default' : 'outline'}
            onClick={() => setActiveTab('history')}
            className={activeTab === 'history' ? 'glow-primary' : ''}
          >
            <Search className="w-4 h-4 mr-2" />
            Historial de Verificaciones
          </Button>
        </div>

        {activeTab === 'verify' && (
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Verification Form */}
              <Card className="glass-effect">
                <CardHeader>
                  <CardTitle className="gradient-text">Verificar Prueba ZK</CardTitle>
                  <CardDescription>
                    Ingrese los datos de la prueba ZK para verificar un certificado
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="holderAddress">Dirección del Titular (Opcional)</Label>
                    <Input
                      id="holderAddress"
                      value={verificationData.holderAddress}
                      onChange={(e) => handleInputChange('holderAddress', e.target.value)}
                      placeholder="0x... (opcional para verificación directa)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="proofData">Datos de la Prueba ZK *</Label>
                    <Textarea
                      id="proofData"
                      value={verificationData.proofData}
                      onChange={(e) => handleInputChange('proofData', e.target.value)}
                      placeholder='{"proof": "0x...", "publicInputs": [...], "verificationKey": "...", "issuer": "TechCert University"}'
                      rows={6}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expectedIssuer">Emisor Esperado</Label>
                      <Input
                        id="expectedIssuer"
                        value={verificationData.expectedIssuer}
                        onChange={(e) => handleInputChange('expectedIssuer', e.target.value)}
                        placeholder="TechCert University"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="certificateType">Tipo de Certificado</Label>
                      <Input
                        id="certificateType"
                        value={verificationData.certificateType}
                        onChange={(e) => handleInputChange('certificateType', e.target.value)}
                        placeholder="Blockchain Development"
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleVerifyProof}
                    disabled={isVerifying || !isConnected}
                    className="w-full glow-primary"
                    size="lg"
                  >
                    {isVerifying ? (
                      "Verificando..."
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        Verificar Certificado
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Verification Result */}
              <div className="space-y-6">
                {isVerifying && (
                  <Card className="glass-effect">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-primary/20 rounded-full flex items-center justify-center animate-pulse">
                          <Shield className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Verificando...</h3>
                        <p className="text-muted-foreground">
                          Validando prueba ZK y consultando EAS
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {verificationResult && (
                  <Card className={`glass-effect ${verificationResult.isValid ? 'glow-primary' : 'border-destructive'}`}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {verificationResult.isValid ? (
                          <>
                            <CheckCircle className="w-5 h-5 text-accent" />
                            Certificado Válido
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5 text-destructive" />
                            Certificado Inválido
                          </>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <Label className="text-xs text-muted-foreground">Commitment</Label>
                          <p className="font-mono text-sm bg-muted/50 p-2 rounded mt-1">
                            {verificationResult.commitment}
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Attestation UID</Label>
                          <p className="font-mono text-sm bg-muted/50 p-2 rounded mt-1">
                            {verificationResult.attestationUID}
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Emisor</Label>
                          <p className="text-sm mt-1">{verificationResult.issuer}</p>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <h4 className="font-semibold mb-3">Detalles de Verificación</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Prueba ZK válida</span>
                            {verificationResult.verificationDetails.proofValid ? (
                              <CheckCircle className="w-4 h-4 text-accent" />
                            ) : (
                              <XCircle className="w-4 h-4 text-destructive" />
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Atestación EAS válida</span>
                            {verificationResult.verificationDetails.easValid ? (
                              <CheckCircle className="w-4 h-4 text-accent" />
                            ) : (
                              <XCircle className="w-4 h-4 text-destructive" />
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Emisor confiable</span>
                            {verificationResult.verificationDetails.issuerTrusted ? (
                              <CheckCircle className="w-4 h-4 text-accent" />
                            ) : (
                              <XCircle className="w-4 h-4 text-destructive" />
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Information Card */}
                <Card className="glass-effect">
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-accent" />
                      Proceso de Verificación
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li>• Validación de la prueba ZK contra el commitment</li>
                      <li>• Consulta de la atestación en EAS</li>
                      <li>• Verificación de la confianza del emisor</li>
                      <li>• Confirmación de la validez temporal</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Historial de Verificaciones</h2>
              <div className="text-sm text-muted-foreground">
                Total: {verificationHistory.length} verificaciones
              </div>
            </div>

            <div className="grid gap-4">
              {verificationHistory.map((request) => (
                <Card key={request.id} className="glass-effect hover:glow-primary transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                      <div>
                        <h3 className="font-semibold">{request.holderName}</h3>
                        <p className="text-sm text-muted-foreground font-mono">
                          {request.holderAddress}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">{request.certificateType}</p>
                        <p className="text-sm text-muted-foreground">
                          {request.institution}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {request.requestDate}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(request.status)}
                          <span className={`font-medium capitalize ${getStatusColor(request.status)}`}>
                            {request.status === 'verified' ? 'Verificado' : 
                             request.status === 'failed' ? 'Fallido' : 'Pendiente'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
