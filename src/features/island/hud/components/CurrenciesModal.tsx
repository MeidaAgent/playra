import React, { useContext, useState } from "react";
import { SUNNYSIDE } from "assets/sunnyside";
import { Button } from "components/ui/Button";
import { Label } from "components/ui/Label";
import { Modal } from "components/ui/Modal";
import { Panel } from "components/ui/Panel";
import { useAppTranslation } from "lib/i18n/useAppTranslations";
import { Context } from "features/game/GameProvider";
import { SwapSFLForCoins } from "./SwapSFLForCoins";
import { DepositFlower } from "./deposit/DepositFlower";

import tokenIcon from "assets/icons/token.png";
import walletIcon from "assets/icons/wallet.png";
import exchangeIcon from "assets/icons/exchange.png";

type TransactionPage = "menu" | "deposit" | "swap";

type PageButtonOptions = {
  page: TransactionPage;
  icon: string;
  label: string;
};

const PageButton: React.FC<{
  option: PageButtonOptions;
  onClick: () => void;
}> = ({ option, onClick }) => (
  <Button onClick={onClick} className="relative">
    <div className="w-full flex justify-center items-center">
      <img
        src={option.icon}
        className="w-6 absolute left-0 top-1/2 -translate-y-1/2"
      />
      {option.label}
    </div>
  </Button>
);

type Props = {
  show: boolean;
  initialPage?: TransactionPage;
  onClose: () => void;
};

export const CurrenciesModal: React.FC<Props> = ({
  show,
  onClose,
  initialPage,
}) => {
  const { gameService } = useContext(Context);
  const [page, setPage] = useState<TransactionPage>(initialPage ?? "menu");
  const { t } = useAppTranslation();

  const transactionOptions: Record<"deposit" | "swap", PageButtonOptions> = {
    deposit: {
      page: "deposit",
      icon: tokenIcon,
      label: "Deposit $PYRA",
    },
    swap: {
      page: "swap",
      icon: exchangeIcon,
      label: t("exchange.flower.coins"),
    },
  };

  const handleExited = () => {
    setPage("menu");
  };

  return (
    <Modal show={show} onHide={onClose} onExited={handleExited}>
      <Panel className="w-full h-full p-2">
        {page === "menu" && (
          <div className="flex justify-between mb-2">
            <Label
              type="default"
              icon={walletIcon}
              className="flex items-center gap-2 left-2.5"
            >
              {t("transaction.menu.title")}
            </Label>

            <img
              src={SUNNYSIDE.icons.close}
              className="w-6 h-6 cursor-pointer"
              onClick={onClose}
            />
          </div>
        )}

        {page === "menu" && (
          <div className="flex flex-col gap-2">
            {Object.values(transactionOptions).map((option) => (
              <PageButton
                key={option.page}
                option={option}
                onClick={() => setPage(option.page)}
              />
            ))}
          </div>
        )}

        {page === "deposit" && (
          <div className="flex flex-col gap-1">
            <div className="flex items-center mb-1">
              <img
                src={SUNNYSIDE.icons.arrow_left}
                className="w-6 cursor-pointer mr-2"
                alt={t("back")}
                onClick={() => setPage("menu")}
              />
              <Label type="default" icon={tokenIcon}>
                {t("deposit.flower")}
              </Label>
            </div>
            <DepositFlower onClose={onClose} />
          </div>
        )}

        {page === "swap" && (
          <SwapSFLForCoins onClose={() => setPage("menu")} />
        )}
      </Panel>
    </Modal>
  );
};
