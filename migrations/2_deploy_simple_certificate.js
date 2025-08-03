const MockEAS = artifacts.require("MockEAS");
const SimpleCertificateSystem = artifacts.require("SimpleCertificateSystem");

module.exports = async function(deployer, network, accounts) {
  console.log('Deploying SimpleCertificateSystem...');
  
  // Primero, obtener la dirección de MockEAS ya desplegada
  const mockEAS = await MockEAS.deployed();
  console.log('MockEAS address:', mockEAS.address);
  
  // Desplegar SimpleCertificateSystem
  await deployer.deploy(SimpleCertificateSystem, mockEAS.address);
  const simpleCertificateSystem = await SimpleCertificateSystem.deployed();
  
  console.log('SimpleCertificateSystem deployed at:', simpleCertificateSystem.address);
  
  // Configuración inicial
  console.log('Initial setup...');
  console.log('Deployer reputation score:', await simpleCertificateSystem.getIssuerReputation(accounts[0]));
};
