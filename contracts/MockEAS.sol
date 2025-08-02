// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

// Mock contract para testing local de EAS
contract MockEAS {
    struct Attestation {
        bytes32 uid;
        bytes32 schema;
        uint64 time;
        uint64 expirationTime;
        uint64 revocationTime;
        bytes32 refUID;
        address recipient;
        address attester;
        bool revocable;
        bytes data;
    }

    struct AttestationRequest {
        bytes32 schema;
        AttestationRequestData data;
    }

    struct AttestationRequestData {
        address recipient;
        uint64 expirationTime;
        bool revocable;
        bytes32 refUID;
        bytes data;
        uint256 value;
    }

    struct RevocationRequest {
        bytes32 schema;
        RevocationRequestData data;
    }

    struct RevocationRequestData {
        bytes32 uid;
        uint256 value;
    }

    mapping(bytes32 => Attestation) public attestations;
    uint256 private nonce;

    function attest(AttestationRequest calldata request) external returns (bytes32) {
        bytes32 uid = keccak256(abi.encodePacked(msg.sender, nonce++, block.timestamp));
        
        attestations[uid] = Attestation({
            uid: uid,
            schema: request.schema,
            time: uint64(block.timestamp),
            expirationTime: request.data.expirationTime,
            revocationTime: 0,
            refUID: request.data.refUID,
            recipient: request.data.recipient,
            attester: msg.sender,
            revocable: request.data.revocable,
            data: request.data.data
        });

        return uid;
    }

    function revoke(RevocationRequest calldata request) external returns (bool) {
        require(attestations[request.data.uid].attester == msg.sender, "Only attester can revoke");
        require(attestations[request.data.uid].revocable, "Attestation is not revocable");
        
        attestations[request.data.uid].revocationTime = uint64(block.timestamp);
        return true;
    }

    function getAttestation(bytes32 uid) external view returns (Attestation memory) {
        return attestations[uid];
    }
}

contract MockSchemaRegistry {
    mapping(bytes32 => string) public schemas;
    uint256 private nonce;

    function register(string calldata schema, address resolver, bool revocable) external returns (bytes32) {
        bytes32 uid = keccak256(abi.encodePacked(schema, resolver, revocable, nonce++));
        schemas[uid] = schema;
        return uid;
    }
}
