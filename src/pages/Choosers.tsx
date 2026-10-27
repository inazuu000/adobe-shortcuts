import { COMMANDS, SOFTWARE, TOOLS } from '../data';
import type { Software } from '../data';
import { href } from '../lib/router';
import { progressStats, useAppState } from '../lib/store';
import { btn, ProgressBar } from '../components/ui';

function BigCard({ to, kicker, title, body, meta, cta }: { to: string; kicker: string; title: string; body: string; meta?: string; cta: string }) {
  return (
    <a href={href(to)} className="group flex flex-col rounded-3xl border border-line bg-surface p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-accent hover:shadow-lg">
      <span className="text-xs font-bold uppercase tracking-widest text-accent">{kicker}</span>
      <span className="mt-2 text-xl font-semibold">{title}</span>
      <span className="mt-2 flex-1 text-sm leading-relaxed text-muted">{body}</span>
      {meta && <span className="mt-3 text-xs text-muted">{meta}</span>}
      <span className="mt-4 text-sm font-semibold text-accent group-hover:underline">{cta} →</span>
    </a>
  );
}

export function Dashboard({ sw }: { sw: Software }) {
  const { progress } = useAppState();
  const info = SOFTWARE[sw];
  const s = progressStats(progress[sw], TOOLS[sw].length, COMMANDS[sw].length);
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <BigCard to={`${sw}/study`} kicker="Study Mode" title={`Study ${info.short}`}
          body="Browse every toolbar icon and general shortcut, read how each works, and mark what you have learned."
          meta={`${TOOLS[sw].length} toolbar tools · ${COMMANDS[sw].length} general shortcuts`} cta="Start studying" />
        <BigCard to={`${sw}/exam`} kicker="Exam Mode" title={`Exam ${info.short}`}
          body="Type the tool name and shortcut from the original icon, or test general commands. Scored with partial credit."
          meta={`${s.completed} exam${s.completed === 1 ? '' : 's'} completed`} cta="Take an exam" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-line bg-surface p-5">
          <div className="text-sm text-muted">Tools learned</div>
          <div className="mt-1 text-2xl font-semibold">{progress[sw].learnedTools.length}<span className="text-base font-normal text-muted"> / {TOOLS[sw].length}</span></div>
          <div className="mt-3"><ProgressBar value={s.learnedPct} label="Tools learned" /></div>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-5">
          <div className="text-sm text-muted">General shortcuts reviewed</div>
          <div className="mt-1 text-2xl font-semibold">{progress[sw].reviewedCommands.length}<span className="text-base font-normal text-muted"> / {COMMANDS[sw].length}</span></div>
          <div className="mt-3"><ProgressBar value={s.reviewedPct} label="Shortcuts reviewed" /></div>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-5">
          <div className="text-sm text-muted">Best exam scores</div>
          <div className="mt-1 text-sm">Toolbar icons: <b>{s.best('tools') === null ? '—' : `${s.best('tools')}%`}</b></div>
          <div className="text-sm">Other shortcuts: <b>{s.best('commands') === null ? '—' : `${s.best('commands')}%`}</b></div>
          <a className={btn.ghost + ' mt-2 !px-0'} href={href(`${sw}/progress`)}>See full progress →</a>
        </div>
      </div>
    </div>
  );
}

export function StudyChooser({ sw }: { sw: Software }) {
  const info = SOFTWARE[sw];
  return (
    <div>
      <h2 className="text-2xl font-bold">Study Mode</h2>
      <p className="mt-1 text-muted">Choose what to study. The two categories are kept separate.</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <BigCard to={`${sw}/study/tools`} kicker="A" title="Toolbar Icon Study"
          body="Learn the original toolbar icons with tool names, keyboard shortcuts, descriptions, functions and examples."
          meta={`${TOOLS[sw].length} tools in ${info.toolCategories.length} categories`} cta="Open toolbar study" />
        <BigCard to={`${sw}/study/shortcuts`} kicker="B" title="Other Useful Shortcuts Study"
          body="Learn general commands, keyboard shortcuts and practical workflows that do not need a toolbar icon."
          meta={`${COMMANDS[sw].length} commands in ${info.commandCategories.length} categories`} cta="Open shortcut study" />
      </div>
    </div>
  );
}

export function ExamChooser({ sw }: { sw: Software }) {
  return (
    <div>
      <h2 className="text-2xl font-bold">Exam Mode</h2>
      <p className="mt-1 text-muted">Type your answers — nothing is multiple choice. Two separate exams:</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <BigCard to={`${sw}/exam/tools`} kicker="A" title="Toolbar Icon Exam"
          body="Identify a tool from its original icon and its function, then type the tool name and keyboard shortcut."
          meta="2 points per question: 1 for the name, 1 for the shortcut" cta="Set up this exam" />
        <BigCard to={`${sw}/exam/shortcuts`} kicker="B" title="Other Useful Shortcuts Exam"
          body="Identify general commands from their function and type the command name and keyboard shortcut. No icons."
          meta="2 points per question when both fields are asked" cta="Set up this exam" />
      </div>
    </div>
  );
}
