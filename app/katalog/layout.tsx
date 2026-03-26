import Header from "@/components/header";
import { Footer } from "@/components/footer";

export default function KatalogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header isDashboard={false} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
