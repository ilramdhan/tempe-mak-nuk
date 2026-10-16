import type { ConsentConfig } from "@/features/settings/schema";

export type ConsentConfigProps = {
  config: ConsentConfig;
  privacyHref: string;
  cookieHref: string;
};
