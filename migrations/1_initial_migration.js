const CertificatesContract = artifacts.require("CertificatesContract");
const MockEAS = artifacts.require("MockEAS");
const MockSchemaRegistry = artifacts.require("MockSchemaRegistry");

module.exports = async function (deployer, network) {
  // Direcciones de EAS en diferentes redes
  const easAddresses = {
    // Mainnet Ethereum
    mainnet: {
      eas: "0xA1207F3BBa224E2c9c3c6D5aF63D0eb1582Ce587",
      schemaRegistry: "0xA7b39296258348C78294F95B872b282326A97BDF"
    },
    // Sepolia Testnet
    sepolia: {
      eas: "0xC2679fBD37d54388Ce493F1DB75320D236e1815e", 
      schemaRegistry: "0x0a7E2Ff54e76B8E6659aedc9103FB21c038050D0"
    },
    // Optimism
    optimism: {
      eas: "0x4200000000000000000000000000000000000021",
      schemaRegistry: "0x4200000000000000000000000000000000000020"
    },
    // Base
    base: {
      eas: "0x4200000000000000000000000000000000000021",
      schemaRegistry: "0x4200000000000000000000000000000000000020"
    }
  };

  let easAddress, schemaRegistryAddress;

  if (network === 'development' || network === 'test') {
    // Para desarrollo local, deployar mocks
    console.log("Deploying MockEAS and MockSchemaRegistry for local development...");
    
    await deployer.deploy(MockEAS);
    await deployer.deploy(MockSchemaRegistry);
    
    const mockEAS = await MockEAS.deployed();
    const mockSchemaRegistry = await MockSchemaRegistry.deployed();
    
    easAddress = mockEAS.address;
    schemaRegistryAddress = mockSchemaRegistry.address;
    
    console.log("MockEAS deployed at:", easAddress);
    console.log("MockSchemaRegistry deployed at:", schemaRegistryAddress);
  } else {
    // Para redes reales, usar direcciones existentes
    const config = easAddresses[network];
    if (!config) {
      throw new Error(`EAS addresses not configured for network: ${network}`);
    }
    
    easAddress = config.eas;
    schemaRegistryAddress = config.schemaRegistry;
    
    console.log("Using existing EAS at:", easAddress);
    console.log("Using existing SchemaRegistry at:", schemaRegistryAddress);
  }

  console.log("Deploying CertificatesContract...");
  await deployer.deploy(CertificatesContract, easAddress, schemaRegistryAddress);
  
  const certificatesContract = await CertificatesContract.deployed();
  console.log("CertificatesContract deployed at:", certificatesContract.address);
};
