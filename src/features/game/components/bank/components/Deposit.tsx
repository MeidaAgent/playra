import React from "react";
import { DepositFlower } from "features/island/hud/components/deposit/DepositFlower";
import { Label } from "components/ui/Label";
import { InnerPanel } from "components/ui/Panel";
import tokenIcon from "assets/icons/token.png";

interface Props {
  onClose: () => void;
}

export const Deposit: React.FC<Props> = ({ onClose }) => {
  return (
    <div className="flex flex-col space-y-2">
      <InnerPanel className="p-2 space-y-1">
        <div className="flex items-center justify-between">
          <Label type="info" icon={tokenIcon}>
            Robinhood Chain Deposit
          </Label>
          <span className="text-xxs text-gray-400">Pre-Launch</span>
        </div>
        <p className="text-xxs text-gray-300 leading-tight">
          Direct on-chain $PYRA deposit connects to your Web3 wallet. Full blockchain bridging activates automatically once the smart contract is deployed on Robinhood Chain Mainnet.
        </p>
      </InnerPanel>
      <DepositFlower onClose={onClose} />
    </div>
  );
};
