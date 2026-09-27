"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDiscord, faTwitch } from "@fortawesome/free-brands-svg-icons";
import { faKey } from "@fortawesome/free-solid-svg-icons";

import { authClient } from "@/lib/auth-client";

type Method = "passkey" | "discord" | "twitch";

/**
 * Sign-in options. Authenticating here grants nothing on its own — the CMS
 * re-checks authorization on the server for every route and every API call, so
 * a successful login by anyone else simply leads to a 404.
 */
export function LoginPanel() {
  const router = useRouter();
  const [pending, setPending] = useState<Method | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function withPasskey() {
    setPending("passkey");
    setMessage(null);

    try {
      const result = await authClient.signIn.passkey();

      if (result?.error) {
        // Deliberately generic: never reveal whether the credential is known.
        setMessage("Anmeldung nicht möglich.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setMessage("Anmeldung nicht möglich.");
    } finally {
      setPending(null);
    }
  }

  async function withSocial(provider: "discord" | "twitch") {
    setPending(provider);
    setMessage(null);

    try {
      await authClient.signIn.social({ provider, callbackURL: "/admin" });
    } catch {
      setMessage("Anmeldung nicht möglich.");
      setPending(null);
    }
  }

  return (
    <div className="space-y-3">
      <Button
        variant="primary"
        fullWidth
        isDisabled={pending !== null}
        onPress={withPasskey}
      >
        <FontAwesomeIcon icon={faKey} className="size-4" aria-hidden />
        {pending === "passkey" ? "Wird geprüft …" : "Mit Passkey anmelden"}
      </Button>

      <div className="flex items-center gap-3 py-1">
        <span className="h-px flex-1 bg-ink-800" />
        <span className="text-xs text-ink-500">oder</span>
        <span className="h-px flex-1 bg-ink-800" />
      </div>

      <Button
        variant="secondary"
        fullWidth
        isDisabled={pending !== null}
        onPress={() => withSocial("discord")}
      >
        <FontAwesomeIcon icon={faDiscord} className="size-4" aria-hidden />
        {pending === "discord" ? "Weiterleitung …" : "Weiter mit Discord"}
      </Button>

      <Button
        variant="secondary"
        fullWidth
        isDisabled={pending !== null}
        onPress={() => withSocial("twitch")}
      >
        <FontAwesomeIcon icon={faTwitch} className="size-4" aria-hidden />
        {pending === "twitch" ? "Weiterleitung …" : "Weiter mit Twitch"}
      </Button>

      {message ? (
        <p role="alert" className="pt-2 text-center text-sm text-ink-400">
          {message}
        </p>
      ) : null}
    </div>
  );
}
