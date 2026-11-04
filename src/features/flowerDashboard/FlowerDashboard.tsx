import React, { useCallback, useEffect } from "react";
import { InnerPanel, Panel } from "components/ui/Panel";
import { Label } from "components/ui/Label";
import { Button } from "components/ui/Button";
import { useLocation, useNavigate } from "react-router";
import { SUNNYSIDE } from "assets/sunnyside";
import { PIXEL_SCALE } from "features/game/lib/constants";
import { useSafeAreaPaddingTop } from "lib/utils/hooks/useSafeAreaPaddingTop";
import { useGame } from "features/game/GameProvider";
import { formatNumber } from "lib/utils/formatNumber";
import flowerToken from "assets/icons/flower_token.webp";
import coinsIcon from "assets/icons/coins.webp";
import gemIcon from "assets/icons/gem.webp";
import walletIcon from "assets/icons/wallet.png";

export const FlowerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { gameService } = useGame();
  const safeAreaPaddingTop = useSafeAreaPaddingTop(30);

  const snapshot = gameService.getSnapshot();
  const farmId = snapshot.context.farmId ?? 0;
  const state = snapshot.context.state;
  const pyraBalance = state?.balance ?? 0;
  const coinsBalance = state?.coins ?? 0;
  const gemsBalance = state?.inventory?.["Gem"] ?? 0;

  const isInternalRoute = pathname.includes("/game") || pathname.includes("/world");

  const handleClose = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  // Exit dashboard if Escape key is pressed
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleClose]);

  return (
    <div
      className="bg-[#181425] w-full h-full safe-area-inset-bottom"
      style={{ paddingTop: safeAreaPaddingTop }}
    >
      <Panel className="inset-0 fixed pointer-events-auto max-w-2xl mx-auto my-auto h-fit overflow-hidden">
        {/* Header Banner */}
        <div className="relative flex w-full justify-between pr-10 items-center mr-auto h-[70px] mb-3">
          <div
            className="absolute inset-0 w-full h-full -z-0 rounded-sm"
            style={{
              backgroundImage: `url(${SUNNYSIDE.announcement.flowerBanner})`,
              imageRendering: "pixelated",
              backgroundSize: "320px",
              backgroundPosition: "center",
            }}
          />
          <div className="absolute inset-0 w-full h-full bg-black opacity-50 -z-0 rounded-sm" />
          <div className="z-10 pl-4">
            <p className="text-xl text-white font-bold text-shadow">
              Playra Token Analytics
            </p>
            <p className="text-xs text-yellow-300">
              Robinhood Chain Ecosystem
            </p>
          </div>

          <img
            src={SUNNYSIDE.icons.close}
            className="flex-none cursor-pointer absolute right-2 z-10"
            onClick={handleClose}
            alt="Close"
            style={{
              width: `${PIXEL_SCALE * 11}px`,
              height: `${PIXEL_SCALE * 11}px`,
            }}
          />
        </div>

        {/* Status Notification */}
        <InnerPanel className="mb-3 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Label type="warning">Coming Soon</Label>
            <span className="text-xs text-gray-700 font-semibold">
              Chapter 2: Official Game Launch
            </span>
          </div>
          <h2 className="text-base font-bold mb-1 text-[#2b2b2b]">
            Playra Token Analytics: Coming Soon
          </h2>
          <p className="text-xs text-gray-700 leading-relaxed mb-3">
            Real-time on-chain token metrics, liquidity pools, staking rewards, and holder analytics for{" "}
            <strong>$PYRA</strong> are currently in development and will launch together with the official Robinhood deployment.
          </p>

          <div className="p-2 bg-[#ead4aa] rounded border border-[#b96f50] text-xs space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-medium">Network:</span>
              <span className="font-bold text-[#4a2e12]">Robinhood</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-medium">Token Symbol:</span>
              <span className="font-bold text-[#4a2e12]">$PYRA (Playra)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-medium">Status:</span>
              <span className="font-semibold text-green-700">Contract Verification Pending</span>
            </div>
          </div>
        </InnerPanel>

        {/* Current Farm & Wallet Balances */}
        <InnerPanel className="mb-3 p-3">
          <div className="flex items-center gap-2 mb-2">
            <img src={walletIcon} className="w-5 h-5" alt="Wallet" />
            <h3 className="text-sm font-bold text-[#2b2b2b]">
              Your Farm Balances (ID #{farmId || "—"})
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#fcf3d7] border border-[#d8b073] p-2 rounded flex flex-col items-center">
              <div className="flex items-center gap-1 mb-1">
                <img src={flowerToken} className="w-5 h-5" alt="$PYRA" />
                <span className="font-bold text-xs">$PYRA</span>
              </div>
              <span className="text-sm font-bold text-[#2b2b2b]">
                {formatNumber(pyraBalance)}
              </span>
            </div>

            <div className="bg-[#fcf3d7] border border-[#d8b073] p-2 rounded flex flex-col items-center">
              <div className="flex items-center gap-1 mb-1">
                <img src={coinsIcon} className="w-5 h-5" alt="Coins" />
                <span className="font-bold text-xs">Coins</span>
              </div>
              <span className="text-sm font-bold text-[#2b2b2b]">
                {formatNumber(coinsBalance)}
              </span>
            </div>

            <div className="bg-[#fcf3d7] border border-[#d8b073] p-2 rounded flex flex-col items-center">
              <div className="flex items-center gap-1 mb-1">
                <img src={gemIcon} className="w-5 h-5" alt="Gems" />
                <span className="font-bold text-xs">Gems</span>
              </div>
              <span className="text-sm font-bold text-[#2b2b2b]">
                {formatNumber(gemsBalance)}
              </span>
            </div>
          </div>
        </InnerPanel>

        {/* Close Button */}
        <div className="flex justify-end gap-2">
          <Button onClick={handleClose}>
            Back to Game
          </Button>
        </div>
      </Panel>
    </div>
  );
};

export default FlowerDashboard;
