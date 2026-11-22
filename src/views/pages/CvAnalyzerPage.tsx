/**
 * Màn "Phân tích CV bằng AI" cho ứng viên (route /cv-analyzer, shell CandidateLayout).
 *
 * Nối thật API ScanCV: POST /cv/upload (PDF/.txt ≤ 10MB),
 * GET /cv (CV mới nhất), PUT /cv/position (vị trí + level mục tiêu), GET /cv/skills.
 * Khi chưa có CV, GET /cv trả CvParseResponse rỗng (cvId null) — màn hiển thị trạng thái
 * "Chưa có CV" thay vì khối kết quả.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCvController } from '../../controllers/useCvController';
import { useAuth } from '../../context/AuthContext';
import { PROFICIENCY_LABELS, ProficiencyLevel } from '../../models/Cv.model';
import { adminButton, adminInputClass } from '../components/adminKit';
import { CARD, CandidatePageHeader, ICON, SOFT } from '../components/candidateKit';

const CV_MAX_BYTES = 10 * 1024 * 1024;
const LEVEL_OPTIONS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

const label2 = 'text-ds-label-md text-slate-900';
const note = 'text-ds-body-sm text-slate-400';

const SectionHead: React.FC<{ icon: string; iconClass: string; title: string; right?: React.ReactNode }> = ({
  icon, iconClass, title, right,
}) => (
  <div className="flex flex-wrap items-center justify-between gap-space-sm border-b border-surface-container-high pb-space-sm">
    <div className="flex items-center gap-space-sm">
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconClass}`}>
        <span className={`${ICON} text-[18px]`}>{icon}</span>
      </span>
      <h2 className="text-ds-headline-md text-slate-900">{title}</h2>
    </div>
    {right}
  </div>
);

const Chip: React.FC<{ children: React.ReactNode; tone?: 'neutral' | 'teal' | 'danger' }> = ({ children, tone = 'neutral' }) => {
  const tones = {
    neutral: 'bg-slate-200 text-slate-900',
    teal: 'bg-teal-100/40 text-teal-700',
    danger: 'bg-red-100/50 text-error',
  };
  return <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-ds-label-md ${tones[tone]}`}>{children}</span>;
};

const skillLabel = (name: string, proficiency: ProficiencyLevel, years: number | null) =>
  `${name}${years != null ? ` · ${years} năm` : ''} (${PROFICIENCY_LABELS[proficiency] ?? proficiency})`;

const CvAnalyzerPage = () => {
  const { user } = useAuth();
  const {
    cv, cvSkills, loading, error, successMsg,
    fetchMyCv, fetchMySkills, uploadCv, updateTargetPosition, clearMessages,
  } = useCvController();

  const [file, setFile] = useState<File | null>(null);
  const [fileMsg, setFileMsg] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const [position, setPosition] = useState('');
  const [level, setLevel] = useState('INTERMEDIATE');
  const [savingPosition, setSavingPosition] = useState(false);

  useEffect(() => {
    if (user?.role === 'ROLE_USER') {
      void fetchMyCv();
      void fetchMySkills();
    }
  }, [fetchMyCv, fetchMySkills, user]);

  useEffect(() => {
    if (cv?.targetPosition) setPosition(cv.targetPosition);
    if (cv?.targetLevel) setLevel(cv.targetLevel);
  }, [cv?.targetPosition, cv?.targetLevel]);

  const positionOptions = useMemo(() => {
    const fromCv = [
      ...(cv?.suggestedPositions ?? []),
      ...(cv?.recommendedPositions ?? []).map((p) => p.title),
      cv?.targetPosition,
    ].filter((v): v is string => Boolean(v && v.trim()));
    return Array.from(new Set(fromCv));
  }, [cv]);

  const levelOptions = useMemo(() => {
    const levels = [...LEVEL_OPTIONS];
    if (cv?.targetLevel && !levels.includes(cv.targetLevel)) levels.push(cv.targetLevel);
    return levels;
  }, [cv?.targetLevel]);

  const refreshSkills = useCallback(async () => {
    await fetchMySkills();
  }, [fetchMySkills]);

  const onPickFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0];
    event.target.value = '';
    if (!picked) return;
    const name = picked.name.toLowerCase();
    if (!name.endsWith('.pdf') && !name.endsWith('.txt')) {
      setFile(null);
      setFileMsg('Chỉ nhận file PDF hoặc .txt.');
      return;
    }
    if (picked.size > CV_MAX_BYTES) {
      setFile(null);
      setFileMsg('File vượt quá giới hạn 10MB.');
      return;
    }
    setFile(picked);
    setFileMsg('');
  };

  const handleUpload = async () => {
    if (!file) return;
    clearMessages();
    const result = await uploadCv(file);
    if (result) await refreshSkills();
  };

  const handleSavePosition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!position.trim() || savingPosition) return;
    setSavingPosition(true);
    await updateTargetPosition(position.trim(), level);
    setSavingPosition(false);
  };

  if (!user || user.role !== 'ROLE_USER') {
    return (
      <div className={`${CARD} p-space-lg text-ds-body-md text-slate-600`}>
        Vui lòng đăng nhập bằng tài khoản ứng viên.
      </div>
    );
  }

  const hasCv = Boolean(cv?.cvId);

  return (
    <div className="flex flex-col gap-space-xl">
      <CandidatePageHeader
        crumbs={[{ label: 'Trang chủ', to: '/dashboard' }, { label: 'Phân tích CV' }]}
        title="Phân tích CV bằng AI"
        subtitle="Tải file CV (PDF/.txt) — AI trích xuất kỹ năng, kinh nghiệm, học vấn và gợi ý vị trí phù hợp để xây lộ trình ôn tập."
        actions={
          <Link to="/study" className={adminButton('ghost', 'h-10 no-underline')}>
            <span className={`${ICON} text-[18px] text-primary`}>school</span>
            Lộ trình ôn tập
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

      <div className="grid grid-cols-1 items-start gap-gutter lg:grid-cols-2">
        {/* Nhập CV: tải file */}
        <section className={`${CARD} flex flex-col gap-space-lg p-space-lg`}>
          <SectionHead icon="upload_file" iconClass="bg-primary/10 text-primary" title="Tải file CV lên" />
          <div className="flex flex-col gap-space-sm">
            <input
              ref={fileInput}
              type="file"
              accept=".pdf,.txt,application/pdf,text/plain"
              className="hidden"
              onChange={onPickFile}
            />
            <div className="flex flex-wrap items-center gap-space-sm">
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className={adminButton('ghost', 'h-10')}
              >
                <span className={`${ICON} text-[18px] text-primary`}>attach_file</span>
                Chọn file
              </button>
              <span className={`min-w-0 flex-1 truncate text-ds-body-md ${file ? 'text-slate-900' : 'text-slate-400'}`}>
                {file ? file.name : 'Chưa chọn file nào'}
              </span>
            </div>
            <span className={note}>File PDF có lớp chữ hoặc .txt, tối đa 10MB.</span>
            {fileMsg && <span className="text-ds-body-sm text-error">{fileMsg}</span>}
            <button
              type="button"
              className={adminButton('primary', 'h-10 self-start')}
              disabled={!file || loading}
              onClick={handleUpload}
            >
              <span className={`${ICON} text-[18px]`}>{loading ? 'progress_activity' : 'document_scanner'}</span>
              {loading ? 'Đang phân tích...' : 'Phân tích file'}
            </button>
          </div>
        </section>

        {/* Kết quả phân tích */}
        {hasCv ? (
          <div className="flex flex-col gap-space-lg">
            <section className={`${CARD} flex flex-col gap-space-md p-space-lg`}>
              <SectionHead
                icon="document_scanner"
                iconClass="bg-primary/10 text-primary"
                title="Kết quả phân tích"
                right={<Chip tone="teal">{cv!.fileName || `CV #${cv!.cvId}`}</Chip>}
              />

              <div className="flex flex-col gap-space-xs">
                <span className="text-ds-label-sm uppercase tracking-wider text-slate-600">Kỹ năng ({cv!.skills.length})</span>
                {cv!.skills.length === 0 ? (
                  <span className={note}>Chưa phát hiện kỹ năng nào.</span>
                ) : (
                  <div className="flex flex-wrap gap-space-xs">
                    {cv!.skills.map((s) => (
                      <Chip key={s.name}>{skillLabel(s.name, s.proficiency, s.years)}</Chip>
                    ))}
                  </div>
                )}
              </div>

              {cv!.experience.length > 0 && (
                <div className="flex flex-col gap-space-xs">
                  <span className="text-ds-label-sm uppercase tracking-wider text-slate-600">Kinh nghiệm</span>
                  <div className="flex flex-col gap-space-sm">
                    {cv!.experience.map((exp, i) => (
                      <div key={i} className={`flex flex-col gap-1 rounded-lg p-space-md ${SOFT}`}>
                        <span className="text-ds-headline-sm font-semibold text-slate-900">{exp.role}</span>
                        <span className="text-ds-label-md text-slate-600">
                          {[exp.company, exp.duration].filter(Boolean).join(' • ')}
                        </span>
                        {exp.achievements.length > 0 && (
                          <ul className="m-0 list-disc pl-5 text-ds-body-sm text-slate-600">
                            {exp.achievements.map((a, j) => (
                              <li key={j} className="mb-0.5">{a}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {cv!.education.length > 0 && (
                <div className="flex flex-col gap-space-xs">
                  <span className="text-ds-label-sm uppercase tracking-wider text-slate-600">Học vấn</span>
                  <div className="flex flex-col gap-space-sm">
                    {cv!.education.map((edu, i) => (
                      <div key={i} className={`flex flex-col gap-0.5 rounded-lg p-space-md ${SOFT}`}>
                        <span className="text-ds-headline-sm font-semibold text-slate-900">{edu.degree}</span>
                        <span className="text-ds-body-sm text-slate-600">
                          {[edu.institution, edu.year].filter(Boolean).join(' • ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {cv!.suggestedPositions.length > 0 && (
                <div className="flex flex-col gap-space-xs">
                  <span className="text-ds-label-sm uppercase tracking-wider text-slate-600">Vị trí gợi ý</span>
                  <div className="flex flex-wrap gap-space-xs">
                    {cv!.suggestedPositions.map((p) => (
                      <Chip key={p}>{p}</Chip>
                    ))}
                  </div>
                </div>
              )}

              {cv!.knowledgeGaps.length > 0 && (
                <div className="flex flex-col gap-space-xs">
                  <span className="text-ds-label-sm uppercase tracking-wider text-slate-600">Lỗ hổng kiến thức</span>
                  <ul className="m-0 list-disc pl-5 text-ds-body-sm text-slate-600">
                    {cv!.knowledgeGaps.map((gap, i) => (
                      <li key={i} className="mb-0.5">{gap}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            {cv!.recommendedPositions.length > 0 && (
              <section className={`${CARD} flex flex-col gap-space-md p-space-lg`}>
                <SectionHead
                  icon="work"
                  iconClass="bg-tertiary-fixed text-on-tertiary-fixed"
                  title={`Vị trí đề xuất (${cv!.recommendedPositions.length})`}
                />
                <div className="flex flex-col gap-space-md">
                  {cv!.recommendedPositions.map((rec) => (
                    <div key={rec.positionId} className={`flex flex-col gap-space-sm rounded-xl p-space-md ${SOFT}`}>
                      <div className="flex flex-wrap items-center justify-between gap-space-xs">
                        <span className="text-ds-headline-sm font-semibold text-slate-900">
                          {rec.title}
                          {rec.level && <span className="ml-2 text-ds-label-md font-normal text-slate-600">{rec.level}</span>}
                        </span>
                        <span className="text-ds-headline-sm font-bold text-primary tabular-nums">{rec.matchPercentage}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.max(0, Math.min(100, rec.matchPercentage))}%` }}
                        />
                      </div>
                      <span className="text-ds-body-sm text-slate-600">
                        Khớp {rec.matchedSkillCount}/{rec.requiredSkillCount} kỹ năng yêu cầu
                      </span>
                      {rec.matchedSkills.length > 0 && (
                        <div className="flex flex-wrap items-center gap-space-xs">
                          <span className="text-ds-body-sm text-slate-600">Đã có:</span>
                          {rec.matchedSkills.map((s) => (
                            <Chip key={s} tone="teal">{s}</Chip>
                          ))}
                        </div>
                      )}
                      {rec.missingSkills.length > 0 && (
                        <div className="flex flex-wrap items-center gap-space-xs">
                          <span className="text-ds-body-sm text-slate-600">Còn thiếu:</span>
                          {rec.missingSkills.map((s) => (
                            <Chip key={s} tone="danger">{s}</Chip>
                          ))}
                        </div>
                      )}
                      {rec.description && <span className="text-ds-body-sm text-slate-600">{rec.description}</span>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className={`${CARD} flex flex-col gap-space-md p-space-lg`}>
              <SectionHead
                icon="flag"
                iconClass="bg-primary-fixed text-on-primary-fixed"
                title="Vị trí mục tiêu"
                right={cv!.targetPosition ? <Chip>{cv!.targetPosition}{cv!.targetLevel ? ` · ${cv!.targetLevel}` : ''}</Chip> : undefined}
              />
              <form onSubmit={handleSavePosition} className="flex flex-col gap-space-sm sm:flex-row sm:items-end">
                <div className="flex min-w-0 flex-1 flex-col gap-space-xs">
                  <label className={label2} htmlFor="target-position">Vị trí mục tiêu</label>
                  <input
                    id="target-position"
                    className={adminInputClass}
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="VD: Backend Developer"
                    list="target-position-options"
                    required
                  />
                  <datalist id="target-position-options">
                    {positionOptions.map((p) => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                </div>
                <div className="flex flex-col gap-space-xs sm:w-44">
                  <label className={label2} htmlFor="target-level">Cấp độ</label>
                  <select
                    id="target-level"
                    className={adminInputClass}
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                  >
                    {levelOptions.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className={adminButton('primary', 'h-10')} disabled={savingPosition || !position.trim()}>
                  <span className={`${ICON} text-[18px]`}>{savingPosition ? 'progress_activity' : 'save'}</span>
                  Lưu
                </button>
              </form>
            </section>
          </div>
        ) : (
          <div className={`${CARD} flex flex-col items-center gap-space-md p-space-xl text-center`}>
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-primary">
              <span className={`${ICON} text-[28px]`}>description</span>
            </span>
            <div className="flex flex-col gap-1">
              <span className="text-ds-headline-sm font-semibold text-slate-900">Chưa có CV nào</span>
              <span className={note}>
                Tải file CV ở cột bên trái — kết quả phân tích sẽ hiển thị tại đây.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Kỹ năng đã lưu từ CV (GET /api/v1/cv/skills) */}
      <section className={`${CARD} flex flex-col gap-space-md p-space-lg`}>
        <SectionHead
          icon="psychology"
          iconClass="bg-teal-600/10 text-teal-600"
          title="Kỹ năng đã lưu"
          right={
            <span className="rounded-full bg-slate-200 px-2.5 py-1 text-ds-label-sm font-semibold text-slate-900 tabular-nums">
              {cvSkills.length} kỹ năng
            </span>
          }
        />
        {cvSkills.length === 0 ? (
          <span className={note}>
            Chưa có kỹ năng nào được lưu. Kỹ năng sẽ xuất hiện ở đây sau khi CV được phân tích.
          </span>
        ) : (
          <div className="flex flex-wrap gap-space-xs">
            {cvSkills.map((s) => (
              <Chip key={s.id}>{skillLabel(s.name, s.proficiency, s.years)}</Chip>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default CvAnalyzerPage;
