import { LEGAL_ROUTES } from "@/features/legal/schema";
import { getSetting } from "@/features/settings/queries";

import { AnalyticsGate } from "./analytics-gate";
import { ConsentUi } from "./consent-ui";

/** Server wrapper: reads `consent.config` and mounts banner/dialog + analytics gate. */
export async function ConsentManager() {
  const config = await getSetting("consent.config");
  return (
    <>
      <ConsentUi
        config={config}
        privacyHref={LEGAL_ROUTES.privacy}
        cookieHref={LEGAL_ROUTES.cookies}
      />
      <AnalyticsGate version={config.version} />
    </>
  );
}
