import React, { useContext, useState } from "react";
import { useSelector } from "@xstate/react";

import { Label, type LabelType } from "components/ui/Label";
import { ButtonPanel } from "components/ui/Panel";
import walletIcon from "assets/icons/wallet.png";

import { useAppTranslation } from "lib/i18n/useAppTranslations";
import type { TranslationKeys } from "lib/i18n/dictionaries/types";
import { Context as GameContext } from "features/game/GameProvider";
import type { MachineState } from "features/game/lib/gameMachine";
import type { ContentComponentProps } from "../types";

const _linkedWallet = (state: MachineState) => state.context.linkedWallet;
const _linkingWallet = (state: MachineState) =>
  state.matches("linkingWallet") || state.matches("linkingWalletSuccess");
const _linkingWalletFailed = (state: MachineState) =>
  state.matches("linkingWalletFailed");

const maskWalletAddress = (address: string): string => {
  if (address.length <= 10) return address;

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

type RowStatus = "linked" | "notLinked" | "linking" | "failed" | "partial";

const PILL: Record<RowStatus, { type: LabelType; key: TranslationKeys }> = {
  linked: { type: "success", key: "linkedAccounts.linked" },
  notLinked: { type: "default", key: "linkedAccounts.notLinked" },
  linking: { type: "warning", key: "linkedAccounts.linking" },
  failed: { type: "danger", key: "linkedAccounts.failedPill" },
  partial: { type: "warning", key: "linkedAccounts.partialPill" },
};

interface RowProps {
  icon: string;
  title: string;
  role: { type: LabelType; key: TranslationKeys };
  rationale: string;
  status: RowStatus;
  subtext: string;
  onClick?: () => void;
  clickableWhenLinked?: boolean;
  onSubtextClick?: () => void;
  subtextTitle?: string;
}

const ProviderRow: React.FC<RowProps> = ({
  icon,
  title,
  role,
  rationale,
  status,
  subtext,
  onClick,
  clickableWhenLinked,
  onSubtextClick,
  subtextTitle,
}) => {
  const { t } = useAppTranslation();
  const disabled =
    status === "linking" || (status === "linked" && !clickableWhenLinked);
  const pill = PILL[status];

  return (
    <ButtonPanel variant="card" onClick={disabled ? undefined : onClick}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 flex-wrap">
          <Label type="default" icon={icon}>
            {title}
          </Label>
          <Label type={role.type}>{t(role.key)}</Label>
        </div>
        <Label type={pill.type}>{t(pill.key)}</Label>
      </div>

      <p className="text-xs italic mt-1 ml-1 opacity-75">{rationale}</p>

      {subtext && (
        <div className="flex items-center justify-between gap-2 mt-1">
          <p
            className={`text-xs break-all ml-1 ${
              onSubtextClick ? "cursor-pointer" : ""
            }`}
            onClick={
              onSubtextClick
                ? (e) => {
                    e.stopPropagation();
                    onSubtextClick();
                  }
                : undefined
            }
            title={subtextTitle}
          >
            {subtext}
          </p>
        </div>
      )}
    </ButtonPanel>
  );
};

export const LinkedAccounts: React.FC<ContentComponentProps> = ({
  onSubMenuClick,
}) => {
  const { t } = useAppTranslation();
  const { gameService } = useContext(GameContext);

  const linkedWallet = useSelector(gameService, _linkedWallet);
  const linkingWallet = useSelector(gameService, _linkingWallet);
  const linkingWalletFailed = useSelector(gameService, _linkingWalletFailed);

  const [revealWallet, setRevealWallet] = useState(false);

  const walletStatus: RowStatus = linkingWallet
    ? "linking"
    : linkingWalletFailed
      ? "failed"
      : linkedWallet
        ? "linked"
        : "notLinked";

  const walletSubtext =
    walletStatus === "linked" && linkedWallet
      ? revealWallet
        ? linkedWallet
        : maskWalletAddress(linkedWallet)
      : walletStatus === "linking"
        ? t("linkedAccounts.waitingForWallet")
        : walletStatus === "failed"
          ? t("linkedAccounts.linkFailed")
          : t("linkedAccounts.noWallet");

  const warningKey: TranslationKeys =
    walletStatus === "linked"
      ? "linkedAccounts.warning.walletLinked"
      : "linkedAccounts.warning.walletNotLinked";

  const walletRationale =
    walletStatus === "linked"
      ? t("linkedAccounts.rationale.walletLinked")
      : t("linkedAccounts.rationale.walletNotLinked");

  return (
    <div className="flex flex-col gap-1 overflow-auto max-h-[400px] scrollable p-1">
      <p className="text-xs mx-1">{t("linkedAccounts.description")}</p>

      <Label type="warning">{t(warningKey)}</Label>

      <ProviderRow
        icon={walletIcon}
        title={t("linkedAccounts.wallet")}
        role={{
          type: walletStatus === "linked" ? "warning" : "chill",
          key:
            walletStatus === "linked"
              ? "linkedAccounts.role.owner"
              : "linkedAccounts.role.futureOwner",
        }}
        rationale={walletRationale}
        status={walletStatus}
        subtext={walletSubtext}
        onClick={() => onSubMenuClick("linkAccountWallet")}
        onSubtextClick={
          walletStatus === "linked" && linkedWallet
            ? () => setRevealWallet((prev) => !prev)
            : undefined
        }
        subtextTitle={
          walletStatus === "linked" && linkedWallet
            ? t(
                revealWallet
                  ? "linkedAccounts.hideWallet"
                  : "linkedAccounts.revealWallet",
              )
            : undefined
        }
      />
    </div>
  );
};
