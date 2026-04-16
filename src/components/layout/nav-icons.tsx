import type { LucideIcon } from "lucide-react";
import {
  Banknote,
  Bell,
  Briefcase,
  ClipboardList,
  CreditCard,
  Flag,
  FolderTree,
  Inbox,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Newspaper,
  PenLine,
  PlusCircle,
  Scale,
  ScrollText,
  Search,
  Settings,
  User,
  Users,
  Wallet,
} from "lucide-react";
import type { NavIconName } from "@/config/navigation";

const MAP: Record<NavIconName, LucideIcon> = {
  layoutDashboard: LayoutDashboard,
  users: Users,
  clipboardList: ClipboardList,
  folderTree: FolderTree,
  inbox: Inbox,
  flag: Flag,
  scale: Scale,
  creditCard: CreditCard,
  banknote: Banknote,
  bell: Bell,
  settings: Settings,
  scrollText: ScrollText,
  plusCircle: PlusCircle,
  messageSquare: MessageSquare,
  wallet: Wallet,
  user: User,
  briefcase: Briefcase,
  search: Search,
  mail: Mail,
  penLine: PenLine,
  newspaper: Newspaper,
};

export function NavIcon({ name, className }: { name: NavIconName; className?: string }) {
  const Icon = MAP[name];
  return <Icon className={className} aria-hidden />;
}
