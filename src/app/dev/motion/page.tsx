import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MotionDemo } from "./motion-demo";

export const metadata: Metadata = {
  title: "Motion kit (dev)",
  robots: { index: false, follow: false },
};

export default function MotionDevPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <MotionDemo />;
}
