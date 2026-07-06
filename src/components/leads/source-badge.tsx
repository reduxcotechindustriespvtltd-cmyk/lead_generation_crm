import { Globe, User, CircleHelp, type LucideIcon } from "lucide-react";
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from "@/components/icons/social-icons";
import { cn } from "@/lib/utils";

type IconComponent = LucideIcon | typeof FacebookIcon;

const SOURCE_META: Record<string, { label: string; icon: IconComponent; className: string }> = {
  FACEBOOK: { label: "Facebook", icon: FacebookIcon, className: "text-[#1877F2]" },
  INSTAGRAM: { label: "Instagram", icon: InstagramIcon, className: "text-[#E1306C]" },
  WHATSAPP: { label: "WhatsApp", icon: WhatsAppIcon, className: "text-[#25D366]" },
  MANUAL: { label: "Manual", icon: User, className: "text-muted-foreground" },
  WEBSITE: { label: "Website", icon: Globe, className: "text-teal-600" },
  OTHER: { label: "Other", icon: CircleHelp, className: "text-purple-600" },
};

export function SourceBadge({ source }: { source: string }) {
  const meta = SOURCE_META[source] ?? SOURCE_META.OTHER;
  const Icon = meta.icon;
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <Icon className={cn("size-3.5", meta.className)} />
      {meta.label}
    </span>
  );
}
