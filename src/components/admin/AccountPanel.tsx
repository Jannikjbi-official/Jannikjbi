"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Spinner, toast } from "@heroui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDiscord, faTwitch } from "@fortawesome/free-brands-svg-icons";
import {
  faCircleCheck,
  faCopy,
  faKey,
  faPlus,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

import { authClient } from "@/lib/auth-client";
import { formatShortDate } from "@/lib/utils";

import { ConfirmDialog } from "./ConfirmDialog";

type LinkedAccount = {
  id: string;
  providerId: string;
  accountId: string;
  createdAt: string | null;
};

type LinkedPasskey = {
  id: string;
  name: string | null;
  deviceType: string | null;
  createdAt: string | null;
};

const PROVIDERS: Array<{ id: "discord" | "twitch"; label: string; icon: IconDefinition }> = [
  { id: "discord", label: "Discord", icon: faDiscord },
  { id: "twitch", label: "Twitch", icon: faTwitch },
];

/**
 * Sign-in methods for the CMS owner.
 *
 * Linking never grants access on its own — authorization stays with the server
 * rule in `src/server/auth/authorization.ts`. This page only adds ways for the
 * already-authorized owner to get in.
 */
export function AccountPanel({
  userId,
  via,
  accounts,
  passkeys,
}: {
  userId: string;
  via: "user" | "discord" | "twitch";
  accounts: LinkedAccount[];
  passkeys: LinkedPasskey[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<LinkedPasskey | null>(null);
  const [copied, setCopied] = useState(false);

  const linked = new Set(accounts.map((account) => account.providerId));

  async function link(provider: "discord" | "twitch") {
    setBusy(provider);

    try {
      const result = await authClient.linkSocial({
        provider,
        callbackURL: "/admin/account",
      });

      // The call answers with the provider's authorize URL; follow it.
      // `assign` rather than setting `location.href`, which the React compiler
      // rejects as a write to a value defined outside the component.
      const url = (result as { data?: { url?: string } })?.data?.url;
      if (url) {
        window.location.assign(url);
        return;
      }

      toast.danger("Die Verknüpfung konnte nicht gestartet werden.");
    } catch {
      toast.danger("Die Verknüpfung konnte nicht gestartet werden.");
    } finally {
      setBusy(null);
    }
  }

  async function addPasskey() {
    setBusy("passkey");

    try {
      const result = await authClient.passkey.addPasskey({
        name: `${navigator.platform || "Gerät"} · ${new Date().toLocaleDateString("de-DE")}`,
      });

      if (result?.error) {
        toast.danger("Der Passkey konnte nicht angelegt werden.");
        return;
      }

      toast.success("Passkey angelegt. Du kannst dich jetzt damit anmelden.");
      router.refresh();
    } catch {
      // A cancelled browser prompt lands here too, so keep it neutral.
      toast.danger("Der Passkey konnte nicht angelegt werden.");
    } finally {
      setBusy(null);
    }
  }

  async function deletePasskey() {
    if (!pendingDelete) return;
    setBusy(pendingDelete.id);

    try {
      await authClient.passkey.deletePasskey({ id: pendingDelete.id });
      toast.success("Passkey entfernt.");
      router.refresh();
    } catch {
      toast.danger("Der Passkey konnte nicht entfernt werden.");
    } finally {
      setBusy(null);
      setPendingDelete(null);
    }
  }

  async function copyUserId() {
    try {
      await navigator.clipboard.writeText(userId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.danger("Kopieren nicht möglich.");
    }
  }

  return (
    <div className="max-w-3xl space-y-8">
      <section className="card-surface p-5">
        <h2 className="font-display text-base font-semibold text-ink-100">Deine Benutzer-ID</h2>
        <p className="mt-1.5 text-sm text-ink-400">
          Diese ID steht in der Umgebungsvariable{" "}
          <span className="font-mono text-ink-300">ADMIN_USER_IDS</span> und entscheidet über
          den Zugang. Sie bleibt gleich, egal welche Anmeldemethoden du hinzufügst oder
          entfernst.
        </p>

        <div className="mt-4 flex items-center gap-3">
          <code className="min-w-0 flex-1 truncate rounded-lg border border-ink-700 bg-ink-850 px-3 py-2 font-mono text-sm text-ink-200">
            {userId}
          </code>
          <Button variant="outline" size="sm" onPress={() => void copyUserId()}>
            <FontAwesomeIcon icon={copied ? faCircleCheck : faCopy} className="size-3.5" aria-hidden />
            {copied ? "Kopiert" : "Kopieren"}
          </Button>
        </div>

        <p className="mt-3 text-xs text-ink-500">
          Aktuell angemeldet über:{" "}
          {via === "user"
            ? "Benutzer-ID"
            : via === "discord"
              ? "Discord"
              : "Twitch"}
        </p>
      </section>

      <section>
        <h2 className="mb-1 font-display text-base font-semibold text-ink-100">
          Anmeldemethoden
        </h2>
        <p className="mb-5 text-sm text-ink-400">
          Verknüpfe weitere Konten mit deinem Benutzer. Alle verknüpften Methoden führen zu
          demselben Zugang.
        </p>

        <ul className="space-y-3">
          {PROVIDERS.map((provider) => {
            const account = accounts.find((entry) => entry.providerId === provider.id);

            return (
              <li
                key={provider.id}
                className="card-surface flex flex-wrap items-center justify-between gap-4 p-4"
              >
                <span className="flex items-center gap-3">
                  <FontAwesomeIcon
                    icon={provider.icon}
                    className="size-5 shrink-0 text-ink-400"
                    aria-hidden
                  />
                  <span>
                    <span className="block font-display text-sm font-semibold text-ink-100">
                      {provider.label}
                    </span>
                    <span className="block text-xs text-ink-500">
                      {account
                        ? `Verknüpft${account.createdAt ? ` seit ${formatShortDate(account.createdAt)}` : ""}`
                        : "Nicht verknüpft"}
                    </span>
                  </span>
                </span>

                {account ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[0.6875rem] font-semibold text-emerald-300 uppercase">
                    <FontAwesomeIcon icon={faCircleCheck} className="size-3" aria-hidden />
                    Aktiv
                  </span>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    isDisabled={busy !== null}
                    onPress={() => void link(provider.id)}
                  >
                    {busy === provider.id ? (
                      <Spinner size="sm" aria-label="Wird verknüpft" />
                    ) : (
                      <FontAwesomeIcon icon={faPlus} className="size-3" aria-hidden />
                    )}
                    {provider.label} verknüpfen
                  </Button>
                )}
              </li>
            );
          })}
        </ul>

        {linked.size < PROVIDERS.length ? (
          <p className="mt-3 text-xs text-ink-500">
            Beim Verknüpfen musst du dich beim jeweiligen Anbieter anmelden. Verwende dort das
            Konto, das zu diesem Benutzer gehören soll.
          </p>
        ) : null}
      </section>

      <section>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="mb-1 font-display text-base font-semibold text-ink-100">Passkeys</h2>
            <p className="text-sm text-ink-400">
              Anmeldung per Fingerabdruck, Gesichtserkennung oder Geräte-PIN – ohne Umweg über
              Discord oder Twitch.
            </p>
          </div>

          <Button variant="primary" isDisabled={busy !== null} onPress={() => void addPasskey()}>
            {busy === "passkey" ? (
              <Spinner size="sm" aria-label="Wird angelegt" />
            ) : (
              <FontAwesomeIcon icon={faKey} className="size-3.5" aria-hidden />
            )}
            Passkey hinzufügen
          </Button>
        </div>

        {passkeys.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-700 bg-ink-900/60 px-6 py-10 text-center">
            <p className="font-display text-sm font-semibold text-ink-100">
              Noch kein Passkey hinterlegt.
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-400">
              Ein Passkey ist an die Adresse gebunden, unter der du ihn anlegst. Lege ihn erst
              an, wenn die Domain endgültig feststeht.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {passkeys.map((passkey) => (
              <li
                key={passkey.id}
                className="card-surface flex flex-wrap items-center justify-between gap-4 p-4"
              >
                <span className="flex items-center gap-3">
                  <FontAwesomeIcon
                    icon={faKey}
                    className="size-4 shrink-0 text-ink-400"
                    aria-hidden
                  />
                  <span>
                    <span className="block font-display text-sm font-semibold text-ink-100">
                      {passkey.name ?? "Passkey"}
                    </span>
                    <span className="block text-xs text-ink-500">
                      {passkey.deviceType === "singleDevice"
                        ? "Nur auf diesem Gerät"
                        : "Geräteübergreifend"}
                      {passkey.createdAt ? ` · seit ${formatShortDate(passkey.createdAt)}` : ""}
                    </span>
                  </span>
                </span>

                <Button
                  variant="ghost"
                  size="sm"
                  isIconOnly
                  aria-label="Passkey entfernen"
                  className="text-danger"
                  isDisabled={busy !== null}
                  onPress={() => setPendingDelete(passkey)}
                >
                  {busy === passkey.id ? (
                    <Spinner size="sm" aria-label="Wird entfernt" />
                  ) : (
                    <FontAwesomeIcon icon={faTrash} className="size-3.5" aria-hidden />
                  )}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Passkey wirklich entfernen?"
        description="Du kannst dich danach nicht mehr mit diesem Passkey anmelden. Die Anmeldung über Discord und Twitch bleibt bestehen."
        confirmLabel="Entfernen"
        isPending={busy !== null}
        onConfirm={() => void deletePasskey()}
      />
    </div>
  );
}
