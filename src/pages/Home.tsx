import { SOFTWARE } from '../data';
import type { Software } from '../data';
import { href } from '../lib/router';
import { btn } from '../components/ui';

function SoftwareCard({ sw }: { sw: Software }) {
  const info = SOFTWARE[sw];
  return (
    <article data-sw={sw} className="group flex flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <a href={href(sw)} className="block" aria-label={`Open the ${info.name} dashboard`}>
        <div className={`flex h-56 items-center justify-center overflow-hidden ${sw === 'photoshop' ? 'bg-[#2b2b2b]' : 'bg-white'} border-b border-line`}>
          <img src={info.homeVisual} alt={sw === 'photoshop' ? 'A grid of original Photoshop toolbar icons from your reference image' : 'The original Illustrator toolbar panel from your reference image'}
            className={`ref-icon ${sw === 'photoshop' ? 'h-44' : 'h-52'} w-auto`} />
        </div>
      </a>
      <div className="flex flex-1 flex-col gap-4 p-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight"><a href={href(sw)} className="hover:underline">{info.name}</a></h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{info.blurb}</p>
        </div>
        <div className="mt-auto flex flex-wrap gap-2">
          <a className={btn.primary} href={href(`${sw}/study`)}>Study {info.short}</a>
          <a className={btn.secondary} href={href(`${sw}/exam`)}>Exam {info.short}</a>
        </div>
      </div>
    </article>
  );
}

export function Home() {
  return (
    <div className="page-enter">
      <section className="mx-auto max-w-3xl py-6 text-center sm:py-10">
        <p className="text-sm font-semibold uppercase tracking-widest text-muted">Design Shortcuts Academy</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-6xl">Learn the Tools. Master the Shortcuts.</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted">
          Study, practice, and master Adobe Photoshop and Illustrator shortcuts through interactive learning and exams.
        </p>
      </section>
      <section className="mt-6 grid gap-6 md:grid-cols-2" aria-label="Choose your software">
        <SoftwareCard sw="photoshop" />
        <SoftwareCard sw="illustrator" />
      </section>
      <section className="mx-auto mt-12 grid max-w-4xl gap-4 text-sm sm:grid-cols-3">
        {[
          ['Original icons', 'Every toolbar icon is cropped straight from your reference sheets — nothing is redrawn.'],
          ['Two kinds of practice', 'Toolbar icons and general commands are studied and tested separately.'],
          ['Honest answer keys', 'Only verified shortcuts are scored. Windows and macOS keys are stored individually.'],
        ].map(([t, d]) => (
          <div key={t} className="rounded-2xl border border-line bg-surface p-5">
            <h3 className="font-semibold">{t}</h3>
            <p className="mt-1.5 text-muted">{d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
