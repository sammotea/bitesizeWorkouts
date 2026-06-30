import Link from "next/link";

const CLS =
  "flex w-full flex-col gap-0.5 rounded-[6px] border border-line bg-white px-4 py-4 text-left transition hover:border-charcoal/50 hover:bg-mint-soft";

function Inner({ name, meta }: { name: string; meta?: string }) {
  return (
    <>
      <span className="font-display text-lg font-black uppercase leading-tight">
        {name}
      </span>
      {meta && <span className="text-sm text-charcoal-soft">{meta}</span>}
    </>
  );
}

/**
 * Standardized exercise list row — used by the generator (button) and the
 * library (link). No leading bullet; consistent card styling everywhere.
 */
export default function ExerciseRow({
  name,
  meta,
  href,
  onClick,
}: {
  name: string;
  meta?: string;
  href?: string;
  onClick?: () => void;
}) {
  if (href) {
    return (
      <Link href={href} className={CLS}>
        <Inner name={name} meta={meta} />
      </Link>
    );
  }
  return (
    <button onClick={onClick} className={CLS}>
      <Inner name={name} meta={meta} />
    </button>
  );
}
