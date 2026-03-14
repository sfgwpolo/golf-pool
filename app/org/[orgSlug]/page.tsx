import OrgLandingClient from "./OrgLandingClient";

export default async function OrgPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  return <OrgLandingClient orgSlug={orgSlug} />;
}
