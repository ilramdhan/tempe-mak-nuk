"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

type Result = { ok: boolean; error?: string };

/**
 * Run a Server Action in a transition, toast the outcome and refresh the route
 * (admin calendar reads are uncached, so a refresh shows the new state).
 */
export function useAdminMutation() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run<R extends Result>(
    action: () => Promise<R>,
    opts: { success: string; onDone?: (res: R) => void },
  ) {
    startTransition(async () => {
      try {
        const res = await action();
        if (res.ok) {
          toast.success(opts.success);
          router.refresh();
        } else {
          toast.error(res.error ?? "Gagal menyimpan.");
        }
        opts.onDone?.(res);
      } catch {
        toast.error("Gagal terhubung ke server. Coba lagi.");
      }
    });
  }

  return { pending, run };
}
