import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Web3 from 'web3';
import { SIMPLE_CERTIFICATE_ABI, CONTRACT_ADDRESS } from '@/lib/contractABI';
import { switchToArbitrumSepolia, isCorrectNetwork, getCurrentNetworkName } from '@/lib/networkConfig';
import { DEPLOYMENT_CONFIG } from '@/lib/deploymentConfig';

// Interfaces reales
interface Certificate {
  id: number;
  recipientName: string;
  institutionName: string;
  courseName: string;
  description: string;
  issuedAt: number;
  completionDate: number;
  grade: number;
  issuer: string;
  recipient: string;
  certificateHash: string;
  easUID: string;
  isValid: boolean;
}

interface VerificationResult {
  certificateId: number;
  level: number;
  isValid: boolean;
  score: number;
  hashValid: boolean;
  easValid: boolean;
  issuerValid: boolean;
  timeValid: boolean;
  errors: string[];
  timestamp: number;
  verifier: string;
}

interface ZKProof {
  certificateId: number;
  minGradeThreshold: number;
  proofHash: string;
  commitment: string;
  gradeAboveThreshold: boolean;
}

interface RealCertificateManagerProps {
  className?: string;
}

export const RealCertificateManager = ({ className }: RealCertificateManagerProps) => {
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [contract, setContract] = useState<any>(null);
  const [currentAccount, setCurrentAccount] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'issuer' | 'holder' | 'verifier' | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [networkStatus, setNetworkStatus] = useState<{
    isCorrect: boolean;
    currentNetwork: string;
  }>({ isCorrect: false, currentNetwork: 'Desconocida' });

  // Estados para formularios
  const [issueForm, setIssueForm] = useState({
    recipientName: '',
    institutionName: '',
    recipientAddress: '',
    courseName: '',
    description: '',
    completionDate: '',
    grade: ''
  });

  const [verifyForm, setVerifyForm] = useState({
    certificateId: '',
    level: '1'
  });

  const [zkForm, setZkForm] = useState({
    certificateId: '',
    minGrade: ''
  });

  const [userCertificates, setUserCertificates] = useState<Certificate[]>([]);

  const [zkVerifyForm, setZkVerifyForm] = useState({
    zkProofJson: ''
  });

  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [zkProofResult, setZkProofResult] = useState<ZKProof | null>(null);
  const [zkVerificationResult, setZkVerificationResult] = useState<{isValid: boolean, details: string} | null>(null);

  // Inicializar Web3
  useEffect(() => {
    initializeWeb3();
  }, []);

  // Verificar red cuando se conecta la cuenta
  useEffect(() => {
    if (currentAccount) {
      checkNetwork();
    }
  }, [currentAccount]);

  const initializeWeb3 = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const web3Instance = new Web3((window as any).ethereum);
      setWeb3(web3Instance);

      const contractInstance = new web3Instance.eth.Contract(
        SIMPLE_CERTIFICATE_ABI as any,
        CONTRACT_ADDRESS
      );
      setContract(contractInstance);

      // Obtener cuenta actual
      try {
        const accounts = await web3Instance.eth.getAccounts();
        if (accounts.length > 0) {
          setCurrentAccount(accounts[0]);
        }
      } catch (error) {
        console.error('Error getting accounts:', error);
      }
    }
  };

  const connectWallet = async () => {
    if (!web3) return;

    try {
      const accounts = await (window as any).ethereum.request({
        method: 'eth_requestAccounts',
      });
      setCurrentAccount(accounts[0]);
      
      // Verificar red
      await checkNetwork();
      
      setSuccess('Wallet conectada exitosamente');
    } catch (error) {
      setError('Error conectando wallet: ' + (error as any).message);
    }
  };

  // Función para verificar y cambiar red
  const checkNetwork = async () => {
    try {
      const isCorrect = await isCorrectNetwork();
      const currentNetwork = await getCurrentNetworkName();
      
      setNetworkStatus({
        isCorrect,
        currentNetwork
      });

      if (!isCorrect) {
        setError(`⚠️ Red incorrecta: Estás conectado a ${currentNetwork}. 
        
El sistema requiere Arbitrum Sepolia para funcionar correctamente.`);
      }
    } catch (error) {
      console.error('Error verificando red:', error);
    }
  };

  // Función para cambiar a Arbitrum Sepolia
  const handleSwitchNetwork = async () => {
    try {
      await switchToArbitrumSepolia();
      await checkNetwork();
      setSuccess('Red cambiada a Arbitrum Sepolia exitosamente');
    } catch (error) {
      setError('Error cambiando red: ' + (error as any).message);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  // Emitir certificado
  const handleIssueCertificate = async () => {
    if (!contract || !currentAccount) {
      setError('Conecta tu wallet primero');
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      // Validaciones
      if (!issueForm.recipientName || !issueForm.institutionName || 
          !issueForm.recipientAddress || !issueForm.courseName ||
          !issueForm.completionDate || !issueForm.grade) {
        throw new Error('Todos los campos son obligatorios');
      }

      if (!web3?.utils.isAddress(issueForm.recipientAddress)) {
        throw new Error('Dirección del destinatario inválida');
      }

      const gradeNum = parseInt(issueForm.grade);
      if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 100) {
        throw new Error('El grado debe ser un número entre 0 y 100');
      }

      const completionTimestamp = new Date(issueForm.completionDate).getTime() / 1000;
      if (isNaN(completionTimestamp)) {
        throw new Error('Fecha de completación inválida');
      }

      console.log('🎓 Emitiendo certificado con validaciones reales...');

      const transaction = await contract.methods
        .issueCertificate(
          issueForm.recipientName,
          issueForm.institutionName,
          issueForm.recipientAddress,
          issueForm.courseName,
          issueForm.description,
          Math.floor(completionTimestamp),
          gradeNum
        )
        .send({ from: currentAccount });

      const certificateId = transaction.events?.CertificateIssued?.returnValues?.id;

      setSuccess(`✅ Certificado emitido exitosamente!
      
ID del Certificado: ${certificateId}
Hash de Transacción: ${transaction.transactionHash}

📝 Detalles del Certificado:
- Titular: ${issueForm.recipientName}
- Institución: ${issueForm.institutionName}
- Curso: ${issueForm.courseName}
- Grado: ${gradeNum}/100

🔗 El certificado está almacenado en blockchain con validaciones cryptográficas reales.`);

      // Limpiar formulario
      setIssueForm({
        recipientName: '',
        institutionName: '',
        recipientAddress: '',
        courseName: '',
        description: '',
        completionDate: '',
        grade: ''
      });

      loadCertificates();

    } catch (error: any) {
      console.error('Error emitiendo certificado:', error);
      setError('Error al emitir certificado: ' + (error.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  // Verificar certificado
  const handleVerifyCertificate = async () => {
    if (!contract || !currentAccount) {
      setError('Conecta tu wallet primero');
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      const certificateId = parseInt(verifyForm.certificateId);
      const level = parseInt(verifyForm.level);

      if (isNaN(certificateId) || certificateId <= 0) {
        throw new Error('ID de certificado inválido');
      }

      console.log(`🔍 Verificando certificado ${certificateId} en nivel ${level}...`);

      const transaction = await contract.methods
        .verifyCertificate(certificateId, level)
        .send({ from: currentAccount });

      const verificationId = transaction.events?.CertificateVerified?.returnValues?.verificationId;

      // Obtener resultado de verificación
      const result = await contract.methods
        .getVerificationResult(verificationId)
        .call();

      const verificationResult: VerificationResult = {
        certificateId: parseInt(result.certificateId),
        level: parseInt(result.level),
        isValid: result.isValid,
        score: parseInt(result.score),
        hashValid: result.hashValid,
        easValid: result.easValid,
        issuerValid: result.issuerValid,
        timeValid: result.timeValid,
        errors: result.errors,
        timestamp: parseInt(result.timestamp),
        verifier: result.verifier
      };

      setVerificationResult(verificationResult);

      if (verificationResult.isValid) {
        setSuccess('✅ Verificación exitosa - Certificado válido');
      } else {
        setError('❌ Verificación falló - Certificado inválido');
      }

    } catch (error: any) {
      console.error('Error verificando certificado:', error);
      setError('Error al verificar certificado: ' + (error.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  // Generar prueba ZK
  const handleGenerateZKProof = async () => {
    if (!contract || !currentAccount) {
      setError('Conecta tu wallet primero');
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      const certificateId = parseInt(zkForm.certificateId);
      const minGrade = parseInt(zkForm.minGrade);

      if (isNaN(certificateId) || isNaN(minGrade)) {
        throw new Error('ID de certificado y grado mínimo son requeridos');
      }

      console.log(`🔐 Generando prueba ZK para certificado ${certificateId} con umbral ${minGrade}%...`);

      const result = await contract.methods
        .generateZKProof(certificateId, minGrade)
        .call({ from: currentAccount });

      const zkProof: ZKProof = {
        certificateId: parseInt(result.certificateId),
        minGradeThreshold: parseInt(result.minGradeThreshold),
        proofHash: result.proofHash,
        commitment: result.commitment,
        gradeAboveThreshold: result.gradeAboveThreshold
      };

      setZkProofResult(zkProof);

      setSuccess(`✅ Prueba ZK generada exitosamente!

🔒 La prueba cryptográfica demuestra que:
${zkProof.gradeAboveThreshold 
  ? `✓ El titular tiene un grado ≥ ${minGrade}% SIN revelar el grado exacto`
  : `✗ El titular NO tiene un grado ≥ ${minGrade}%`}

📋 Copia la prueba ZK completa para enviarla a verificadores.`);

    } catch (error: any) {
      console.error('Error generando prueba ZK:', error);
      setError('Error al generar prueba ZK: ' + (error.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  // Verificar prueba ZK
  const handleVerifyZKProof = async () => {
    if (!contract) {
      setError('Contrato no inicializado');
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      if (!zkVerifyForm.zkProofJson.trim()) {
        throw new Error('Prueba ZK JSON es requerida');
      }

      // Intentar parsear el JSON primero
      let zkProof;
      try {
        zkProof = JSON.parse(zkVerifyForm.zkProofJson);
      } catch (parseError) {
        throw new Error('❌ JSON inválido: El formato de la prueba ZK no es válido. Verifica que sea un JSON válido.');
      }

      // Validar estructura básica de la prueba ZK
      if (!zkProof || typeof zkProof !== 'object') {
        throw new Error('❌ Estructura inválida: La prueba ZK debe ser un objeto JSON válido.');
      }

      const requiredFields = ['certificateId', 'minGradeThreshold', 'proofHash', 'commitment', 'gradeAboveThreshold'];
      const missingFields = requiredFields.filter(field => !(field in zkProof));
      
      if (missingFields.length > 0) {
        throw new Error(`❌ Campos faltantes: La prueba ZK debe contener los campos: ${missingFields.join(', ')}`);
      }

      // Validar tipos de datos
      if (typeof zkProof.certificateId !== 'number' || zkProof.certificateId <= 0) {
        throw new Error('❌ certificateId debe ser un número mayor a 0');
      }

      if (typeof zkProof.minGradeThreshold !== 'number' || zkProof.minGradeThreshold < 0 || zkProof.minGradeThreshold > 100) {
        throw new Error('❌ minGradeThreshold debe ser un número entre 0 y 100');
      }

      if (typeof zkProof.gradeAboveThreshold !== 'boolean') {
        throw new Error('❌ gradeAboveThreshold debe ser un valor booleano (true/false)');
      }

      console.log('🔍 Verificando prueba ZK...', zkProof);

      const result = await contract.methods
        .verifyZKProof(zkProof)
        .call();

      setZkVerificationResult({
        isValid: result.isValid,
        details: result.details
      });

      if (result.isValid) {
        setSuccess(`✅ Prueba ZK verificada exitosamente!

🔒 Detalles de la verificación:
${result.details}

✓ La prueba cryptográfica es válida y auténtica.`);
      } else {
        setError(`❌ Prueba ZK inválida

🚫 Motivo: ${result.details}

La prueba ZK no pudo ser verificada. Esto puede deberse a:
• Prueba manipulada o corrupta
• Certificado inexistente o inválido
• Datos inconsistentes en la prueba
• Prueba generada con parámetros incorrectos`);
      }

    } catch (error: any) {
      console.error('Error verificando prueba ZK:', error);
      
      // Extraer mensaje de error más específico
      let errorMessage = 'Error desconocido';
      
      if (error.message) {
        // Si ya es un mensaje personalizado (comienza con ❌), usarlo directamente
        if (error.message.startsWith('❌')) {
          errorMessage = error.message;
        } else if (error.message.includes('Web3ValidatorError')) {
          errorMessage = '❌ Error de validación Web3: Los datos de la prueba ZK no cumplen con el formato esperado por el contrato.';
        } else if (error.message.includes('revert')) {
          errorMessage = '❌ Error del contrato: ' + error.message.split('revert')[1]?.trim() || 'El contrato rechazó la transacción.';
        } else if (error.message.includes('invalid JSON')) {
          errorMessage = '❌ JSON inválido: Verifica que el formato de la prueba ZK sea JSON válido.';
        } else {
          errorMessage = '❌ ' + error.message;
        }
      }

      setError(`Error al verificar prueba ZK:

${errorMessage}

💡 Consejos para solucionar:
• Verifica que la prueba ZK sea válida y esté completa
• Asegúrate de que el JSON esté bien formateado
• Confirma que el certificado referenciado existe
• Intenta generar una nueva prueba ZK`);
    } finally {
      setLoading(false);
    }
  };

  // Cargar certificados
  const loadCertificates = async () => {
    if (!contract) {
      console.log('❌ No hay contrato inicializado');
      return;
    }

    if (!networkStatus.isCorrect) {
      console.log('❌ Red incorrecta, no se pueden cargar certificados');
      setError('Cambia a Arbitrum Sepolia para ver los certificados');
      return;
    }

    try {
      console.log('📋 Cargando certificados desde:', CONTRACT_ADDRESS);
      console.log('🌐 Red:', DEPLOYMENT_CONFIG.network.name);
      
      const counter = await contract.methods.getCertificateCounter().call();
      const totalCerts = parseInt(counter);
      
      console.log(`📊 Total de certificados en el contrato: ${totalCerts}`);
      
      if (totalCerts === 0) {
        console.log('ℹ️ No hay certificados emitidos aún');
        setCertificates([]);
        setUserCertificates([]);
        return;
      }
      
      const certs: Certificate[] = [];
      
      // Cargar máximo 20 certificados más recientes
      const startId = Math.max(1, totalCerts - 19);
      
      for (let i = startId; i <= totalCerts; i++) {
        try {
          console.log(`🔍 Cargando certificado ${i}...`);
          const cert = await contract.methods.getCertificate(i).call();
          
          if (cert.id !== '0' && cert.isValid) {
            const certificateData: Certificate = {
              id: parseInt(cert.id),
              recipientName: cert.recipientName,
              institutionName: cert.institutionName,
              courseName: cert.courseName,
              description: cert.description,
              issuedAt: parseInt(cert.issuedAt),
              completionDate: parseInt(cert.completionDate),
              grade: parseInt(cert.grade),
              issuer: cert.issuer,
              recipient: cert.recipient,
              certificateHash: cert.certificateHash,
              easUID: cert.easUID,
              isValid: cert.isValid
            };
            
            certs.push(certificateData);
            console.log(`✅ Certificado ${i} cargado:`, certificateData.courseName);
          } else {
            console.log(`⚠️ Certificado ${i} inválido o vacío`);
          }
        } catch (certError) {
          console.warn(`❌ No se pudo cargar el certificado ${i}:`, certError);
        }
      }

      console.log(`📊 ${certs.length} certificados cargados exitosamente`);
      setCertificates(certs);
      
      // Filtrar certificados del usuario actual
      if (currentAccount) {
        const userCerts = certs.filter(cert => 
          cert.recipient.toLowerCase() === currentAccount.toLowerCase()
        );
        console.log(`👤 Certificados del usuario ${currentAccount.slice(0, 6)}...${currentAccount.slice(-4)}: ${userCerts.length}`);
        setUserCertificates(userCerts);
      }
      
      if (certs.length > 0) {
        setSuccess(`✅ ${certs.length} certificados cargados desde Arbitrum Sepolia`);
      }
      
    } catch (error) {
      console.error('❌ Error cargando certificados:', error);
      setError(`Error cargando certificados: ${(error as any).message || 'Error desconocido'}
      
🔧 Posibles soluciones:
• Verifica que estés en Arbitrum Sepolia
• Asegúrate de que el contrato esté desplegado
• Revisa la consola del navegador para más detalles`);
    }
  };

  useEffect(() => {
    if (contract && currentAccount && networkStatus.isCorrect) {
      console.log('🔄 Cargando certificados automáticamente...');
      loadCertificates();
    }
  }, [contract, currentAccount, networkStatus.isCorrect]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const getVerificationLevelName = (level: number) => {
    const levels = ['Básico', 'Estándar', 'Premium', 'Forense'];
    return levels[level] || 'Desconocido';
  };

  if (!currentAccount) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center space-y-4">
          <h3 className="text-lg font-medium mb-2">Sistema Real de Certificados Blockchain</h3>
          <p className="text-gray-600 mb-4">
            Sistema de verificación real con validaciones cryptográficas, EAS y reputación de emisores
          </p>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
            <strong>🌐 Red Requerida:</strong> Arbitrum Sepolia<br />
            <strong>📡 RPC URL:</strong> https://sepolia-rollup.arbitrum.io/rpc<br />
            <strong>🔗 Chain ID:</strong> 421614
          </div>
          <Button onClick={connectWallet}>
            Conectar Wallet
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header de Control de Wallet */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Sistema Real de Certificados</h3>
              <p className="text-sm text-gray-600">
                Sistema de verificación con validaciones cryptográficas, EAS y reputación
              </p>
            </div>
            <div className="flex gap-2 items-center">
              <div className="text-right">
                <p className="text-xs text-gray-500">Wallet Conectada</p>
                <p className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                  {currentAccount?.slice(0, 6)}...{currentAccount?.slice(-4)}
                </p>
                <div className={`text-xs mt-1 px-2 py-1 rounded ${
                  networkStatus.isCorrect 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  🌐 {networkStatus.currentNetwork}
                </div>
              </div>
              {!networkStatus.isCorrect && (
                <Button 
                  onClick={handleSwitchNetwork}
                  variant="default"
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  🔄 Cambiar a Arbitrum
                </Button>
              )}
              <Button 
                onClick={connectWallet}
                variant="outline"
                size="sm"
              >
                🔗 Cambiar Wallet
              </Button>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm font-medium text-gray-700">Selecciona tu Rol:</p>
              <div className="flex gap-2">
                <Button 
                  variant={userRole === 'issuer' ? 'default' : 'outline'}
                  onClick={() => setUserRole('issuer')}
                  size="sm"
                >
                  🎓 Emisor
                </Button>
                <Button 
                  variant={userRole === 'holder' ? 'default' : 'outline'}
                  onClick={() => setUserRole('holder')}
                  size="sm"
                >
                  👤 Titular
                </Button>
                <Button 
                  variant={userRole === 'verifier' ? 'default' : 'outline'}
                  onClick={() => setUserRole('verifier')}
                  size="sm"
                >
                  🔍 Verificador
                </Button>
              </div>
            </div>
            
            {userRole && (
              <div className="text-sm text-gray-600">
                <p>
                  <strong>Rol Activo:</strong> {
                    userRole === 'issuer' ? '🎓 Emisor de Certificados' :
                    userRole === 'holder' ? '👤 Titular de Certificados' :
                    '🔍 Verificador de Certificados'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Mensajes */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800 whitespace-pre-line">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800 whitespace-pre-line">{success}</p>
        </div>
      )}

      {/* Panel de Emisor */}
      {userRole === 'issuer' && (
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Emitir Certificado</h3>
          <p className="text-sm text-gray-600 mb-4">
            Sistema con validaciones cryptográficas reales, EAS attestation y reputación del emisor
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="recipientName">Nombre del Titular *</Label>
              <Input
                id="recipientName"
                value={issueForm.recipientName}
                onChange={(e) => setIssueForm(prev => ({ ...prev, recipientName: e.target.value }))}
                placeholder="Juan Pérez García"
              />
            </div>
            <div>
              <Label htmlFor="institutionName">Institución *</Label>
              <Input
                id="institutionName"
                value={issueForm.institutionName}
                onChange={(e) => setIssueForm(prev => ({ ...prev, institutionName: e.target.value }))}
                placeholder="Universidad Blockchain Certificada"
              />
            </div>
            <div>
              <Label htmlFor="recipientAddress">Dirección del Titular *</Label>
              <Input
                id="recipientAddress"
                value={issueForm.recipientAddress}
                onChange={(e) => setIssueForm(prev => ({ ...prev, recipientAddress: e.target.value }))}
                placeholder="0x..."
              />
            </div>
            <div>
              <Label htmlFor="courseName">Curso *</Label>
              <Input
                id="courseName"
                value={issueForm.courseName}
                onChange={(e) => setIssueForm(prev => ({ ...prev, courseName: e.target.value }))}
                placeholder="Introducción a Blockchain y Solidity"
              />
            </div>
            <div>
              <Label htmlFor="completionDate">Fecha de Completación *</Label>
              <Input
                id="completionDate"
                type="date"
                value={issueForm.completionDate}
                onChange={(e) => setIssueForm(prev => ({ ...prev, completionDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="grade">Grado (0-100) *</Label>
              <Input
                id="grade"
                type="number"
                min="0"
                max="100"
                value={issueForm.grade}
                onChange={(e) => setIssueForm(prev => ({ ...prev, grade: e.target.value }))}
                placeholder="85"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={issueForm.description}
                onChange={(e) => setIssueForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción adicional del certificado..."
                rows={3}
              />
            </div>
          </div>
          
          <Button 
            onClick={handleIssueCertificate} 
            disabled={loading}
            className="mt-4 w-full"
          >
            {loading ? 'Emitiendo...' : '🎓 Emitir Certificado con Validaciones Reales'}
          </Button>
        </Card>
      )}

      {/* Panel de Verificador */}
      {userRole === 'verifier' && (
        <>

          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">🔐 Verificar Prueba Zero-Knowledge</h3>
            <p className="text-sm text-gray-600 mb-4">
              Verificar que alguien tiene un certificado con grado ≥ umbral SIN revelar datos privados
            </p>
            
            <div>
              <Label htmlFor="zkProofJson">Prueba ZK (JSON)</Label>
              <Textarea
                id="zkProofJson"
                value={zkVerifyForm.zkProofJson}
                onChange={(e) => setZkVerifyForm(prev => ({ ...prev, zkProofJson: e.target.value }))}
                placeholder="Pega aquí la prueba ZK en formato JSON..."
                rows={6}
              />
            </div>
            
            <Button 
              onClick={handleVerifyZKProof} 
              disabled={loading || !zkVerifyForm.zkProofJson}
              className="mt-4 w-full"
            >
              {loading ? 'Verificando...' : '🔐 Verificar Prueba Zero-Knowledge'}
            </Button>

            {/* {zkVerificationResult && (
              <div className={`mt-4 p-4 rounded-md ${
                zkVerificationResult.isValid 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <h4 className={`font-medium mb-2 ${
                  zkVerificationResult.isValid ? 'text-green-800' : 'text-red-800'
                }`}>
                  {zkVerificationResult.isValid ? '✅ Prueba ZK Válida' : '❌ Prueba ZK Inválida'}
                </h4>
                <p className="text-sm">
                  <strong>Detalles:</strong> {zkVerificationResult.details}
                </p>
              </div>
            )} */}
          </Card>
        </>
      )}

      {/* Panel de Titular */}
      {userRole === 'holder' && (
        <>
          {/* Mis Certificados */}
          {/* {userCertificates.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">� Mis Certificados</h3>
              <div className="grid gap-3">
                {userCertificates.map((cert) => (
                  <div key={cert.id} className="p-3 border rounded-lg bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-sm">{cert.courseName}</h4>
                      <span className={`px-2 py-1 text-xs rounded ${
                        cert.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {cert.isValid ? 'Válido' : 'Inválido'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div><strong>ID:</strong> {cert.id}</div>
                      <div><strong>Institución:</strong> {cert.institutionName}</div>
                      <div><strong>Grado:</strong> {cert.grade}/100</div>
                      <div><strong>Completado:</strong> {formatDate(cert.completionDate)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )} */}

          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">Generar Prueba ZK</h3>
            <p className="text-sm text-gray-600 mb-4">
              Demuestra que tienes un grado ≥ umbral SIN revelar tu grado exacto, nombre u otros datos privados
            </p>
            
            {userCertificates.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No tienes certificados disponibles</p>
                <p className="text-xs text-gray-400">
                  Necesitas que alguien emita un certificado a tu dirección: {currentAccount}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="zkCertSelect">Selecciona tu Certificado</Label>
                    <select 
                      id="zkCertSelect"
                      className="w-full p-2 border rounded-md"
                      value={zkForm.certificateId}
                      onChange={(e) => setZkForm(prev => ({ ...prev, certificateId: e.target.value }))}
                    >
                      <option value="">-- Selecciona un certificado --</option>
                      {userCertificates.map((cert) => (
                        <option key={cert.id} value={cert.id.toString()}>
                          ID {cert.id}: {cert.courseName} - Grado: {cert.grade}%
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="zkMinGrade">Umbral Mínimo de Grado (%)</Label>
                    <Input
                      id="zkMinGrade"
                      type="number"
                      min="0"
                      max="100"
                      value={zkForm.minGrade}
                      onChange={(e) => setZkForm(prev => ({ ...prev, minGrade: e.target.value }))}
                      placeholder="75"
                    />
                  </div>
                </div>

                {/* Información del certificado seleccionado */}
                {zkForm.certificateId && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    {(() => {
                      const selectedCert = userCertificates.find(c => c.id.toString() === zkForm.certificateId);
                      if (!selectedCert) return null;
                      
                      const minGrade = parseInt(zkForm.minGrade || '0');
                      const willPass = selectedCert.grade >= minGrade;
                      
                      return (
                        <div>
                          <h4 className="font-medium text-blue-800 mb-2">📋 Certificado Seleccionado</h4>
                          <div className="text-sm text-blue-700 space-y-1">
                            <div><strong>Curso:</strong> {selectedCert.courseName}</div>
                            <div><strong>Institución:</strong> {selectedCert.institutionName}</div>
                            <div><strong>Tu Grado:</strong> {selectedCert.grade}/100</div>
                            <div><strong>Completado:</strong> {formatDate(selectedCert.completionDate)}</div>
                          </div>
                          {zkForm.minGrade && (
                            <div className={`mt-2 p-2 rounded text-sm ${
                              willPass 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {willPass 
                                ? `✅ Tu grado (${selectedCert.grade}%) cumple el umbral (≥${minGrade}%)`
                                : `❌ Tu grado (${selectedCert.grade}%) NO cumple el umbral (≥${minGrade}%)`
                              }
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
                
                <Button 
                  onClick={handleGenerateZKProof} 
                  disabled={loading || !zkForm.certificateId || !zkForm.minGrade}
                  className="mt-4 w-full"
                >
                  {loading ? 'Generando...' : '🔐 Generar Prueba Zero-Knowledge'}
                </Button>
              </>
            )}

            {zkProofResult && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h4 className="font-medium text-blue-800 mb-2">🔐 Prueba ZK Generada</h4>
                <p className="text-sm text-blue-700 mb-3">
                  <strong>Estado:</strong> {zkProofResult.gradeAboveThreshold 
                    ? `✓ Tu grado es ≥ ${zkProofResult.minGradeThreshold}%` 
                    : `✗ Tu grado es < ${zkProofResult.minGradeThreshold}%`}
                </p>
                
                <div className="bg-white p-3 rounded border font-mono text-xs overflow-auto max-h-48">
                  <pre>{JSON.stringify(zkProofResult, null, 2)}</pre>
                </div>
                
                <Button 
                  onClick={() => navigator.clipboard.writeText(JSON.stringify(zkProofResult, null, 2))}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  📋 Copiar Prueba ZK
                </Button>
                
                <p className="text-xs text-blue-600 mt-2">
                  💡 Envía esta prueba a verificadores para demostrar tu grado sin revelar información privada
                </p>
              </div>
            )}
          </Card>
        </>
      )}

      {/* Panel de Control de Certificados */}
      {/* <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">📋 Certificados en Arbitrum Sepolia</h3>
          <div className="flex gap-2">
            <Button 
              onClick={loadCertificates}
              variant="outline"
              size="sm"
              disabled={loading || !networkStatus.isCorrect}
            >
              🔄 Recargar Certificados
            </Button>
            {certificates.length > 0 && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                {certificates.length} certificados
              </span>
            )}
          </div>
        </div>

        {!networkStatus.isCorrect ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-2">⚠️ Red incorrecta</p>
            <p className="text-xs text-gray-400 mb-4">
              Cambia a Arbitrum Sepolia para ver los certificados
            </p>
            <Button onClick={handleSwitchNetwork} size="sm">
              🔄 Cambiar a Arbitrum Sepolia
            </Button>
          </div>
        ) : certificates.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-2">📄 No hay certificados disponibles</p>
            <p className="text-xs text-gray-400 mb-4">
              Los certificados emitidos aparecerán aquí automáticamente
            </p>
            <div className="text-xs text-gray-400 space-y-1">
              <div><strong>Contrato:</strong> {CONTRACT_ADDRESS}</div>
              <div><strong>Red:</strong> {DEPLOYMENT_CONFIG.network.name}</div>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {certificates.map((cert) => (
              <div key={cert.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium text-lg">{cert.courseName}</h4>
                    <p className="text-sm text-gray-600">{cert.institutionName}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 text-xs rounded mb-2 block ${
                      cert.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {cert.isValid ? '✅ Válido' : '❌ Inválido'}
                    </span>
                    <div className="text-xl font-bold text-blue-600">
                      {cert.grade}/100
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div><strong>🆔 ID:</strong> {cert.id}</div>
                    <div><strong>👤 Titular:</strong> {cert.recipientName}</div>
                    <div><strong>📚 Curso:</strong> {cert.courseName}</div>
                    {cert.description && (
                      <div><strong>📝 Descripción:</strong> {cert.description}</div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div><strong>✅ Completado:</strong> {formatDate(cert.completionDate)}</div>
                    <div><strong>📅 Emitido:</strong> {formatDate(cert.issuedAt)}</div>
                    <div><strong>🏫 Emisor:</strong> 
                      <span className="font-mono text-xs ml-1">
                        {cert.issuer.slice(0, 6)}...{cert.issuer.slice(-4)}
                      </span>
                    </div>
                    <div><strong>🎓 Destinatario:</strong> 
                      <span className="font-mono text-xs ml-1">
                        {cert.recipient.slice(0, 6)}...{cert.recipient.slice(-4)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                      <strong>🔗 Hash:</strong> 
                      <span className="font-mono ml-1">{cert.certificateHash.slice(0, 16)}...</span>
                    </div>
                    <Button
                      onClick={() => window.open(`${DEPLOYMENT_CONFIG.network.explorer}/tx/${cert.certificateHash}`, '_blank')}
                      variant="outline"
                      size="sm"
                    >
                      🔍 Ver en Explorer
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card> */}
    </div>
  );
};
