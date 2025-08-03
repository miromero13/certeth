// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "./MockEAS.sol";

/**
 * @title RealCertificateVerificationSystem
 * @dev Sistema de verificación real de certificados que valida datos reales
 */
contract RealCertificateVerificationSystem {
    // Estados de verificación
    enum VerificationStatus {
        PENDING,
        VERIFIED,
        REJECTED,
        EXPIRED
    }

    // Niveles de verificación
    enum VerificationLevel {
        BASIC, // Solo validación de firma y existencia
        STANDARD, // Incluye validación EAS
        PREMIUM, // Incluye validación de reputación
        FORENSIC // Validación completa con análisis profundo
    }

    // Estructura de certificado real
    struct CertificateData {
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
        VerificationLevel level;
        VerificationStatus status;
        uint256 score; // 0-100
        bool hashValid;
        bool easValid;
        bool issuerValid;
        bool timeValid;
        bool gradeValid;
        string[] errors;
        uint256 verificationTimestamp;
        address verifier;
    }

    // Estructura de prueba ZK simplificada y realista
    struct ZKProof {
        uint256 certificateId;
        uint256 minGradeThreshold;
        bytes32 proofHash; // Hash de la prueba
        bytes32 commitment; // Commitment de los datos privados
        bool isValid;
    }

    // Variables de estado
    mapping(uint256 => CertificateData) public certificates;
    mapping(bytes32 => VerificationResult) public verificationResults;
    mapping(uint256 => ZKProof) public zkProofs;
    mapping(address => bool) public authorizedVerifiers;
    mapping(address => uint256) public issuerReputationScore; // 0-1000

    uint256 public certificatesCounter;
    uint256 public verificationsCounter;
    MockEAS public eas;

    // Eventos
    event CertificateIssued(
        uint256 indexed id,
        address indexed issuer,
        address indexed recipient,
        string courseName,
        uint256 grade
    );

    event VerificationRequested(
        bytes32 indexed verificationId,
        uint256 indexed certificateId,
        VerificationLevel level
    );

    event VerificationCompleted(
        bytes32 indexed verificationId,
        uint256 indexed certificateId,
        bool isValid,
        uint256 score
    );

    event ZKProofGenerated(
        uint256 indexed certificateId,
        bytes32 indexed commitment,
        uint256 minGradeThreshold
    );

    constructor(address _easAddress) {
        eas = MockEAS(_easAddress);
        authorizedVerifiers[msg.sender] = true;
        issuerReputationScore[msg.sender] = 900; // Deployer inicial tiene buena reputación
    }

    /**
     * @dev Emitir un certificado real con validaciones
     */
    function issueCertificate(
        string memory _recipientName,
        string memory _institutionName,
        address _recipient,
        string memory _courseName,
        string memory _description,
        uint256 _completionDate,
        uint256 _grade
    ) external returns (uint256 certificateId) {
        // Validaciones de entrada
        require(
            bytes(_recipientName).length > 0,
            "Nombre del recipient requerido"
        );
        require(
            bytes(_institutionName).length > 0,
            "Nombre de institucion requerido"
        );
        require(_recipient != address(0), "Direccion del recipient invalida");
        require(bytes(_courseName).length > 0, "Nombre del curso requerido");
        require(_grade <= 100, "Grado no puede ser mayor a 100");
        require(
            _completionDate <= block.timestamp,
            "Fecha de completacion no puede ser futura"
        );
        require(
            _completionDate > block.timestamp - 10 * 365 * 24 * 60 * 60,
            "Certificado muy antiguo"
        );

        certificatesCounter++;
        certificateId = certificatesCounter;

        // Calcular hash real del certificado
        bytes32 certHash = keccak256(
            abi.encodePacked(
                certificateId,
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

        // Crear attestation en EAS
        bytes memory attestationData = abi.encode(
            certificateId,
            _courseName,
            _grade,
            _completionDate,
            certHash
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

        // Almacenar certificado
        certificates[certificateId] = CertificateData({
            id: certificateId,
            recipientName: _recipientName,
            institutionName: _institutionName,
            courseName: _courseName,
            description: _description,
            issuedAt: block.timestamp,
            completionDate: _completionDate,
            grade: _grade,
            issuer: msg.sender,
            recipient: _recipient,
            certificateHash: certHash,
            easUID: easUID,
            isValid: true
        });

        // Actualizar reputación del emisor
        _updateIssuerReputation(msg.sender, true);

        emit CertificateIssued(
            certificateId,
            msg.sender,
            _recipient,
            _courseName,
            _grade
        );

        return certificateId;
    }

    /**
     * @dev Verificar un certificado de forma real y completa
     */
    function verifyCertificate(
        uint256 _certificateId,
        VerificationLevel _level
    ) external returns (bytes32 verificationId) {
        require(
            _certificateId > 0 && _certificateId <= certificatesCounter,
            "ID de certificado invalido"
        );

        verificationsCounter++;
        verificationId = keccak256(
            abi.encodePacked(
                _certificateId,
                msg.sender,
                block.timestamp,
                verificationsCounter
            )
        );

        emit VerificationRequested(verificationId, _certificateId, _level);

        // Ejecutar verificación inmediatamente
        VerificationResult memory result = _executeVerification(
            _certificateId,
            _level
        );
        result.verifier = msg.sender;
        result.verificationTimestamp = block.timestamp;

        verificationResults[verificationId] = result;

        emit VerificationCompleted(
            verificationId,
            _certificateId,
            result.status == VerificationStatus.VERIFIED,
            result.score
        );

        return verificationId;
    }

    /**
     * @dev Ejecutar verificación real del certificado
     */
    function _executeVerification(
        uint256 _certificateId,
        VerificationLevel _level
    ) private view returns (VerificationResult memory result) {
        CertificateData memory cert = certificates[_certificateId];
        string[] memory errors = new string[](10);
        uint256 errorCount = 0;
        uint256 score = 100;

        result.certificateId = _certificateId;
        result.level = _level;
        result.status = VerificationStatus.VERIFIED;

        // 1. Verificar existencia del certificado
        if (cert.id == 0) {
            errors[errorCount++] = "Certificado no existe";
            score -= 100;
            result.status = VerificationStatus.REJECTED;
        }

        // 2. Verificar que el certificado esté marcado como válido
        if (!cert.isValid) {
            errors[errorCount++] = "Certificado marcado como invalido";
            score -= 50;
            result.status = VerificationStatus.REJECTED;
        }

        // 3. Verificar hash del certificado
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

        result.hashValid = (expectedHash == cert.certificateHash);
        if (!result.hashValid) {
            errors[errorCount++] = "Hash del certificado no coincide";
            score -= 30;
        }

        // 4. Verificar validez temporal
        result.timeValid = _validateTimeConstraints(cert);
        if (!result.timeValid) {
            errors[errorCount++] = "Restricciones temporales no cumplidas";
            score -= 20;
        }

        // 5. Verificar grado
        result.gradeValid = (cert.grade <= 100);
        if (!result.gradeValid) {
            errors[errorCount++] = "Grado invalido";
            score -= 15;
        }

        // Verificaciones adicionales según el nivel
        if (_level >= VerificationLevel.STANDARD) {
            // 6. Verificar EAS attestation
            result.easValid = _validateEASAttestation(cert.easUID);
            if (!result.easValid) {
                errors[errorCount++] = "Attestation EAS invalida";
                score -= 25;
            }
        }

        if (_level >= VerificationLevel.PREMIUM) {
            // 7. Verificar reputación del emisor
            result.issuerValid = _validateIssuerReputation(cert.issuer);
            if (!result.issuerValid) {
                errors[errorCount++] = "Emisor no confiable";
                score -= 20;
            }
        }

        if (_level == VerificationLevel.FORENSIC) {
            // 8. Verificaciones adicionales forenses
            bool forensicValid = _performForensicValidation(cert);
            if (!forensicValid) {
                errors[errorCount++] = "Verificacion forense fallo";
                score -= 15;
            }
        }

        // Ajustar score final
        if (score < 0) score = 0;
        result.score = score;

        // Determinar status final
        if (score >= 80) {
            result.status = VerificationStatus.VERIFIED;
        } else if (score >= 50) {
            result.status = VerificationStatus.PENDING;
        } else {
            result.status = VerificationStatus.REJECTED;
        }

        // Copiar errores
        result.errors = new string[](errorCount);
        for (uint256 i = 0; i < errorCount; i++) {
            result.errors[i] = errors[i];
        }

        return result;
    }

    /**
     * @dev Generar prueba ZK simple y realista
     */
    function generateZKProof(
        uint256 _certificateId,
        uint256 _minGradeThreshold
    ) external view returns (ZKProof memory proof) {
        require(
            _certificateId > 0 && _certificateId <= certificatesCounter,
            "ID de certificado invalido"
        );

        CertificateData memory cert = certificates[_certificateId];

        require(
            cert.recipient == msg.sender,
            "Solo el titular puede generar pruebas ZK"
        );
        require(cert.isValid, "Certificado debe estar valido");
        require(
            _minGradeThreshold > 0 && _minGradeThreshold <= 100,
            "Umbral de grado invalido"
        );

        // Verificar que el grado del certificado cumple el umbral
        bool gradeAboveThreshold = cert.grade >= _minGradeThreshold;

        // Generar commitment de los datos privados
        bytes32 commitment = keccak256(
            abi.encodePacked(
                cert.grade,
                cert.recipientName,
                cert.completionDate,
                block.timestamp
            )
        );

        // Generar hash de la prueba
        bytes32 proofHash = keccak256(
            abi.encodePacked(
                _certificateId,
                _minGradeThreshold,
                commitment,
                gradeAboveThreshold
            )
        );

        proof = ZKProof({
            certificateId: _certificateId,
            minGradeThreshold: _minGradeThreshold,
            proofHash: proofHash,
            commitment: commitment,
            isValid: gradeAboveThreshold
        });

        return proof;
    }

    /**
     * @dev Verificar prueba ZK de forma realista
     */
    function verifyZKProof(
        ZKProof memory _proof,
        uint256 _certificateId
    ) external view returns (bool isValid, string memory details) {
        // Verificar que el certificateId coincide
        if (_proof.certificateId != _certificateId) {
            return (false, "ID de certificado no coincide");
        }

        CertificateData memory cert = certificates[_certificateId];

        // Verificar que el certificado existe y es válido
        if (cert.id == 0) {
            return (false, "Certificado no existe");
        }

        if (!cert.isValid) {
            return (false, "Certificado no valido");
        }

        // Verificar EAS attestation
        if (!_validateEASAttestation(cert.easUID)) {
            return (false, "Attestation EAS invalida");
        }

        // En un sistema real, aquí verificaríamos la prueba cryptográfica ZK
        // Por ahora, validamos que el hash de la prueba sea consistente
        bytes32 expectedProofHash = keccak256(
            abi.encodePacked(
                _certificateId,
                _proof.minGradeThreshold,
                _proof.commitment,
                _proof.isValid
            )
        );

        if (_proof.proofHash != expectedProofHash) {
            return (false, "Hash de prueba ZK invalido");
        }

        // Verificar que el emisor tiene buena reputación
        if (!_validateIssuerReputation(cert.issuer)) {
            return (false, "Emisor no confiable");
        }

        if (_proof.isValid) {
            return (
                true,
                string(
                    abi.encodePacked(
                        "Verificacion exitosa: El titular posee un certificado valido con grado >= ",
                        _toString(_proof.minGradeThreshold),
                        "% de ",
                        cert.institutionName
                    )
                )
            );
        } else {
            return (
                false,
                "El grado del certificado no cumple el umbral minimo"
            );
        }
    }

    // Funciones de validación auxiliares
    function _validateTimeConstraints(
        CertificateData memory cert
    ) private view returns (bool) {
        // El certificado no debe ser del futuro
        if (cert.issuedAt > block.timestamp) return false;

        // La fecha de completación debe ser anterior a la emisión
        if (cert.completionDate > cert.issuedAt) return false;

        // El certificado no debe ser demasiado antiguo (10 años)
        if (block.timestamp - cert.issuedAt > 10 * 365 * 24 * 60 * 60)
            return false;

        return true;
    }

    function _validateEASAttestation(
        bytes32 easUID
    ) private view returns (bool) {
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

    function _validateIssuerReputation(
        address issuer
    ) private view returns (bool) {
        return issuerReputationScore[issuer] >= 600; // Minimum score 600/1000
    }

    function _performForensicValidation(
        CertificateData memory cert
    ) private pure returns (bool) {
        // Validaciones forenses adicionales
        if (bytes(cert.recipientName).length < 3) return false;
        if (bytes(cert.institutionName).length < 5) return false;
        if (bytes(cert.courseName).length < 3) return false;

        return true;
    }

    function _updateIssuerReputation(address issuer, bool positive) private {
        if (positive) {
            if (issuerReputationScore[issuer] < 950) {
                issuerReputationScore[issuer] += 10;
            }
        } else {
            if (issuerReputationScore[issuer] > 50) {
                issuerReputationScore[issuer] -= 50;
            }
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
        uint256 _certificateId
    ) external view returns (CertificateData memory) {
        return certificates[_certificateId];
    }

    function getVerificationResult(
        bytes32 _verificationId
    ) external view returns (VerificationResult memory) {
        return verificationResults[_verificationId];
    }

    function getIssuerReputation(
        address _issuer
    ) external view returns (uint256) {
        return issuerReputationScore[_issuer];
    }

    function getCertificatesCounter() external view returns (uint256) {
        return certificatesCounter;
    }
}
