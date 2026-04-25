import { BrowserProvider, Contract, JsonRpcProvider } from "ethers";
import { COMMEMORATIVE_BADGE_ABI, EVENT_TICKET_ABI, MONADPASS_CORE_ABI } from "./abis";
import { LOCAL_CONTRACTS } from "./contracts";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
    };
  }
}

export function getReadProvider() {
  return new JsonRpcProvider(LOCAL_CONTRACTS.rpcUrl);
}

export async function getBrowserProvider() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("No encontré wallet. Abre la app con MetaMask o Rabby.");
  }

  const provider = new BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  await ensureLocalChain();
  return provider;
}

export async function ensureLocalChain() {
  if (typeof window === "undefined" || !window.ethereum) return;

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x7a69" }],
    });
  } catch {
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: "0x7a69",
          chainName: "Hardhat Local",
          nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
          rpcUrls: [LOCAL_CONTRACTS.rpcUrl],
        },
      ],
    });
  }
}

export function getReadCoreContract() {
  return new Contract(LOCAL_CONTRACTS.monadPassCore, MONADPASS_CORE_ABI, getReadProvider());
}

export function getReadTicketContract() {
  return new Contract(LOCAL_CONTRACTS.eventTicket, EVENT_TICKET_ABI, getReadProvider());
}

export function getReadBadgeContract() {
  return new Contract(LOCAL_CONTRACTS.commemorativeBadge, COMMEMORATIVE_BADGE_ABI, getReadProvider());
}

export async function getConnectedAddress() {
  const provider = await getBrowserProvider();
  const signer = await provider.getSigner();
  return signer.getAddress();
}

export async function getWriteCoreContract() {
  const provider = await getBrowserProvider();
  const signer = await provider.getSigner();
  return new Contract(LOCAL_CONTRACTS.monadPassCore, MONADPASS_CORE_ABI, signer);
}
