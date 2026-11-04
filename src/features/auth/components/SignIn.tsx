import React, { useContext } from "react";

import { Context as AuthContext } from "../lib/Provider";

import { useAppTranslation } from "lib/i18n/useAppTranslations";

import { WalletWall } from "features/wallet/components/WalletWall";

const Login: React.FC<{ screen: "signin" | "signup" }> = ({ screen }) => {
  const { authService } = useContext(AuthContext);
  const { t } = useAppTranslation();

  return (
    <>
      <WalletWall
        screen={screen}
        onSignMessage={({ address, signature }) => {
          authService.send("CONNECTED", { address, signature });
        }}
      />
      <div className="flex justify-end my-1 items-center">
        <a
          href="https://docs.playra.io/getting-started/how-to-start"
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-base font-secondary"
        >
          {t("welcome.needHelp")}
        </a>
      </div>
    </>
  );
};

export const SignIn = () => <Login screen="signin" />;
export const SignUp = () => <Login screen="signup" />;
