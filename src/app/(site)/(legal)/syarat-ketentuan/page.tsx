import { LegalPage, legalMetadata } from "../legal-page";

export const generateMetadata = () => legalMetadata("terms");

export default function Page() {
  return <LegalPage slug="terms" />;
}
