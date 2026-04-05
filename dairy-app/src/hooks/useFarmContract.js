import { ethers } from 'ethers';
import FarmContractABI from '../contracts/FarmContract.json';

const CONTRACT_ADDRESS = '0x4cdA7F51303b7a0a0e400920671c26d7A4E16b4c';

export function useFarmContract() {

  const getContract = async () => {
    if (!window.ethereum) {
      alert('Vui lòng cài MetaMask để ghi lên blockchain!');
      return null;
    }
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, FarmContractABI.abi, signer);
  };

  // Đăng ký bò lên blockchain
  const registerCowOnChain = async (cowId, breed, dob) => {
    try {
      const contract = await getContract();
      if (!contract) return null;

      const birthTimestamp = Math.floor(new Date(dob).getTime() / 1000);
      const tx = await contract.registerCow(cowId, breed, birthTimestamp);
      
      console.log('Đang chờ xác nhận...', tx.hash);
      await tx.wait();
      console.log('Đã ghi lên blockchain!', tx.hash);
      return tx.hash;
    } catch (error) {
      console.error('Lỗi blockchain:', error);
      return null;
    }
  };

  return { registerCowOnChain };
}