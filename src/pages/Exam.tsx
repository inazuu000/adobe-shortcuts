import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { COMMANDS, SOFTWARE, TOOLS } from '../data';
import type { Software } from '../data';
import {
  availableCounts, examPool, expectedShortcut, explain, generateQuestions, getItem, grade, summarize,
} from '../lib/exam';
import type { Answer, CountChoice, Difficulty, ExamCategory, ExamConfig, Graded, Question } from '../lib/exam';
import { href, navigate } from '../lib/router';
import { actions, setSettings, useAppState } from '../lib/store';
import { btn, Confirm, Glyph, OSSelector, ProgressBar, Seg, ToolIcon } from '../components/ui';
import { Keys } from '../components/cards';

const inputCls = 'w-full rounded-xl border border-line bg-bg px-4 py-3 text-base placeholder:text-muted focus:border-accent focus:outline-none disabled:opacity-70';

const TITLE: Record<ExamCategory, string> = { tools: 'TOOLBAR ICON EXAM', commands: 'OTHER USEFUL SHORTCUTS EXAM' };

interface Row { q: Question; item: NonNullable<ReturnType<typeof getItem>>; answer: Answer; graded: Graded }

/* ============================ setup ============================ */
function Setup({ sw, category, cfg, setCfg, onStart }: {
  sw: Software; category: ExamCategory; cfg: ExamConfig; setCfg: (c: ExamConfig) => void; onStart: () => void;
}) {
  const info = SOFTWARE[sw];
  const pool = useMemo(() => examPool(cfg), [cfg.software, cfg.category, cfg.difficulty]);
  const counts = availableCounts(pool.length);
  const total = category === 'tools' ? TOOLS[sw].length : COMMANDS[sw].length;
  const excluded = total - examPool({ software: sw, category, difficulty: 'advanced' }).length;
  const effective: CountChoice = counts.find((c) => c.value === cfg.count)?.enabled ? cfg.count : 'all';
  const n = effective === 'all' ? pool.length : effective;

  return (
    <div className="mx-auto max-w-2xl">
      <a href={href(`${sw}/exam`)} className="text-sm text-muted hover:text-fg">← Exam Mode</a>
      <h2 className="mt-1 text-2xl font-bold">{category === 'tools' ? 'Toolbar Icon Exam' : 'Other Useful Shortcuts Exam'}</h2>
      <p className="mt-1 text-sm text-muted">
        {category === 'tools'
          ? 'You will see the original toolbar icon and a description of its function. Type the tool name and its shortcut key.'
          : 'You will see a description of a command. Type the command name and its shortcut key. No icons are used.'}
      </p>

      <div className="mt-6 space-y-6 rounded-3xl border border-line bg-surface p-5 sm:p-7">
        <Field label="Software">
          <Seg label="Software" value={sw} onChange={(v: Software) => navigate(`${v}/exam/${category === 'tools' ? 'tools' : 'shortcuts'}`)}
            options={[{ value: 'photoshop', label: 'Adobe Photoshop' }, { value: 'illustrator', label: 'Adobe Illustrator' }]} />
        </Field>
        <Field label="Exam category">
          <Seg label="Exam category" value={category} onChange={(v: ExamCategory) => navigate(`${sw}/exam/${v === 'tools' ? 'tools' : 'shortcuts'}`)}
            options={[{ value: 'tools', label: 'Toolbar Icon Exam' }, { value: 'commands', label: 'Other Useful Shortcuts Exam' }]} />
        </Field>
        <Field label="Difficulty" hint="Each level includes the easier ones before it.">
          <Seg<Difficulty> label="Difficulty" value={cfg.difficulty} onChange={(v) => setCfg({ ...cfg, difficulty: v })}
            options={[{ value: 'beginner', label: 'Beginner' }, { value: 'intermediate', label: 'Intermediate' }, { value: 'advanced', label: 'Advanced' }]} />
        </Field>
        <Field label="Number of questions" hint={`${pool.length} verified question${pool.length === 1 ? '' : 's'} available at this level.`}>
          <Seg<CountChoice> label="Number of questions" value={effective} onChange={(v) => setCfg({ ...cfg, count: v })}
            options={counts.map((c) => ({ value: c.value, label: c.label, disabled: !c.enabled, title: c.enabled ? undefined : `Only ${pool.length} questions available at this difficulty` }))} />
        </Field>
        <Field label="Operating system" hint="Controls which shortcuts are accepted as correct.">
          <OSSelector os={cfg.os} onChange={(os) => { setSettings({ os }); setCfg({ ...cfg, os }); }} />
        </Field>
        <Field label="Feedback timing">
          <Seg label="Feedback timing" value={cfg.feedback} onChange={(v) => { setSettings({ feedback: v }); setCfg({ ...cfg, feedback: v }); }}
            options={[{ value: 'each', label: 'After each answer' }, { value: 'end', label: 'At the end of the exam' }]} />
        </Field>
        {category === 'commands' && (
          <Field label="Question format">
            <Seg<'both' | 'mixed'> label="Question format" value={cfg.mixed ? 'mixed' : 'both'} onChange={(v) => setCfg({ ...cfg, mixed: v === 'mixed' })}
              options={[{ value: 'both', label: 'Function → name + shortcut' }, { value: 'mixed', label: 'Mixed (also name → shortcut, shortcut → name)' }]} />
          </Field>
        )}
        <div className="rounded-2xl bg-surface2 p-4 text-sm text-muted">
          <b className="text-fg">Scoring:</b> 1 point for the correct name and 1 point for the correct shortcut (single-field questions are worth 1).
          {' '}If an item has no default shortcut, type <kbd className="kbd">None</kbd>.
          {excluded > 0 && <> {excluded} item{excluded === 1 ? ' is' : 's are'} excluded because {excluded === 1 ? 'its' : 'their'} shortcut is not verified for current releases.</>}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-muted">{n} question{n === 1 ? '' : 's'} · up to {category === 'commands' && cfg.mixed ? '≈' : ''}{n * 2} points · {info.short}</span>
          <button className={btn.primary} disabled={n === 0} onClick={() => { setCfg({ ...cfg, count: effective }); onStart(); }}>Start exam</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-sm font-semibold">{label}</div>
      {children}
      {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

/* ============================ question ============================ */
function QuestionView({ sw, category, cfg, q, index, total, answeredCount, onSubmit, onNext, onQuit, submitted }: {
  sw: Software; category: ExamCategory; cfg: ExamConfig; q: Question; index: number; total: number; answeredCount: number;
  submitted: Row | null; onSubmit: (a: Answer) => void; onNext: () => void; onQuit: () => void;
}) {
  const item = getItem(sw, category, q.itemId)!;
  const [name, setName] = useState('');
  const [shortcut, setShortcut] = useState('');
  const nextRef = useRef<HTMLButtonElement | null>(null);
  const firstRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => { setName(''); setShortcut(''); firstRef.current?.focus(); }, [q.id]);
  useEffect(() => { if (submitted) nextRef.current?.focus(); }, [submitted]);

  const askName = q.format !== 'shortcut';
  const askShortcut = q.format !== 'name';
  const info = SOFTWARE[sw];
  const canSubmit = (!askName || name.trim() !== '') || (!askShortcut || shortcut.trim() !== '');
  const g = submitted?.graded;
  const sc = expectedShortcut(item, cfg.os);
  const last = index === total - 1;

  const submit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (submitted) return;
    onSubmit({ name, shortcut });
  };

  const mark = (ok: boolean | null) => (ok === null ? null : ok ? <span className="font-semibold text-ok">Correct ✓</span> : <span className="font-semibold text-bad">Incorrect ✗</span>);

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl rounded-3xl border border-line bg-surface p-5 shadow-sm sm:p-8" aria-label={`Question ${index + 1} of ${total}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-widest text-accent">{info.short} — {TITLE[category]}</p>
        <button type="button" className={btn.ghost + ' !py-1'} onClick={onQuit}>Quit</button>
      </div>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="font-semibold">Question {index + 1} of {total}</span>
        <span className="text-muted">{cfg.os === 'mac' ? 'macOS' : 'Windows'} · {answeredCount}/{total} answered</span>
      </div>
      <div className="mt-2"><ProgressBar value={(answeredCount / total) * 100} label="Exam progress" /></div>

      {category === 'tools' && item.tool && (
        <div className="mt-7 flex justify-center"><ToolIcon tool={item.tool} scale={4} /></div>
      )}

      <div className="mt-6">
        {q.format === 'name' ? (
          <>
            <div className="text-xs font-bold uppercase tracking-widest text-muted">Shortcut shown</div>
            <div className="mt-2"><Keys value={sc} /></div>
            <p className="mt-2 text-sm text-muted">Category hint: {item.category}</p>
          </>
        ) : (
          <>
            {q.format === 'shortcut' && (
              <>
                <div className="text-xs font-bold uppercase tracking-widest text-muted">Command</div>
                <div className="mt-1 text-xl font-semibold">{item.name}</div>
                <div className="mt-4" />
              </>
            )}
            <div className="text-xs font-bold uppercase tracking-widest text-muted">Function / description</div>
            <p className="mt-2 text-lg leading-relaxed">{item.fn}</p>
          </>
        )}
      </div>

      <div className="mt-6 space-y-5">
        {askName && (
          <div>
            <label htmlFor="ans-name" className="text-xs font-bold uppercase tracking-widest text-muted">Name:</label>
            <input id="ans-name" ref={firstRef} className={inputCls + ' mt-1.5'} value={submitted ? submitted.answer.name : name}
              onChange={(e: { target: { value: string } }) => setName(e.target.value)} disabled={!!submitted}
              placeholder="Type your answer here" autoComplete="off" autoCapitalize="off" spellCheck={false} />
          </div>
        )}
        {askShortcut && (
          <div>
            <label htmlFor="ans-sc" className="text-xs font-bold uppercase tracking-widest text-muted">Shortcut key:</label>
            <input id="ans-sc" ref={askName ? undefined : firstRef} className={inputCls + ' mt-1.5 font-mono'} value={submitted ? submitted.answer.shortcut : shortcut}
              onChange={(e: { target: { value: string } }) => setShortcut(e.target.value)} disabled={!!submitted}
              placeholder="Type your answer here" autoComplete="off" autoCapitalize="off" spellCheck={false} aria-describedby="sc-hint" />
            <p id="sc-hint" className="mt-1.5 text-xs text-muted">
              {cfg.os === 'mac' ? 'Write it like Command + Shift + D.' : 'Write it like Ctrl + Shift + D.'} For a single-key tool just type the key. If there is no default shortcut, type None.
            </p>
          </div>
        )}
      </div>

      {!submitted ? (
        <div className="mt-7 flex justify-center">
          <button type="submit" className={btn.primary + ' min-w-48'} disabled={!canSubmit}>Submit answer</button>
        </div>
      ) : (
        <div className="mt-7 space-y-4" role="status" aria-live="polite">
          {cfg.feedback === 'each' && g ? (
            <div className="rounded-2xl border border-line bg-surface2 p-4 text-sm leading-relaxed">
              {g.nameOk !== null && <p>NAME: {mark(g.nameOk)}{!g.nameOk && <span className="text-muted"> — correct name: <b className="text-fg">{item.name}</b></span>}</p>}
              {g.shortcutOk !== null && <p>SHORTCUT KEY: {mark(g.shortcutOk)}{!g.shortcutOk && <span className="text-muted"> — correct shortcut: <b className="text-fg">{sc ?? 'None (no default shortcut)'}</b></span>}</p>}
              <p className="mt-2 text-muted"><b className="text-fg">Explanation:</b> {explain(item, cfg.os)}</p>
              <p className="mt-2 font-semibold">{g.points} / {g.max} point{g.max === 1 ? '' : 's'}</p>
            </div>
          ) : (
            <p className="rounded-2xl bg-surface2 p-4 text-sm text-muted">Answer submitted. Your feedback will appear when you finish the exam.</p>
          )}
          <div className="flex justify-center">
            <button ref={nextRef} type="button" className={btn.primary + ' min-w-48'} onClick={onNext}>{last ? 'Finish exam' : 'Next question'} <Glyph name="right" size={16} /></button>
          </div>
        </div>
      )}
    </form>
  );
}

/* ============================ results ============================ */
function Results({ sw, category, cfg, rows, isRetry, onRetryIncorrect, onRetake }: {
  sw: Software; category: ExamCategory; cfg: ExamConfig; rows: Row[]; isRetry: boolean; onRetryIncorrect: () => void; onRetake: () => void;
}) {
  const info = SOFTWARE[sw];
  const s = useMemo(() => summarize(rows.map((r) => ({ item: r.item, graded: r.graded }))), [rows]);
  const [review, setReview] = useState<'none' | 'all' | 'mistakes'>('none');
  const saved = useRef(false);
  useEffect(() => {
    if (saved.current || isRetry) return;
    saved.current = true;
    actions.addExam(sw, {
      at: Date.now(), category, difficulty: cfg.difficulty, os: cfg.os, questions: s.questions, points: s.points, max: s.max,
      percent: s.percent, namesCorrect: s.namesCorrect, shortcutsCorrect: s.shortcutsCorrect, weak: s.weakCategories.map((w) => w.category),
    });
  }, []);

  const missed = rows.filter((r) => r.graded.status !== 'correct');
  const shown = review === 'all' ? rows : review === 'mistakes' ? missed : [];
  const stat = (label: string, value: string) => (
    <div className="rounded-2xl border border-line bg-surface p-4"><div className="text-xs text-muted">{label}</div><div className="mt-1 text-xl font-semibold">{value}</div></div>
  );

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-xs font-bold uppercase tracking-widest text-accent">{info.short} — {category === 'tools' ? 'Toolbar Icon Exam' : 'Other Useful Shortcuts Exam'} results{isRetry ? ' (retry — not saved to history)' : ''}</p>
      <h2 className="mt-2 text-4xl font-bold tracking-tight">{s.percent}%</h2>
      <p className="text-muted">{s.points} / {s.max} points · {cfg.os === 'mac' ? 'macOS' : 'Windows'} · {cfg.difficulty}</p>
      <div className="mt-4"><ProgressBar value={s.percent} label="Final score" /></div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stat('Questions completed', String(s.questions))}
        {stat('Fully correct', String(s.fullyCorrect))}
        {stat('Partially correct', String(s.partial))}
        {stat('Incorrect', String(s.incorrect))}
        {s.namesAsked > 0 && stat('Names correct', `${s.namesCorrect} / ${s.namesAsked}`)}
        {s.shortcutsAsked > 0 && stat('Shortcuts correct', `${s.shortcutsCorrect} / ${s.shortcutsAsked}`)}
        {stat('Points earned', `${s.points} / ${s.max}`)}
        {stat('Final score', `${s.percent}%`)}
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-surface p-4">
        <h3 className="font-semibold">Categories that need improvement</h3>
        {s.weakCategories.length === 0
          ? <p className="mt-1 text-sm text-muted">Nothing below 80% — nice work.</p>
          : <ul className="mt-2 space-y-1 text-sm">{s.weakCategories.map((w) => <li key={w.category} className="flex justify-between"><span>{w.category}</span><span className="text-muted">{w.percent}%</span></li>)}</ul>}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button className={review === 'all' ? btn.primary : btn.secondary} onClick={() => setReview(review === 'all' ? 'none' : 'all')}>Review All Answers</button>
        <button className={review === 'mistakes' ? btn.primary : btn.secondary} onClick={() => setReview(review === 'mistakes' ? 'none' : 'mistakes')} disabled={missed.length === 0}>Review Mistakes ({missed.length})</button>
        <button className={btn.secondary} onClick={onRetryIncorrect} disabled={missed.length === 0}>Retry Incorrect Questions</button>
        <button className={btn.secondary} disabled={missed.length === 0}
          onClick={() => navigate(`${sw}/study/${category === 'tools' ? 'tools' : 'shortcuts'}`, { ids: missed.map((m) => m.item.id).join(',') })}>
          Study These {category === 'tools' ? 'Tools' : 'Shortcuts'}
        </button>
        <button className={btn.secondary} onClick={onRetake}>Retake Exam</button>
        <a className={btn.secondary} href={href(sw)}>Return to Dashboard</a>
      </div>

      {review !== 'none' && (
        <section className="mt-8" aria-label="Answer review">
          <h3 className="mb-3 text-lg font-semibold">{review === 'all' ? 'All answers' : 'Mistakes to review'}</h3>
          <ol className="space-y-3">
            {shown.map((r) => {
              const sc = expectedShortcut(r.item, cfg.os);
              const g = r.graded;
              return (
                <li key={r.q.id} className="rounded-2xl border border-line bg-surface p-4">
                  <div className="flex items-start gap-3">
                    {r.item.tool && <ToolIcon tool={r.item.tool} scale={1} label={false} />}
                    <div className="min-w-0 flex-1 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-base font-semibold">{r.item.name}</span>
                        <span className={g.status === 'correct' ? 'font-semibold text-ok' : g.status === 'partial' ? 'font-semibold text-warn' : 'font-semibold text-bad'}>
                          {g.status === 'correct' ? 'Correct' : g.status === 'partial' ? 'Partly correct' : 'Incorrect'} · {g.points}/{g.max}
                        </span>
                      </div>
                      <p className="mt-1 text-muted">{r.item.fn}</p>
                      <dl className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
                        {g.nameOk !== null && <div><dt className="inline text-muted">Your name: </dt><dd className="inline">{r.answer.name.trim() || '(blank)'} {g.nameOk ? '✓' : '✗'}</dd></div>}
                        {g.shortcutOk !== null && <div><dt className="inline text-muted">Your shortcut: </dt><dd className="inline">{r.answer.shortcut.trim() || '(blank)'} {g.shortcutOk ? '✓' : '✗'}</dd></div>}
                        {g.nameOk !== null && <div><dt className="inline text-muted">Correct name: </dt><dd className="inline font-medium">{r.item.name}</dd></div>}
                        {g.shortcutOk !== null && <div><dt className="inline text-muted">Correct shortcut: </dt><dd className="inline font-medium">{sc ?? 'None'}</dd></div>}
                      </dl>
                      <p className="mt-2 text-xs text-muted">{explain(r.item, cfg.os)}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </div>
  );
}

/* ============================ flow controller ============================ */
export function ExamFlow({ sw, category }: { sw: Software; category: ExamCategory }) {
  const { settings } = useAppState();
  const [cfg, setCfg] = useState<ExamConfig>({
    software: sw, category, difficulty: 'beginner', count: 10, os: settings.os, feedback: settings.feedback, mixed: false,
  });
  const [phase, setPhase] = useState<'setup' | 'run' | 'results'>('setup');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [rows, setRows] = useState<Row[]>([]);
  const [isRetry, setIsRetry] = useState(false);
  const [quit, setQuit] = useState(false);

  // keep the config in sync when the global OS / feedback settings change (e.g. from the header)
  useEffect(() => { setCfg((c) => ({ ...c, os: settings.os, feedback: settings.feedback, software: sw, category })); }, [settings.os, settings.feedback, sw, category]);

  const begin = (qs: Question[], retry: boolean) => {
    setQuestions(qs); setRows([]); setIdx(0); setIsRetry(retry); setPhase('run');
    try { window.scrollTo({ top: 0 }); } catch { /* ignore */ }
  };
  const start = () => begin(generateQuestions(cfg), false);

  if (phase === 'setup') return <Setup sw={sw} category={category} cfg={cfg} setCfg={setCfg} onStart={start} />;

  if (phase === 'results') {
    return (
      <Results sw={sw} category={category} cfg={cfg} rows={rows} isRetry={isRetry}
        onRetake={() => setPhase('setup')}
        onRetryIncorrect={() => begin(rows.filter((r) => r.graded.status !== 'correct').map((r, i) => ({ ...r.q, id: `retry${i + 1}-${r.item.id}` })), true)} />
    );
  }

  const q = questions[idx];
  const current = rows.find((r) => r.q.id === q.id) ?? null;
  const submit = (a: Answer) => {
    if (rows.some((r) => r.q.id === q.id)) return; // answers are final once submitted
    const item = getItem(sw, category, q.itemId)!;
    setRows((rs) => [...rs, { q, item, answer: a, graded: grade(q, item, a, cfg.os) }]);
  };
  const next = () => { if (idx + 1 >= questions.length) setPhase('results'); else setIdx(idx + 1); };

  return (
    <>
      <QuestionView sw={sw} category={category} cfg={cfg} q={q} index={idx} total={questions.length} answeredCount={rows.length}
        submitted={current} onSubmit={submit} onNext={next} onQuit={() => setQuit(true)} />
      <Confirm open={quit} title="Quit this exam?" body="Your answers so far will not be saved to your history." confirmLabel="Quit exam"
        onCancel={() => setQuit(false)} onConfirm={() => { setQuit(false); setPhase('setup'); }} />
    </>
  );
}
