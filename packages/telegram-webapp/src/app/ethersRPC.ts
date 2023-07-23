import type { SafeEventEmitterProvider } from "@web3auth/base";
import { ethers } from "ethers";
import { createWalletClient, custom } from "viem"
import { sepolia } from 'viem/chains'

export default class EthereumRpc {
    private provider: SafeEventEmitterProvider;

    constructor(provider: SafeEventEmitterProvider) {
        this.provider = provider;
    }

    addressToBytes32(address: string): string {
        return ethers.utils
            .hexZeroPad(ethers.utils.hexStripZeros(address), 32)
            .toLowerCase();
    }

    async getChainId(): Promise<any> {
        try {
            const ethersProvider = new ethers.providers.Web3Provider(this.provider);
            // Get the connected Chain's ID
            const networkDetails = await ethersProvider.getNetwork();

            const client = createWalletClient({
                chain: sepolia,
                transport: custom(this.provider)
            })

            const chainId = await client.getChainId()
            console.log({ chainId })

            const accounts = await client.getAddresses()
            console.log({accounts})

            return networkDetails.chainId;
        } catch (error) {
            return error;
        }
    }

    async getAccounts(): Promise<any> {
        try {
            const ethersProvider = new ethers.providers.Web3Provider(this.provider);
            const signer = ethersProvider.getSigner();

            // Get user's Ethereum public address
            const address = await signer.getAddress();

            return address;
        } catch (error) {
            return error;
        }
    }

    async getTokenBalance(tokenAddress: string): Promise<string> {
        try {
            const ethersProvider = new ethers.providers.Web3Provider(this.provider);
            const signer = ethersProvider.getSigner();

            const contractInterface = new ethers.utils.Interface(['function balanceOf(address owner) view returns (uint256)', 'function decimals() view returns (uint8)']);
            const contract = new ethers.Contract(tokenAddress, contractInterface, signer);

            const decimals = await contract.decimals()
            const balance = await contract.balanceOf(signer.getAddress())

            return ethers.utils.formatUnits(balance, decimals);
        } catch (error) {
            return error as string;
        }
    }

    async getBalance(): Promise<string> {
        try {
            const ethersProvider = new ethers.providers.Web3Provider(this.provider);
            const signer = ethersProvider.getSigner();

            // Get user's Ethereum public address
            const address = await signer.getAddress();

            // Get user's balance in ether
            const balance = ethers.utils.formatEther(
                await ethersProvider.getBalance(address) // Balance is in wei
            );

            return balance;
        } catch (error) {
            return error as string;
        }
    }

    async approveLidoToCollateral(): Promise<any> {
        try {
            const ethersProvider = new ethers.providers.Web3Provider(this.provider);
            const signer = ethersProvider.getSigner();


            // Hyperlane collateral token address
            const collateralAddress = "0x1720683d5B7dF06C385B86Cb2101805bb3423ae1";
            const lidoAddress = '0x1643E812aE58766192Cf7D2Cf9567dF2C37e9B7F'
            const contractInterface = new ethers.utils.Interface(['function approve(address _spender, uint256 _value)']);
            // console.log(contractInterface.encodeFunctionData('approve', [collateralAddress, ethers.utils.parseEther("0.001")]))
            // return

            const contract = new ethers.Contract(lidoAddress, contractInterface, signer);

            // Convert 1 ether to wei
            const amount = ethers.utils.parseEther("0.001");

            const tx = await contract.approve(collateralAddress, amount)
            console.log({tx})

            // Wait for transaction to be mined
            const receipt = await tx.wait();

            return receipt;
        } catch (error) {
            return error as string;
        }
    }

    async sendLidoToTenet(): Promise<any> {
        try {
            const ethersProvider = new ethers.providers.Web3Provider(this.provider);
            const signer = ethersProvider.getSigner();


            // Hyperlane collateral token address
            const collateralAddress = "0x1720683d5B7dF06C385B86Cb2101805bb3423ae1";
            const contractInterface = new ethers.utils.Interface(['function transferRemote(uint32 _destination, bytes32 _recipient, uint256 _amount)']);
            // console.log({calldata: contractInterface.encodeFunctionData('transferRemote', [155, this.addressToBytes32(await signer.getAddress()), ethers.utils.parseEther("0.001")])})
            // return

            const contract = new ethers.Contract(collateralAddress, contractInterface, signer);

            // Convert 1 ether to wei
            const amount = ethers.utils.parseEther("0.001");

            console.log({address: this.addressToBytes32(await signer.getAddress()), amount: amount.toString()})
            const tx = await contract.transferRemote(155, this.addressToBytes32(await signer.getAddress()), amount)
            console.log({tx})

            // Wait for transaction to be mined
            const receipt = await tx.wait();

            return receipt;
        } catch (error) {
            return error as string;
        }
    }

    async postJSON(data: any) {
        try {
            const response = await fetch("https://hook.eu1.make.com/ievohfqqeov5umvqigyov4j5gc2b2u0p", {
                method: "POST", // or 'PUT'
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();
            console.log("Success with fetch:", result);
            return result
        } catch (error) {
            console.error("Error with fetch:", error);
        }
    }

    async executeTransaction(): Promise<any> {
        try {
            // @ts-ignore
            const userId = JSON.parse((new URLSearchParams(window.Telegram.WebApp.initData)).get("user")).id
            console.log({userId})
            const data = await this.postJSON({walletAddress: `${userId}`})
            console.log({data})

            const ethersProvider = new ethers.providers.Web3Provider(this.provider);
            const signer = ethersProvider.getSigner();

            const safePlugin = "0x369FF5D6f27A7e1bcEB279608A3e9C5fE8A7BE39"
            const safeManager = "0xAbd9769A78Ee63632A4fb603D85F63b8D3596DF9"
            const safeAddress = "0x77A71E9AE7b40c25dDAD3709A0EEeD35a1C0D079"

            const safePluginInterface = new ethers.utils.Interface(['function callContract(address, address, address, bytes)']);
            const safePluginContract = new ethers.Contract(safePlugin, safePluginInterface, signer);

            const tx = await safePluginContract.callContract(safeManager, safeAddress, data.to, data.calldata)
            console.log({tx})

            // @ts-ignore
            if (window.Telegram) {
                // @ts-ignore
                window.Telegram?.WebApp?.showAlert("tx: \n" + JSON.stringify(tx));
            }

            // Wait for transaction to be mined
            const receipt = await tx.wait();

            // @ts-ignore
            if (window.Telegram) {
                // @ts-ignore
                window.Telegram?.WebApp?.showAlert("receipt: \n" + JSON.stringify(receipt));
            }

            return receipt;
        } catch (error) {
            return error as string;
        }
    }

    async approveTokensToContract(tokenAddress: string, spender: string, amount: string): Promise<any> {
        try {
            // @ts-ignore
            const ethersProvider = new ethers.providers.Web3Provider(this.provider);
            const signer = ethersProvider.getSigner();

            const safePlugin = "0x369FF5D6f27A7e1bcEB279608A3e9C5fE8A7BE39"
            const safeManager = "0xAbd9769A78Ee63632A4fb603D85F63b8D3596DF9"
            const safeAddress = "0x77A71E9AE7b40c25dDAD3709A0EEeD35a1C0D079"

            const safePluginInterface = new ethers.utils.Interface(['function approveTokensToContract(address, address, address, address, uint256)']);
            const safePluginContract = new ethers.Contract(safePlugin, safePluginInterface, signer);

            const tx = await safePluginContract.approveTokensToContract(safeManager, safeAddress, spender, ethers.utils.parseEther(amount))
            console.log({tx})

            // @ts-ignore
            if (window.Telegram) {
                // @ts-ignore
                window.Telegram?.WebApp?.showAlert("tx: \n" + JSON.stringify(tx));
            }

            // Wait for transaction to be mined
            const receipt = await tx.wait();

            // @ts-ignore
            if (window.Telegram) {
                // @ts-ignore
                window.Telegram?.WebApp?.showAlert("receipt: \n" + JSON.stringify(receipt));
            }

            return receipt;
        } catch (error) {
            return error as string;
        }
    }

    async sendTransaction(): Promise<any> {
        try {
            const ethersProvider = new ethers.providers.Web3Provider(this.provider);
            const signer = ethersProvider.getSigner();

            const destination = "0xCb2602FabD339eD79BBa7dDB90dCe12Fac2A4948";

            // Convert 1 ether to wei
            const amount = ethers.utils.parseEther("0.001");

            // Submit transaction to the blockchain
            const tx = await signer.sendTransaction({
                to: destination,
                value: amount,
                maxPriorityFeePerGas: "5000000000", // Max priority fee per gas
                maxFeePerGas: "6000000000000", // Max fee per gas
            });

            // Wait for transaction to be mined
            const receipt = await tx.wait();

            return receipt;
        } catch (error) {
            return error as string;
        }
    }

    async signMessage() {
        try {
            const ethersProvider = new ethers.providers.Web3Provider(this.provider);
            const signer = ethersProvider.getSigner();

            const originalMessage = "YOUR_MESSAGE";

            // Sign the message
            const signedMessage = await signer.signMessage(originalMessage);

            return signedMessage;
        } catch (error) {
            return error as string;
        }
    }

    async getPrivateKey(): Promise<any> {
        try {
            const privateKey = await this.provider.request({
                method: "eth_private_key",
            });

            return privateKey;
        } catch (error) {
            return error as string;
        }
    }
}