import React, { useState } from 'react';
import { ethers } from 'ethers';

const ConnectWallet = ({ onWalletConnected }) => {
    const [address, setAddress] = useState(null);

    const connectWallet = async () => {
        if (window.ethereum) {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            const signer = provider.getSigner();
            const walletAddress = await signer.getAddress();
            setAddress(walletAddress);
            onWalletConnected(walletAddress);
        } else {
            alert("Please install MetaMask to use this feature.");
        }
    };

    return (
        <div style={{ textAlign: 'right', padding: '10px' }}>
            {address ? (
                <p>Connected: {address.slice(0, 6)}...{address.slice(-4)}</p>
            ) : (
                <button className="connect-wallet-button" onClick={connectWallet}>Connect Wallet</button>
            )}
        </div>
    );
};

export default ConnectWallet;
