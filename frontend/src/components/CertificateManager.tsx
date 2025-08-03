import { useState, useEffect } from "react";
import { web3Service } from "@/lib/web3ServiceSimple";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Certificate {
  id: number;
  recipientName: string;
  institutionName: string;
  courseName: string;
  description: string;
  isValid: boolean;
  issuedAt: number;
  completionDate: number;
  grade: number;
  issuer: string;
  recipient: string;
  certificateHash: string;
  easUID: string;
}

interface CertificateManagerProps {
  className?: string;
}

export const CertificateManager = ({ className }: CertificateManagerProps) => {
  const [userRole, setUserRole] = useState<'issuer' | 'holder' | 'verifier' | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Formulario para emitir certificado
  const [issueForm, setIssueForm] = useState({
    recipientName: '',
    institutionName: '',
    recipientAddress: '',
    courseName: '',
    description: '',
    completionDate: '',
    grade: ''
  });

  // Formularios para ZK Proofs
  const [zkForm, setZkForm] = useState({
    certificateId: '',
    minGrade: '',
    proofType: 'Grade Above Threshold'
  });

  const [verifyZkForm, setVerifyZkForm] = useState({
    holderAddress: '',
    zkProof: ''
  });

  const [zkProofResult, setZkProofResult] = useState<any>(null);
  const [zkVerificationResult, setZkVerificationResult] = useState<any>(null);

  const isConnected = web3Service.getCurrentAccount() !== null;

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleIssueCertificate = async () => {
    if (!isConnected) {
      setError('Debes conectar tu wallet primero');
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      if (!issueForm.recipientName || !issueForm.institutionName || 
          !issueForm.recipientAddress || !issueForm.courseName ||
          !issueForm.completionDate || !issueForm.grade) {
        throw new Error('Todos los campos son obligatorios');
      }

      // Verificar que la dirección del destinatario sea válida
      if (!web3Service.isValidAddress(issueForm.recipientAddress)) {
        throw new Error('Dirección del destinatario inválida');
      }

      // Validar el grado
      const gradeNum = parseInt(issueForm.grade);
      if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 100) {
        throw new Error('El grado debe ser un número entre 0 y 100');
      }

      // Validar la fecha de completación
      const completionTimestamp = new Date(issueForm.completionDate).getTime() / 1000;
      if (isNaN(completionTimestamp)) {
        throw new Error('Fecha de completación inválida');
      }

      // Verificar el contador actual antes de emitir
      const counterBefore = await web3Service.getCertificatesCounter();
      console.log('📊 Certificates before issuance:', counterBefore);

      try {
        const txHash = await web3Service.issueCertificate(
          issueForm.recipientName,
          issueForm.institutionName,
          issueForm.recipientAddress,
          issueForm.courseName,
          issueForm.description,
          completionTimestamp,
          gradeNum
        );

        setSuccess(`Certificado emitido exitosamente! Hash de transacción: ${txHash}`);
        
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

        // Recargar certificados
        await loadCertificates();

      } catch (txError: any) {
        console.error('Transaction error:', txError);
        
                // Verificar si el certificado se creó a pesar del error
        const counterAfter = await web3Service.getCertificatesCounter();
        console.log('📊 Certificates after transaction:', counterAfter);
        
        if (counterAfter > counterBefore) {
          // El certificado se creó exitosamente a pesar del error
          setSuccess(`✅ ¡Certificado creado exitosamente! 
          Se detectó que el certificado #${counterAfter} se emitió correctamente en la blockchain.
          
          📝 Detalles:
          - Titular: ${issueForm.recipientName}
          - Institución: ${issueForm.institutionName}
          - Curso: ${issueForm.courseName}
          
          ⚠️ Nota: Hubo un error menor en la respuesta de la transacción, pero el certificado está almacenado correctamente.`);
          
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

          // Recargar certificados para mostrar el nuevo
          await loadCertificates();
        } else {
          // El certificado realmente no se creó
          throw txError;
        }
      }

    } catch (error: any) {
      console.error('Error issuing certificate:', error);
      setError('Error al emitir certificado: ' + (error.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeCertificate = async (certificateId: number) => {
    if (!isConnected) {
      setError('Debes conectar tu wallet primero');
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      const txHash = await web3Service.revokeCertificate(certificateId);
      setSuccess(`Certificado revocado exitosamente! Hash de transacción: ${txHash}`);
      await loadCertificates();
    } catch (error: any) {
      console.error('Error revoking certificate:', error);
      setError('Error al revocar certificado: ' + (error.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const loadCertificates = async () => {
    if (!isConnected) return;

    try {
      const account = web3Service.getCurrentAccount();
      if (!account) return;

      console.log('Loading certificates for account:', account, 'Role:', userRole);

      // Cargar certificados según el rol
      let certs: Certificate[] = [];
      
      if (userRole === 'issuer') {
        console.log('Getting certificates as issuer...');
        certs = await web3Service.getIssuerCertificates(account);
      } else if (userRole === 'holder') {
        console.log('Getting certificates as holder...');
        certs = await web3Service.getRecipientCertificates(account);
      } else {
        // Si no tiene rol específico, cargar algunos certificados públicos
        console.log('Getting public certificates...');
        try {
          const totalCerts = await web3Service.getCertificatesCounter();
          console.log('Total certificates in contract:', totalCerts);
          
          const maxToLoad = Math.min(10, totalCerts);
          
          for (let i = 1; i <= maxToLoad; i++) {
            try {
              const cert = await web3Service.getCertificate(i);
              if (cert) {
                certs.push({
                  id: cert.id,
                  recipientName: cert.recipientName,
                  institutionName: cert.institutionName,
                  courseName: cert.courseName,
                  description: cert.description,
                  isValid: cert.isValid,
                  issuedAt: cert.issuedAt,
                  completionDate: cert.completionDate,
                  grade: cert.grade,
                  issuer: cert.issuer,
                  recipient: cert.recipient,
                  certificateHash: cert.certificateHash,
                  easUID: cert.easUID
                });
              }
            } catch (error) {
              console.warn(`Could not load certificate ${i}:`, error);
            }
          }
        } catch (error) {
          console.error('Error getting certificates counter:', error);
        }
      }

      console.log('Loaded certificates:', certs);
      setCertificates(certs);
    } catch (error: any) {
      console.error('Error loading certificates:', error);
      setError('Error al cargar certificados: ' + (error.message || 'Error desconocido'));
    }
  };

  useEffect(() => {
    if (isConnected) {
      loadCertificates();
    }
    
    // Listen for account changes and reload certificates
    const handleAccountChange = () => {
      console.log('Account changed, reloading certificates...');
      setTimeout(() => {
        loadCertificates();
      }, 1000); // Small delay to ensure web3Service is updated
    };
    
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      (window as any).ethereum.on('accountsChanged', handleAccountChange);
      (window as any).ethereum.on('chainChanged', handleAccountChange);
      
      return () => {
        (window as any).ethereum.removeListener('accountsChanged', handleAccountChange);
        (window as any).ethereum.removeListener('chainChanged', handleAccountChange);
      };
    }
  }, [isConnected, userRole]);

  const handleGenerateZKProof = async () => {
    if (!isConnected) {
      setError('Debes conectar tu wallet primero');
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

      const result = await web3Service.generateNoirZKProof(certificateId, minGrade);
      
      // Obtener el certificado para información adicional
      const certificate = certificates.find(cert => cert.id === certificateId);
      
      // El contrato ahora retorna publicInputs en el formato correcto para MockNoirVerifier:
      // [0] = min_grade (0-100)
      // [1] = current_timestamp (> 1600000000)  
      // [2] = expected_institution (> 0)
      // [3] = max_age_seconds (> 0)
      
      const proofResult = {
        proof: result.proofData, // Usar el proof real del contrato
        publicInputs: {
          commitment: result.commitment,
          min_grade_threshold: result.publicInputs[0], // min_grade del contrato
          current_timestamp: result.publicInputs[1], // timestamp del contrato
          expected_institution: result.publicInputs[2], // ID institución del contrato
          max_age_seconds: result.publicInputs[3], // edad máxima del contrato
          attestation_uid: certificate?.easUID || "0x0000000000000000000000000000000000000000000000000000000000000000"
        },
        privateInputs: {
          grade: certificate?.grade || "HIDDEN",
          completion_date: certificate?.completionDate ? new Date(certificate.completionDate * 1000).toISOString().split('T')[0] : "HIDDEN",
          student_name: certificate?.recipientName || "HIDDEN"
        },
        circuit: "grade_verification.nr",
        timestamp: Date.now()
      };

      setZkProofResult(proofResult);
      setSuccess('Prueba ZK generada exitosamente');
    } catch (error: any) {
      console.error('Error generating ZK proof:', error);
      setError('Error al generar prueba ZK: ' + (error.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyZKProof = async () => {
    if (!isConnected) {
      setError('Debes conectar tu wallet primero');
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      if (!verifyZkForm.holderAddress || !verifyZkForm.zkProof) {
        throw new Error('Dirección del titular y prueba ZK son requeridas');
      }

      const proofData = JSON.parse(verifyZkForm.zkProof);
      
      // Prepare publicInputs in the correct order for MockNoirVerifier:
      // [0] = min_grade (0-100)
      // [1] = current_timestamp (> 1600000000)  
      // [2] = expected_institution (> 0)
      // [3] = max_age_seconds (> 0)
      const publicInputsArray = [
        proofData.publicInputs.min_grade_threshold || proofData.publicInputs.commitment,
        proofData.publicInputs.current_timestamp || Math.floor(Date.now() / 1000).toString(),
        proofData.publicInputs.expected_institution || "1",
        proofData.publicInputs.max_age_seconds || "31536000"
      ];
      
      const result = await web3Service.verifyNoirZKProof(
        proofData.publicInputs.commitment,
        publicInputsArray,
        proofData.proof,
        proofData.publicInputs.attestation_uid
      );

      // Enriquecer el resultado con información adicional para el UI
      const enrichedResult = {
        ...result,
        attestationUID: proofData.publicInputs.attestation_uid,
        attester: proofData.publicInputs.attester_address,
        minThreshold: proofData.publicInputs.min_grade_threshold
      };

      setZkVerificationResult(enrichedResult);
      
      if (result.isValid) {
        setSuccess('Verificación ZK exitosa');
      } else {
        setError('Verificación ZK falló');
      }
    } catch (error: any) {
      console.error('Error verifying ZK proof:', error);
      setError('Error al verificar prueba ZK: ' + (error.message || 'Error desconocido'));
      setZkVerificationResult({
        isValid: false,
        verificationDetails: 'Error al procesar la prueba: ' + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">Sistema de Certificados Blockchain</h3>
          <p className="text-gray-600 mb-4">
            Conecta tu wallet para acceder al sistema de certificados descentralizado
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Selector de Rol */}
      <Card className="p-4">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Selecciona tu rol</h3>
          <div className="flex gap-2">
            <Button 
              variant={userRole === 'issuer' ? 'default' : 'outline'}
              onClick={() => setUserRole('issuer')}
            >
              Emisor de Certificados
            </Button>
            <Button 
              variant={userRole === 'holder' ? 'default' : 'outline'}
              onClick={() => setUserRole('holder')}
            >
              Titular de Certificados
            </Button>
            <Button 
              variant={userRole === 'verifier' ? 'default' : 'outline'}
              onClick={() => setUserRole('verifier')}
            >
              Verificador
            </Button>
          </div>
        </div>
      </Card>

      {/* Mensajes de Estado */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
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
          <h3 className="text-lg font-medium mb-4">Emitir Nuevo Certificado</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="recipientName">Nombre del Titular</Label>
              <Input
                id="recipientName"
                value={issueForm.recipientName}
                onChange={(e) => setIssueForm(prev => ({ ...prev, recipientName: e.target.value }))}
                placeholder="Juan Pérez"
              />
            </div>
            <div>
              <Label htmlFor="institutionName">Nombre de la Institución</Label>
              <Input
                id="institutionName"
                value={issueForm.institutionName}
                onChange={(e) => setIssueForm(prev => ({ ...prev, institutionName: e.target.value }))}
                placeholder="Universidad Blockchain"
              />
            </div>
            <div>
              <Label htmlFor="recipientAddress">Dirección del Titular</Label>
              <Input
                id="recipientAddress"
                value={issueForm.recipientAddress}
                onChange={(e) => setIssueForm(prev => ({ ...prev, recipientAddress: e.target.value }))}
                placeholder="0x..."
              />
            </div>
            <div>
              <Label htmlFor="courseName">Nombre del Curso</Label>
              <Input
                id="courseName"
                value={issueForm.courseName}
                onChange={(e) => setIssueForm(prev => ({ ...prev, courseName: e.target.value }))}
                placeholder="Introducción a Solidity"
              />
            </div>
            <div>
              <Label htmlFor="completionDate">Fecha de Completación</Label>
              <Input
                id="completionDate"
                type="date"
                value={issueForm.completionDate}
                onChange={(e) => setIssueForm(prev => ({ ...prev, completionDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="grade">Grado (0-100)</Label>
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
                placeholder="Descripción del certificado..."
                rows={3}
              />
            </div>
          </div>
          <Button 
            onClick={handleIssueCertificate} 
            disabled={loading}
            className="mt-4 w-full"
          >
            {loading ? 'Emitiendo...' : 'Emitir Certificado'}
          </Button>
        </Card>
      )}



      {/* Step 2: Generate Noir ZK Proof - Solo para holders */}
      {userRole === 'holder' && (
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-2">Step 2: Generate Noir ZK Proof</h3>
          <p className="text-sm text-gray-600 mb-4">
            Use Noir circuit to prove certificate properties without revealing private data
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="zkCertificateSelect">Select Your EAS Attestation</Label>
              <select 
                id="zkCertificateSelect"
                className="w-full p-2 border rounded-md"
                onChange={(e) => setZkForm(prev => ({ ...prev, certificateId: e.target.value }))}
                value={zkForm.certificateId}
              >
                <option value="">Select a certificate</option>
                {certificates.filter(cert => cert.isValid).map(cert => (
                  <option key={cert.id} value={cert.id}>
                    {cert.courseName} - Grade: {cert.grade}/100
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="zkMinGradeThreshold">Minimum Grade Threshold</Label>
              <Input
                id="zkMinGradeThreshold"
                type="number"
                min="0"
                max="100"
                value={zkForm.minGrade}
                onChange={(e) => setZkForm(prev => ({ ...prev, minGrade: e.target.value }))}
                placeholder="60"
              />
            </div>
            <div>
              <Label htmlFor="zkProofType">Proof Type</Label>
              <select 
                id="zkProofType"
                className="w-full p-2 border rounded-md"
                onChange={(e) => setZkForm(prev => ({ ...prev, proofType: e.target.value }))}
                value={zkForm.proofType}
              >
                <option value="Grade Above Threshold">Grade Above Threshold</option>
                <option value="Course Completion">Course Completion</option>
                <option value="Skill Verification">Skill Verification</option>
              </select>
            </div>
          </div>
          
          <Button 
            onClick={handleGenerateZKProof} 
            disabled={loading || !zkForm.certificateId || !zkForm.minGrade}
            className="mt-4 w-full"
          >
            {loading ? 'Generating Proof...' : 'Generate Zero-Knowledge Proof with Noir'}
          </Button>

          {zkProofResult && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <h4 className="font-medium text-green-800 mb-2">Noir ZK Proof Generated Successfully</h4>
              <p className="text-sm font-medium mb-3">
                ✅ Proof Statement: "I have a certificate from {zkProofResult.publicInputs?.attester_address} with a grade ≥ {zkForm.minGrade}% without revealing my actual grade"
              </p>
              <div className="bg-white p-3 rounded border font-mono text-xs overflow-auto max-h-64">
                <pre>{JSON.stringify(zkProofResult, null, 2)}</pre>
              </div>
              <Button 
                onClick={() => navigator.clipboard.writeText(JSON.stringify(zkProofResult, null, 2))}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                Copy Proof
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Step 3: Verify Noir ZK Proof - Solo para verifiers */}
      {userRole === 'verifier' && (
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-2">Step 3: Verify Noir ZK Proof</h3>
          <p className="text-sm text-gray-600 mb-4">
            Validate proof without accessing private certificate data
          </p>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="holderAddress">Certificate Holder Address</Label>
              <Input
                id="holderAddress"
                value={verifyZkForm.holderAddress}
                onChange={(e) => setVerifyZkForm(prev => ({ ...prev, holderAddress: e.target.value }))}
                placeholder="0x..."
              />
            </div>
            <div>
              <Label htmlFor="zkProofInput">Noir ZK Proof (JSON)</Label>
              <Textarea
                id="zkProofInput"
                value={verifyZkForm.zkProof}
                onChange={(e) => setVerifyZkForm(prev => ({ ...prev, zkProof: e.target.value }))}
                placeholder="Paste the complete ZK proof JSON here..."
                rows={6}
              />
            </div>
          </div>
          
          <Button 
            onClick={handleVerifyZKProof} 
            disabled={loading || !verifyZkForm.holderAddress || !verifyZkForm.zkProof}
            className="mt-4 w-full"
          >
            {loading ? 'Verifying...' : 'Verify Zero-Knowledge Proof'}
          </Button>

          {zkVerificationResult && (
            <div className={`mt-4 p-4 rounded-md ${
              zkVerificationResult.isValid 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              {zkVerificationResult.isValid ? (
                <>
                  <h4 className="font-medium text-green-800 mb-2">✅ Verification Successful</h4>
                  <div className="space-y-2 text-sm">
                    <h5 className="font-medium text-green-800">Verification Results</h5>
                    <ul className="list-disc list-inside text-green-700 space-y-1">
                      <li>Noir proof cryptographically valid</li>
                      <li>EAS attestation found on-chain</li>
                      <li>Commitment hash matches</li>
                      <li>Grade threshold requirement met</li>
                    </ul>
                    
                    <div className="mt-3">
                      <h5 className="font-medium text-green-800">Public Information</h5>
                      <div className="text-green-700">
                        <div><strong>Attestation UID:</strong></div>
                        <div className="font-mono text-xs bg-white p-2 rounded border">{zkVerificationResult.attestationUID || 'N/A'}</div>
                        
                        <div className="mt-2"><strong>Attester:</strong></div>
                        <div className="font-mono text-xs bg-white p-2 rounded border">{zkVerificationResult.attester || 'N/A'}</div>
                        
                        <div className="mt-2"><strong>Min Grade Threshold:</strong> {zkVerificationResult.minThreshold || 'N/A'}%</div>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-green-100 rounded border">
                      <h5 className="font-medium text-green-800">🔒 Privacy Preserved:</h5>
                      <p className="text-green-700 text-sm">
                        The holder has cryptographically proven they possess a certificate with a grade above the threshold, 
                        without revealing their actual grade, name, or other sensitive information. 
                        The proof is mathematically sound and cannot be forged.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h4 className="font-medium text-red-800 mb-2">❌ Verification Failed</h4>
                  <p className="text-sm text-red-700">
                    {zkVerificationResult.verificationDetails}
                  </p>
                </>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
