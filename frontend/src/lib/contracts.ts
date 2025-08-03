// Contract ABIs - These would be imported from your build artifacts
export const CERTIFICATES_CONTRACT_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "_easContract", "type": "address"},
      {"internalType": "address", "name": "_schemaRegistry", "type": "address"}
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": false, "internalType": "uint256", "name": "id", "type": "uint256"},
      {"indexed": false, "internalType": "string", "name": "recipientName", "type": "string"},
      {"indexed": false, "internalType": "string", "name": "institutionName", "type": "string"},
      {"indexed": false, "internalType": "string", "name": "courseName", "type": "string"},
      {"indexed": false, "internalType": "string", "name": "description", "type": "string"},
      {"indexed": false, "internalType": "uint256", "name": "issuedAt", "type": "uint256"},
      {"indexed": false, "internalType": "address", "name": "issuer", "type": "address"},
      {"indexed": false, "internalType": "address", "name": "recipient", "type": "address"},
      {"indexed": false, "internalType": "bytes32", "name": "certificateHash", "type": "bytes32"},
      {"indexed": false, "internalType": "bytes32", "name": "easUID", "type": "bytes32"}
    ],
    "name": "CertificateIssued",
    "type": "event"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "_recipientName", "type": "string"},
      {"internalType": "string", "name": "_institutionName", "type": "string"},
      {"internalType": "address", "name": "_recipient", "type": "address"},
      {"internalType": "string", "name": "_courseName", "type": "string"},
      {"internalType": "string", "name": "_description", "type": "string"}
    ],
    "name": "issueCertificate",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "_certificateId", "type": "uint256"}
    ],
    "name": "generateZKProof",
    "outputs": [
      {"internalType": "bytes32", "name": "proofHash", "type": "bytes32"},
      {"internalType": "bytes32", "name": "commitment", "type": "bytes32"}
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "bytes", "name": "noirProof", "type": "bytes"},
      {"internalType": "uint256", "name": "minGrade", "type": "uint256"},
      {"internalType": "uint256", "name": "currentTimestamp", "type": "uint256"},
      {"internalType": "uint256", "name": "expectedInstitution", "type": "uint256"},
      {"internalType": "uint256", "name": "maxAgeSeconds", "type": "uint256"}
    ],
    "name": "verifyConditionalZKProof",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getMyCertificates",
    "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "name": "certificates",
    "outputs": [
      {"internalType": "uint256", "name": "id", "type": "uint256"},
      {"internalType": "string", "name": "recipientName", "type": "string"},
      {"internalType": "string", "name": "institutionName", "type": "string"},
      {"internalType": "string", "name": "courseName", "type": "string"},
      {"internalType": "string", "name": "description", "type": "string"},
      {"internalType": "bool", "name": "isValid", "type": "bool"},
      {"internalType": "uint256", "name": "issuedAt", "type": "uint256"},
      {"internalType": "address", "name": "issuer", "type": "address"},
      {"internalType": "address", "name": "recipient", "type": "address"},
      {"internalType": "bytes32", "name": "certificateHash", "type": "bytes32"},
      {"internalType": "bytes32", "name": "easUID", "type": "bytes32"},
      {"internalType": "bytes32", "name": "zkProofHash", "type": "bytes32"},
      {"internalType": "bytes32", "name": "privateDataHash", "type": "bytes32"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Contract addresses - deployed on Arbitrum Sepolia
export const CONTRACT_ADDRESSES = {
  CERTIFICATES_CONTRACT: "0x3FC85d298d55b17253F62A2Be4198A53308E84B2", // CertificatesContract
  SIMPLE_CERTIFICATE_SYSTEM: "0xd5d1bF8F538769Ed2b0421B85A638B7C2d18cF32", // SimpleCertificateSystem
  MOCK_EAS: "0x395606843558787D30608B1504B4379285d36E0a", // MockEAS
  SCHEMA_REGISTRY: "0x741aaF4918702417e6ed06b4c60719F1DBda4BB1" // MockSchemaRegistry
};
