import AdminHeader from "./AdminHeader";
import AdminHomeClient from "./AdminHomeClient";

export default function AdminHomePage() {
  return (
    <div style={{ padding: 20, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 960 }}>
        <AdminHeader />
        <AdminHomeClient />
      </div>
    </div>
  );
}
