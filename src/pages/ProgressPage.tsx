import { useState } from 'react';
import { COMMANDS, SOFTWARE, TOOLS } from '../data';
import type { Software } from '../data';
import { actions, progressStats, useAppState } from '../lib/store';
import { btn, Confirm, ProgressBar } from '../components/ui';

export function ProgressPage({ sw }: { sw: Software }) {
  const { progress } = useAppState();
  const info = SOFTWARE[sw];
  const p = progress[sw];
  const s = progressStats(p, TOOLS[sw].length, COMMANDS[sw].length);
  const [confirm, setConfirm] = useState(false);
  const pct = (n: number | null) => (n === null ? '—' : `${n}%`);
  const lastT = s.last('tools'), lastC = s.last('commands');
  const accuracy = s.totalMax ? Math.round((s.totalPoints / s.totalMax) * 100) : null;

  const card = (title: string, value: string, sub?: string) => (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="text-sm text-muted">{title}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </div>
  );

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">{info.short} learning progress</h2>
          <p className="text-sm text-muted">Saved in this browser only. {info.short} and {sw === 'photoshop' ? 'Illustrator' : 'Photoshop'} progress are tracked separately.</p>
        </div>
        <button className={btn.secondary} onClick={() => setConfirm(true)}>Reset progress</button>
      </div>

      <div className="mt-5 rounded-2xl border border-line bg-surface p-5">
        <div className="flex justify-between text-sm"><span className="font-semibold">Overall learning progress</span><span>{s.overall}%</span></div>
        <div className="mt-2"><ProgressBar value={s.overall} label="Overall learning progress" /></div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {card('Tools learned', `${p.learnedTools.length} / ${TOOLS[sw].length}`, `${s.learnedPct}%`)}
        {card('General shortcuts reviewed', `${p.reviewedCommands.length} / ${COMMANDS[sw].length}`, `${s.reviewedPct}%`)}
        {card('Favorite tools', String(p.favTools.length))}
        {card('Favorite commands', String(p.favCommands.length))}
        {card('Exams completed', String(s.completed))}
        {card('Best score · toolbar icons', pct(s.best('tools')))}
        {card('Best score · other shortcuts', pct(s.best('commands')))}
        {card('Most recent score', lastT || lastC ? [lastT && `Icons ${lastT.percent}%`, lastC && `Shortcuts ${lastC.percent}%`].filter(Boolean).join(' · ') : '—')}
        {card('Correct names (all exams)', String(s.totalNames))}
        {card('Points earned (all exams)', s.totalMax ? `${s.totalPoints} / ${s.totalMax}` : '—', accuracy === null ? undefined : `${accuracy}% accuracy`)}
      </div>

      <div className="mt-4 rounded-2xl border border-line bg-surface p-5">
        <h3 className="font-semibold">Categories that need improvement</h3>
        {s.weak.length === 0 ? <p className="mt-1 text-sm text-muted">Take an exam to see which categories need more practice.</p>
          : <ul className="mt-2 list-inside list-disc text-sm">{s.weak.map((w) => <li key={w}>{w}</li>)}</ul>}
      </div>

      <div className="mt-4 rounded-2xl border border-line bg-surface p-5">
        <h3 className="font-semibold">Exam history</h3>
        {p.exams.length === 0 ? <p className="mt-1 text-sm text-muted">No exams yet.</p> : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <thead className="text-xs uppercase text-muted"><tr><th className="py-1 pr-3">Date</th><th className="pr-3">Exam</th><th className="pr-3">Level</th><th className="pr-3">OS</th><th className="pr-3">Points</th><th>Score</th></tr></thead>
              <tbody>
                {p.exams.slice().reverse().slice(0, 15).map((e) => (
                  <tr key={e.at} className="border-t border-line">
                    <td className="py-2 pr-3">{new Date(e.at).toLocaleString()}</td>
                    <td className="pr-3">{e.category === 'tools' ? 'Toolbar icons' : 'Other shortcuts'}</td>
                    <td className="pr-3 capitalize">{e.difficulty}</td>
                    <td className="pr-3">{e.os === 'mac' ? 'macOS' : 'Windows'}</td>
                    <td className="pr-3">{e.points} / {e.max}</td>
                    <td className="font-semibold">{e.percent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Confirm open={confirm} title={`Reset ${info.short} progress?`}
        body={`This clears learned tools, reviewed shortcuts, favorites and exam history for ${info.short} in this browser. ${sw === 'photoshop' ? 'Illustrator' : 'Photoshop'} is not affected.`}
        confirmLabel="Reset progress" onCancel={() => setConfirm(false)} onConfirm={() => { actions.reset(sw); setConfirm(false); }} />
    </div>
  );
}
