import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { resources, type LanguageCode } from "lib/i18n/dictionaries/language";
import { getKeys } from "lib/object";

if (process.env.NODE_ENV !== "metadata") {
  let lng: LanguageCode = "en";
  try {
    if (typeof localStorage !== "undefined") {
      lng = (localStorage.getItem("language") as LanguageCode) || "en";
      if (!getKeys(resources).includes(lng)) {
        lng = "en";
        localStorage.setItem("language", lng);
      }
    }
  } catch (e) {
    lng = "en";
  }

  try {
    if (typeof document !== "undefined" && document.documentElement) {
      document.documentElement.setAttribute("lang", lng);
    }
  } catch (e) {
    // Ignore DOM attribute error in non-standard environments
  }

  i18n.use(initReactI18next).init(
    {
      resources,
      lng,
      fallbackLng: "en",
      keySeparator: false,
      interpolation: {
        escapeValue: false,
      },
    },
    (err, t) => {
      // eslint-disable-next-line no-console
      if (err) return console.error("Something went wrong loading", err);
      t("key"); // initialized and ready to go!
    },
  );
}

export default i18n;
