import React from "react";

import { CloseButtonPanel } from "../../CloseablePanel";
import { NPC_WEARABLES } from "lib/npcs";
import { InnerPanel, Panel } from "components/ui/Panel";
import { Label } from "components/ui/Label";

interface Props {
  farmAddress: string;
  onClose: () => void;
}

export const BankModal: React.FC<Props> = ({ farmAddress, onClose }) => {
  return (
    <CloseButtonPanel
      bumpkinParts={NPC_WEARABLES["greedclaw"]}
      onClose={onClose}
    >
      <Panel className="p-3">
        <InnerPanel className="p-4">
          <Label type="info" className="mb-3">Blockchain features unavailable</Label>
          <p className="text-sm leading-relaxed">
            Deposits, withdrawals, staking, and legacy token transfers are not available during the Playra economy transition.
          </p>
          <p className="text-xs opacity-70 mt-3 leading-relaxed">
            Official blockchain information will only be published through verified Playra channels after the game economy is ready.
          </p>
        </InnerPanel>
      </Panel>
    </CloseButtonPanel>
  );
};
