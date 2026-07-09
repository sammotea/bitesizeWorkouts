import Link from "next/link";

export default function HomeLink({ className }: { className?: string }) {
  return (
    <Link href="/" className={className}>
      Home
    </Link>
  );
}
