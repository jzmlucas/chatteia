import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "./i18n/config";

export default createMiddleware({
  locales,
  defaultLocale,
  // "always": mesmo o idioma padrão (pt-br) aparece na URL,
  // conforme pedido (ex: /pt-br/chat/turbao8).
  localePrefix: "always",
  // Detecta o idioma preferido do navegador (Accept-Language) na
  // primeira visita, quando o usuário acessa "/" sem prefixo.
  localeDetection: true,
});

export const config = {
  // Roda em todas as rotas, exceto assets estáticos, API e arquivos
  // internos do Next.js.
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
