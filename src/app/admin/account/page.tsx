import { PageHeading } from "@/components/admin/PageHeading";
import { AccountPanel } from "@/components/admin/AccountPanel";
import { requireAdminPage } from "@/server/auth/guard";
import { listLinkedAccounts, listPasskeys } from "@/server/auth/accounts";

export const dynamic = "force-dynamic";

export default async function AdminAccountPage() {
  // The layout already guards; re-deriving here keeps the identity local
  // instead of threading it through the shell.
  const identity = await requireAdminPage();

  const [accounts, passkeys] = await Promise.all([
    listLinkedAccounts(identity.userId),
    listPasskeys(identity.userId),
  ]);

  return (
    <>
      <PageHeading
        title="Zugang"
        description="Deine Anmeldemethoden für das CMS. Discord, Twitch und Passkeys führen alle zu demselben Benutzer."
      />
      <AccountPanel
        userId={identity.userId}
        via={identity.via}
        accounts={accounts}
        passkeys={passkeys}
      />
    </>
  );
}
