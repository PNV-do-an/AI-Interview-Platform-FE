import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminButton, adminInputClass } from '../components/adminKit';
import { CARD, CandidatePageHeader, ICON } from '../components/candidateKit';
import './CvBuilderPage.css';

interface Experience {
  id: string;
  role: string;
  company: string;
  period: string;
  details: string;
}

interface Education {
  id: string;
  degree: string;
  school: string;
  period: string;
}

const createId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const Field: React.FC<{
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}> = ({ id, label, value, onChange, placeholder, type = 'text' }) => (
  <label className="flex min-w-0 flex-col gap-2 text-xs font-semibold text-[#514957]" htmlFor={id}>
    {label}
    <input
      id={id}
      type={type}
      className={`${adminInputClass} min-h-11 bg-[#fffdf7]`}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
    />
  </label>
);

const SectionTitle: React.FC<{ number: string; title: string; description: string }> = ({ number, title, description }) => (
  <div className="flex items-start gap-3 border-b border-[#d9d0c3] pb-4">
    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#e9dff0] font-mono text-xs font-bold text-[#604273]">{number}</span>
    <div>
      <h2 className="m-0 text-sm font-bold text-[#28212e]">{title}</h2>
      <p className="m-0 mt-1 text-xs leading-5 text-[#6f6675]">{description}</p>
    </div>
  </div>
);

const CvBuilderPage: React.FC = () => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [title, setTitle] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [summary, setSummary] = useState('');
  const [skills, setSkills] = useState('');
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);

  const completion = useMemo(() => {
    const checks = [name, email, title, summary, skills, experiences.some((item) => item.role || item.company), education.some((item) => item.degree || item.school)];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [education, email, experiences, name, skills, summary, title]);

  const updateExperience = (id: string, field: keyof Omit<Experience, 'id'>, value: string) => {
    setExperiences((current) => current.map((item) => item.id === id ? { ...item, [field]: value } : item));
  };

  const updateEducation = (id: string, field: keyof Omit<Education, 'id'>, value: string) => {
    setEducation((current) => current.map((item) => item.id === id ? { ...item, [field]: value } : item));
  };

  const addExperience = () => setExperiences((current) => [...current, { id: createId(), role: '', company: '', period: '', details: '' }]);
  const addEducation = () => setEducation((current) => [...current, { id: createId(), degree: '', school: '', period: '' }]);
  const printCv = () => window.print();

  return (
    <div className="cv-builder-page flex flex-col gap-7">
      <CandidatePageHeader
        crumbs={[{ label: 'Trang chủ', to: '/dashboard' }, { label: 'Tạo CV' }]}
        title="Tạo CV của bạn"
        subtitle="Điền thông tin, xem bản xem trước cập nhật tức thì và in hoặc lưu thành PDF khi đã sẵn sàng."
        status={(
          <span className="inline-flex items-center gap-2 rounded-full bg-[#e7f4b7] px-3 py-2 text-xs font-semibold text-[#39431b]">
            <span className="size-2 rounded-full bg-[#604273]" aria-hidden="true" />
            Bản nháp · hoàn thiện {completion}%
          </span>
        )}
        actions={(
          <button type="button" onClick={printCv} className={adminButton('primary', 'h-11')}>
            <span className={`${ICON} text-[18px]`} aria-hidden="true">print</span>
            In / lưu PDF
          </button>
        )}
      />

      <div className="cv-builder-layout grid items-start gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(500px,1.1fr)]">
        <div className="cv-builder-form flex min-w-0 flex-col gap-4">
          <section className={`${CARD} flex flex-col gap-5 border border-[#28212e]/10 p-5 sm:p-6`}>
            <SectionTitle number="01" title="Thông tin liên hệ" description="Giúp nhà tuyển dụng biết cách kết nối với bạn." />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="cv-name" label="Họ và tên" value={name} onChange={setName} placeholder="Nguyễn Minh An" />
              <Field id="cv-title" label="Vị trí mong muốn" value={title} onChange={setTitle} placeholder="Product Designer" />
              <Field id="cv-email" label="Email" value={email} onChange={setEmail} placeholder="ban@email.com" type="email" />
              <Field id="cv-phone" label="Số điện thoại" value={phone} onChange={setPhone} placeholder="090 123 4567" type="tel" />
              <Field id="cv-location" label="Thành phố" value={location} onChange={setLocation} placeholder="TP. Hồ Chí Minh" />
              <Field id="cv-portfolio" label="Portfolio / LinkedIn" value={portfolio} onChange={setPortfolio} placeholder="linkedin.com/in/ten-ban" />
            </div>
          </section>

          <section className={`${CARD} flex flex-col gap-5 border border-[#28212e]/10 p-5 sm:p-6`}>
            <SectionTitle number="02" title="Giới thiệu" description="Tóm tắt thế mạnh và hướng đi nghề nghiệp trong vài câu." />
            <label htmlFor="cv-summary" className="flex flex-col gap-2 text-xs font-semibold text-[#514957]">
              Tóm tắt chuyên môn
              <textarea
                id="cv-summary"
                className={`${adminInputClass} min-h-32 resize-y bg-[#fffdf7]`}
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                placeholder="Ví dụ: Nhà thiết kế sản phẩm với 4 năm biến những quy trình phức tạp thành trải nghiệm số rõ ràng, dễ dùng..."
              />
            </label>
          </section>

          <section className={`${CARD} flex flex-col gap-5 border border-[#28212e]/10 p-5 sm:p-6`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SectionTitle number="03" title="Kinh nghiệm" description="Ưu tiên thành tựu và tác động thay vì chỉ liệt kê nhiệm vụ." />
              <button type="button" onClick={addExperience} className={adminButton('ghost', 'h-10 shrink-0')}>
                <span className={`${ICON} text-[18px]`} aria-hidden="true">add</span>Thêm
              </button>
            </div>
            {experiences.length === 0 && <p className="m-0 rounded-xl bg-[#f3efe6] p-4 text-xs leading-5 text-[#6f6675]">Chưa có mục kinh nghiệm. Nhấn “Thêm” để bắt đầu, hoặc bỏ qua nếu bạn mới vào nghề.</p>}
            {experiences.map((item, index) => (
              <fieldset key={item.id} className="flex min-w-0 flex-col gap-4 rounded-xl border border-[#d9d0c3] p-4">
                <legend className="px-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[#604273]">Kinh nghiệm {index + 1}</legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id={`experience-role-${item.id}`} label="Chức danh" value={item.role} onChange={(value) => updateExperience(item.id, 'role', value)} placeholder="Senior Product Designer" />
                  <Field id={`experience-company-${item.id}`} label="Công ty" value={item.company} onChange={(value) => updateExperience(item.id, 'company', value)} placeholder="Công ty / tổ chức" />
                  <Field id={`experience-period-${item.id}`} label="Thời gian" value={item.period} onChange={(value) => updateExperience(item.id, 'period', value)} placeholder="2022 — Hiện tại" />
                </div>
                <label htmlFor={`experience-details-${item.id}`} className="flex flex-col gap-2 text-xs font-semibold text-[#514957]">
                  Thành tựu / mô tả
                  <textarea id={`experience-details-${item.id}`} className={`${adminInputClass} min-h-24 resize-y bg-[#fffdf7]`} value={item.details} onChange={(event) => updateExperience(item.id, 'details', event.target.value)} placeholder="Mô tả kết quả nổi bật, mỗi ý một dòng." />
                </label>
                <button type="button" aria-label={`Xóa kinh nghiệm ${index + 1}`} onClick={() => setExperiences((current) => current.filter((entry) => entry.id !== item.id))} className="self-start rounded-lg border-0 bg-transparent px-2 py-1 text-xs font-semibold text-[#ad493b] hover:bg-[#f9d9d0]">Xóa mục</button>
              </fieldset>
            ))}
          </section>

          <section className={`${CARD} flex flex-col gap-5 border border-[#28212e]/10 p-5 sm:p-6`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SectionTitle number="04" title="Học vấn" description="Bằng cấp, chuyên ngành hoặc chương trình đào tạo liên quan." />
              <button type="button" onClick={addEducation} className={adminButton('ghost', 'h-10 shrink-0')}>
                <span className={`${ICON} text-[18px]`} aria-hidden="true">add</span>Thêm
              </button>
            </div>
            {education.length === 0 && <p className="m-0 rounded-xl bg-[#f3efe6] p-4 text-xs leading-5 text-[#6f6675]">Thêm học vấn nếu phù hợp với vị trí bạn đang ứng tuyển.</p>}
            {education.map((item, index) => (
              <fieldset key={item.id} className="flex min-w-0 flex-col gap-4 rounded-xl border border-[#d9d0c3] p-4">
                <legend className="px-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[#604273]">Học vấn {index + 1}</legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id={`education-degree-${item.id}`} label="Bằng cấp / chuyên ngành" value={item.degree} onChange={(value) => updateEducation(item.id, 'degree', value)} placeholder="Cử nhân Thiết kế đồ họa" />
                  <Field id={`education-school-${item.id}`} label="Trường / đơn vị" value={item.school} onChange={(value) => updateEducation(item.id, 'school', value)} placeholder="Đại học Kiến trúc" />
                  <Field id={`education-period-${item.id}`} label="Thời gian" value={item.period} onChange={(value) => updateEducation(item.id, 'period', value)} placeholder="2018 — 2022" />
                </div>
                <button type="button" aria-label={`Xóa học vấn ${index + 1}`} onClick={() => setEducation((current) => current.filter((entry) => entry.id !== item.id))} className="self-start rounded-lg border-0 bg-transparent px-2 py-1 text-xs font-semibold text-[#ad493b] hover:bg-[#f9d9d0]">Xóa mục</button>
              </fieldset>
            ))}
          </section>

          <section className={`${CARD} flex flex-col gap-5 border border-[#28212e]/10 p-5 sm:p-6`}>
            <SectionTitle number="05" title="Kỹ năng" description="Tách từng kỹ năng bằng dấu phẩy để trình bày thành danh sách gọn gàng." />
            <label htmlFor="cv-skills" className="flex flex-col gap-2 text-xs font-semibold text-[#514957]">
              Kỹ năng chuyên môn
              <textarea id="cv-skills" className={`${adminInputClass} min-h-24 resize-y bg-[#fffdf7]`} value={skills} onChange={(event) => setSkills(event.target.value)} placeholder="Figma, Nghiên cứu người dùng, Prototyping, Design systems" />
            </label>
          </section>

          <div className="rounded-xl border border-[#604273]/15 bg-[#e9dff0]/55 p-4 text-xs leading-5 text-[#514957]">
            <span className="font-bold text-[#604273]">Mẹo nhỏ:</span> Dùng số liệu cụ thể để làm nổi bật kết quả. CV chỉ được giữ trong phiên làm việc này; hãy in hoặc lưu PDF trước khi rời trang.
          </div>
        </div>

        <aside className="cv-builder-preview-wrap min-w-0 xl:sticky xl:top-24">
          <section className={`${CARD} cv-builder-preview overflow-hidden border border-[#28212e]/10 shadow-[0_14px_45px_rgba(40,33,46,0.09)]`} aria-label="Bản xem trước CV">
            <div className="cv-builder-preview-toolbar flex flex-wrap items-center justify-between gap-3 border-b border-[#28212e]/10 bg-[#fffdf7] px-5 py-4">
              <div>
                <p className="m-0 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#ee795f]">Live preview / A4</p>
                <h2 className="m-0 mt-1 text-sm font-bold text-[#28212e]">Bản xem trước</h2>
              </div>
              <button type="button" onClick={printCv} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#604273]/20 bg-[#e9dff0]/60 px-3 text-xs font-bold text-[#604273] transition hover:bg-[#e9dff0]">
                <span className={`${ICON} text-base`} aria-hidden="true">picture_as_pdf</span>Tạo PDF
              </button>
            </div>

            <article className="cv-builder-preview-sheet mx-auto min-h-[700px] max-w-[760px] bg-[#fffdf7] p-6 sm:p-9 lg:p-10" aria-label="Bản xem trước CV được cập nhật theo nội dung biểu mẫu">
              <header className="border-b-2 border-[#604273] pb-5">
                <p className="m-0 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#ee795f]">Career profile / Vietnam</p>
                <h1 className="mt-3 break-words text-3xl font-bold leading-tight tracking-[-0.045em] text-[#28212e] sm:text-4xl">{name.trim() || 'Tên của bạn'}</h1>
                <p className="mt-2 text-base font-semibold text-[#604273]">{title.trim() || 'Vị trí nghề nghiệp'}</p>
                <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] leading-5 text-[#6f6675]">
                  {email && <span>{email}</span>}
                  {phone && <span>{phone}</span>}
                  {location && <span>{location}</span>}
                  {portfolio && <span className="break-all">{portfolio}</span>}
                  {!email && !phone && !location && !portfolio && <span>Thông tin liên hệ sẽ hiển thị tại đây</span>}
                </div>
              </header>

              {summary.trim() && (
                <section className="cv-builder-print-section mt-6">
                  <h2 className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.17em] text-[#604273]">Hồ sơ</h2>
                  <p className="m-0 whitespace-pre-line text-xs leading-6 text-[#514957]">{summary}</p>
                </section>
              )}

              {experiences.some((item) => item.role || item.company || item.details) && (
                <section className="cv-builder-print-section mt-6">
                  <h2 className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.17em] text-[#604273]">Kinh nghiệm</h2>
                  <div className="flex flex-col gap-4">
                    {experiences.filter((item) => item.role || item.company || item.details).map((item) => (
                      <div key={item.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                        <div>
                          <h3 className="m-0 text-sm font-bold text-[#28212e]">{item.role || 'Vị trí'}</h3>
                          <p className="m-0 mt-1 text-xs font-semibold text-[#6f6675]">{item.company}</p>
                          {item.details && <p className="m-0 mt-2 whitespace-pre-line text-xs leading-5 text-[#514957]">{item.details}</p>}
                        </div>
                        {item.period && <span className="text-right font-mono text-[9px] text-[#6f6675]">{item.period}</span>}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {education.some((item) => item.degree || item.school) && (
                <section className="cv-builder-print-section mt-6">
                  <h2 className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.17em] text-[#604273]">Học vấn</h2>
                  <div className="flex flex-col gap-3">
                    {education.filter((item) => item.degree || item.school).map((item) => (
                      <div key={item.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                        <div>
                          <h3 className="m-0 text-xs font-bold text-[#28212e]">{item.degree}</h3>
                          <p className="m-0 mt-1 text-xs text-[#6f6675]">{item.school}</p>
                        </div>
                        {item.period && <span className="text-right font-mono text-[9px] text-[#6f6675]">{item.period}</span>}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {skills.split(',').map((skill) => skill.trim()).filter(Boolean).length > 0 && (
                <section className="cv-builder-print-section mt-6">
                  <h2 className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.17em] text-[#604273]">Kỹ năng</h2>
                  <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                    {skills.split(',').map((skill) => skill.trim()).filter(Boolean).map((skill, index) => (
                      <li key={`${skill}-${index}`} className="rounded-full bg-[#f3efe6] px-2.5 py-1 text-[10px] font-semibold text-[#514957]">{skill}</li>
                    ))}
                  </ul>
                </section>
              )}

              {completion === 0 && (
                <div className="mt-8 rounded-xl border border-dashed border-[#d9d0c3] p-5 text-center text-xs leading-5 text-[#6f6675]">
                  Điền thông tin ở bên trái để bắt đầu dựng CV của bạn.
                </div>
              )}
              <footer className="mt-8 border-t border-[#d9d0c3] pt-3 font-mono text-[8px] uppercase tracking-[0.14em] text-[#9a919f]">AI Interview · Career Lab</footer>
            </article>
          </section>
        </aside>
      </div>

      <div className="cv-builder-page-links flex flex-wrap items-center justify-between gap-3 border-t border-[#28212e]/10 pt-5 text-xs text-[#6f6675]">
        <Link to="/cv-analyzer" className="inline-flex items-center gap-2 font-semibold text-[#604273] no-underline hover:underline">
          <span className={`${ICON} text-base`} aria-hidden="true">fact_check</span>Đã có CV? Phân tích với AI
        </Link>
        <span>Hãy kiểm tra thông tin trước khi chia sẻ với nhà tuyển dụng.</span>
      </div>
    </div>
  );
};

export default CvBuilderPage;
