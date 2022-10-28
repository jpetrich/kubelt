import { json, redirect } from "@remix-run/cloudflare";

import { Outlet } from "@remix-run/react";

import {
  WagmiConfig,
  createClient,
  defaultChains,
  configureChains,
} from "wagmi";

import { publicProvider } from "wagmi/providers/public";
import { InjectedConnector } from "wagmi/connectors/injected";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";

import styles from "../styles/auth.css";
import logo from "../assets/three-id-logo.svg";

import { getUserSession, requireJWT } from "~/utils/session.server";
import { oortSend } from "~/utils/rpc.server";

import { links as spinnerLinks } from "~/components/spinner";

export function links() {
  return [...spinnerLinks(), { rel: "stylesheet", href: styles }];
}

export default function Auth() {
  const { chains, provider, webSocketProvider } = configureChains(
    defaultChains,
    [publicProvider()]
  );

  const client = createClient({
    autoConnect: true,
    connectors: [
      new MetaMaskConnector({ chains }),
      new InjectedConnector({
        chains,
        options: {
          name: "Injected",
          shimDisconnect: true,
        },
      }),
    ],
    provider,
    webSocketProvider,
  });

  return (
    <div className="wrapper grid grid-row-3 gap-4">
      <nav className="col-span-3">
        <img src={logo} alt="threeid" />
      </nav>
      <article className="content col-span-3">
        <WagmiConfig client={client}>
          <Outlet />
        </WagmiConfig>
      </article>
      <footer className="col-span-3">
        <p>
          3ID is non-custodial and secure. We will never request access to your
          assets.
        </p>
      </footer>
    </div>
  );
}