import PublicHeader from "../../PublicHeader";
import OrgLandingClient from "./OrgLandingClient";

export default async function OrgPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;

  return (
    <div style={{ padding: 20, fontFamily: "system-ui, sans-serif" }}>
      <PublicHeader backHref="/" backLabel="All Organizations" />
      <OrgLandingClient orgSlug={orgSlug} />
    </div>
  );
}