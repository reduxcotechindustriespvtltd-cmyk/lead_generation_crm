import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { FacebookPagePicker } from "@/components/integrations/facebook-page-picker";

export default async function ConnectFacebookPage() {
  const session = await getCurrentUser();
  if (!session || session.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Choose a Facebook Page</h1>
        <p className="text-muted-foreground text-sm">
          Pick which Page(s) you want this CRM to pull leads from. You can connect more later.
        </p>
      </div>
      <FacebookPagePicker />
    </div>
  );
}
