"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Info, KeyRound, LoaderCircle, Mail } from "lucide-react";
import { useState, useTransition } from "react";
import {
  useForm,
  type FieldValues,
  type Path,
  type UseFormReturn,
} from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  sendMagicLink,
  signInWithPassword,
  type AuthActionResult,
} from "@/lib/auth/actions";
import { AUTH_MESSAGES, type LoginNoticeCode } from "@/lib/auth/messages";
import { magicLinkSchema, passwordLoginSchema } from "@/lib/auth/schema";

/** redirect()/notFound() surface as errors with a NEXT_* digest — let the router handle them. */
function isNextControlFlow(error: unknown): boolean {
  const digest = (error as { digest?: unknown } | null)?.digest;
  return typeof digest === "string" && digest.startsWith("NEXT_");
}

type Notice = { code: LoginNoticeCode; message: string } | null;

/** Copy server-side field errors into the form; toast the summary. */
function applyResult<T extends FieldValues>(
  form: UseFormReturn<T>,
  res: AuthActionResult,
) {
  if (res.ok) return;
  for (const [key, messages] of Object.entries(res.fieldErrors ?? {})) {
    if (key in form.getValues())
      form.setError(key as Path<T>, { message: messages[0] });
  }
  toast.error(res.error);
}

export function LoginForm({ next, notice }: { next: string; notice: Notice }) {
  return (
    <div className="flex flex-col gap-5">
      {notice ? (
        <Alert variant={notice.code === "keluar" ? "default" : "destructive"}>
          <Info aria-hidden="true" />
          <AlertDescription>{notice.message}</AlertDescription>
        </Alert>
      ) : null}
      <Tabs defaultValue="password" className="gap-5">
        <TabsList className="w-full">
          <TabsTrigger value="password">
            <KeyRound aria-hidden="true" /> Kata sandi
          </TabsTrigger>
          <TabsTrigger value="magic">
            <Mail aria-hidden="true" /> Tautan email
          </TabsTrigger>
        </TabsList>
        <TabsContent value="password">
          <PasswordForm next={next} />
        </TabsContent>
        <TabsContent value="magic">
          <MagicLinkForm next={next} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PasswordForm({ next }: { next: string }) {
  const [pending, startTransition] = useTransition();
  const form = useForm<
    z.input<typeof passwordLoginSchema>,
    unknown,
    z.output<typeof passwordLoginSchema>
  >({
    resolver: zodResolver(passwordLoginSchema),
    defaultValues: { email: "", password: "", next },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      try {
        const res = await signInWithPassword(values);
        if (res) applyResult(form, res);
      } catch (error) {
        // redirect() on success is handled by the framework; anything else is unexpected.
        if (isNextControlFlow(error)) throw error;
        toast.error(AUTH_MESSAGES.generic);
      }
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="login-email">Email</FieldLabel>
          <Input
            id="login-email"
            type="email"
            autoComplete="username"
            inputMode="email"
            aria-invalid={!!errors.email}
            {...form.register("email")}
          />
          <FieldError errors={[errors.email]} />
        </Field>
        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="login-password">Kata sandi</FieldLabel>
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            {...form.register("password")}
          />
          <FieldError errors={[errors.password]} />
        </Field>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : null}
          {pending ? "Memeriksa…" : "Masuk"}
        </Button>
      </FieldGroup>
    </form>
  );
}

function MagicLinkForm({ next }: { next: string }) {
  const [pending, startTransition] = useTransition();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const form = useForm<
    z.input<typeof magicLinkSchema>,
    unknown,
    z.output<typeof magicLinkSchema>
  >({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: { email: "", next },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      try {
        const res = await sendMagicLink(values);
        if (res.ok) {
          setSentTo(values.email);
          toast.success("Tautan masuk dikirim.");
        } else {
          applyResult(form, res);
        }
      } catch {
        toast.error(AUTH_MESSAGES.generic);
      }
    }),
  );

  if (sentTo) {
    return (
      <div className="flex flex-col gap-4" role="status">
        <Alert>
          <Mail aria-hidden="true" />
          <AlertDescription>{AUTH_MESSAGES.magicLinkSent}</AlertDescription>
        </Alert>
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={() => setSentTo(null)}
        >
          Kirim ke email lain
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="magic-email">Email</FieldLabel>
          <Input
            id="magic-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            aria-invalid={!!errors.email}
            {...form.register("email")}
          />
          <FieldError errors={[errors.email]} />
        </Field>
        <p className="text-sm text-muted-foreground">
          Kami kirim tautan sekali pakai ke email admin Anda. Tanpa kata sandi.
        </p>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : null}
          {pending ? "Mengirim…" : "Kirim tautan masuk"}
        </Button>
      </FieldGroup>
    </form>
  );
}
