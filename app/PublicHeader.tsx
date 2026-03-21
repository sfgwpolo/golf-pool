import Link from "next/link";

type PublicHeaderProps = {
  backHref?: string;
  backLabel?: string;
};

export default function PublicHeader({
  backHref,
  backLabel = "Back",
}: PublicHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        alignItems: "center",
        marginBottom: 16,
        paddingBottom: 12,
        borderBottom: "1px solid #ddd",
        flexWrap: "wrap",
      }}
    >
      <Link href="/" >Home</Link>
      {backHref ? <Link href={backHref}>{backLabel}</Link> : null}
    </div>
  );
}