// ABI del SimpleCertificateSystem desplegado
export const SIMPLE_CERTIFICATE_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_easAddress",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "issuer",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "courseName",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "grade",
        "type": "uint256"
      }
    ],
    "name": "CertificateIssued",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "certificateId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "verifier",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "isValid",
        "type": "bool"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "score",
        "type": "uint256"
      }
    ],
    "name": "CertificateVerified",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "certificateId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "minGradeThreshold",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "gradeAboveThreshold",
        "type": "bool"
      }
    ],
    "name": "ZKProofGenerated",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "certificateCounter",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "certificates",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "recipientName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "institutionName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "courseName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "issuedAt",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "completionDate",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "grade",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "issuer",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      },
      {
        "internalType": "bytes32",
        "name": "certificateHash",
        "type": "bytes32"
      },
      {
        "internalType": "bytes32",
        "name": "easUID",
        "type": "bytes32"
      },
      {
        "internalType": "bool",
        "name": "isValid",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "eas",
    "outputs": [
      {
        "internalType": "contract MockEAS",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_certificateId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_minGradeThreshold",
        "type": "uint256"
      }
    ],
    "name": "generateZKProof",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "certificateId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "minGradeThreshold",
            "type": "uint256"
          },
          {
            "internalType": "bytes32",
            "name": "proofHash",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "commitment",
            "type": "bytes32"
          },
          {
            "internalType": "bool",
            "name": "gradeAboveThreshold",
            "type": "bool"
          }
        ],
        "internalType": "struct SimpleCertificateSystem.ZKProof",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_id",
        "type": "uint256"
      }
    ],
    "name": "getCertificate",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "recipientName",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "institutionName",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "courseName",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "description",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "issuedAt",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "completionDate",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "grade",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "issuer",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "recipient",
            "type": "address"
          },
          {
            "internalType": "bytes32",
            "name": "certificateHash",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "easUID",
            "type": "bytes32"
          },
          {
            "internalType": "bool",
            "name": "isValid",
            "type": "bool"
          }
        ],
        "internalType": "struct SimpleCertificateSystem.Certificate",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getCertificateCounter",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_issuer",
        "type": "address"
      }
    ],
    "name": "getIssuerReputation",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "_id",
        "type": "bytes32"
      }
    ],
    "name": "getVerificationResult",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "certificateId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "level",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isValid",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "score",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "hashValid",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "easValid",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "issuerValid",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "timeValid",
            "type": "bool"
          },
          {
            "internalType": "string[]",
            "name": "errors",
            "type": "string[]"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "verifier",
            "type": "address"
          }
        ],
        "internalType": "struct SimpleCertificateSystem.VerificationResult",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_recipientName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_institutionName",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "_recipient",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "_courseName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_description",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_completionDate",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_grade",
        "type": "uint256"
      }
    ],
    "name": "issueCertificate",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "issuerReputation",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "verificationCounter",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "name": "verifications",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "certificateId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "level",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isValid",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "score",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "hashValid",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "easValid",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "issuerValid",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "timeValid",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "verifier",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_certificateId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_level",
        "type": "uint256"
      }
    ],
    "name": "verifyCertificate",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "verificationId",
        "type": "bytes32"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "certificateId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "minGradeThreshold",
            "type": "uint256"
          },
          {
            "internalType": "bytes32",
            "name": "proofHash",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "commitment",
            "type": "bytes32"
          },
          {
            "internalType": "bool",
            "name": "gradeAboveThreshold",
            "type": "bool"
          }
        ],
        "internalType": "struct SimpleCertificateSystem.ZKProof",
        "name": "_proof",
        "type": "tuple"
      }
    ],
    "name": "verifyZKProof",
    "outputs": [
      {
        "internalType": "bool",
        "name": "isValid",
        "type": "bool"
      },
      {
        "internalType": "string",
        "name": "details",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

export const CONTRACT_ADDRESS = '0x784023424e92F809A9C28b74943a55eba0b9583E';
