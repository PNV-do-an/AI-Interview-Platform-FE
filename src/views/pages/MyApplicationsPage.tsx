import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCandidateController } from '../../controllers/useCandidateController';
import { useSlotController } from '../../controllers/useSlotController';
import { useAuth } from '../../context/AuthContext';
import { Application, ApplicationStatus } from '../../models/Program.model';
import {
  Card,
  EmptyState,
  ErrorBanner,
  LoadingState,
  StatusBadge,
  buttonClass,
  inputClass,
  tableClass,
  tdClass,
  thClass,
} from '../components/ui';

// Mockup English labels for the statuses that appear in the design.
// INTERVIEWED / REJECTED / CANCELLED have no mockup label, so the raw API
// value is rendered verbatim.
const STATUS_TEXT: Partial<Record<ApplicationStatus, string>> = {
  PENDING: 'Under Review',
  SCHEDULED: 'Interview Scheduled',
  ACCEPTED: 'Offer Received',
};
const statusText = (status: ApplicationStatus) => STATUS_TEXT[status] ?? status;

interface TabDef {
  key: string;
  label: string;
  statuses: ApplicationStatus[] | null;
}

// Client-side segmented tabs from the mockup filter bar (All / In Review /
// Interviews / Offers / Archived), mapped onto real Application.status values.
const TAB_DEFS: TabDef[] = [
  { key: 'all', label: 'All', statuses: null },
  { key: 'review', label: 'In Review', statuses: ['PENDING'] },
  { key: 'interviews', label: 'Interviews', statuses: ['SCHEDULED', 'INTERVIEWED'] },
  { key: 'offers', label: 'Offers', statuses: ['ACCEPTED'] },
  { key: 'archived', label: 'Archived', statuses: ['REJECTED', 'CANCELLED'] },
];

// Left accent bar colour per status (mockup card rail), using config tokens only.
const ACCENT: Record<ApplicationStatus, string> = {
  PENDING: 'bg-primary-container',
  SCHEDULED: 'bg-secondary',
  INTERVIEWED: 'bg-secondary',
  ACCEPTED: 'bg-secondary',
  REJECTED: 'bg-surface-high',
  CANCELLED: 'bg-surface-high',
};

const TILE_CLASS =
  'rounded-lg bg-card p-4 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] transition-shadow hover:shadow-proof';
const TAB_BASE =
  'whitespace-nowrap rounded-md px-3 py-1.5 text-label-md transition-all';
const CODE_CHIP = 'rounded bg-surface-high px-2 py-1 font-mono text-[12px] text-ink-variant';

const fmtDateTime = (iso: string) => new Date(iso).toLocaleString('vi-VN');

const MyApplicationsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    applications, profile, loading, error, successMsg,
    fetchMyApplications, cancelApplication, bookSlot,
    fetchProfile, clearMessages,
  } = useCandidateController();
  const { availableSlots, fetchAvailableSlots } = useSlotController();

  const [page, setPage] = useState(0);
  const [bookingApp, setBookingApp] = useState<Application | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'cards' | 'table'>('cards');

  useEffect(() => {
    if (user?.role === 'ROLE_USER') {
      fetchMyApplications(0);
      fetchProfile();
    }
  }, [user]);

  const openBooking = async (app: Application) => {
    clearMessages();
    setSelectedSlot(null);
    setBookingApp(app);
    await fetchAvailableSlots(app.employerId);
  };

  const confirmBooking = async () => {
    if (!bookingApp || !selectedSlot) return;
    const ok = await bookSlot(selectedSlot, bookingApp.id);
    if (ok) {
      setBookingApp(null);
      fetchMyApplications(page);
    }
  };

  const withdraw = async (app: Application) => {
    if (!window.confirm('Withdraw this application?')) return;
    const ok = await cancelApplication(app.id);
    if (ok) fetchMyApplications(page);
  };

  const content = applications?.content ?? [];

  const tabCounts = useMemo(
    () =>
      TAB_DEFS.map((t) => ({
        ...t,
        count: content.filter((a) => !t.statuses || t.statuses.includes(a.status)).length,
      })),
    [content]
  );

  const visible = useMemo(() => {
    const def = TAB_DEFS.find((t) => t.key === tab) ?? TAB_DEFS[0];
    const q = query.trim().toLowerCase();
    return content.filter((a) => {
      const inTab = !def.statuses || def.statuses.includes(a.status);
      const inQuery =
        !q ||
        a.companyName.toLowerCase().includes(q) ||
        a.jobTitle.toLowerCase().includes(q);
      return inTab && inQuery;
    });
  }, [content, tab, query]);

  // Next Interview tile: earliest upcoming booked slot among loaded applications.
  const nextInterview = useMemo(() => {
    const now = Date.now();
    const upcoming = content
      .filter((a) => a.slot && new Date(a.slot.startTime).getTime() >= now)
      .sort(
        (a, b) =>
          new Date(a.slot!.startTime).getTime() - new Date(b.slot!.startTime).getTime()
      );
    return upcoming[0] ?? null;
  }, [content]);

  if (!user || user.role !== 'ROLE_USER') {
    return (
      <Card className="text-body-md text-ink-variant">
        Please sign in with a candidate account.
      </Card>
    );
  }
  if (loading && !applications) return <LoadingState />;

  const total = applications?.totalElements ?? 0;
  const size = applications?.size ?? 10;
  const showingFrom = total === 0 ? 0 : page * size + 1;
  const showingTo = Math.min((page + 1) * size, total);

  const renderActions = (app: Application, compact = false) => (
    <div className="flex items-center gap-2">
      {app.status === 'PENDING' && (
        <button
          className={buttonClass('primary', compact ? 'h-8 px-2 text-label-sm' : '')}
          onClick={() => openBooking(app)}
        >
          Book Interview
        </button>
      )}
      {(app.status === 'PENDING' || app.status === 'SCHEDULED') && (
        <button
          className={`inline-flex items-center justify-center rounded-md font-medium text-error transition-colors hover:bg-danger-bg ${
            compact ? 'h-8 px-2 text-label-sm' : 'h-9 px-3 text-label-md'
          }`}
          onClick={() => withdraw(app)}
        >
          Withdraw Application
        </button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-6 pb-16">
      {/* Section header — mockup description (Export Dossier / Track External Job
          omitted: no handler or endpoint backs them). */}
      <div className="flex flex-col justify-between gap-3 pt-2 md:flex-row md:items-end">
        <p className="m-0 max-w-xl text-body-md text-ink-variant">
          Track your job applications, interview schedules, and upcoming assessments all in one place.
        </p>
      </div>

      {profile && !profile.cvFileName && (
        <div className="rounded-md border border-[#e2e8f0] bg-surface-low px-3 py-2.5 text-body-md text-ink-variant">
          Your profile is incomplete (skills, CV). Update it on your{' '}
          <Link to="/my-profile" className="text-primary no-underline hover:underline">profile page</Link>{' '}
          so employers can find you.
        </div>
      )}
      {successMsg && (
        <div className="flex items-start gap-2 rounded-lg bg-success-bg px-3 py-2.5 text-body-sm text-success-text" role="status">
          <span className="material-symbols-outlined shrink-0 text-[18px]">check_circle</span>
          <span>{successMsg}</span>
        </div>
      )}
      <ErrorBanner message={error} />

      {!applications || content.length === 0 ? (
        <EmptyState
          icon="description"
          title="No applications yet."
          action={
            <button className={buttonClass('primary')} onClick={() => navigate('/jobs')}>
              Browse Job Board
            </button>
          }
        />
      ) : (
        <>
          {/* Summary metric tiles — only tiles backed by real fields are kept
              (AI Screening Pass and Active Offers omitted: no pass-rate,
              mean-rubric, offer-expiry or salary fields on Application). */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className={TILE_CLASS}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-label-sm font-semibold uppercase tracking-wider text-ink-variant">
                  Total Submitted
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-mid text-secondary">
                  <span className="material-symbols-outlined text-[18px]">send</span>
                </span>
              </div>
              <span className="text-metric-stat text-ink">{total}</span>
            </div>
            <div className={TILE_CLASS}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-label-sm font-semibold uppercase tracking-wider text-ink-variant">
                  Next Interview
                </span>
                {nextInterview && (
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-secondary" />
                )}
              </div>
              {nextInterview && nextInterview.slot ? (
                <div className="flex flex-col gap-1">
                  <span className="truncate text-headline-sm text-ink">
                    {fmtDateTime(nextInterview.slot.startTime)}
                  </span>
                  <span className="flex items-center gap-1 text-label-sm font-semibold text-secondary">
                    <span className="material-symbols-outlined text-[14px]">corporate_fare</span>
                    {nextInterview.companyName} • {nextInterview.jobTitle}
                  </span>
                </div>
              ) : (
                <span className="text-headline-sm text-outline-strong">—</span>
              )}
            </div>
          </div>

          {/* Filter control bar: status tabs + search + card/table toggle
              (client-side over the loaded page only). */}
          <div className="flex flex-col items-stretch justify-between gap-3 rounded-lg bg-card p-2 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] lg:flex-row lg:items-center">
            <div className="flex items-center gap-1 overflow-x-auto rounded-lg bg-surface-low p-1">
              {tabCounts.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`${TAB_BASE} ${
                    tab === t.key
                      ? 'bg-card font-semibold text-ink shadow-sm'
                      : 'text-ink-variant hover:text-ink'
                  }`}
                >
                  {t.label}
                  <span className="ml-1 font-mono text-[12px] text-outline-strong">{t.count}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between gap-2 lg:justify-end">
              <div className="relative w-full lg:w-72">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline-strong">
                  filter_list
                </span>
                <input
                  className={`${inputClass} rounded-lg bg-surface-low pl-9`}
                  placeholder="Filter company, role, or tech..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Filter company, role, or tech"
                />
              </div>
              <div className="flex items-center rounded-lg bg-surface-low p-1">
                <button
                  type="button"
                  title="Card View"
                  onClick={() => setView('cards')}
                  className={`rounded-md p-1.5 transition-all ${
                    view === 'cards'
                      ? 'bg-card text-ink shadow-sm'
                      : 'text-ink-variant hover:text-ink'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">view_agenda</span>
                </button>
                <button
                  type="button"
                  title="Dense Table View"
                  onClick={() => setView('table')}
                  className={`rounded-md p-1.5 transition-all ${
                    view === 'table'
                      ? 'bg-card text-ink shadow-sm'
                      : 'text-ink-variant hover:text-ink'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">table_rows</span>
                </button>
              </div>
            </div>
          </div>

          {visible.length === 0 ? (
            <EmptyState icon="filter_list" title="No applications match the filter." />
          ) : view === 'cards' ? (
            /* Cards view */
            <div className="flex flex-col gap-4">
              {visible.map((app) => (
                <div
                  key={app.id}
                  className="relative overflow-hidden rounded-lg bg-card p-4 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] transition-shadow hover:shadow-proof"
                >
                  <div className={`absolute left-0 top-0 h-full w-1.5 ${ACCENT[app.status]}`} />
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-start gap-3">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-high text-headline-md font-bold text-primary">
                        {app.companyName.charAt(0).toUpperCase()}
                      </span>
                      <div className="flex min-w-0 flex-col">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="m-0 text-headline-lg text-ink">{app.companyName}</h2>
                          <span className="text-headline-sm text-outline-strong">•</span>
                          <span className="text-headline-md font-medium text-ink-variant">
                            {app.jobTitle}
                          </span>
                          <StatusBadge status={app.status} label={statusText(app.status)} />
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-body-sm text-outline-strong">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">schedule</span>
                            Applied {fmtDateTime(app.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-start md:self-auto">
                      {app.score != null && (
                        <span className={CODE_CHIP}>Score: {app.score}/100</span>
                      )}
                    </div>
                  </div>

                  {app.slot && (
                    <div className="mt-3 flex flex-col gap-1 rounded-lg bg-surface-low p-3">
                      <span className="flex items-center gap-1 text-label-md font-semibold text-ink">
                        <span className="material-symbols-outlined text-[16px] text-secondary">
                          event_available
                        </span>
                        Interview
                      </span>
                      <span className="w-fit rounded bg-surface-high px-1.5 py-0.5 font-mono text-[12px] text-ink">
                        {fmtDateTime(app.slot.startTime)} — {new Date(app.slot.endTime).toLocaleTimeString('vi-VN')}
                      </span>
                    </div>
                  )}

                  {app.feedback && (
                    <p className="mt-3 mb-0 text-body-sm text-ink-variant">{app.feedback}</p>
                  )}

                  <div className="mt-3 flex flex-col items-stretch justify-between gap-3 pt-1 sm:flex-row sm:items-center">
                    {profile?.cvFileName ? (
                      <span className="text-body-sm text-outline-strong">
                        Resume uploaded: <span className="font-mono text-[12px] text-ink">{profile.cvFileName}</span>
                      </span>
                    ) : (
                      <span />
                    )}
                    {renderActions(app)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Dense table view — header 32px / row 40px via thClass/tdClass */
            <div className="overflow-x-auto rounded-lg border border-[#e2e8f0] bg-card">
              <table className={tableClass}>
                <thead>
                  <tr>
                    <th className={thClass}>Company &amp; Role</th>
                    <th className={thClass}>Stage</th>
                    <th className={thClass}>AI Screening</th>
                    <th className={thClass}>Applied Date</th>
                    <th className={thClass}>Next Action</th>
                    <th className={thClass}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((app) => (
                    <tr key={app.id} className="transition-colors hover:bg-surface-low">
                      <td className={tdClass}>
                        <div className="flex flex-col">
                          <span className="text-headline-sm font-semibold text-ink">{app.companyName}</span>
                          <span className="text-body-sm text-outline-strong">{app.jobTitle}</span>
                        </div>
                      </td>
                      <td className={tdClass}>
                        <StatusBadge status={app.status} label={statusText(app.status)} />
                      </td>
                      <td className={tdClass}>
                        {app.score != null ? (
                          <span className="rounded bg-surface-mid px-2 py-0.5 font-mono text-[12px] text-ink">
                            {app.score} / 100
                          </span>
                        ) : (
                          <span className="text-outline-strong">—</span>
                        )}
                      </td>
                      <td className={`${tdClass} font-mono text-[12px] text-outline-strong`}>
                        {fmtDateTime(app.createdAt)}
                      </td>
                      <td className={`${tdClass} text-body-sm font-medium text-secondary`}>
                        {app.slot ? fmtDateTime(app.slot.startTime) : '—'}
                      </td>
                      <td className={tdClass}>{renderActions(app, true)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination & results count bar */}
          {applications.totalPages > 1 && (
            <div className="flex flex-col items-center justify-between gap-3 rounded-lg bg-card p-3 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] sm:flex-row">
              <span className="text-body-sm text-ink-variant">
                Showing <strong className="text-ink">{showingFrom}-{showingTo}</strong> of{' '}
                <strong className="text-ink">{total}</strong> applications
              </span>
              <div className="flex items-center gap-1">
                {Array.from({ length: applications.totalPages }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { setPage(i); fetchMyApplications(i); }}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-label-md transition-all ${
                      i === page
                        ? 'bg-primary font-semibold text-on-primary'
                        : 'text-ink-variant hover:bg-surface-low hover:text-ink'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {bookingApp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[80vh] w-[480px] flex-col overflow-y-auto rounded-lg bg-card p-6 shadow-card">
            <h3 className="m-0 text-headline-md text-ink">Select Interview Time — {bookingApp.jobTitle}</h3>
            <div className="mt-4 flex flex-col gap-2">
              {availableSlots.length === 0 ? (
                <p className="m-0 text-body-md text-ink-variant">No available time slots yet. Please check back later.</p>
              ) : (
                availableSlots.map((s) => (
                  <label
                    key={s.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-body-md transition-colors ${
                      selectedSlot === s.id ? 'border-primary bg-info text-primary' : 'border-[#e2e8f0] hover:bg-surface-low'
                    }`}
                  >
                    <input
                      type="radio"
                      name="slot"
                      checked={selectedSlot === s.id}
                      onChange={() => setSelectedSlot(s.id)}
                      className="mr-1"
                    />
                    {new Date(s.startTime).toLocaleString('vi-VN')} — {new Date(s.endTime).toLocaleTimeString('vi-VN')}
                  </label>
                ))
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className={buttonClass('secondary')} onClick={() => setBookingApp(null)}>
                Close
              </button>
              {availableSlots.length > 0 && (
                <button className={buttonClass('primary')} onClick={confirmBooking} disabled={!selectedSlot}>
                  Confirm and Schedule
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyApplicationsPage;
