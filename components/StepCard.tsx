import { ReactNode } from "react";

type StepCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function StepCard({ eyebrow, title, description, children }: StepCardProps) {
  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-5 shadow-2xl shadow-black/30 backdrop-blur md:p-7">
      <div className="mb-6 border-l-4 border-red-600 pl-4">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-red-300">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-white md:text-3xl">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400 md:text-base">{description}</p>
      </div>
      {children}
    </section>
  );
}
