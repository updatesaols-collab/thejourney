import BottomNav from "@/components/BottomNav";
import TopBar from "@/components/TopBar";

export default function RitualsPage() {
  return (
    <div className="page">
      <main className="phone">
        <TopBar title="Rituals" showBack />
        <div className="content">
          <div className="empty surface">
            <p>Your personal rituals will appear here.</p>
          </div>
        </div>
        <BottomNav active="rituals" />
      </main>
    </div>
  );
}
