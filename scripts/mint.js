require("dotenv").config();
const ethers = require("ethers");
const API_URL = process.env.API_URL;

const PUBLIC_KEY = process.env.PUBLIC_KEY;
const PRIVATE_KEY = process.env.GOERLI_PRIVATE_KEY;
const API_KEY = process.env.ALCHEMY_API_KEY;
const contractAddress = process.env.CONTRACT_ADDRESS;

const to_account = "0x9C81A0d297Bd01A9394a19Eac4AD04aa237b2ed9";
const contract = require("../artifacts/contracts/Degree.sol/Degree.json");

// Provider
const alchemyProvider = new ethers.providers.AlchemyProvider(network = "goerli", API_KEY);

// Signer
const signer = new ethers.Wallet(PRIVATE_KEY, alchemyProvider);
console.log(signer.address);

// Contract
const degreeContract = new ethers.Contract(contractAddress, contract.abi, signer);


async function safeMint(tokenURI) {
    console.log("Minting your NFT");
    try {
        const tx = await degreeContract.safeMint(
            to_account, "Bappa", 11, "Vu", tokenURI
        );
        await tx.wait();
        console.log("NFT minted : ", tx);
    } catch (error) {
        console.log(error);
    }

}

safeMint("https://tinypng.com/images/social/website.jpg");




// console.log(JSON.stringify(contract.abi));

