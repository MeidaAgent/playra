import React from "react";
import { Button } from "components/ui/Button";
import { CONFIG } from "lib/config";
import { useAppTranslation } from "lib/i18n/useAppTranslations";
import type { ContentComponentProps } from "../types";

const WEBSITE_URL = "https://www.playra.io";
const TERMS_URL = "https://www.playra.io/website/terms-of-service/";
const PRIVACY_URL = "https://www.playra.io/website/privacy-policy/";
const TWITTER_URL = "https://x.com/PlayraFarm";

export const About: React.FC<ContentComponentProps> = () => {
  const { t } = useAppTranslation();
  const version = CONFIG.RELEASE_VERSION?.split("-")[0] ?? "v1.0.0";

  return (
    <div className="flex flex-col gap-1 p-1">
      <div className="flex items-center justify-between mx-2 mb-2">
        <span className="text-xs">{t("gameOptions.about.version")}</span>
        <span className="text-xs font-bold text-amber-400">{version}</span>
      </div>
      <Button onClick={() => window.open(TWITTER_URL, "_blank")}>
        Follow on X
      </Button>
      <Button onClick={() => window.open(WEBSITE_URL, "_blank")}>
        Official Website
      </Button>
      <Button onClick={() => window.open(TERMS_URL, "_blank")}>
        {t("gameOptions.about.terms")}
      </Button>
      <Button onClick={() => window.open(PRIVACY_URL, "_blank")}>
        Privacy Policy
      </Button>
    </div>
  );
};
