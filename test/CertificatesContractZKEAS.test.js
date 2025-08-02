const CertificatesContract = artifacts.require("CertificatesContract");
const MockEAS = artifacts.require("MockEAS");
const MockSchemaRegistry = artifacts.require("MockSchemaRegistry");

contract("CertificatesContract con ZK y EAS", (accounts) => {
  let certificatesContract;
  let mockEAS;
  let mockSchemaRegistry;
  
  const issuer1 = accounts[0]; // Primera institución
  const issuer2 = accounts[1]; // Segunda institución  
  const recipient1 = accounts[2]; // Primer titular
  const recipient2 = accounts[3]; // Segundo titular
  const verifier = accounts[4]; // Verificador externo

  beforeEach(async () => {
    // Deploy mock contracts
    mockEAS = await MockEAS.new();
    mockSchemaRegistry = await MockSchemaRegistry.new();
    
    // Deploy main contract
    certificatesContract = await CertificatesContract.new(
      mockEAS.address, 
      mockSchemaRegistry.address, 
      { from: issuer1 }
    );
  });

  describe("Deployment y configuración inicial", () => {
    it("should deploy successfully with EAS integration", async () => {
      const address = await certificatesContract.address;
      assert.notEqual(address, 0x0);
      assert.notEqual(address, "");
      assert.notEqual(address, null);
      assert.notEqual(address, undefined);
    });

    it("should have EAS and Schema Registry configured", async () => {
      const easAddress = await certificatesContract.eas();
      const schemaRegistryAddress = await certificatesContract.schemaRegistry();
      
      assert.equal(easAddress, mockEAS.address);
      assert.equal(schemaRegistryAddress, mockSchemaRegistry.address);
    });

    it("should create initial certificate", async () => {
      const certificatesCounter = await certificatesContract.certificatesCounter();
      assert.equal(certificatesCounter.toNumber(), 1);
    });

    it("should have certificate schema registered", async () => {
      const schemaId = await certificatesContract.certificateSchema();
      assert.notEqual(schemaId, "0x0000000000000000000000000000000000000000000000000000000000000000");
    });
  });

  describe("Emisión de certificados sin admin", () => {
    it("should allow any address to issue certificates", async () => {
      const result = await certificatesContract.issueCertificate(
        "Maria Rodriguez",
        "Instituto Tecnologico",
        recipient1,
        "Desarrollo Blockchain",
        "Certificado de completacion del programa de blockchain",
        { from: issuer2 }
      );

      const certificatesCounter = await certificatesContract.certificatesCounter();
      assert.equal(certificatesCounter.toNumber(), 2); // 1 inicial + 1 nuevo

      // Verificar evento
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, "CertificateIssued");
      assert.equal(result.logs[0].args.recipientName, "Maria Rodriguez");
      assert.equal(result.logs[0].args.institutionName, "Instituto Tecnologico");
      assert.equal(result.logs[0].args.courseName, "Desarrollo Blockchain");
      assert.equal(result.logs[0].args.issuer, issuer2);
      assert.equal(result.logs[0].args.recipient, recipient1);
    });

    it("should create certificate with EAS attestation", async () => {
      const result = await certificatesContract.issueCertificate(
        "Ana Lopez",
        "Universidad Digital",
        recipient1,
        "Smart Contracts",
        "Certificado avanzado de smart contracts",
        { from: issuer1 }
      );

      const certificate = await certificatesContract.certificates(2);
      
      // Verificar que tiene EAS UID
      assert.notEqual(certificate.easUID, "0x0000000000000000000000000000000000000000000000000000000000000000");
      
      // Verificar que el attestation existe en EAS
      const attestation = await mockEAS.getAttestation(certificate.easUID);
      assert.equal(attestation.recipient, recipient1);
      // El attester en EAS será la dirección del contrato, no el issuer original
      assert.equal(attestation.attester, certificatesContract.address);
    });

    it("should create certificate with ZK proof hash", async () => {
      await certificatesContract.issueCertificate(
        "Pedro Martinez",
        "Academia Crypto",
        recipient2,
        "DeFi Fundamentals",
        "Curso completo de finanzas descentralizadas",
        { from: issuer1 }
      );

      const certificate = await certificatesContract.certificates(2);
      
      // Verificar que tiene ZK proof hash
      assert.notEqual(certificate.zkProofHash, "0x0000000000000000000000000000000000000000000000000000000000000000");
      
      // Verificar que la prueba ZK es válida
      const isValidZKProof = await certificatesContract.validZKProofs(certificate.zkProofHash);
      assert.equal(isValidZKProof, true);
    });
  });

  describe("Gestión de certificados por titular", () => {
    beforeEach(async () => {
      await certificatesContract.issueCertificate(
        "Carlos Ruiz",
        "Escuela Blockchain",
        recipient1,
        "NFT Development",
        "Creacion y desarrollo de NFTs",
        { from: issuer1 }
      );
      
      await certificatesContract.issueCertificate(
        "Carlos Ruiz",
        "Instituto IA",
        recipient1,
        "Machine Learning",
        "Fundamentos de ML",
        { from: issuer2 }
      );
    });

    it("should allow recipient to view their certificates", async () => {
      const certificates = await certificatesContract.getMyCertificates({ from: recipient1 });
      
      // recipient1 debe tener solo 2 certificados (no incluye el inicial que es para issuer1)
      assert.equal(certificates.length, 2);
    });

    it("should allow issuer to view their issued certificates", async () => {
      const issuer1Certificates = await certificatesContract.getCertificatesByIssuer(issuer1);
      const issuer2Certificates = await certificatesContract.getCertificatesByIssuer(issuer2);
      
      assert.equal(issuer1Certificates.length, 2); // inicial + 1 nuevo
      assert.equal(issuer2Certificates.length, 1); // 1 nuevo
    });

    it("should generate verification data for external use", async () => {
      const verificationData = await certificatesContract.generateVerificationData(2);
      
      // Verificar que contiene datos JSON válidos
      assert.include(verificationData, '"id":2');
      assert.include(verificationData, '"valid":true');
      assert.include(verificationData, '"recipient"');
      assert.include(verificationData, '"issuer"');
    });
  });

  describe("Verificación con ZK", () => {
    let zkProofHash;
    let certificateId;

    beforeEach(async () => {
      await certificatesContract.issueCertificate(
        "Elena Vasquez",
        "Universidad ZK",
        recipient2,
        "Zero Knowledge Proofs",
        "Curso avanzado de ZK",
        { from: issuer1 }
      );
      
      certificateId = 2;
      const certificate = await certificatesContract.certificates(certificateId);
      zkProofHash = certificate.zkProofHash;
    });

    it("should allow recipient to generate ZK proof", async () => {
      const zkData = await certificatesContract.generateZKProof(certificateId, { from: recipient2 });
      
      assert.equal(zkData.proofHash, zkProofHash);
      assert.notEqual(zkData.commitment, "0x0000000000000000000000000000000000000000000000000000000000000000");
    });

    it("should not allow non-recipient to generate ZK proof", async () => {
      try {
        await certificatesContract.generateZKProof(certificateId, { from: recipient1 });
        assert.fail("Expected revert not received");
      } catch (error) {
        assert.include(error.message, "Solo el titular puede generar prueba ZK");
      }
    });

    it("should verify ZK proof without revealing details", async () => {
      const zkData = await certificatesContract.generateZKProof(certificateId, { from: recipient2 });
      
      // Simular verificación ZK
      const result = await certificatesContract.verifyZKProof(
        zkData.proofHash,
        zkData.commitment,
        "0x1234", // Mock proof data
        { from: verifier }
      );
      
      // verifyZKProof retorna una transacción, verificamos que fue exitosa
      assert.equal(result.receipt.status, true);
      
      // Verificar que se registró la verificación
      const verificationData = await certificatesContract.verificationHistory(zkData.proofHash);
      assert.equal(verificationData.verifier, verifier);
      assert.equal(verificationData.isPrivateVerification, true);
    });
  });

  describe("Integración con EAS", () => {
    let easUID;

    beforeEach(async () => {
      const result = await certificatesContract.issueCertificate(
        "Roberto Silva",
        "Tech Academy",
        recipient1,
        "Cybersecurity",
        "Certificado de seguridad informatica",
        { from: issuer2 }
      );
      
      const certificate = await certificatesContract.certificates(2);
      easUID = certificate.easUID;
    });

    it("should create attestation in EAS when issuing certificate", async () => {
      const attestation = await mockEAS.getAttestation(easUID);
      
      assert.equal(attestation.recipient, recipient1);
      // El attester en EAS será la dirección del contrato, no el issuer original
      assert.equal(attestation.attester, certificatesContract.address);
    });

    it("should verify certificate through EAS", async () => {
      const verification = await certificatesContract.verifyWithEAS(easUID);
      
      assert.equal(verification.isValid, true);
      assert.notEqual(verification.data, "0x");
    });

    it("should revoke attestation in EAS when revoking certificate", async () => {
      // Revocar certificado
      await certificatesContract.revokeCertificate(2, { from: issuer2 });
      
      // Verificar que está revocado en EAS
      const attestation = await mockEAS.getAttestation(easUID);
      assert.notEqual(attestation.revocationTime, 0); // Fue revocado
      
      // Verificar que el certificado está marcado como inválido
      const certificate = await certificatesContract.certificates(2);
      assert.equal(certificate.isValid, false);
    });
  });

  describe("Revocación de certificados", () => {
    beforeEach(async () => {
      await certificatesContract.issueCertificate(
        "Laura Mendez",
        "Instituto Digital",
        recipient1,
        "Web3 Development",
        "Desarrollo en Web3",
        { from: issuer1 }
      );
    });

    it("should allow issuer to revoke certificate", async () => {
      const result = await certificatesContract.revokeCertificate(2, { from: issuer1 });
      
      const certificate = await certificatesContract.certificates(2);
      assert.equal(certificate.isValid, false);

      // Verificar evento
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, "CertificateRevoked");
      assert.equal(result.logs[0].args.id.toNumber(), 2);
      assert.equal(result.logs[0].args.revokedBy, issuer1);
    });

    it("should allow recipient to revoke certificate", async () => {
      await certificatesContract.revokeCertificate(2, { from: recipient1 });
      
      const certificate = await certificatesContract.certificates(2);
      assert.equal(certificate.isValid, false);
    });

    it("should not allow unauthorized user to revoke certificate", async () => {
      try {
        await certificatesContract.revokeCertificate(2, { from: verifier });
        assert.fail("Expected revert not received");
      } catch (error) {
        assert.include(error.message, "Solo el emisor o titular puede realizar esta accion");
      }
    });

    it("should invalidate ZK proof when revoking certificate", async () => {
      const certificate = await certificatesContract.certificates(2);
      const zkProofHash = certificate.zkProofHash;
      
      // Verificar que la prueba ZK es válida antes de revocar
      let isValid = await certificatesContract.validZKProofs(zkProofHash);
      assert.equal(isValid, true);
      
      // Revocar certificado
      await certificatesContract.revokeCertificate(2, { from: issuer1 });
      
      // Verificar que la prueba ZK ya no es válida
      isValid = await certificatesContract.validZKProofs(zkProofHash);
      assert.equal(isValid, false);
    });
  });
});
