import Link from "next/link";
import ThemeToggle from "./components/ThemeToggle";

type PublicHeaderProps = {
  backHref?: string;
  backLabel?: string;
};

export default function PublicHeader({
  backHref,
  backLabel = "Back",
}: PublicHeaderProps) {
  return (
    <div className="flex gap-3 items-center mb-4 pb-3 border-b border-gray-300 dark:border-gray-600 flex-wrap justify-between">
      <div className="flex gap-3 flex-wrap items-center">
        <Link href="/" className="hover:underline">Home</Link>
        {backHref ? <Link href={backHref} className="hover:underline">{backLabel}</Link> : null}
      </div>
      <ThemeToggle />
    </div>
  );
}