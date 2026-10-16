import { LegalPage, legalMetadata } from "../legal-page";

export const generateMetadata = () => legalMetadata("cookies");

export default function Page() {
  return <LegalPage slug="cookies" />;
}
