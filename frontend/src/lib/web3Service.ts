import Web3 from 'web3';
import { CERTIFICATES_CONTRACT_ABI, CONTRACT_ADDRESSES } from './contracts';

export interface Certificate {
  id: string;
  recipientName: string;
  institutionName: string;
  courseName: string;
  description: string;
  isValid: boolean;
  issuedAt: string;
  issuer: string;
  recipient: string;
  certificateHash: string;
  easUID: string;
  zkProofHash: string;
  privateDataHash: string;
}

export interface ZKProofData {
  proofHash: string;
  commitment: string;
}

class Web3Service {
  private web3: Web3 | null = null;
  private contract: any = null;
  private accounts: string[] = [];

  async initializeWeb3(): Promise<boolean> {
    try {
      // Check if Web3 has been injected by MetaMask
      if (typeof (window as any).ethereum !== 'undefined') {
        this.web3 = new Web3((window as any).ethereum);
        
        // Request account access
        await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        this.accounts = await this.web3.eth.getAccounts();
        
        // Initialize contract
        this.contract = new this.web3.eth.Contract(
          CERTIFICATES_CONTRACT_ABI,
          CONTRACT_ADDRESSES.CERTIFICATES_CONTRACT
        );
        
        return true;
      } else {
        console.error('MetaMask not found');
        return false;
      }
    } catch (error) {
      console.error('Error initializing Web3:', error);
      return false;
    }
  }

  async connectWallet(): Promise<string[]> {
    try {
      if (!this.web3) await this.initializeWeb3();
      
      this.accounts = await this.web3!.eth.getAccounts();
      return this.accounts;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  }

  getCurrentAccount(): string | null {
    return this.accounts.length > 0 ? this.accounts[0] : null;
  }

  async issueCertificate(
    recipientName: string,
    institutionName: string,
    recipient: string,
    courseName: string,
    description: string
  ): Promise<string> {
    try {
      if (!this.contract || !this.accounts.length) {
        throw new Error('Web3 not initialized or no accounts');
      }

      const tx = await this.contract.methods
        .issueCertificate(recipientName, institutionName, recipient, courseName, description)
        .send({ from: this.accounts[0] });

      return tx.transactionHash;
    } catch (error) {
      console.error('Error issuing certificate:', error);
      throw error;
    }
  }

  async getMyCertificates(): Promise<Certificate[]> {
    try {
      if (!this.contract || !this.accounts.length) {
        throw new Error('Web3 not initialized or no accounts');
      }

      const certificateIds = await this.contract.methods
        .getMyCertificates()
        .call({ from: this.accounts[0] });

      const certificates: Certificate[] = [];
      
      for (const id of certificateIds) {
        const cert = await this.contract.methods
          .certificates(id)
          .call();
        
        certificates.push({
          id: id.toString(),
          recipientName: cert.recipientName,
          institutionName: cert.institutionName,
          courseName: cert.courseName,
          description: cert.description,
          isValid: cert.isValid,
          issuedAt: new Date(Number(cert.issuedAt) * 1000).toISOString().split('T')[0],
          issuer: cert.issuer,
          recipient: cert.recipient,
          certificateHash: cert.certificateHash,
          easUID: cert.easUID,
          zkProofHash: cert.zkProofHash,
          privateDataHash: cert.privateDataHash
        });
      }

      return certificates;
    } catch (error) {
      console.error('Error getting certificates:', error);
      throw error;
    }
  }

  async generateZKProof(certificateId: string): Promise<ZKProofData> {
    try {
      if (!this.contract || !this.accounts.length) {
        throw new Error('Web3 not initialized or no accounts');
      }

      const result = await this.contract.methods
        .generateZKProof(certificateId)
        .send({ from: this.accounts[0] });

      // In a real implementation, this would involve generating actual ZK proofs
      // For now, we'll simulate the response
      return {
        proofHash: result.events.ZKProofGenerated?.returnValues?.proofHash || '0x...',
        commitment: result.events.ZKProofGenerated?.returnValues?.commitment || '0x...'
      };
    } catch (error) {
      console.error('Error generating ZK proof:', error);
      throw error;
    }
  }

  async verifyZKProof(
    noirProof: string,
    minGrade: number,
    expectedInstitution: number,
    maxAgeSeconds: number
  ): Promise<boolean> {
    try {
      if (!this.contract || !this.accounts.length) {
        throw new Error('Web3 not initialized or no accounts');
      }

      const currentTimestamp = Math.floor(Date.now() / 1000);
      
      const result = await this.contract.methods
        .verifyConditionalZKProof(
          noirProof,
          minGrade,
          currentTimestamp,
          expectedInstitution,
          maxAgeSeconds
        )
        .send({ from: this.accounts[0] });

      return result.status === true;
    } catch (error) {
      console.error('Error verifying ZK proof:', error);
      throw error;
    }
  }

  // Utility method to generate mock NOIR proof for demo purposes
  generateMockZKProof(): string {
    return '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }

  // Listen to contract events
  onCertificateIssued(callback: (event: any) => void) {
    if (this.contract) {
      this.contract.events.CertificateIssued()
        .on('data', callback)
        .on('error', console.error);
    }
  }

  onZKProofVerified(callback: (event: any) => void) {
    if (this.contract) {
      this.contract.events.ZKProofVerified()
        .on('data', callback)
        .on('error', console.error);
    }
  }
}

export const web3Service = new Web3Service();
