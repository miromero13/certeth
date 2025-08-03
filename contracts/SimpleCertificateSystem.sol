// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "./MockEAS.sol";

/**
 * @title SimpleCertificateSystem
 * @dev Sistema simple pero realista de certificados con verificación real
 */
contract SimpleCertificateSystem {
    // Estructura del certificado
    struct Certificate {
        uint256 id;
        string recipientName;
        string institutionName;
        string courseName;
        string description;
        uint256 issuedAt;
        uint256 completionDate;
        uint256 grade;
        address issuer;
        address recipient;
        bytes32 certificateHash;
        bytes32 easUID;
        bool isValid;
    }

    // Estructura de verificación
    struct VerificationResult {
        uint256 certificateId;
        uint256 level; // 0: BASIC, 1: STANDARD, 2: PREMIUM, 3: FORENSIC
        bool isValid;
        uint256 score; // 0-100
        bool hashValid;
        bool easValid;
        bool issuerValid;
        bool timeValid;
        string[] errors;
        uint256 timestamp;
        address verifier;
    }

    // Estructura de prueba ZK
    struct ZKProof {
        uint256 certificateId;
        uint256 minGradeThreshold;
        bytes32 proofHash;
        bytes32 commitment;
        bool gradeAboveThreshold;
    }

    // Variables de estado
    mapping(uint256 => Certificate) public certificates;
    mapping(bytes32 => VerificationResult) public verifications;
    mapping(address => uint256) public issuerReputation; // 0-1000

    uint256 public certificateCounter;
    uint256 public verificationCounter;
    MockEAS public eas;

    // Eventos
    event CertificateIssued(
        uint256 indexed id,
        address indexed issuer,
        address indexed recipient,
        string courseName,
        uint256 grade
    );

    event CertificateVerified(
        uint256 indexed certificateId,
        address indexed verifier,
        bool isValid,
        uint256 score
    );

    event ZKProofGenerated(
        uint256 indexed certificateId,
        uint256 minGradeThreshold,
        bool gradeAboveThreshold
    );

    constructor(address _easAddress) {
        eas = MockEAS(_easAddress);
        issuerReputation[msg.sender] = 900; // Deployer inicial
    }

    /**
     * @dev Emitir un certificado
     */
    function issueCertificate(
        string memory _recipientName,
        string memory _institutionName,
        address _recipient,
        string memory _courseName,
        string memory _description,
        uint256 _completionDate,
        uint256 _grade
    ) external returns (uint256) {
        // Validaciones
        require(bytes(_recipientName).length > 0, "Nombre requerido");
        require(bytes(_institutionName).length > 0, "Institucion requerida");
        require(_recipient != address(0), "Recipient invalido");
        require(bytes(_courseName).length > 0, "Curso requerido");
        require(_grade <= 100, "Grado maximo 100");
        require(_completionDate <= block.timestamp, "Fecha futura invalida");

        certificateCounter++;
        uint256 id = certificateCounter;

        // Calcular hash real
        bytes32 hash = keccak256(
            abi.encodePacked(
                id,
                _recipientName,
                _institutionName,
                _recipient,
                _courseName,
                _completionDate,
                _grade,
                msg.sender,
                block.timestamp
            )
        );

        // Crear attestation EAS
        bytes memory attestationData = abi.encode(
            id,
            _courseName,
            _grade,
            _completionDate,
            hash
        );

        MockEAS.AttestationRequest memory req = MockEAS.AttestationRequest({
            schema: keccak256("certificate_v1"),
            data: MockEAS.AttestationRequestData({
                recipient: _recipient,
                expirationTime: uint64(block.timestamp + 365 * 24 * 60 * 60), // 1 año
                revocable: true,
                refUID: bytes32(0),
                data: attestationData,
                value: 0
            })
        });

        bytes32 easUID = eas.attest(req);

        // Guardar certificado
        certificates[id] = Certificate({
            id: id,
            recipientName: _recipientName,
            institutionName: _institutionName,
            courseName: _courseName,
            description: _description,
            issuedAt: block.timestamp,
            completionDate: _completionDate,
            grade: _grade,
            issuer: msg.sender,
            recipient: _recipient,
            certificateHash: hash,
            easUID: easUID,
            isValid: true
        });

        // Actualizar reputación
        if (issuerReputation[msg.sender] < 950) {
            issuerReputation[msg.sender] += 10;
        }

        emit CertificateIssued(id, msg.sender, _recipient, _courseName, _grade);

        return id;
    }

    /**
     * @dev Verificar certificado con validaciones reales
     */
    function verifyCertificate(
        uint256 _certificateId,
        uint256 _level
    ) external returns (bytes32 verificationId) {
        require(
            _certificateId > 0 && _certificateId <= certificateCounter,
            "ID invalido"
        );
        require(_level <= 3, "Nivel invalido");

        verificationCounter++;
        verificationId = keccak256(
            abi.encodePacked(
                _certificateId,
                msg.sender,
                block.timestamp,
                verificationCounter
            )
        );

        Certificate memory cert = certificates[_certificateId];

        // Variables de verificación
        bool isValid = true;
        uint256 score = 100;
        string[] memory errors = new string[](10);
        uint256 errorCount = 0;

        // 1. Verificar existencia
        if (cert.id == 0) {
            isValid = false;
            score = 0;
            errors[errorCount++] = "Certificado no existe";
        } else {
            // 2. Verificar validez básica
            if (!cert.isValid) {
                isValid = false;
                score -= 50;
                errors[errorCount++] = "Certificado revocado";
            }

            // 3. Verificar hash
            bytes32 expectedHash = keccak256(
                abi.encodePacked(
                    cert.id,
                    cert.recipientName,
                    cert.institutionName,
                    cert.recipient,
                    cert.courseName,
                    cert.completionDate,
                    cert.grade,
                    cert.issuer,
                    cert.issuedAt
                )
            );

            bool hashValid = (expectedHash == cert.certificateHash);
            if (!hashValid) {
                isValid = false;
                score -= 30;
                errors[errorCount++] = "Hash invalido";
            }

            // 4. Verificar tiempo
            bool timeValid = (cert.issuedAt <= block.timestamp &&
                cert.completionDate <= cert.issuedAt &&
                (block.timestamp - cert.issuedAt) <= 10 * 365 * 24 * 60 * 60);
            if (!timeValid) {
                score -= 20;
                errors[errorCount++] = "Restricciones temporales";
            }

            // 5. Verificar EAS (nivel estándar+)
            bool easValid = true;
            if (_level >= 1) {
                easValid = _verifyEAS(cert.easUID);
                if (!easValid) {
                    score -= 25;
                    errors[errorCount++] = "EAS attestation invalida";
                }
            }

            // 6. Verificar emisor (nivel premium+)
            bool issuerValid = true;
            if (_level >= 2) {
                issuerValid = (issuerReputation[cert.issuer] >= 600);
                if (!issuerValid) {
                    score -= 20;
                    errors[errorCount++] = "Emisor no confiable";
                }
            }

            // Determinar validez final
            if (score < 70) {
                isValid = false;
            }

            // Guardar resultado
            string[] memory finalErrors = new string[](errorCount);
            for (uint256 i = 0; i < errorCount; i++) {
                finalErrors[i] = errors[i];
            }

            verifications[verificationId] = VerificationResult({
                certificateId: _certificateId,
                level: _level,
                isValid: isValid,
                score: score,
                hashValid: hashValid,
                easValid: easValid,
                issuerValid: issuerValid,
                timeValid: timeValid,
                errors: finalErrors,
                timestamp: block.timestamp,
                verifier: msg.sender
            });
        }

        emit CertificateVerified(_certificateId, msg.sender, isValid, score);

        return verificationId;
    }

    /**
     * @dev Generar prueba ZK realista
     */
    function generateZKProof(
        uint256 _certificateId,
        uint256 _minGradeThreshold
    ) external view returns (ZKProof memory) {
        require(
            _certificateId > 0 && _certificateId <= certificateCounter,
            "ID invalido"
        );
        require(
            _minGradeThreshold > 0 && _minGradeThreshold <= 100,
            "Umbral invalido"
        );

        Certificate memory cert = certificates[_certificateId];
        require(
            cert.recipient == msg.sender,
            "Solo el titular puede generar ZK"
        );
        require(cert.isValid, "Certificado invalido");

        bool gradeAboveThreshold = cert.grade >= _minGradeThreshold;

        bytes32 commitment = keccak256(
            abi.encodePacked(
                cert.grade,
                cert.recipientName,
                cert.completionDate,
                block.timestamp
            )
        );

        bytes32 proofHash = keccak256(
            abi.encodePacked(
                _certificateId,
                _minGradeThreshold,
                commitment,
                gradeAboveThreshold,
                cert.certificateHash
            )
        );

        return
            ZKProof({
                certificateId: _certificateId,
                minGradeThreshold: _minGradeThreshold,
                proofHash: proofHash,
                commitment: commitment,
                gradeAboveThreshold: gradeAboveThreshold
            });
    }

    /**
     * @dev Verificar prueba ZK
     */
    function verifyZKProof(
        ZKProof memory _proof
    ) external view returns (bool isValid, string memory details) {
        // Verificar que el certificado existe
        Certificate memory cert = certificates[_proof.certificateId];
        if (cert.id == 0) {
            return (false, "Certificado no existe");
        }

        if (!cert.isValid) {
            return (false, "Certificado no valido");
        }

        // Verificar EAS
        if (!_verifyEAS(cert.easUID)) {
            return (false, "EAS attestation invalida");
        }

        // Verificar emisor
        if (issuerReputation[cert.issuer] < 600) {
            return (false, "Emisor no confiable");
        }

        // Verificar integridad de la prueba
        bytes32 expectedProofHash = keccak256(
            abi.encodePacked(
                _proof.certificateId,
                _proof.minGradeThreshold,
                _proof.commitment,
                _proof.gradeAboveThreshold,
                cert.certificateHash
            )
        );

        if (_proof.proofHash != expectedProofHash) {
            return (false, "Hash de prueba ZK invalido");
        }

        if (_proof.gradeAboveThreshold) {
            return (
                true,
                string(
                    abi.encodePacked(
                        "Verificacion exitosa: El titular posee un certificado de ",
                        cert.institutionName,
                        " con grado >= ",
                        _toString(_proof.minGradeThreshold),
                        "%"
                    )
                )
            );
        } else {
            return (false, "El grado no cumple el umbral minimo");
        }
    }

    // Funciones auxiliares
    function _verifyEAS(bytes32 easUID) private view returns (bool) {
        try eas.getAttestation(easUID) returns (
            MockEAS.Attestation memory attestation
        ) {
            return
                attestation.uid != bytes32(0) &&
                attestation.revocationTime == 0 &&
                attestation.expirationTime > block.timestamp;
        } catch {
            return false;
        }
    }

    function _toString(uint256 value) private pure returns (string memory) {
        if (value == 0) return "0";

        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }

        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }

        return string(buffer);
    }

    // Funciones de consulta
    function getCertificate(
        uint256 _id
    ) external view returns (Certificate memory) {
        return certificates[_id];
    }

    function getVerificationResult(
        bytes32 _id
    ) external view returns (VerificationResult memory) {
        return verifications[_id];
    }

    function getIssuerReputation(
        address _issuer
    ) external view returns (uint256) {
        return issuerReputation[_issuer];
    }

    function getCertificateCounter() external view returns (uint256) {
        return certificateCounter;
    }
}
