import PublicHeader from "../../PublicHeader";
import OrgLandingClient from "./OrgLandingClient";

export default async function OrgPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;

  return (
    <div className="p-5 font-sans max-w-4xl mx-auto bg-white dark:bg-gray-900 text-black dark:text-white">
      <PublicHeader backHref="/" backLabel="All Organizations" />
      <OrgLandingClient orgSlug={orgSlug} />
    </div>
  );
}