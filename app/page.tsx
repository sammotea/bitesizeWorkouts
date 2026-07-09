import Link from "next/link";
import RehabPeek from "@/components/RehabPeek";

export default function LandingPage() {
  return (
    <div className="flex flex-col gap-3">
      <LandingCard
        href="/workout"
        title="Workout"
        meta="Generate a bitesize workout"
      />
      <LandingCard href="/rehab" title="Rehab" meta={<RehabPeek />} />
    </div>
  );
}

function LandingCard({
  href,
  title,
  meta,
}: {
  href: string;
  title: string;
  meta: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="block rounded-[6px] border border-line bg-white px-6 py-8 transition hover:border-charcoal/50 hover:bg-mint-soft"
    >
      <span className="block font-display text-4xl font-black uppercase leading-none">
        {title}
      </span>
      <span className="mt-2 block text-sm text-charcoal-soft">{meta}</span>
    </Link>
  );
}
