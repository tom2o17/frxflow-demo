"use client";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { WagmiConfig, createConfig, fallback, http } from "wagmi";
import { arbitrum, fraxtal, mainnet, mantle } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Configure Wagmi
const wagmiConfig = createConfig({
  chains: [mainnet, mantle, arbitrum, fraxtal],
  batch: {
    multicall: true,
  },
  transports: {
    [1]: fallback([http("https://rpc.flashbots.net")]),
    [5000]: fallback([http("https://rpc.mantle.xyz")]),
    [42161]: fallback([http("https://api.zan.top/arb-one")]),
    [252]: fallback([http("https://rpc.frax.com")])
  },
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Configure React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={wagmiConfig}>
        <html lang="en">
          <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          >
            {children}
          </body>
        </html>
      </WagmiConfig>
    </QueryClientProvider>
  );
}
