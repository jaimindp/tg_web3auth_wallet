"use client";

import { useEffect, useState } from "react";
// HIGHLIGHTSTART-importModules
import { Web3AuthNoModal } from "@web3auth/no-modal";
import { CHAIN_NAMESPACES, SafeEventEmitterProvider, WALLET_ADAPTERS } from "@web3auth/base";
import RPC from "./ethersRPC";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";

const clientId = "BNM3ytXW4KY_TE468iF6Qwqc4EIskvJr6gjmCkj5PCXNgaLRz2XRF6HKhDGCknw6n_ROapG-7vqCAbCudMEpY_4"; // get from https://dashboard.web3auth.io

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0x5",
  rpcTarget: "https://eth-goerli.g.alchemy.com/v2/IjVFtqiHIPdAGoFJTTf4NR6ol8yxC-Lh",
  // rpcTarget: "https://eth-goerli.g.alchemy.com/v2/IjVFtqiHIPdAGoFJTTf4NR6ol8yxC-Lh",
  displayName: "Ethereum Goerli",
  blockExplorer: "https://goerli.etherscan.io",
  ticker: "ETH",
  tickerName: "Ethereum",
};

export default function Home() {
  const [web3auth, setWeb3auth] = useState<Web3AuthNoModal | null>(null);
  const [provider, setProvider] = useState<SafeEventEmitterProvider | null>(null);
  const [email, setEmail] = useState<string>('telegram-wallet@proton.me');

  useEffect(() => {
    const init = async () => {
      try {
        const web3auth = new Web3AuthNoModal({
          clientId,
          chainConfig,
        });

        const privateKeyProvider = new EthereumPrivateKeyProvider({ config: { chainConfig }});

        const openloginAdapter = new OpenloginAdapter({
          privateKeyProvider,
          adapterSettings: {
            uxMode: "redirect",
            network: "testnet"
          },
        });
        web3auth.configureAdapter(openloginAdapter);


        setWeb3auth(web3auth);

        await web3auth.init();
        if (web3auth.connected) {
          setProvider(web3auth.provider);
        };

      } catch (error) {
        console.error(error);
      }
    };

    init();
  }, []);

  const login = async () => {
    if (!web3auth) {
      console.log("web3auth not initialized yet");
      // @ts-ignore
      window.Telegram.WebApp.showAlert("web3auth not initialized yet");
      return;
    }
    try {
      // const web3authProvider = await web3auth.connectTo(WALLET_ADAPTERS.OPENLOGIN, {
      //   mfaLevel: "default", // Pass on the mfa level of your choice: default, optional, mandatory, none
      //   loginProvider: "twitter", // Pass on the login provider of your choice: google, facebook, discord, twitch, twitter, github, linkedin, apple, etc.
      // });
      const web3authProvider = await web3auth.connectTo(WALLET_ADAPTERS.OPENLOGIN, {
        loginProvider: "email_passwordless",
        extraLoginOptions: {
          login_hint: email, // email to send the OTP to
        },
      });
      setProvider(web3authProvider);
    } catch (e) {
      console.error(e);
      // @ts-ignore
      window.Telegram.WebApp.showAlert(e.message);
    }
  };

  const authenticateUser = async () => {
    if (!web3auth) {
      console.log("web3auth not initialized yet");
      return;
    }
    const idToken = await web3auth.authenticateUser();
    console.log(idToken);
  };

  const getUserInfo = async () => {
    if (!web3auth) {
      console.log("web3auth not initialized yet");
      return;
    }
    const user = await web3auth.getUserInfo();
    console.log(user);
  };

  const logout = async () => {
    if (!web3auth) {
      console.log("web3auth not initialized yet");
      return;
    }
    await web3auth.logout();
    setProvider(null);
  };

  const getChainId = async () => {
    if (!provider) {
      console.log("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const chainId = await rpc.getChainId();
    console.log(chainId);
    // @ts-ignore
    if (window.Telegram) {
      // @ts-ignore
      window.Telegram?.WebApp?.showAlert("Chain ID: " + chainId);
    }
  };
  const getAccounts = async () => {
    if (!provider) {
      console.log("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const address = await rpc.getAccounts();
    console.log(address);
    // @ts-ignore
    console.log({telegram: window.Telegram})
    // @ts-ignore
    if (window.Telegram) {
      // @ts-ignore
      window.Telegram?.WebApp?.showAlert("Address: " + address);
    }
  };

  const getBalance = async () => {
    if (!provider) {
      console.log("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const balance = await rpc.getBalance();
    console.log(balance);
    // @ts-ignore
    if (window.Telegram) {
      // @ts-ignore
      window.Telegram?.WebApp?.showAlert("ETH Balance: " + balance);
    }
  };

  const getTokenBalance = async (token: string) => {
    if (!provider) {
      console.log("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const balance = await rpc.getTokenBalance(token);
    console.log(balance);

    // @ts-ignore
    if (window.Telegram) {
      // @ts-ignore
      window.Telegram?.WebApp?.showAlert("Token address: " + token + "\nBalance: " + balance);
    }
  };

  const executeTransaction = async () => {
    if (!provider) {
      console.log("provider not initialized yet");
      return;
    }

    // @ts-ignore
    if (window.Telegram) {
      // @ts-ignore
      await window.Telegram?.WebApp?.showConfirm("Are you sure you want to execute the transaction?");
    }

    const rpc = new RPC(provider);
    const balance = await rpc.executeTransaction();
    console.log(balance);

    // @ts-ignore
    if (window.Telegram) {
      // @ts-ignore
      window.Telegram?.WebApp?.showAlert("Done!");
    }
  };

  const approveTokensToContract = async (tokenAddress: string, spender: string, amount: string) => {
    if (!provider) {
      console.log("provider not initialized yet");
      return;
    }

    // @ts-ignore
    if (window.Telegram) {
      // @ts-ignore
      await window.Telegram?.WebApp?.showConfirm("Are you sure you want to execute the transaction?");
    }

    const rpc = new RPC(provider);
    const balance = await rpc.approveTokensToContract(tokenAddress, spender, amount);
    console.log(balance);

    // @ts-ignore
    if (window.Telegram) {
      // @ts-ignore
      window.Telegram?.WebApp?.showAlert("Done!");
    }
  };

  const approveLidoToCollateral = async () => {
    if (!provider) {
      console.log("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const receipt = await rpc.approveLidoToCollateral();
    console.log(receipt);
  };

  const sendLidoToTenet = async () => {
    if (!provider) {
      console.log("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const receipt = await rpc.sendLidoToTenet();
    console.log(receipt);
  };

  const sendTransaction = async () => {
    if (!provider) {
      console.log("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const receipt = await rpc.sendTransaction();
    console.log(receipt);
  };

  const signMessage = async () => {
    if (!provider) {
      console.log("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const signedMessage = await rpc.signMessage();
    console.log(signedMessage);
  };

  const getPrivateKey = async () => {
    if (!provider) {
      console.log("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const privateKey = await rpc.getPrivateKey();
    console.log(privateKey);
  };

  const loggedInView = (
      <>
        <div className="flex-container">
          {/*<div>*/}
          {/*  <button onClick={getUserInfo} className="card">*/}
          {/*    Get User Info*/}
          {/*  </button>*/}
          {/*</div>*/}
          {/*<div>*/}
          {/*  <button onClick={authenticateUser} className="card">*/}
          {/*    Get ID Token*/}
          {/*  </button>*/}
          {/*</div>*/}
          <div>
            <button onClick={getChainId} className="card">
              Get Chain ID
            </button>
          </div>
          <div>
            <button onClick={getAccounts} className="card">
              Get Accounts
            </button>
          </div>
          <div>
            <button onClick={getBalance} className="card">
              Get ETH Balance
            </button>
          </div>
          <div>
            <button onClick={() => getTokenBalance('0x1643E812aE58766192Cf7D2Cf9567dF2C37e9B7F')} className="card">
              Get stETH Balance
            </button>
          </div>
          <div>
            <button onClick={() => getTokenBalance('0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844')} className="card">
              Get DAI Balance
            </button>
          </div>
          <div>
            <button onClick={() => getTokenBalance('0xD8134205b0328F5676aaeFb3B2a0DC15f4029d8C')} className="card">
              Get sDAI Balance
            </button>
          </div>
          <div>
            <button onClick={executeTransaction} className="card">
              Execute Transaction
            </button>
          </div>
          <div>
            <button onClick={() => approveTokensToContract("0x1643E812aE58766192Cf7D2Cf9567dF2C37e9B7F", "0xe2bA3dB075898EA3a2C5DDCddef8Db637A2c6210", "0.012")} className="card">
              Approve stETH to Hyperlane Collateral
            </button>
          </div>
          <div>
            <button onClick={() => approveTokensToContract("0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844", "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", "0.012")} className="card">
              Approve DAI to Uniswap
            </button>
          </div>
          <div>
            <button onClick={() => approveTokensToContract("0x1643E812aE58766192Cf7D2Cf9567dF2C37e9B7F", "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", "0.012")} className="card">
              Approve stETH to Uniswap
            </button>
          </div>
          <div>
            <button onClick={() => approveTokensToContract("0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844", "0xD8134205b0328F5676aaeFb3B2a0DC15f4029d8C", "0.012")} className="card">
              Approve DAI to sDAI Contract
            </button>
          </div>
          {/*<div>*/}
          {/*  <button onClick={signMessage} className="card">*/}
          {/*    Sign Message*/}
          {/*  </button>*/}
          {/*</div>*/}
          {/*<div>*/}
          {/*  <button onClick={sendTransaction} className="card">*/}
          {/*    Send Transaction*/}
          {/*  </button>*/}
          {/*</div>*/}
          {/*<div>*/}
          {/*  <button onClick={approveLidoToCollateral} className="card">*/}
          {/*    Approve Lido to Hyperlane Collateral*/}
          {/*  </button>*/}
          {/*</div>*/}
          {/*<div>*/}
          {/*  <button onClick={sendLidoToTenet} className="card">*/}
          {/*    Send Lido to Tenet*/}
          {/*  </button>*/}
          {/*</div>*/}
          {/*<div>*/}
          {/*  <button onClick={getPrivateKey} className="card">*/}
          {/*    Get Private Key*/}
          {/*  </button>*/}
          {/*</div>*/}
          <div>
            <button onClick={logout} className="card">
              Log Out
            </button>
          </div>
        </div>

        <div id="console" style={{ whiteSpace: "pre-line" }}>
          <p style={{ whiteSpace: "pre-line" }}>Logged in Successfully!</p>
        </div>
      </>
  );

  const unloggedInView = (
      <>
        <label>
          E-mail:
          <input type="text" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>

        <button onClick={login} className="card">
          Login
        </button>
      </>
  );

  return (
      <div className="container">
        <h1 className="title">
          <a target="_blank" href="" rel="noreferrer">
            Tele
          </a>
          Safe 🔐
        </h1>

        <div className="grid">{provider ? loggedInView : unloggedInView}</div>
      </div>
  );
}
