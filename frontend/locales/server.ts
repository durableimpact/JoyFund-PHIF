import { createI18nServer, setStaticParamsLocale } from "next-international/server";

export { setStaticParamsLocale };

export const { getI18n, getScopedI18n, getStaticParams, getCurrentLocale } =
  createI18nServer({
    en: () => import("./en"),
    fr: () => import("./fr"),
  });
