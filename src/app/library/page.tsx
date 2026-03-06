import BottomNav from "@/components/BottomNav";
import TopBar from "@/components/TopBar";

export default function LibraryPage() {
  return (
    <div className="page">
      <main className="phone">
        <TopBar title="Library" showBack />
        <div className="content">
          <div className="empty surface">
            <p>Your saved sessions and resources will appear here.</p>
          </div>
        </div>
        <BottomNav active="library" />
      </main>
    </div>
  );
}
