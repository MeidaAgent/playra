import { useSelector } from "@xstate/react";
import React, { useContext, useState } from "react";
import Decimal from "decimal.js-light";
import { toWei } from "web3-utils";
import { Button } from "components/ui/Button";
import { wallet } from "lib/blockchain/wallet";
import { getTax } from "lib/utils/tax";
import { SUNNYSIDE } from "assets/sunnyside";
import { useAppTranslation } from "lib/i18n/useAppTranslations";
import { Context } from "features/game/GameProvider";
import { formatNumber, setPrecision } from "lib/utils/formatNumber";
import { WalletAddressLabel } from "components/ui/WalletAddressLabel";
import { PIXEL_SCALE } from "features/game/lib/constants";
import type { MachineState } from "features/game/lib/gameMachine";
import { NumberInput } from "components/ui/NumberInput";
import { Label } from "components/ui/Label";
import { useConnection } from "wagmi";
import { ModalOverlay } from "components/ui/ModalOverlay";
import { InnerPanel } from "components/ui/Panel";
import { shortAddress } from "lib/utils/shortAddress";
import withdrawIcon from "assets/icons/withdraw.png";

interface Props {
  onWithdraw: (pyra: string, chainId: number) => void;
  withdrawDisabled?: boolean;
}

const _state = (state: MachineState) => state.context.state;
const _autosaving = (state: MachineState) => state.matches("autosaving");

const MIN_PYRA_WITHDRAW_AMOUNT = new Decimal(5);

export const WithdrawFlower: React.FC<Props> = ({
  onWithdraw,
  withdrawDisabled,
}) => {
  const { t } = useAppTranslation();
  const { gameService } = useContext(Context);
  const state = useSelector(gameService, _state);
  const autosaving = useSelector(gameService, _autosaving);
  const { chain } = useConnection();
  const address = wallet.getConnection() || "0x0000000000000000000000000000000000000000";

  const [amount, setAmount] = useState<Decimal>(new Decimal(0));
  const [showConfirmation, setShowConfirmation] = useState(false);

  const { balance } = state;
  const available = balance;

  const tax = getTax({
    amount: typeof amount !== "string" ? amount : new Decimal(0),
    game: state,
  });

  const disableWithdraw =
    amount.greaterThan(available) ||
    amount.lessThan(MIN_PYRA_WITHDRAW_AMOUNT) ||
    !!withdrawDisabled;

  const withdraw = () => {
    if (disableWithdraw || autosaving || !chain) return;

    onWithdraw(toWei(amount.toString()), chain!.id);
  };

  return (
    <>
      <ModalOverlay
        show={showConfirmation}
        onBackdropClick={() => setShowConfirmation(false)}
      >
        <InnerPanel>
          <div className="p-1 mb-1">
            <div className="flex flex-col gap-1 mb-3">
              <Label type="default" icon={withdrawIcon}>
                Confirm $PYRA Withdrawal
              </Label>
              <Label type="transparent">
                {`Network: ${chain?.name || "Robinhood"}`}
              </Label>
              <Label type="transparent">
                {`Amount: ${formatNumber(amount, { decimalPlaces: 4 })} $PYRA`}
              </Label>
              <Label type="transparent">
                {`Treasury Fee (10%): ${formatNumber(tax, { decimalPlaces: 4 })} $PYRA`}
              </Label>
              <Label type="warning">
                {`You will receive: ${formatNumber(amount.sub(tax), { decimalPlaces: 4 })} $PYRA`}
              </Label>
              <Label type="transparent" className="text-nowrap">
                {`Destination: ${shortAddress(address)}`}
              </Label>
            </div>

            <Label type="danger">{t("withdraw.flower.cannotCancel")}</Label>
          </div>

          <div className="flex gap-1">
            <Button onClick={() => setShowConfirmation(false)}>
              {t("back")}
            </Button>
            <Button
              disabled={disableWithdraw || autosaving || !chain}
              onClick={withdraw}
            >
              {t("confirm")}
            </Button>
          </div>
        </InnerPanel>
      </ModalOverlay>

      <div className="p-2 mb-2">
        <div className="flex flex-col items-stretch gap-1">
          <p className="text-xs">
            {t("withdraw.sfl.available", {
              flower: formatNumber(balance, { decimalPlaces: 4 }),
            })}
          </p>
          <p className="text-xxs text-neutral-400">
            Minimum withdrawal: 5 $PYRA
          </p>
        </div>

        <div className="mt-2">
          <div className="flex items-center -ml-1">
            <NumberInput
              value={amount}
              maxDecimalPlaces={4}
              isOutOfRange={disableWithdraw}
              onValueChange={setAmount}
            />
            <Button
              onClick={() => setAmount(setPrecision(available.mul(0.5), 4))}
              className="ml-2 px-1 py-1 w-auto h-9"
            >
              {`50%`}
            </Button>
            <Button
              onClick={() => setAmount(setPrecision(available, 4))}
              className="ml-2 px-1 py-1 w-auto h-9"
            >
              {t("max")}
            </Button>
          </div>

          <div className="bg-[#181425] p-2 rounded mt-2 border border-white/10">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-300">Treasury Fee (10%):</span>
              <span className="font-bold text-amber-400">
                {`${formatNumber(tax, { decimalPlaces: 4 })} $PYRA`}
              </span>
            </div>
            <p className="text-xxs text-neutral-400 mt-0.5">
              Flat 10% fee routes directly to the Revolving Dev Treasury to maintain circular player liquidity.
            </p>
          </div>
        </div>

        <Label type="warning" className="my-3">
          {t("withdraw.receive", {
            sflReceived: formatNumber(amount.sub(tax), {
              decimalPlaces: 4,
            }),
          })}
        </Label>

        <div className="w-full my-2 border-t border-white/20" />
        <div className="flex items-center text-xs">
          <img
            src={SUNNYSIDE.icons.player}
            className="mr-3"
            style={{
              width: `${PIXEL_SCALE * 13}px`,
            }}
          />
          <div className="flex flex-col gap-1">
            <p>{t("withdraw.send.wallet")}</p>
            <WalletAddressLabel walletAddress={address} />
          </div>
        </div>
      </div>

      <Button
        onClick={() => setShowConfirmation(true)}
        disabled={disableWithdraw || autosaving || withdrawDisabled}
      >
        {t("withdraw")}
      </Button>
    </>
  );
};
