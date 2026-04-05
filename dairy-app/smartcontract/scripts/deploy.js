const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("Dang deploy FarmContract len Sepolia...");

  const FarmContract = await ethers.getContractFactory("FarmContract");
  const farm = await FarmContract.deploy();
  await farm.waitForDeployment();

  const address = await farm.getAddress();
  console.log("FarmContract deployed tai:", address);
  console.log("Xem tren Etherscan: https://sepolia.etherscan.io/address/" + address);

  fs.writeFileSync("./deployed-addresses.json", JSON.stringify({
    FarmContract: address,
    network: "sepolia",
    deployedAt: new Date().toISOString()
  }, null, 2));

  console.log("Da luu dia chi vao deployed-addresses.json");
}

main().catch(console.error);