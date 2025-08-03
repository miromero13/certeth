// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

// Import NOIR verifier interface
import "./NoirVerifier.sol";

// Interfaces para EAS
interface IEAS {
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

    function attest(
        AttestationRequest calldata request
    ) external returns (bytes32);
    function revoke(RevocationRequest calldata request) external returns (bool);
    function getAttestation(
        bytes32 uid
    ) external view returns (Attestation memory);
}

interface ISchemaRegistry {
    function register(
        string calldata schema,
        address resolver,
        bool revocable
    ) external returns (bytes32);
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

contract CertificatesContract {
    uint256 public certificatesCounter = 0;

    struct Certificate {
        uint256 id;
        string recipientName;
        string institutionName;
        string courseName;
        string description;
        bool isValid;
        uint256 issuedAt;
        address issuer;
        address recipient; // Dirección del titular del certificado
        bytes32 certificateHash; // Hash único del certificado para verificación
        bytes32 easUID; // UID del attestation en EAS
        bytes32 zkProofHash; // Hash de la prueba ZK para verificación privada
        bytes32 privateDataHash; // Hash de datos privados (notas, calificaciones, etc.)
    }

    struct VerificationData {
        bytes32 certificateHash;
        uint256 timestamp;
        address verifier;
        bool isPrivateVerification; // Si fue verificado usando ZK
    }

    event CertificateIssued(
        uint256 id,
        string recipientName,
        string institutionName,
        string courseName,
        string description,
        uint256 issuedAt,
        address issuer,
        address recipient,
        bytes32 certificateHash,
        bytes32 easUID
    );

    event CertificateRevoked(uint256 id, address revokedBy, bytes32 easUID);
    event ZKProofVerified(
        uint256 certificateId,
        bytes32 proofHash,
        address verifier
    );

    mapping(uint256 => Certificate) public certificates;
    mapping(bytes32 => uint256) public hashToCertificateId;
    mapping(address => uint256[]) public recipientCertificates; // Certificados por titular
    mapping(address => uint256[]) public issuerCertificates; // Certificados por emisor
    mapping(bytes32 => VerificationData) public verificationHistory;

    // EAS Integration
    IEAS public eas;
    ISchemaRegistry public schemaRegistry;
    bytes32 public certificateSchema;

    // NOIR ZK Verification
    INoirCertificateVerifier public noirVerifier;
    mapping(bytes32 => bool) public validZKProofs; // Pruebas ZK válidas

    modifier onlyValidCertificate(uint256 _certificateId) {
        require(
            _certificateId > 0 && _certificateId <= certificatesCounter,
            "ID de certificado invalido"
        );
        require(
            certificates[_certificateId].isValid,
            "El certificado no es valido"
        );
        _;
    }

    modifier onlyIssuerOrRecipient(uint256 _certificateId) {
        require(
            certificates[_certificateId].issuer == msg.sender ||
                certificates[_certificateId].recipient == msg.sender,
            "Solo el emisor o titular puede realizar esta accion"
        );
        _;
    }

    constructor(address _easContract, address _schemaRegistry) {
        eas = IEAS(_easContract);
        schemaRegistry = ISchemaRegistry(_schemaRegistry);

        // Deploy NOIR verifier
        noirVerifier = new MockNoirVerifier();

        // Registrar esquema para certificados en EAS
        certificateSchema = schemaRegistry.register(
            "string recipientName,string institutionName,string courseName,string description,uint256 issuedAt,bytes32 certificateHash",
            address(0), // No resolver
            true // Revocable
        );

        // Crear un certificado de ejemplo
        issueCertificate(
            "Juan Perez",
            "Universidad Blockchain",
            msg.sender, // recipient
            "Introduccion a Solidity",
            "Certificado de completacion del curso basico de Solidity"
        );
    }

    function issueCertificate(
        string memory _recipientName,
        string memory _institutionName,
        address _recipient,
        string memory _courseName,
        string memory _description
    ) public {
        issueCertificateWithPrivateData(
            _recipientName,
            _institutionName,
            _recipient,
            _courseName,
            _description,
            bytes32(0) // Sin datos privados por defecto
        );
    }

    function issueCertificateWithPrivateData(
        string memory _recipientName,
        string memory _institutionName,
        address _recipient,
        string memory _courseName,
        string memory _description,
        bytes32 _privateDataHash // Hash de datos privados como notas, calificaciones
    ) public {
        certificatesCounter++;

        // Generar hash único del certificado
        bytes32 certificateHash = _generateCertificateHash(
            _recipientName,
            _institutionName,
            _courseName,
            _recipient
        );

        // Crear attestation en EAS
        bytes32 easUID = _createEASAttestation(
            _recipientName,
            _institutionName,
            _courseName,
            _description,
            certificateHash,
            _recipient
        );

        // Generar hash para prueba ZK
        bytes32 zkProofHash = _generateZKProofHash(certificateHash);

        // Almacenar certificado
        _storeCertificate(
            _recipientName,
            _institutionName,
            _courseName,
            _description,
            _recipient,
            certificateHash,
            easUID,
            zkProofHash,
            _privateDataHash
        );

        _emitCertificateIssued(
            _recipientName,
            _institutionName,
            _courseName,
            _description,
            _recipient,
            certificateHash,
            easUID
        );
    }

    function _generateCertificateHash(
        string memory _recipientName,
        string memory _institutionName,
        string memory _courseName,
        address _recipient
    ) internal view returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(
                    certificatesCounter,
                    _recipientName,
                    _institutionName,
                    _courseName,
                    _recipient,
                    block.timestamp,
                    msg.sender
                )
            );
    }

    function _createEASAttestation(
        string memory _recipientName,
        string memory _institutionName,
        string memory _courseName,
        string memory _description,
        bytes32 certificateHash,
        address _recipient
    ) internal returns (bytes32) {
        bytes memory attestationData = abi.encode(
            _recipientName,
            _institutionName,
            _courseName,
            _description,
            block.timestamp,
            certificateHash
        );

        AttestationRequest memory request = AttestationRequest({
            schema: certificateSchema,
            data: AttestationRequestData({
                recipient: _recipient,
                expirationTime: 0,
                revocable: true,
                refUID: bytes32(0),
                data: attestationData,
                value: 0
            })
        });

        return eas.attest(request);
    }

    function _generateZKProofHash(
        bytes32 certificateHash
    ) internal view returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(
                    certificateHash,
                    "zk_proof_placeholder",
                    block.timestamp
                )
            );
    }

    function _storeCertificate(
        string memory _recipientName,
        string memory _institutionName,
        string memory _courseName,
        string memory _description,
        address _recipient,
        bytes32 certificateHash,
        bytes32 easUID,
        bytes32 zkProofHash,
        bytes32 _privateDataHash
    ) internal {
        certificates[certificatesCounter] = Certificate(
            certificatesCounter,
            _recipientName,
            _institutionName,
            _courseName,
            _description,
            true,
            block.timestamp,
            msg.sender,
            _recipient,
            certificateHash,
            easUID,
            zkProofHash,
            _privateDataHash
        );

        hashToCertificateId[certificateHash] = certificatesCounter;
        recipientCertificates[_recipient].push(certificatesCounter);
        issuerCertificates[msg.sender].push(certificatesCounter);
        validZKProofs[zkProofHash] = true;
    }

    function _emitCertificateIssued(
        string memory _recipientName,
        string memory _institutionName,
        string memory _courseName,
        string memory _description,
        address _recipient,
        bytes32 certificateHash,
        bytes32 easUID
    ) internal {
        emit CertificateIssued(
            certificatesCounter,
            _recipientName,
            _institutionName,
            _courseName,
            _description,
            block.timestamp,
            msg.sender,
            _recipient,
            certificateHash,
            easUID
        );
    }

    function revokeCertificate(uint256 _id) public onlyIssuerOrRecipient(_id) {
        require(
            _id > 0 && _id <= certificatesCounter,
            "ID de certificado invalido"
        );
        require(certificates[_id].isValid, "El certificado ya esta revocado");

        // Revocar en EAS
        RevocationRequest memory revocationRequest = RevocationRequest({
            schema: certificateSchema,
            data: RevocationRequestData({
                uid: certificates[_id].easUID,
                value: 0
            })
        });

        eas.revoke(revocationRequest);

        certificates[_id].isValid = false;
        validZKProofs[certificates[_id].zkProofHash] = false;

        emit CertificateRevoked(_id, msg.sender, certificates[_id].easUID);
    }

    // SOLO VERIFICACIÓN ZK - No hay verificación pública
    function verifyZKProof(
        bytes32 _zkProofHash,
        bytes32 /* _commitment */,
        bytes calldata /* _proof */
    ) public returns (bool) {
        // En una implementación real, aquí se verificaría la prueba ZK
        // Por ahora simulamos la verificación
        require(validZKProofs[_zkProofHash], "Prueba ZK invalida");

        // Encontrar el certificado asociado a esta prueba ZK
        uint256 certificateId = 0;
        for (uint256 i = 1; i <= certificatesCounter; i++) {
            if (certificates[i].zkProofHash == _zkProofHash) {
                certificateId = i;
                break;
            }
        }

        require(certificateId > 0, "Certificado no encontrado");
        require(certificates[certificateId].isValid, "Certificado no valido");

        // Registrar verificación
        verificationHistory[_zkProofHash] = VerificationData({
            certificateHash: certificates[certificateId].certificateHash,
            timestamp: block.timestamp,
            verifier: msg.sender,
            isPrivateVerification: true
        });

        emit ZKProofVerified(certificateId, _zkProofHash, msg.sender);
        return true;
    }

    // Verificación ZK con condiciones específicas usando NOIR
    function verifyConditionalZKProof(
        bytes calldata noirProof,
        uint256 minGrade,
        uint256 currentTimestamp,
        uint256 expectedInstitution,
        uint256 maxAgeSeconds
    ) public returns (bool) {
        // Crear los inputs públicos para NOIR
        NoirProofLib.ProofData memory proofData = NoirProofLib.createProofData(
            noirProof,
            minGrade,
            currentTimestamp,
            expectedInstitution,
            maxAgeSeconds
        );

        // Verificar la prueba NOIR
        bool isValidProof = noirVerifier.verifyProof(
            proofData.proof,
            proofData.publicInputs
        );

        require(isValidProof, "Prueba NOIR invalida");

        // Registrar verificación condicional exitosa
        bytes32 proofHash = keccak256(
            abi.encodePacked(
                noirProof,
                minGrade,
                currentTimestamp,
                expectedInstitution,
                maxAgeSeconds
            )
        );

        verificationHistory[proofHash] = VerificationData({
            certificateHash: bytes32(0), // No revelamos el hash específico
            timestamp: block.timestamp,
            verifier: msg.sender,
            isPrivateVerification: true
        });

        emit ZKProofVerified(0, proofHash, msg.sender);
        return true;
    }

    // Función helper para generar prueba NOIR (off-chain)
    function getNoirPublicInputs(
        uint256 minGrade,
        uint256 currentTimestamp,
        uint256 expectedInstitution,
        uint256 maxAgeSeconds
    ) public pure returns (bytes32[] memory) {
        bytes32[] memory publicInputs = new bytes32[](4);
        publicInputs[0] = bytes32(minGrade);
        publicInputs[1] = bytes32(currentTimestamp);
        publicInputs[2] = bytes32(expectedInstitution);
        publicInputs[3] = bytes32(maxAgeSeconds);
        return publicInputs;
    }

    // Obtener todos los certificados del titular (para su billetera)
    function getMyCertificates() public view returns (uint256[] memory) {
        return recipientCertificates[msg.sender];
    }

    // Obtener certificados emitidos por una institución
    function getCertificatesByIssuer(
        address _issuer
    ) public view returns (uint256[] memory) {
        return issuerCertificates[_issuer];
    }

    // Generar datos para verificación externa (JSON/Link)
    function generateVerificationData(
        uint256 _id
    ) public view returns (string memory verificationJSON) {
        require(
            _id > 0 && _id <= certificatesCounter,
            "ID de certificado invalido"
        );
        Certificate memory cert = certificates[_id];

        // En una implementación real, esto generaría un JSON completo
        // Por ahora devolvemos los datos básicos como string
        verificationJSON = string(
            abi.encodePacked(
                '{"id":',
                _uint2str(_id),
                ',"hash":"',
                _bytes32ToString(cert.certificateHash),
                '","easUID":"',
                _bytes32ToString(cert.easUID),
                '","recipient":"',
                _addressToString(cert.recipient),
                '","issuer":"',
                _addressToString(cert.issuer),
                '","valid":',
                cert.isValid ? "true" : "false",
                ',"timestamp":',
                _uint2str(cert.issuedAt),
                "}"
            )
        );
    }

    // Verificar certificado usando EAS directamente
    function verifyWithEAS(
        bytes32 _easUID
    ) public view returns (bool isValid, bytes memory data) {
        IEAS.Attestation memory attestation = eas.getAttestation(_easUID);
        return (attestation.revocationTime == 0, attestation.data);
    }

    // Funciones de utilidad para conversión de tipos
    function _uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) return "0";
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - (_i / 10) * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }

    function _bytes32ToString(
        bytes32 _bytes32
    ) internal pure returns (string memory) {
        bytes memory hexBytes = new bytes(66); // "0x" + 64 hex chars
        hexBytes[0] = "0";
        hexBytes[1] = "x";

        bytes memory hexAlphabet = "0123456789abcdef";

        for (uint256 i = 0; i < 32; i++) {
            hexBytes[2 + i * 2] = hexAlphabet[uint8(_bytes32[i] >> 4)];
            hexBytes[2 + i * 2 + 1] = hexAlphabet[uint8(_bytes32[i] & 0x0f)];
        }

        return string(hexBytes);
    }

    function _addressToString(
        address _address
    ) internal pure returns (string memory) {
        bytes32 _bytes = bytes32(uint256(uint160(_address)));
        bytes memory HEX = "0123456789abcdef";
        bytes memory _string = new bytes(42);
        _string[0] = "0";
        _string[1] = "x";
        for (uint i = 0; i < 20; i++) {
            _string[2 + i * 2] = HEX[uint8(_bytes[i + 12] >> 4)];
            _string[3 + i * 2] = HEX[uint8(_bytes[i + 12] & 0x0f)];
        }
        return string(_string);
    }

    // Función para generar prueba ZK (placeholder para implementación real)
    function generateZKProof(
        uint256 _certificateId
    ) public view returns (bytes32 proofHash, bytes32 commitment) {
        require(
            _certificateId > 0 && _certificateId <= certificatesCounter,
            "ID invalido"
        );
        require(
            certificates[_certificateId].recipient == msg.sender,
            "Solo el titular puede generar prueba ZK"
        );

        proofHash = certificates[_certificateId].zkProofHash;
        commitment = keccak256(
            abi.encodePacked(proofHash, msg.sender, block.timestamp)
        );
    }
}
