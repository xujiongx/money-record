import "@astryxdesign/core/reset.css";
import "@astryxdesign/core/astryx.css";
import { AdminAstryxProvider } from "@/components/features/admin/AdminAstryxProvider";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminAstryxProvider>{children}</AdminAstryxProvider>;
}
