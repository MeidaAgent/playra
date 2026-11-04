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
      className="fixed left-1/2 top-[max(12px,env(safe-area-inset-top))] z-[9999] -translate-x-1/2 whitespace-nowrap rounded-md border border-amber-900/70 bg-amber-400 px-3 py-1.5 text-center text-[10px] font-bold text-amber-950 shadow-lg sm:text-xs"
      style={{ pointerEvents: "none", fontFamily: "Poppins, sans-serif" }}
    >
      PLAYRA BETA
      <span className="mx-2 opacity-60">|</span>
      Features and token balances may change.
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
