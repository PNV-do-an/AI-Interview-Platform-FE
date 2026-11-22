/**
 * Màn "Lộ trình ôn tập" cho ứng viên (route /study, shell CandidateLayout).
 *
 * Nối thật API Study Program: POST /study/generate (cần đã có CV, BE 400 nếu chưa),
 * GET /study/programs (danh sách chương trình của user). Chi tiết chương trình + chủ đề +
 * câu hỏi nằm ở StudyProgramDetailPage (/study/:id).
 */
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStudyController } from '../../controllers/useStudyController';
import { useAuth } from '../../context/AuthContext';
import {
  DIFFICULTY_LABELS,
  PROGRAM_STATUS_LABELS,
  PROGRAM_TYPE_LABELS,
  ProgramType,
} from '../../models/Study.model';
import { adminButton, adminInputClass, fmtServer } from '../components/adminKit';
import { CARD, CandidatePageHeader, ICON, SOFT } from '../components/candidateKit';

const label2 = 'text-ds-label-md text-slate-900';
const note = 'text-ds-body-sm text-slate-400';

const STATUS_TONE: Record<string, string> = {
  ACTIVE: 'bg-teal-100/40 text-teal-600',
  COMPLETED: 'bg-indigo-600 text-on-primary',
  ARCHIVED: 'bg-slate-200 text-slate-600',
};

const StudyProgramsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { programs, loading, error, successMsg, generateProgram, fetchPrograms, clearMessages } =
    useStudyController();

  const [programType, setProgramType] = useState<ProgramType>('STUDY');
  const [targetPosition, setTargetPosition] = useState('');
  const [questionsPerTopic, setQuestionsPerTopic] = useState('10');

  useEffect(() => {
    if (user?.role === 'ROLE_USER') void fetchPrograms();
  }, [fetchPrograms, user]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const count = Math.max(1, Math.min(50, Number(questionsPerTopic) || 10));
    clearMessages();
    const created = await generateProgram({
      programType,
      targetPosition: targetPosition.trim() || undefined,
      questionsPerTopic: count,
    });
    if (created) navigate(`/study/${created.id}`);
  };

  if (!user || user.role !== 'ROLE_USER') {
    return (
      <div className={`${CARD} p-space-lg text-ds-body-md text-slate-600`}>
        Vui lòng đăng nhập bằng tài khoản ứng viên.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-space-xl">
      <CandidatePageHeader
        crumbs={[{ label: 'Trang chủ', to: '/dashboard' }, { label: 'Lộ trình ôn tập' }]}
        title="Lộ trình ôn tập"
        subtitle="Tạo chương trình ôn tập kiến thức hoặc luyện phỏng vấn dựa trên CV — hệ thống chia chủ đề theo lỗ hổng kỹ năng và chấm từng câu trả lời."
        actions={
          <Link to="/cv-analyzer" className={adminButton('ghost', 'h-10 no-underline')}>
            <span className={`${ICON} text-[18px] text-primary`}>document_scanner</span>
            Phân tích CV
          </Link>
        }
      />

      {successMsg && (
        <p role="status" className="m-0 flex items-center gap-2 rounded-lg bg-teal-100/50 px-4 py-3 text-ds-body-md text-teal-700">
          <span className={`${ICON} text-[18px]`}>check_circle</span>
          {successMsg}
        </p>
      )}
      {error && (
        <p role="alert" className="m-0 flex items-center gap-2 rounded-lg bg-red-100 px-4 py-3 text-ds-body-md text-red-700">
          <span className={`${ICON} text-[18px]`}>error</span>
          {error}
        </p>
      )}

      <section className={`${CARD} flex flex-col gap-space-lg p-space-lg`}>
        <div className="flex flex-wrap items-center justify-between gap-space-sm border-b border-surface-container-high pb-space-sm">
          <div className="flex items-center gap-space-sm">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <span className={`${ICON} text-[18px]`}>auto_stories</span>
            </span>
            <h2 className="text-ds-headline-md text-slate-900">Tạo chương trình mới</h2>
          </div>
        </div>

        <form onSubmit={handleGenerate} className="grid grid-cols-1 items-end gap-space-md md:grid-cols-4">
          <div className="flex flex-col gap-space-xs md:col-span-2">
            <label className={label2} htmlFor="program-type">Loại chương trình</label>
            <select
              id="program-type"
              className={adminInputClass}
              value={programType}
              onChange={(e) => setProgramType(e.target.value as ProgramType)}
            >
              <option value="STUDY">{PROGRAM_TYPE_LABELS.STUDY}</option>
              <option value="INTERVIEW_PREP">{PROGRAM_TYPE_LABELS.INTERVIEW_PREP}</option>
            </select>
            <span className={note}>Chương trình dựa trên CV đã phân tích; chưa có CV thì hệ thống sẽ báo lỗi.</span>
          </div>
          <div className="flex flex-col gap-space-xs">
            <label className={label2} htmlFor="target-position">Vị trí mục tiêu (tùy chọn)</label>
            <input
              id="target-position"
              className={adminInputClass}
              value={targetPosition}
              onChange={(e) => setTargetPosition(e.target.value)}
              placeholder="VD: Backend Developer"
            />
          </div>
          <div className="flex flex-col gap-space-xs">
            <label className={label2} htmlFor="questions-count">Số câu mỗi chủ đề</label>
            <input
              id="questions-count"
              className={adminInputClass}
              type="number"
              min={1}
              max={50}
              value={questionsPerTopic}
              onChange={(e) => setQuestionsPerTopic(e.target.value)}
            />
            <span className={note}>Từ 1 đến 50, mặc định 10.</span>
          </div>
          <div className="md:col-span-4">
            <button type="submit" className={adminButton('primary', 'h-10')} disabled={loading}>
              <span className={`${ICON} text-[18px]`}>{loading ? 'progress_activity' : 'add'}</span>
              {loading ? 'Đang tạo...' : 'Tạo chương trình'}
            </button>
          </div>
        </form>
      </section>

      <section className={`${CARD} flex flex-col gap-space-md p-space-lg`}>
        <div className="flex flex-wrap items-center justify-between gap-space-sm border-b border-surface-container-high pb-space-sm">
          <div className="flex items-center gap-space-sm">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-600/10 text-teal-600">
              <span className={`${ICON} text-[18px]`}>list_alt</span>
            </span>
            <h2 className="text-ds-headline-md text-slate-900">Chương trình của bạn</h2>
          </div>
          <span className="rounded-full bg-slate-200 px-2.5 py-1 text-ds-label-sm font-semibold text-slate-900 tabular-nums">
            {programs.length} chương trình
          </span>
        </div>

        {programs.length === 0 ? (
          <div className="flex flex-col items-center gap-space-md py-space-lg text-center">
            <span className={`${ICON} text-[32px] text-slate-400`}>menu_book</span>
            <div className="flex flex-col gap-1">
              <span className="text-ds-headline-sm font-semibold text-slate-900">Chưa có chương trình nào</span>
              <span className={note}>
                Phân tích CV trước rồi quay lại tạo chương trình ôn tập.
              </span>
            </div>
            <Link to="/cv-analyzer" className={adminButton('soft', 'h-9 no-underline')}>
              <span className={`${ICON} text-[18px] text-primary`}>document_scanner</span>
              Đi phân tích CV
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-space-sm">
            {programs.map((p) => {
              const done = Math.max(0, Math.min(100, p.totalTopics > 0 ? Math.round((p.completedTopics / p.totalTopics) * 100) : 0));
              return (
                <Link
                  key={p.id}
                  to={`/study/${p.id}`}
                  className={`${SOFT} flex flex-col gap-space-sm rounded-xl p-space-md no-underline transition-colors hover:bg-slate-200`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-space-xs">
                    <span className="min-w-0 flex-1 truncate text-ds-headline-sm font-semibold text-slate-900">{p.title}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-ds-label-sm font-bold ${STATUS_TONE[p.status] ?? STATUS_TONE.ACTIVE}`}>
                      {PROGRAM_STATUS_LABELS[p.status] ?? p.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-space-xs text-ds-label-md text-slate-600">
                    <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-ds-label-sm text-slate-900">
                      {PROGRAM_TYPE_LABELS[p.programType] ?? p.programType}
                    </span>
                    {p.targetPosition && <span>Vị trí: {p.targetPosition}</span>}
                    {p.difficultyLevel && <span>Độ khó: {DIFFICULTY_LABELS[p.difficultyLevel] ?? p.difficultyLevel}</span>}
                    <span className="ml-auto">{fmtServer(p.createdAt, 'date')}</span>
                  </div>
                  <div className="flex items-center gap-space-sm">
                    <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-teal-600" style={{ width: `${done}%` }} />
                    </div>
                    <span className="text-ds-body-sm text-slate-600 tabular-nums">
                      {p.completedTopics}/{p.totalTopics} chủ đề
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default StudyProgramsPage;
