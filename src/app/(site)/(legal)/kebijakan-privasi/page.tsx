import { LegalPage, legalMetadata } from "../legal-page";

export const generateMetadata = () => legalMetadata("privacy");

export default function Page() {
  return <LegalPage slug="privacy" />;
}
