// Network configuration for Arbitrum Sepolia
export const NETWORK_CONFIG = {
  chainId: '0x66eee', // 421614 in hex
  chainName: 'Arbitrum Sepolia',
  rpcUrls: ['https://sepolia-rollup.arbitrum.io/rpc'],
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
  },
  blockExplorerUrls: ['https://sepolia.arbiscan.io/'],
};

// Helper function to switch to Arbitrum Sepolia
export const switchToArbitrumSepolia = async () => {
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    try {
      // Try to switch to the network
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: NETWORK_CONFIG.chainId }],
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [NETWORK_CONFIG],
          });
        } catch (addError) {
          console.error('Error adding network:', addError);
          throw new Error('No se pudo agregar la red Arbitrum Sepolia a MetaMask');
        }
      } else {
        console.error('Error switching network:', switchError);
        throw new Error('No se pudo cambiar a la red Arbitrum Sepolia');
      }
    }
  } else {
    throw new Error('MetaMask no está instalado');
  }
};

// Check if we're on the correct network
export const isCorrectNetwork = async (): Promise<boolean> => {
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    try {
      const chainId = await (window as any).ethereum.request({
        method: 'eth_chainId',
      });
      return chainId === NETWORK_CONFIG.chainId;
    } catch (error) {
      console.error('Error checking network:', error);
      return false;
    }
  }
  return false;
};

// Get current network name
export const getCurrentNetworkName = async (): Promise<string> => {
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    try {
      const chainId = await (window as any).ethereum.request({
        method: 'eth_chainId',
      });
      
      switch (chainId) {
        case '0x1':
          return 'Ethereum Mainnet';
        case '0x5':
          return 'Goerli Testnet';
        case '0xaa36a7':
          return 'Sepolia Testnet';
        case '0x66eee':
          return 'Arbitrum Sepolia';
        case '0xa4b1':
          return 'Arbitrum One';
        default:
          return `Red desconocida (${chainId})`;
      }
    } catch (error) {
      console.error('Error getting network:', error);
      return 'Red desconocida';
    }
  }
  return 'MetaMask no disponible';
};