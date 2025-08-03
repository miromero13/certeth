// Deployment configuration for Arbitrum Sepolia
export const DEPLOYMENT_CONFIG = {
  network: {
    name: 'Arbitrum Sepolia',
    chainId: 421614,
    chainIdHex: '0x66eee',
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    explorer: 'https://sepolia.arbiscan.io',
    symbol: 'ETH',
    decimals: 18
  },
  contracts: {
    // Deployed on Arbitrum Sepolia
    MockEAS: '0x395606843558787D30608B1504B4379285d36E0a',
    MockSchemaRegistry: '0x741aaF4918702417e6ed06b4c60719F1DBda4BB1',
    CertificatesContract: '0x3FC85d298d55b17253F62A2Be4198A53308E84B2',
    SimpleCertificateSystem: '0xd5d1bF8F538769Ed2b0421B85A638B7C2d18cF32'
  },
  deployment: {
    date: '2025-08-03',
    totalCost: '0.007236259 ETH',
    deployer: '0x191B51546C092135c78CEB4Ba37E89aDA0cb4D76',
    gasUsed: {
      MockEAS: 589852,
      MockSchemaRegistry: 369553,
      CertificatesContract: 3963172,
      SimpleCertificateSystem: 2313682
    }
  }
};

// Contract URLs for verification
export const CONTRACT_URLS = {
  MockEAS: `${DEPLOYMENT_CONFIG.network.explorer}/address/${DEPLOYMENT_CONFIG.contracts.MockEAS}`,
  MockSchemaRegistry: `${DEPLOYMENT_CONFIG.network.explorer}/address/${DEPLOYMENT_CONFIG.contracts.MockSchemaRegistry}`,
  CertificatesContract: `${DEPLOYMENT_CONFIG.network.explorer}/address/${DEPLOYMENT_CONFIG.contracts.CertificatesContract}`,
  SimpleCertificateSystem: `${DEPLOYMENT_CONFIG.network.explorer}/address/${DEPLOYMENT_CONFIG.contracts.SimpleCertificateSystem}`
};

// Helper function to get contract address by name
export const getContractAddress = (contractName: keyof typeof DEPLOYMENT_CONFIG.contracts): string => {
  return DEPLOYMENT_CONFIG.contracts[contractName];
};

// Helper function to get explorer URL for a contract
export const getContractExplorerUrl = (contractName: keyof typeof DEPLOYMENT_CONFIG.contracts): string => {
  return CONTRACT_URLS[contractName];
};
