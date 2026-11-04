import React, { useContext } from "react";
import { useSelector } from "@xstate/react";

import { WithdrawFlower } from "./WithdrawFlower";
import { Context } from "features/game/GameProvider";
import {
  getAccountTradedRestrictionSecondsLeft,
  isAccountTradedWithin90Days,
  type MachineState,
} from "features/game/lib/gameMachine";
import { Transaction } from "features/island/hud/Transaction";
import { GameWallet } from "features/wallet/Wallet";
import { TradeCooldownWidget } from "features/game/components/TradeCooldownWidget";

interface Props {
  onClose: () => void;
}

const _farmId = (state: MachineState) => state.context.farmId;

export const Withdraw: React.FC<Props> = ({ onClose }) => {
  const { gameService } = useContext(Context);
  const farmId = useSelector(gameService, _farmId);

  const accountTradedRecently = useSelector(gameService, (s) =>
    isAccountTradedWithin90Days(s.context),
  );
  const restrictionSecondsLeft = useSelector(gameService, (s) =>
    getAccountTradedRestrictionSecondsLeft(s.context),
  );

  const onWithdrawTokens = async (pyra: string, chainId: number) => {
    if (accountTradedRecently) return;
    gameService.send("TRANSACT", {
      transaction: "transaction.flowerWithdrawn",
      request: {
        farmId,
        effect: { type: "withdraw.flower", amount: pyra, chainId },
      },
    });
    onClose();
  };

  const transaction = gameService.getSnapshot().context.state.transaction;
  if (transaction) {
    return <Transaction isBlocked onClose={onClose} />;
  }

  return (
    <>
      <GameWallet action="withdrawFlower">
        <WithdrawFlower
          onWithdraw={onWithdrawTokens}
          withdrawDisabled={accountTradedRecently}
        />
      </GameWallet>
      {accountTradedRecently && (
        <div className="mt-2">
          <TradeCooldownWidget
            restrictionSecondsLeft={restrictionSecondsLeft}
          />
        </div>
      )}
    </>
  );
};
