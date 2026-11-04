/* eslint-disable no-console */
import React, { useEffect } from "react";

import { initialise } from "lib/utils/init";

import "./styles.css";
import * as Auth from "features/auth/lib/Provider";
import ErrorBoundary from "features/auth/components/ErrorBoundary";
import { Navigation } from "./Navigation";
import "./lib/i18n";
import { WalletProvider } from "features/wallet/WalletProvider";
import { useServiceWorkerUpdate } from "lib/utils/hooks/useServiceWorkerUpdate";

// Initialise Global Settings
initialise();

// Android + Metamask browser has issues loading assets when the Service Worker is running
// The cause is unknown hence we unregister the service worker for these users to prevent
// rendering issues
const NoServiceWorker = () => {
  useEffect(() => {
    (async () => {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        const unregisterPromises = registrations.map((registration) =>
          registration.unregister(),
        );

        const allCaches = await caches.keys();
        const cacheDeletionPromises = allCaches.map((cache) =>
          caches.delete(cache),
        );

        await Promise.all([...unregisterPromises, ...cacheDeletionPromises]);
      }
    })();
  }, []);
  return null;
};

const ServiceWorker = () => {
  useServiceWorkerUpdate();
  return null;
};

const BetaNotice: React.FC = () => {
  const [visible, setVisible] = React.useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => setVisible(false), 12000);
    return () => window.clearTimeout(timeout);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="status"
      className="fixed left-1/2 top-[max(12px,env(safe-area-inset-top))] z-[9999] flex max-w-[calc(100vw-24px)] -translate-x-1/2 flex-wrap items-center justify-center gap-x-2 gap-y-0.5 rounded-md border border-amber-900/70 bg-amber-300/95 px-2.5 py-1 text-center text-[9px] font-bold leading-normal text-amber-950 shadow-md sm:text-[10px]"
      style={{ pointerEvents: "none", fontFamily: "Poppins, sans-serif" }}
    >
      <span className="whitespace-nowrap">PLAYRA BETA</span>
      <span className="hidden opacity-60 sm:inline" aria-hidden="true">
        |
      </span>
      <span className="min-w-0">Features and token balances may change.</span>
    </div>
  );
};

/**
 * Top level wrapper for providers
 */
export const App: React.FC = () => {
  return (
    <>
      <BetaNotice />
      {/Metamask/i.test(navigator.userAgent) ? (
        <NoServiceWorker />
      ) : (
        <ServiceWorker />
      )}
      <Auth.Provider>
        <WalletProvider>
          <ErrorBoundary>
            <Navigation />
          </ErrorBoundary>
        </WalletProvider>
      </Auth.Provider>
    </>
  );
};
