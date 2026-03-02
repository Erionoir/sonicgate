import Link from "next/link";

export function NavBar(): React.JSX.Element {
  return (
    <nav className="mx-auto mb-4 flex w-full max-w-6xl items-center justify-between rounded-md border border-zinc-800 bg-zinc-900/80 px-3 py-2">
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">SonicGate</p>
      <div className="flex items-center gap-2 text-xs">
        <Link className="rounded border border-emerald-500/40 px-3 py-2.5 text-emerald-300 hover:bg-emerald-500/10" href="/transmit">
          /transmit
        </Link>
        <Link className="rounded border border-cyan-500/40 px-3 py-2.5 text-cyan-300 hover:bg-cyan-500/10" href="/receive">
          /receive
        </Link>
      </div>
    </nav>
  );
}
