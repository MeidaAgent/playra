import React from "react";

import { Label } from "components/ui/Label";

import { useAppTranslation } from "lib/i18n/useAppTranslations";
import type { ContentComponentProps } from "../types";

export const LinkedAccounts: React.FC<ContentComponentProps> = () => {
  const { t } = useAppTranslation();

  return (
    <div className="p-2">
      <Label type="warning">{t("linkedAccounts.walletUnavailableBeta")}</Label>
    </div>
  );
};
