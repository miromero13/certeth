// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

// Mock contract para testing de Schema Registry
contract MockSchemaRegistry {
    struct SchemaRecord {
        bytes32 uid;
        address resolver;
        bool revocable;
        string schema;
    }

    mapping(bytes32 => SchemaRecord) public schemas;
    uint256 private nonce;

    function register(
        string calldata schema,
        address resolver,
        bool revocable
    ) external returns (bytes32) {
        bytes32 uid = keccak256(
            abi.encodePacked(msg.sender, nonce++, block.timestamp)
        );

        schemas[uid] = SchemaRecord({
            uid: uid,
            resolver: resolver,
            revocable: revocable,
            schema: schema
        });

        return uid;
    }

    function getSchema(
        bytes32 uid
    ) external view returns (SchemaRecord memory) {
        return schemas[uid];
    }
}
