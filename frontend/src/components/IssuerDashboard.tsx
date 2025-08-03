import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Building2, FileText, Hash, CheckCircle, Clock, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { web3Service, Certificate } from "@/lib/web3Service";

interface IssuerDashboardProps {
  onBack: () => void;
}

export const IssuerDashboard = ({ onBack }: IssuerDashboardProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'issue' | 'manage' | 'analytics'>('issue');
  const [isIssuing, setIsIssuing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<string>('');
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  const [formData, setFormData] = useState({
    recipientAddress: '',
    recipientName: '',
    courseName: '',
    institution: 'TechCert University',
    grade: '',
    courseType: '',
    description: ''
  });

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
      // In a real app, this would fetch certificates issued by this institution
      // For demo, we'll use mock data
      const mockCertificates: Certificate[] = [
        {
          id: '1',
          recipientName: 'Ana García',
          courseName: 'Desarrollo Blockchain Avanzado',
          institutionName: 'TechCert University',
          description: 'Certificado de completación',
          isValid: true,
          issuedAt: '2024-01-15',
          issuer: currentAccount,
          recipient: '0x742d35cc6cc...',
          certificateHash: '0x1a2b3c4d...',
          easUID: '0x5e6f7a8b...',
          zkProofHash: '0x...',
          privateDataHash: '0x...'
        },
        {
          id: '2',
          recipientName: 'Carlos López',
          courseName: 'Smart Contracts con Solidity',
          institutionName: 'TechCert University',
          description: 'Certificado de completación',
          isValid: true,
          issuedAt: '2024-01-20',
          issuer: currentAccount,
          recipient: '0x123abc456def...',
          certificateHash: '0x9f8e7d6c...',
          easUID: '0x2c3d4e5f...',
          zkProofHash: '0x...',
          privateDataHash: '0x...'
        }
      ];
      setCertificates(mockCertificates);
    } catch (error) {
      console.error('Error loading certificates:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleIssueCertificate = async () => {
    if (!formData.recipientName || !formData.courseName || !formData.grade) {
      toast({
        title: "Error",
        description: "Todos los campos obligatorios deben estar completos",
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

    setIsIssuing(true);

    try {
      // For demo purposes, we'll use a mock recipient address if not provided
      const recipientAddress = formData.recipientAddress || '0x742d35Cc6Cc134081c65e2Af0dC54E252a8b88A5';
      
      const txHash = await web3Service.issueCertificate(
        formData.recipientName,
        formData.institution,
        recipientAddress,
        formData.courseName,
        formData.description
      );

      // Create mock certificate for immediate UI update
      const newCertificate: Certificate = {
        id: Date.now().toString(),
        recipientName: formData.recipientName,
        courseName: formData.courseName,
        institutionName: formData.institution,
        description: formData.description,
        isValid: true,
        issuedAt: new Date().toISOString().split('T')[0],
        issuer: currentAccount,
        recipient: recipientAddress,
        certificateHash: '0x' + Math.random().toString(16).substring(2, 10) + '...',
        easUID: '0x' + Math.random().toString(16).substring(2, 10) + '...',
        zkProofHash: '0x...',
        privateDataHash: '0x...'
      };

      setCertificates(prev => [newCertificate, ...prev]);
      setFormData({
        recipientAddress: '',
        recipientName: '',
        courseName: '',
        institution: 'TechCert University',
        grade: '',
        courseType: '',
        description: ''
      });

      toast({
        title: "¡Certificado emitido exitosamente!",
        description: `Transacción: ${txHash.substring(0, 10)}...`,
      });
    } catch (error) {
      console.error('Error issuing certificate:', error);
      toast({
        title: "Error",
        description: "No se pudo emitir el certificado. Verifica tu conexión.",
        variant: "destructive"
      });
    }

    setIsIssuing(false);
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
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo conectar la wallet",
        variant: "destructive"
      });
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
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold">Panel de Institución Emisora</h1>
                  <p className="text-sm text-muted-foreground">TechCert University</p>
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
            variant={activeTab === 'issue' ? 'default' : 'outline'}
            onClick={() => setActiveTab('issue')}
            className={activeTab === 'issue' ? 'glow-primary' : ''}
          >
            <FileText className="w-4 h-4 mr-2" />
            Emitir Certificado
          </Button>
          <Button 
            variant={activeTab === 'manage' ? 'default' : 'outline'}
            onClick={() => setActiveTab('manage')}
            className={activeTab === 'manage' ? 'glow-primary' : ''}
          >
            <Hash className="w-4 h-4 mr-2" />
            Gestionar Certificados
          </Button>
          <Button 
            variant={activeTab === 'analytics' ? 'default' : 'outline'}
            onClick={() => setActiveTab('analytics')}
            className={activeTab === 'analytics' ? 'glow-primary' : ''}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Analíticas
          </Button>
        </div>

        {activeTab === 'issue' && (
          <div className="max-w-2xl mx-auto">
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="gradient-text">Emitir Nuevo Certificado</CardTitle>
                <CardDescription>
                  Complete los datos del certificado. Se generará un commitment y una atestación en EAS.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipientName">Nombre del Titular *</Label>
                    <Input
                      id="recipientName"
                      value={formData.recipientName}
                      onChange={(e) => handleInputChange('recipientName', e.target.value)}
                      placeholder="Nombre completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recipientAddress">Dirección Wallet</Label>
                    <Input
                      id="recipientAddress"
                      value={formData.recipientAddress}
                      onChange={(e) => handleInputChange('recipientAddress', e.target.value)}
                      placeholder="0x..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="courseName">Nombre del Curso/Certificación *</Label>
                  <Input
                    id="courseName"
                    value={formData.courseName}
                    onChange={(e) => handleInputChange('courseName', e.target.value)}
                    placeholder="Ej: Desarrollo Blockchain Avanzado"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="institution">Institución</Label>
                    <select
                      value={formData.institution}
                      onChange={(e) => handleInputChange('institution', e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="TechCert University">TechCert University</option>
                      <option value="Blockchain Institute">Blockchain Institute</option>
                      <option value="Crypto Academy">Crypto Academy</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="grade">Calificación *</Label>
                    <Input
                      id="grade"
                      value={formData.grade}
                      onChange={(e) => handleInputChange('grade', e.target.value)}
                      placeholder="85, A+, Aprobado, etc."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="courseType">Tipo de Curso</Label>
                  <select
                    value={formData.courseType}
                    onChange={(e) => handleInputChange('courseType', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Seleccionar tipo</option>
                    <option value="course">Curso</option>
                    <option value="certification">Certificación</option>
                    <option value="degree">Título</option>
                    <option value="workshop">Taller</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción Adicional</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Información adicional sobre el certificado..."
                    rows={3}
                  />
                </div>

                <Button 
                  onClick={handleIssueCertificate}
                  disabled={isIssuing || !isConnected}
                  className="w-full glow-primary"
                  size="lg"
                >
                  {isIssuing ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Emitiendo certificado...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Emitir Certificado
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'manage' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Certificados Emitidos</h2>
              <div className="text-sm text-muted-foreground">
                Total: {certificates.length} certificados
              </div>
            </div>

            <div className="grid gap-4">
              {certificates.map((cert) => (
                <Card key={cert.id} className="glass-effect hover:glow-primary transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-2">{cert.courseName}</h3>
                        <p className="text-muted-foreground">Titular: {cert.recipientName}</p>
                        <p className="text-muted-foreground">Institución: {cert.institutionName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Commitment:</p>
                        <p className="font-mono text-sm bg-muted/50 p-2 rounded">{cert.certificateHash}</p>
                        <p className="text-sm text-muted-foreground mt-2">Fecha: {cert.issuedAt}</p>
                      </div>
                      <div className="flex flex-col justify-between">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-accent" />
                          <span className="text-sm text-accent font-medium">Emitido</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Atestación: {cert.easUID}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-2">Analíticas de Certificados</h2>
              <p className="text-muted-foreground">Estadísticas de emisión y tendencias</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="glass-effect">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Certificados</p>
                      <p className="text-3xl font-bold gradient-text">{certificates.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-effect">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Este Mes</p>
                      <p className="text-3xl font-bold gradient-text">{certificates.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-accent" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-effect">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Certificados Válidos</p>
                      <p className="text-3xl font-bold gradient-text">
                        {certificates.filter(c => c.isValid).length}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
