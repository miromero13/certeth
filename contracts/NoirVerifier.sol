// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

// Basic NOIR verifier interface for our certificate verification circuit
interface INoirCertificateVerifier {
    function verifyProof(
        bytes calldata proof,
        bytes32[] calldata publicInputs
    ) external pure returns (bool);
}

// Mock implementation for development - replace with real NOIR verifier
contract MockNoirVerifier is INoirCertificateVerifier {
    // This is a simplified mock for development
    // In production, this would be replaced by the actual NOIR verifier contract
    function verifyProof(
        bytes calldata proof,
        bytes32[] calldata publicInputs
    ) external pure returns (bool) {
        // Basic validation for development
        require(proof.length > 0, "Proof cannot be empty");
        require(publicInputs.length >= 4, "Need at least 4 public inputs");
        
        // publicInputs[0] = min_grade
        // publicInputs[1] = current_timestamp  
        // publicInputs[2] = expected_institution
        // publicInputs[3] = max_age_seconds
        
        // Mock verification - in real implementation this would verify the NOIR proof
        // For development, we just return true if inputs look reasonable
        uint256 minGrade = uint256(publicInputs[0]);
        uint256 currentTimestamp = uint256(publicInputs[1]);
        uint256 expectedInstitution = uint256(publicInputs[2]);
        uint256 maxAgeSeconds = uint256(publicInputs[3]);
        
        // Basic sanity checks
        return (
            minGrade > 0 && minGrade <= 100 &&
            currentTimestamp > 1600000000 && // After year 2020
            expectedInstitution > 0 &&
            maxAgeSeconds > 0
        );
    }
}

// Library for NOIR proof verification
library NoirProofLib {
    struct ProofData {
        bytes proof;
        bytes32[] publicInputs;
        uint256 minGrade;
        uint256 currentTimestamp;
        uint256 expectedInstitution;
        uint256 maxAgeSeconds;
    }
    
    function createProofData(
        bytes calldata proof,
        uint256 minGrade,
        uint256 currentTimestamp,
        uint256 expectedInstitution,
        uint256 maxAgeSeconds
    ) internal pure returns (ProofData memory) {
        bytes32[] memory publicInputs = new bytes32[](4);
        publicInputs[0] = bytes32(minGrade);
        publicInputs[1] = bytes32(currentTimestamp);
        publicInputs[2] = bytes32(expectedInstitution);
        publicInputs[3] = bytes32(maxAgeSeconds);
        
        return ProofData({
            proof: proof,
            publicInputs: publicInputs,
            minGrade: minGrade,
            currentTimestamp: currentTimestamp,
            expectedInstitution: expectedInstitution,
            maxAgeSeconds: maxAgeSeconds
        });
    }
}
