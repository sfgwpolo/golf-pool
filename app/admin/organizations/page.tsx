import AdminHeader from "../AdminHeader";
import OrganizationsClient from "./OrganizationsClient";

export default function AdminOrganizationsPage() {
  return (
    <div style={{ padding: 20, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 960 }}>
        <AdminHeader />
        <OrganizationsClient />
      </div>
    </div>
  );
}
