const CertificatesContract = artifacts.require("CertificatesContract");
const MockEAS = artifacts.require("MockEAS");
const MockSchemaRegistry = artifacts.require("MockSchemaRegistry");
const MockNoirVerifier = artifacts.require("MockNoirVerifier");

contract("CertificatesContract - NOIR Integration", (accounts) => {
  let certificatesContract;
  let mockEAS;
  let mockSchemaRegistry;
  let noirVerifier;
  
  const [deployer, issuer1, recipient1, verifier] = accounts;

  beforeEach(async () => {
    // Deploy mock contracts
    mockEAS = await MockEAS.new();
    mockSchemaRegistry = await MockSchemaRegistry.new();
    
    // Deploy main contract
    certificatesContract = await CertificatesContract.new(
      mockEAS.address,
      mockSchemaRegistry.address,
      { from: deployer }
    );
    
    // Get the NOIR verifier instance
    const noirVerifierAddress = await certificatesContract.noirVerifier();
    noirVerifier = await MockNoirVerifier.at(noirVerifierAddress);
  });

  describe("NOIR Verifier Integration", () => {
    it("should have NOIR verifier deployed and configured", async () => {
      const verifierAddress = await certificatesContract.noirVerifier();
      assert.notEqual(verifierAddress, "0x0000000000000000000000000000000000000000");
      
      // Test that we can call the verifier
      const mockProof = "0x1234567890abcdef";
      const publicInputs = [
        "0x" + web3.utils.toBN(85).toString(16).padStart(64, '0'),     // min_grade
        "0x" + web3.utils.toBN(Math.floor(Date.now() / 1000)).toString(16).padStart(64, '0'), // current_timestamp
        "0x" + web3.utils.toBN(111).toString(16).padStart(64, '0'),    // expected_institution
        "0x" + web3.utils.toBN(63072000).toString(16).padStart(64, '0') // max_age_seconds (2 years)
      ];
      
      const result = await noirVerifier.verifyProof(mockProof, publicInputs);
      assert.equal(result, true, "Mock verifier should return true for valid inputs");
    });

    it("should create public inputs correctly", async () => {
      const minGrade = 80;
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const expectedInstitution = 111;
      const maxAgeSeconds = 63072000; // 2 years
      
      const publicInputs = await certificatesContract.getNoirPublicInputs(
        minGrade,
        currentTimestamp,
        expectedInstitution,
        maxAgeSeconds
      );
      
      assert.equal(publicInputs.length, 4, "Should have 4 public inputs");
      assert.equal(web3.utils.hexToNumber(publicInputs[0]), minGrade);
      assert.equal(web3.utils.hexToNumber(publicInputs[1]), currentTimestamp);
      assert.equal(web3.utils.hexToNumber(publicInputs[2]), expectedInstitution);
      assert.equal(web3.utils.hexToNumber(publicInputs[3]), maxAgeSeconds);
    });

    it("should verify conditional ZK proof successfully", async () => {
      const mockProof = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
      const minGrade = 80;
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const expectedInstitution = 111;
      const maxAgeSeconds = 63072000; // 2 years
      
      const result = await certificatesContract.verifyConditionalZKProof(
        mockProof,
        minGrade,
        currentTimestamp,
        expectedInstitution,
        maxAgeSeconds,
        { from: verifier }
      );
      
      // Verify the transaction was successful
      assert.equal(result.receipt.status, true);
      
      // Check that ZKProofVerified event was emitted
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, "ZKProofVerified");
      assert.equal(result.logs[0].args.verifier, verifier);
    });

    it("should fail with invalid proof data", async () => {
      const emptyProof = "0x";
      const minGrade = 80;
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const expectedInstitution = 111;
      const maxAgeSeconds = 63072000;
      
      try {
        await certificatesContract.verifyConditionalZKProof(
          emptyProof,
          minGrade,
          currentTimestamp,
          expectedInstitution,
          maxAgeSeconds,
          { from: verifier }
        );
        assert.fail("Should have thrown error for empty proof");
      } catch (error) {
        assert.include(error.message, "Proof cannot be empty");
      }
    });

    it("should fail with unrealistic inputs", async () => {
      const mockProof = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
      const minGrade = 150; // Invalid grade > 100
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const expectedInstitution = 111;
      const maxAgeSeconds = 63072000;
      
      try {
        await certificatesContract.verifyConditionalZKProof(
          mockProof,
          minGrade,
          currentTimestamp,
          expectedInstitution,
          maxAgeSeconds,
          { from: verifier }
        );
        assert.fail("Should have thrown error for invalid grade");
      } catch (error) {
        assert.include(error.message, "Prueba NOIR invalida");
      }
    });

    it("should record verification history", async () => {
      const mockProof = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
      const minGrade = 80;
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const expectedInstitution = 111;
      const maxAgeSeconds = 63072000;
      
      await certificatesContract.verifyConditionalZKProof(
        mockProof,
        minGrade,
        currentTimestamp,
        expectedInstitution,
        maxAgeSeconds,
        { from: verifier }
      );
      
      // Generate the same proof hash that would be created in the contract
      const proofHash = web3.utils.keccak256(
        web3.utils.encodePacked(
          { type: 'bytes', value: mockProof },
          { type: 'uint256', value: minGrade },
          { type: 'uint256', value: currentTimestamp },
          { type: 'uint256', value: expectedInstitution },
          { type: 'uint256', value: maxAgeSeconds }
        )
      );
      
      const verificationData = await certificatesContract.verificationHistory(proofHash);
      assert.equal(verificationData.verifier, verifier);
      assert.equal(verificationData.isPrivateVerification, true);
      assert.notEqual(verificationData.timestamp.toNumber(), 0);
    });
  });

  describe("Integration with Certificate Issuance", () => {
    it("should issue certificate with private data hash", async () => {
      // Simulate private data (grade, completion details, etc.)
      const privateData = {
        grade: 95,
        completionDate: Math.floor(Date.now() / 1000),
        difficulty: "advanced",
        secretKey: "student_secret_123"
      };
      
      // Create hash of private data (this would be done off-chain)
      const privateDataHash = web3.utils.keccak256(
        web3.eth.abi.encodeParameters(
          ['uint256', 'uint256', 'string', 'string'],
          [privateData.grade, privateData.completionDate, privateData.difficulty, privateData.secretKey]
        )
      );
      
      const result = await certificatesContract.issueCertificateWithPrivateData(
        "Alice Johnson",
        "Crypto University",
        recipient1,
        "Advanced Blockchain Development",
        "Advanced course completion",
        privateDataHash,
        { from: issuer1 }
      );
      
      assert.equal(result.receipt.status, true);
      
      // Check that certificate was created with private data hash
      const certificate = await certificatesContract.certificates(2); // Second certificate (first is created in constructor)
      assert.equal(certificate.privateDataHash, privateDataHash);
      assert.equal(certificate.recipientName, "Alice Johnson");
      assert.equal(certificate.institutionName, "Crypto University");
    });
  });

  describe("Real-world ZK Verification Flow", () => {
    it("should simulate complete ZK verification flow", async () => {
      // 1. Issue certificate with private data
      const privateData = {
        grade: 88,
        completionDate: Math.floor(Date.now() / 1000) - 86400, // Yesterday
        institutionId: 111,
        secretKey: "student_secret_456"
      };
      
      const privateDataHash = web3.utils.keccak256(
        web3.eth.abi.encodeParameters(
          ['uint256', 'uint256', 'uint256', 'string'],
          [privateData.grade, privateData.completionDate, privateData.institutionId, privateData.secretKey]
        )
      );
      
      await certificatesContract.issueCertificateWithPrivateData(
        "Bob Smith",
        "Tech Academy",
        recipient1,
        "Smart Contract Security",
        "Security audit certification",
        privateDataHash,
        { from: issuer1 }
      );
      
      // 2. Simulate NOIR proof generation (this would be done off-chain with real NOIR)
      const mockNoirProof = "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
      
      // 3. Verify that student has grade >= 85 without revealing actual grade
      const minGrade = 85;
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const expectedInstitution = 111;
      const maxAgeSeconds = 31536000; // 1 year
      
      const verificationResult = await certificatesContract.verifyConditionalZKProof(
        mockNoirProof,
        minGrade,
        currentTimestamp,
        expectedInstitution,
        maxAgeSeconds,
        { from: verifier }
      );
      
      // Verify that the proof verification was successful
      assert.equal(verificationResult.receipt.status, true);
      assert.equal(verificationResult.logs[0].event, "ZKProofVerified");
      
      // The verifier now knows the student has a grade >= 85 from the correct institution
      // without knowing the actual grade (88) or other private details
    });
  });
});
