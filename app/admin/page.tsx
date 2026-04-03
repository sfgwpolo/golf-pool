import AdminHeader from "./AdminHeader";
import AdminHomeClient from "./AdminHomeClient";

export default function AdminHomePage() {
  return (
    <div className="p-5 font-sans max-w-4xl mx-auto bg-white dark:bg-gray-900 text-black dark:text-white">
      <div style={{ maxWidth: 960 }}>
        <AdminHeader />
        <AdminHomeClient />
      </div>
    </div>
  );
}
