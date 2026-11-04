import React from "react";
import { CONFIG } from "lib/config";
import { http, createConfig, fallback, injected } from "@wagmi/core";
import {
  base,
  baseSepolia,
  polygon,
  polygonAmoy,
  ronin,
  saigon,
} from "@wagmi/core/chains";
import { walletConnect, metaMask, coinbaseWallet } from "@wagmi/connectors";
import { sequenceWallet } from "@0xsequence/wagmi-connector";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export const sequenceConnector = sequenceWallet({
  defaultNetwork: "polygon",
  connectOptions: {
    app: "Playra",
    projectAccessKey: CONFIG.SEQUENCE_ACCESS_KEY,
    settings: {
      theme: "dark",
      bannerUrl: "https://playra.io/assets/plank_logo.png",
      includedPaymentProviders: ["ramp"],
      lockFundingCurrencyToDefault: true,
      defaultFundingCurrency: "matic",
      defaultPurchaseAmount: 10,
    },
  },
});

export const walletConnectConnector = walletConnect({
  projectId:
    CONFIG.WALLETCONNECT_PROJECT_ID || "3fcc6bba6f1de962d911bb5b5c3dba68",
  showQrModal: true,
  qrModalOptions: {
    themeMode: "light",
  },
});

export const metaMaskConnector = metaMask();

export const coinbaseConnector = coinbaseWallet({
  appName: "Playra",
  appLogoUrl: "https://playra.io/assets/token.png",
});

export const fallbackConnector = injected({
  target() {
    return {
      id: "injected",
      name: "Injected Wallet",
      provider:
        window.ethereum?.isMetaMask || window.ethereum?.isCoinbaseWallet
          ? undefined
          : window.ethereum,
    };
  },
});

export const waypointConnector = fallbackConnector;
export const roninStashConnector = () => fallbackConnector;


type SupportedChain =
  | "polygon"
  | "polygonAmoy"
  | "base"
  | "baseSepolia"
  | "ronin"
  | "saigon";
const getAlchemyRpc = (chain: SupportedChain): string | undefined => {
  if (!CONFIG.ALCHEMY_KEY || CONFIG.ALCHEMY_KEY.startsWith("<"))
    return undefined;
  switch (chain) {
    case "polygon":
      return `https://polygon-mainnet.g.alchemy.com/v2/${CONFIG.ALCHEMY_KEY}`;
    case "polygonAmoy":
      return `https://polygon-amoy.g.alchemy.com/v2/${CONFIG.ALCHEMY_KEY}`;
    case "base":
      return `https://base-mainnet.g.alchemy.com/v2/${CONFIG.ALCHEMY_KEY}`;
    case "baseSepolia":
      return `https://base-sepolia.g.alchemy.com/v2/${CONFIG.ALCHEMY_KEY}`;
    case "ronin":
      return `https://ronin-mainnet.g.alchemy.com/v2/${CONFIG.ALCHEMY_KEY}`;
    case "saigon":
      return `https://ronin-saigon.g.alchemy.com/v2/${CONFIG.ALCHEMY_KEY}`;
  }
};

const createTransport = (chain: SupportedChain, alchemyFirst = false) => {
  const alchemy = getAlchemyRpc(chain);
  if (!alchemy) return fallback([http()]);
  return alchemyFirst
    ? fallback([http(alchemy), http()])
    : fallback([http(), http(alchemy)]);
};

export const robinhood = {
  ...polygon,
  name: "Robinhood",
  nativeCurrency: {
    name: "Robinhood",
    symbol: "ROBIN",
    decimals: 18,
  },
} as const;

export const robinhoodTestnet = {
  ...polygonAmoy,
  name: "Robinhood Testnet",
  nativeCurrency: {
    name: "Robinhood",
    symbol: "ROBIN",
    decimals: 18,
  },
} as const;

export const config = createConfig({
  chains:
    CONFIG.NETWORK === "mainnet"
      ? [robinhood]
      : [robinhoodTestnet],
  multiInjectedProviderDiscovery: true,
  connectors: [
    metaMaskConnector,
    ...(CONFIG.SEQUENCE_ACCESS_KEY ? [sequenceConnector] : []),
    walletConnectConnector,
    coinbaseConnector,
    fallbackConnector,
  ],
  transports: {
    // Mainnet
    [robinhood.id]: createTransport("polygon"),

    // Testnet
    [robinhoodTestnet.id]: createTransport("polygonAmoy", true),
  },
});

export const queryClient = new QueryClient();

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
};
