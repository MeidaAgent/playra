// Settings-menu types shared between GameOptions and the content
// components it routes to. Kept in a leaf module so content components
// can depend on these without forming a source-level cycle through
// GameOptions (which itself imports those content components).

export type SettingMenuId =
  // Game Options
  | "main"
  | "installApp"
  | "account"
  | "advanced"
  | "about"
  | "amoy"
  | "blockchain"
  | "linkedAccounts"
  | "linkAccountWallet"
  | "referAFriend"
  | "streams"
  | "plaza"
  | "experiments"
  | "economyEditor"
  | "interiorExperiment"
  | "landscapingExperiment"
  | "toolShopBuyAll"
  | "statsLeaderboard"
  | "auctionCalendar"
  | "betaFeatures"
  | "admin"

  // Account / Preferences
  | "changeLanguage"
  | "preferences"
  | "appearance"
  | "behaviour"
  | "audio"
  | "notifications"
  | "faceRecognition"

  // Amoy Testnet Actions
  | "playerSearch"
  | "errorSearch"
  // Plaza Settings
  | "pickServer"
  | "shader";

export interface ContentComponentProps {
  onSubMenuClick: (id: SettingMenuId) => void;
  onClose: () => void;
  onTimeMachineToggle?: () => void;
}
