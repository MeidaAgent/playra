import { Button } from "components/ui/Button";
import React, { useContext } from "react";

import { SUNNYSIDE } from "assets/sunnyside";
import { wallet } from "lib/blockchain/wallet";
import { shortAddress } from "lib/utils/shortAddress";
import { useAppTranslation } from "lib/i18n/useAppTranslations";
import { Context as GameContext } from "../GameProvider";

export const Withdrawn: React.FC = () => {
  const { gameService } = useContext(GameContext);
  const { t } = useAppTranslation();

  const handleAddToken = async () => {
    await wallet.addTokenToMetamask();
  };

  const address = wallet.getConnection() as `0x${string}`;

  return (
    <div className="flex flex-col items-center">
      <div className="p-2 flex flex-col items-center">
        <h1 className="text-center mb-4 mt-1 text-lg">{t("success")}</h1>
        <img src={SUNNYSIDE.npcs.synced} className="w-14 mb-4" />
        <p className="mb-4 text-center">
          {t("transaction.withdraw.sent")}{" "}
          <span className="text-center mb-2 ml-2 text-sm font-secondary">
            {shortAddress(address)}
          </span>
        </p>

        <span className="mb-4 text-center">{t("transaction.withdraw.four")}</span>
        <Button className="mb-4 sm:w-3/4 text-xs" onClick={handleAddToken}>
          {t("transaction.withdraw.five")}
        </Button>
      </div>
      <Button onClick={() => gameService.send("REFRESH")}>{t("ok")}</Button>
    </div>
  );
};
