import Web3 from 'web3';

// Interfaces para el sistema real
export interface RealCertificate {
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

export interface VerificationResult {
  certificateId: number;
  level: number; // 0: BASIC, 1: STANDARD, 2: PREMIUM, 3: FORENSIC
  status: number; // 0: PENDING, 1: VERIFIED, 2: REJECTED, 3: EXPIRED
  score: number; // 0-100
  hashValid: boolean;
  easValid: boolean;
  issuerValid: boolean;
  timeValid: boolean;
  gradeValid: boolean;
  errors: string[];
  verificationTimestamp: number;
  verifier: string;
}

export interface ZKProof {
  certificateId: number;
  minGradeThreshold: number;
  proofHash: string;
  commitment: string;
  isValid: boolean;
}

// ABI del contrato real
const REAL_CERTIFICATE_SYSTEM_ABI = [
  {
    "type": "function",
    "name": "issueCertificate",
    "inputs": [
      {"name": "_recipientName", "type": "string"},
      {"name": "_institutionName", "type": "string"},
      {"name": "_recipient", "type": "address"},
      {"name": "_courseName", "type": "string"},
      {"name": "_description", "type": "string"},
      {"name": "_completionDate", "type": "uint256"},
      {"name": "_grade", "type": "uint256"}
    ],
    "outputs": [{"name": "certificateId", "type": "uint256"}],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "verifyCertificate",
    "inputs": [
      {"name": "_certificateId", "type": "uint256"},
      {"name": "_level", "type": "uint8"}
    ],
    "outputs": [{"name": "verificationId", "type": "bytes32"}],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "generateZKProof",
    "inputs": [
      {"name": "_certificateId", "type": "uint256"},
      {"name": "_minGradeThreshold", "type": "uint256"}
    ],
    "outputs": [
      {
        "type": "tuple",
        "components": [
          {"name": "certificateId", "type": "uint256"},
          {"name": "minGradeThreshold", "type": "uint256"},
          {"name": "proofHash", "type": "bytes32"},
          {"name": "commitment", "type": "bytes32"},
          {"name": "isValid", "type": "bool"}
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "verifyZKProof",
    "inputs": [
      {
        "type": "tuple",
        "components": [
          {"name": "certificateId", "type": "uint256"},
          {"name": "minGradeThreshold", "type": "uint256"},
          {"name": "proofHash", "type": "bytes32"},
          {"name": "commitment", "type": "bytes32"},
          {"name": "isValid", "type": "bool"}
        ]
      },
      {"name": "_certificateId", "type": "uint256"}
    ],
    "outputs": [
      {"name": "isValid", "type": "bool"},
      {"name": "details", "type": "string"}
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getCertificate",
    "inputs": [{"name": "_certificateId", "type": "uint256"}],
    "outputs": [
      {
        "type": "tuple",
        "components": [
          {"name": "id", "type": "uint256"},
          {"name": "recipientName", "type": "string"},
          {"name": "institutionName", "type": "string"},
          {"name": "courseName", "type": "string"},
          {"name": "description", "type": "string"},
          {"name": "issuedAt", "type": "uint256"},
          {"name": "completionDate", "type": "uint256"},
          {"name": "grade", "type": "uint256"},
          {"name": "issuer", "type": "address"},
          {"name": "recipient", "type": "address"},
          {"name": "certificateHash", "type": "bytes32"},
          {"name": "easUID", "type": "bytes32"},
          {"name": "isValid", "type": "bool"}
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getVerificationResult",
    "inputs": [{"name": "_verificationId", "type": "bytes32"}],
    "outputs": [
      {
        "type": "tuple",
        "components": [
          {"name": "certificateId", "type": "uint256"},
          {"name": "level", "type": "uint8"},
          {"name": "status", "type": "uint8"},
          {"name": "score", "type": "uint256"},
          {"name": "hashValid", "type": "bool"},
          {"name": "easValid", "type": "bool"},
          {"name": "issuerValid", "type": "bool"},
          {"name": "timeValid", "type": "bool"},
          {"name": "gradeValid", "type": "bool"},
          {"name": "errors", "type": "string[]"},
          {"name": "verificationTimestamp", "type": "uint256"},
          {"name": "verifier", "type": "address"}
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getCertificatesCounter",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getIssuerReputation",
    "inputs": [{"name": "_issuer", "type": "address"}],
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view"
  }
] as const;

export class RealCertificateService {
  private web3: Web3 | null = null;
  private contract: any = null;
  private currentAccount: string | null = null;
  
  // Esta dirección se actualizará después del deployment
  private contractAddress: string = '';

  constructor() {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      this.web3 = new Web3((window as any).ethereum);
      this.initialize();
    }
  }

  async initialize() {
    if (!this.web3) return;

    try {
      const accounts = await this.web3.eth.getAccounts();
      if (accounts.length > 0) {
        this.currentAccount = accounts[0];
      }

      if (this.contractAddress) {
        this.contract = new this.web3.eth.Contract(
          REAL_CERTIFICATE_SYSTEM_ABI,
          this.contractAddress
        );
      }
    } catch (error) {
      console.error('Error initializing RealCertificateService:', error);
    }
  }

  setContractAddress(address: string) {
    this.contractAddress = address;
    if (this.web3) {
      this.contract = new this.web3.eth.Contract(
        REAL_CERTIFICATE_SYSTEM_ABI,
        address
      );
    }
  }

  async connectWallet(): Promise<string[]> {
    if (!this.web3) {
      throw new Error('Web3 not available');
    }

    try {
      const accounts = await (window as any).ethereum.request({
        method: 'eth_requestAccounts',
      });
      
      this.currentAccount = accounts[0];
      return accounts;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  }

  getCurrentAccount(): string | null {
    return this.currentAccount;
  }

  isValidAddress(address: string): boolean {
    if (!this.web3) return false;
    return this.web3.utils.isAddress(address);
  }

  /**
   * Emitir un certificado real con validaciones
   */
  async issueCertificate(
    recipientName: string,
    institutionName: string,
    recipient: string,
    courseName: string,
    description: string,
    completionDate: number,
    grade: number
  ): Promise<{txHash: string, certificateId: number}> {
    if (!this.contract || !this.currentAccount) {
      throw new Error('Contract not initialized or no account connected');
    }

    try {
      console.log('🎓 Issuing certificate with real validation...');
      console.log('Data:', {
        recipientName,
        institutionName,
        recipient,
        courseName,
        description,
        completionDate,
        grade
      });

      const transaction = await this.contract.methods
        .issueCertificate(
          recipientName,
          institutionName,
          recipient,
          courseName,
          description,
          completionDate,
          grade
        )
        .send({ from: this.currentAccount });

      // Extraer el ID del certificado de los eventos
      const certificateId = transaction.events.CertificateIssued?.returnValues?.id || 0;

      console.log('✅ Certificate issued successfully!');
      console.log('Transaction Hash:', transaction.transactionHash);
      console.log('Certificate ID:', certificateId);

      return {
        txHash: transaction.transactionHash,
        certificateId: parseInt(certificateId)
      };
    } catch (error) {
      console.error('Error issuing certificate:', error);
      throw error;
    }
  }

  /**
   * Obtener un certificado por ID
   */
  async getCertificate(certificateId: number): Promise<RealCertificate | null> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const result = await this.contract.methods
        .getCertificate(certificateId)
        .call();

      if (result.id === '0') {
        return null;
      }

      return {
        id: parseInt(result.id),
        recipientName: result.recipientName,
        institutionName: result.institutionName,
        courseName: result.courseName,
        description: result.description,
        issuedAt: parseInt(result.issuedAt),
        completionDate: parseInt(result.completionDate),
        grade: parseInt(result.grade),
        issuer: result.issuer,
        recipient: result.recipient,
        certificateHash: result.certificateHash,
        easUID: result.easUID,
        isValid: result.isValid
      };
    } catch (error) {
      console.error('Error getting certificate:', error);
      throw error;
    }
  }

  /**
   * Verificar un certificado de forma real y completa
   */
  async verifyCertificate(
    certificateId: number,
    level: number = 1 // 0: BASIC, 1: STANDARD, 2: PREMIUM, 3: FORENSIC
  ): Promise<{verificationId: string, result: VerificationResult}> {
    if (!this.contract || !this.currentAccount) {
      throw new Error('Contract not initialized or no account connected');
    }

    try {
      console.log(`🔍 Verifying certificate ${certificateId} at level ${level}...`);

      const transaction = await this.contract.methods
        .verifyCertificate(certificateId, level)
        .send({ from: this.currentAccount });

      const verificationId = transaction.events.VerificationRequested?.returnValues?.verificationId;

      // Obtener el resultado de la verificación
      const result = await this.contract.methods
        .getVerificationResult(verificationId)
        .call();

      const verificationResult: VerificationResult = {
        certificateId: parseInt(result.certificateId),
        level: parseInt(result.level),
        status: parseInt(result.status),
        score: parseInt(result.score),
        hashValid: result.hashValid,
        easValid: result.easValid,
        issuerValid: result.issuerValid,
        timeValid: result.timeValid,
        gradeValid: result.gradeValid,
        errors: result.errors,
        verificationTimestamp: parseInt(result.verificationTimestamp),
        verifier: result.verifier
      };

      console.log('✅ Verification completed:', verificationResult);

      return {
        verificationId,
        result: verificationResult
      };
    } catch (error) {
      console.error('Error verifying certificate:', error);
      throw error;
    }
  }

  /**
   * Generar prueba ZK realista
   */
  async generateZKProof(
    certificateId: number,
    minGradeThreshold: number
  ): Promise<ZKProof> {
    if (!this.contract || !this.currentAccount) {
      throw new Error('Contract not initialized or no account connected');
    }

    try {
      console.log(`🔐 Generating ZK proof for certificate ${certificateId} with threshold ${minGradeThreshold}%...`);

      const result = await this.contract.methods
        .generateZKProof(certificateId, minGradeThreshold)
        .call({ from: this.currentAccount });

      const zkProof: ZKProof = {
        certificateId: parseInt(result.certificateId),
        minGradeThreshold: parseInt(result.minGradeThreshold),
        proofHash: result.proofHash,
        commitment: result.commitment,
        isValid: result.isValid
      };

      console.log('✅ ZK Proof generated:', zkProof);

      return zkProof;
    } catch (error) {
      console.error('Error generating ZK proof:', error);
      throw error;
    }
  }

  /**
   * Verificar prueba ZK de forma realista
   */
  async verifyZKProof(
    proof: ZKProof,
    certificateId: number
  ): Promise<{isValid: boolean, details: string}> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      console.log('🔍 Verifying ZK proof...', { proof, certificateId });

      const result = await this.contract.methods
        .verifyZKProof(proof, certificateId)
        .call();

      console.log('✅ ZK Proof verification result:', result);

      return {
        isValid: result.isValid,
        details: result.details
      };
    } catch (error) {
      console.error('Error verifying ZK proof:', error);
      throw error;
    }
  }

  /**
   * Obtener la reputación de un emisor
   */
  async getIssuerReputation(issuerAddress: string): Promise<number> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const reputation = await this.contract.methods
        .getIssuerReputation(issuerAddress)
        .call();

      return parseInt(reputation);
    } catch (error) {
      console.error('Error getting issuer reputation:', error);
      throw error;
    }
  }

  /**
   * Obtener contador de certificados
   */
  async getCertificatesCounter(): Promise<number> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const counter = await this.contract.methods
        .getCertificatesCounter()
        .call();

      return parseInt(counter);
    } catch (error) {
      console.error('Error getting certificates counter:', error);
      throw error;
    }
  }

  /**
   * Obtener múltiples certificados
   */
  async getCertificates(startId: number = 1, count: number = 10): Promise<RealCertificate[]> {
    const certificates: RealCertificate[] = [];
    const totalCerts = await this.getCertificatesCounter();
    const endId = Math.min(startId + count - 1, totalCerts);

    for (let i = startId; i <= endId; i++) {
      try {
        const cert = await this.getCertificate(i);
        if (cert) {
          certificates.push(cert);
        }
      } catch (error) {
        console.warn(`Could not load certificate ${i}:`, error);
      }
    }

    return certificates;
  }

  /**
   * Obtener certificados por emisor
   */
  async getCertificatesByIssuer(issuerAddress: string): Promise<RealCertificate[]> {
    const certificates: RealCertificate[] = [];
    const totalCerts = await this.getCertificatesCounter();

    for (let i = 1; i <= totalCerts; i++) {
      try {
        const cert = await this.getCertificate(i);
        if (cert && cert.issuer.toLowerCase() === issuerAddress.toLowerCase()) {
          certificates.push(cert);
        }
      } catch (error) {
        console.warn(`Could not load certificate ${i}:`, error);
      }
    }

    return certificates;
  }

  /**
   * Obtener certificados por recipient
   */
  async getCertificatesByRecipient(recipientAddress: string): Promise<RealCertificate[]> {
    const certificates: RealCertificate[] = [];
    const totalCerts = await this.getCertificatesCounter();

    for (let i = 1; i <= totalCerts; i++) {
      try {
        const cert = await this.getCertificate(i);
        if (cert && cert.recipient.toLowerCase() === recipientAddress.toLowerCase()) {
          certificates.push(cert);
        }
      } catch (error) {
        console.warn(`Could not load certificate ${i}:`, error);
      }
    }

    return certificates;
  }

  // Utility functions
  getVerificationLevelName(level: number): string {
    const levels = ['Básico', 'Estándar', 'Premium', 'Forense'];
    return levels[level] || 'Desconocido';
  }

  getVerificationStatusName(status: number): string {
    const statuses = ['Pendiente', 'Verificado', 'Rechazado', 'Expirado'];
    return statuses[status] || 'Desconocido';
  }

  formatReputationScore(score: number): string {
    if (score >= 900) return 'Excelente';
    if (score >= 750) return 'Buena';
    if (score >= 600) return 'Aceptable';
    if (score >= 400) return 'Baja';
    return 'Muy Baja';
  }
}

export const realCertificateService = new RealCertificateService();
