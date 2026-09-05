import { Link } from 'react-router-dom';

/** Official rescheduled MDCAT 2026 test date (PM&DC notice + STS press release). */
const MDCAT_DATE = new Date('2026-09-20T00:00:00+05:00');

/** Computed at render time so prerendered HTML never ships a stale number. */
export const daysUntilMdcat = () =>
  Math.ceil((MDCAT_DATE.getTime() - Date.now()) / 86400000);

/** PM&DC national MDCAT pattern — 200 MCQs total. */
export const MDCAT_WEIGHTAGE = [
  { subject: 'Biology', mcqs: 68, pct: '34%', time: '~34 min' },
  { subject: 'Chemistry', mcqs: 54, pct: '27%', time: '~27 min' },
  { subject: 'Physics', mcqs: 54, pct: '27%', time: '~27 min' },
  { subject: 'English', mcqs: 18, pct: '9%', time: '~9 min' },
  { subject: 'Logical Reasoning', mcqs: 6, pct: '3%', time: '~3 min' },
];

export const MdcatCountdown = () => {
  const daysLeft = daysUntilMdcat();
  if (daysLeft <= 0) return null;
  const unit = daysLeft === 1 ? 'day' : 'days';

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-8">
      <p className="text-sm font-semibold text-purple-800">
        ⏳ MDCAT 2026 in {daysLeft} {unit}
      </p>
      <p className="text-sm text-purple-700 mt-1">
        Test day is Sunday, 20 September 2026. With {daysLeft} {unit} left, split your
        time by paper weightage below: Biology first (68 MCQs), then Chemistry and
        Physics (54 each), and keep the last week for full-length mocks and revision of
        wrong answers.
      </p>
    </div>
  );
};

export const MdcatWeightageTable = () => (
  <section id="mdcat-weightage" className="mb-10 scroll-mt-24">
    <h2 className="text-xl font-semibold mb-2">MDCAT 2026 Subject Weightage (200 MCQs)</h2>
    <p className="text-sm text-muted-foreground mb-4">
      The MDCAT paper carries 200 MCQs in 210 minutes. Use this distribution to allocate
      study time — Biology alone is roughly one third of the paper, so it deserves the
      largest share of your revision hours.
    </p>
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left px-3 py-2 font-semibold">Subject</th>
            <th className="text-left px-3 py-2 font-semibold">MCQs</th>
            <th className="text-left px-3 py-2 font-semibold">Share of paper</th>
            <th className="text-left px-3 py-2 font-semibold">Suggested time</th>
          </tr>
        </thead>
        <tbody>
          {MDCAT_WEIGHTAGE.map((w) => (
            <tr key={w.subject} className="border-t">
              <td className="px-3 py-2 font-medium">{w.subject}</td>
              <td className="px-3 py-2">{w.mcqs}</td>
              <td className="px-3 py-2">{w.pct}</td>
              <td className="px-3 py-2 text-muted-foreground">{w.time}</td>
            </tr>
          ))}
          <tr className="border-t bg-muted/30 font-semibold">
            <td className="px-3 py-2">Total</td>
            <td className="px-3 py-2">200</td>
            <td className="px-3 py-2">100%</td>
            <td className="px-3 py-2">210 min</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p className="text-sm text-muted-foreground mt-3">
      There is no negative marking in MDCAT and the qualifying score is 55% (110/200), so
      attempt every question. See the{' '}
      <Link to="/mdcat-syllabus" className="text-purple-700 underline">
        full MDCAT 2026 syllabus
      </Link>{' '}
      and{' '}
      <Link to="/tools/aggregate-calculator" className="text-purple-700 underline">
        calculate your MDCAT aggregate
      </Link>
      .
    </p>
  </section>
);

/**
 * In-body contextual links for MDCAT pages (Batch B).
 * Isolated: rendered only on MDCAT routes, no shared layout changes.
 */
export const MdcatContextualLinks = () => (
  <section className="mb-10 rounded-xl border bg-muted/30 p-4">
    <h2 className="text-base font-semibold mb-2">Plan the rest of your MDCAT route</h2>
    <p className="text-sm text-muted-foreground">
      Once you know your score range, check where you actually stand with the{' '}
      <Link to="/tools/aggregate-calculator" className="text-purple-700 underline">
        MDCAT aggregate calculator
      </Link>{' '}
      — it weighs your FSc marks and MDCAT score the way public medical colleges do. Keep the
      daily habit going with{' '}
      <Link to="/exams/mdcat" className="text-purple-700 underline">
        free MDCAT MCQ practice
      </Link>
      , and if you are also applying to army medical colleges, the{' '}
      <Link to="/exams/nums" className="text-purple-700 underline">
        NUMS entry test preparation
      </Link>{' '}
      shares most of the Biology and Chemistry syllabus. Engineering aspirants keeping a backup
      option should start{' '}
      <Link to="/ecat-preparation" className="text-purple-700 underline">
        ECAT preparation
      </Link>{' '}
      alongside, since Physics and Maths overlap heavily.
    </p>
  </section>
);

/** Officially confirmed MDCAT 2026 facts (PM&DC notices only). */
const TEST_DAY_FACTS: { label: string; value: string; confirmed: boolean }[] = [
  { label: 'Test date', value: 'Sunday, 20 September 2026', confirmed: true },
  {
    label: 'Official notice',
    value: 'PM&DC Public Notice PF-1-C-PM&DC/Notification/2026/1229, dated 6 August 2026',
    confirmed: true,
  },
  {
    label: 'Exam arrangements',
    value: 'All other terms, conditions and examination arrangements remain unchanged unless notified otherwise by PM&DC',
    confirmed: true,
  },
  {
    label: 'Registration portal',
    value: 'Reopened 17–21 August 2026 with prescribed fee (PM&DC Examinations Dept. notice) — now closed',
    confirmed: true,
  },
  { label: 'Roll number slip download date', value: 'Not yet announced', confirmed: false },
  { label: 'Test centre allotment / city list', value: 'Not yet announced', confirmed: false },
  { label: 'Reporting time and gate closing time', value: 'Not yet announced', confirmed: false },
];

/**
 * Roll number slip / test-day information block (Batch C).
 * Only PM&DC-confirmed facts are stated; everything else is explicitly
 * marked "Not yet announced" — never guessed.
 */
export const MdcatTestDayBlock = () => (
  <section id="mdcat-test-day" className="mb-10 scroll-mt-24">
    <h2 className="text-xl font-semibold mb-2">MDCAT 2026 Roll Number Slip &amp; Test-Day Information</h2>
    <p className="text-sm text-muted-foreground mb-4">
      Below is only what PM&amp;DC has officially confirmed for MDCAT 2026. Anything PM&amp;DC has
      not announced yet is clearly marked — we do not publish rumoured dates.
    </p>
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left px-3 py-2 font-semibold">Item</th>
            <th className="text-left px-3 py-2 font-semibold">Official status</th>
          </tr>
        </thead>
        <tbody>
          {TEST_DAY_FACTS.map((f) => (
            <tr key={f.label} className="border-t">
              <td className="px-3 py-2 font-medium">{f.label}</td>
              <td className="px-3 py-2">
                <span className={f.confirmed ? 'text-foreground' : 'text-muted-foreground italic'}>
                  {f.value}
                </span>
                {!f.confirmed && (
                  <span className="ml-2 inline-block rounded-full border border-yellow-300 bg-yellow-50 px-2 py-0.5 text-[11px] font-medium text-yellow-800">
                    Awaiting PM&amp;DC notice
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <p className="text-xs text-muted-foreground mt-3">
      Sources:{' '}
      <a
        href="https://www.pmdc.pk/Documents/Others/MDCAT-2026%20Rescheduling%20Public%20Notice.pdf"
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="underline"
      >
        PM&amp;DC rescheduling public notice (PDF)
      </a>
      ,{' '}
      <a
        href="https://www.pmdc.pk/Documents/press/PRESS%20RELEASE-MDCAT%20Rescheduled.pdf"
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="underline"
      >
        PM&amp;DC press release (PDF)
      </a>
      ,{' '}
      <a
        href="https://pmdc.pk/home/PublicAnnouncement"
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="underline"
      >
        PM&amp;DC public announcements
      </a>
      . Roll number slips are issued through the PM&amp;DC / test-conducting university portal you
      registered on — check{' '}
      <a
        href="https://www.pmdc.pk"
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="underline"
      >
        pmdc.pk
      </a>{' '}
      for the download announcement.
    </p>
    <p className="text-sm text-muted-foreground mt-3">
      While you wait, keep revising with the{' '}
      <Link to="/mdcat-syllabus" className="text-purple-700 underline">
        MDCAT 2026 syllabus
      </Link>{' '}
      and{' '}
      <Link to="/mdcat-past-papers" className="text-purple-700 underline">
        past papers
      </Link>
      .
    </p>
  </section>
);
