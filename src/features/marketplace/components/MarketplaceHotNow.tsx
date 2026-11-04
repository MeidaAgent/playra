import { SUNNYSIDE } from "assets/sunnyside";
import { Label } from "components/ui/Label";
import { ButtonPanel, InnerPanel } from "components/ui/Panel";
import React, { useContext } from "react";
import { WhatsNew } from "./WhatsNew";
import { ITEM_DETAILS } from "features/game/types/images";
import { useLocation, useNavigate } from "react-router";
import { useAppTranslation } from "lib/i18n/useAppTranslations";
import sflIcon from "assets/icons/flower_token.webp";
import tradeIcon from "assets/icons/trade.png";
import whaleIcon from "assets/icons/whale.webp";
import walletIcon from "assets/icons/wallet.png";
import type { MarketplaceTrends } from "features/game/types/marketplace";
import { Loading } from "features/auth/components";
import { loadTrends } from "../actions/loadTrends";
import * as Auth from "features/auth/lib/Provider";
import { useActor } from "@xstate/react";
import { TopTrades } from "./TopTrades";
import useSWR from "swr";
import { CONFIG } from "lib/config";
import { useGame } from "features/game/GameProvider";

const defaultTrends: MarketplaceTrends = {
  volume: 0,
  trades: 0,
  owners: 0,
  topTrades: [],
};

const hotNowFetcher = async ([, token]: [string, string]) => {
  if (CONFIG.API_URL) {
    try {
      return (await loadTrends({ token })) ?? defaultTrends;
    } catch {
      return defaultTrends;
    }
  }
  return defaultTrends;
};

export const MarketplaceHotNow: React.FC = () => {
  const { authService } = useContext(Auth.Context);
  const [authState] = useActor(authService);
  const { gameState } = useGame();
  const navigate = useNavigate();

  const { t } = useAppTranslation();

  const { data } = useSWR(
    ["/marketplace/trends", authState.context.user.rawToken as string],
    hotNowFetcher,
  );

  const trendsData = data ?? defaultTrends;
  const isWorldRoute = useLocation().pathname.includes("/world");

  return (
    <div className="overflow-y-scroll scrollable pr-1">
      <InnerPanel className="mb-1">
        <div className="p-2">
          <Label type="default" className="mb-2 -ml-1">
            {t("marketplace.welcome")}
          </Label>
          <p className="text-sm mb-2">{t("marketplace.welcomeDescription")}</p>

          <div className="flex flex-wrap">
            <div className="w-full sm:w-1/3 xl:w-1/3 pr-1 mb-1">
              <ButtonPanel
                className="w-full h-full"
                onClick={() =>
                  navigate(
                    `${isWorldRoute ? "/world" : ""}/marketplace/collection?filters=resources`,
                  )
                }
              >
                <div className="flex items-center">
                  <img
                    src={ITEM_DETAILS.Eggplant.image}
                    className="w-10 mr-2"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <p>{t("marketplace.resources")}</p>
                      <img
                        src={SUNNYSIDE.icons.chevron_right}
                        className="h-4"
                      />
                    </div>
                    <p className="text-xs">
                      {t("marketplace.resourcesDescription")}
                    </p>
                  </div>
                </div>
              </ButtonPanel>
            </div>

            <div className="w-full sm:w-1/3 xl:w-1/3 pr-1 mb-1">
              <ButtonPanel
                className="w-full h-full"
                onClick={() =>
                  navigate(
                    `${isWorldRoute ? "/world" : ""}/marketplace/collection?filters=collectibles,utility`,
                  )
                }
              >
                <div className="flex items-center">
                  <img
                    src={ITEM_DETAILS["Grinx's Hammer"].image}
                    className="w-10 mr-2"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <p>{t("marketplace.powerUps")}</p>
                      <img
                        src={SUNNYSIDE.icons.chevron_right}
                        className="h-4"
                      />
                    </div>
                    <p className="text-xs">
                      {t("marketplace.powerUpsDescription")}
                    </p>
                  </div>
                </div>
              </ButtonPanel>
            </div>

            <div className="w-full sm:w-1/3 xl:w-1/3 mb-1">
              <ButtonPanel
                className="w-full h-full"
                onClick={() =>
                  navigate(
                    `${isWorldRoute ? "/world" : ""}/marketplace/favorites`,
                  )
                }
              >
                <div className="flex items-center">
                  <img src={SUNNYSIDE.icons.heart} className="w-10 mr-2" />
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <p>{t("marketplace.favorites")}</p>
                      <img
                        src={SUNNYSIDE.icons.chevron_right}
                        className="h-4"
                      />
                    </div>
                    <p className="text-xs">
                      {t("marketplace.favoritesDescription")}
                    </p>
                  </div>
                </div>
              </ButtonPanel>
            </div>
          </div>
        </div>
      </InnerPanel>

      <MarketplaceStats trends={trendsData} />

      <InnerPanel className="mb-2">
        <div className="p-2">
          <div className="flex items-center justify-between">
            <Label type="default" icon={whaleIcon} className="-ml-1 mb-2">
              {t("marketplace.whaleTrades")}
            </Label>

            <Label type="transparent" icon={SUNNYSIDE.icons.stopwatch}>
              {t("marketplace.7days")}
            </Label>
          </div>

          <TopTrades trends={trendsData} />
        </div>
      </InnerPanel>

      <InnerPanel>
        <div className="p-2">
          <Label type="success" className="-ml-1 mb-2">
            {t("reward.whatsNew")}
          </Label>

          <WhatsNew />
        </div>
      </InnerPanel>
    </div>
  );
};

export const MarketplaceStats: React.FC<{
  trends?: MarketplaceTrends;
}> = ({ trends }) => {
  const { t } = useAppTranslation();
  const volume = trends?.volume ?? 0;
  const trades = trends?.trades ?? 0;
  const owners = trends?.owners ?? 0;

  return (
    <div className="flex flex-wrap">
      <div className="w-full sm:w-1/3 sm:pr-1 mb-1">
        <InnerPanel>
          <div className="flex items-center p-1">
            <img src={sflIcon} className="h-10 mr-2" />
            <div>
              <p>{`${volume.toLocaleString()} $PYRA`}</p>
              <p className="text-xs">{t("marketplace.totalVolume")}</p>
            </div>
          </div>
        </InnerPanel>
      </div>
      <div className="w-full sm:w-1/3 sm:pr-1 mb-1">
        <InnerPanel>
          <div className="flex items-center p-1">
            <img src={tradeIcon} className="h-10 mr-2" />
            <div>
              <p>{`${trades.toLocaleString()}`}</p>
              <p className="text-xs">{t("marketplace.totalTrades")}</p>
            </div>
          </div>
        </InnerPanel>
      </div>
      <div className="w-full sm:w-1/3 mb-1">
        <InnerPanel>
          <div className="flex items-center sm:p-1">
            <img src={walletIcon} className="h-10 mr-2" />
            <div>
              <p>{`${owners.toLocaleString()}`}</p>
              <p className="text-xs">
                {t("marketplace.walletsHoldingCollectibles")}
              </p>
            </div>
          </div>
        </InnerPanel>
      </div>
    </div>
  );
};
