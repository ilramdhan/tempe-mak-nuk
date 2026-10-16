import { LegalPage, legalMetadata } from "../legal-page";

export const generateMetadata = () => legalMetadata("ordering");

export default function Page() {
  return <LegalPage slug="ordering" />;
}
