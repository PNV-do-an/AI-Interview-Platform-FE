import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ProgramService from '../../services/program.service';
import { useEmployerJobController } from '../../controllers/useEmployerJobController';
import { JobRequest } from '../../models/Program.model';

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 640, margin: '40px auto', padding: 24, fontFamily: 'sans-serif' },
  field: { marginBottom: 14 },
  input: { display: 'block', width: '100%', padding: 8, marginTop: 4, boxSizing: 'border-box' },
};

const emptyForm: JobRequest = {
  title: '',
  companyName: '',
  position: '',
  location: '',
  salaryRange: '',
  description: '',
  requirements: '',
  requiredSkills: '',
};

const JobFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const jobId = Number(id);
  const navigate = useNavigate();
  const { createJob, updateJob, error, successMsg } = useEmployerJobController();
  const [form, setForm] = useState<JobRequest>(emptyForm);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    ProgramService.getJobDetail(jobId)
      .then((res) => {
        const j = res.data.data!;
        setForm({
          title: j.title,
          companyName: j.companyName,
          position: j.position ?? '',
          location: j.location ?? '',
          salaryRange: j.salaryRange ?? '',
          description: j.description ?? '',
          requirements: j.requirements ?? '',
          requiredSkills: j.requiredSkills ?? '',
        });
      })
      .catch((e) => setLoadError(e.response?.data?.message || 'Không tải được tin tuyển dụng'));
  }, [jobId]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (key: keyof JobRequest) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm({ ...form, [key]: e.target.value });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = isEdit ? await updateJob(jobId, form) : await createJob(form);
    if (ok) navigate('/my-jobs');
  };

  return (
    <div style={styles.page}>
      <h2>{isEdit ? 'Chỉnh sửa tin tuyển dụng' : 'Đăng tin tuyển dụng mới'}</h2>

      {loadError && <p style={{ color: 'red' }}>{loadError}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {successMsg && <p style={{ color: 'green' }}>{successMsg}</p>}

      <form onSubmit={onSubmit}>
        <div style={styles.field}>
          <label>Tiêu đề *</label>
          <input required value={form.title} onChange={set('title')} style={styles.input} />
        </div>
        <div style={styles.field}>
          <label>Tên công ty *</label>
          <input required value={form.companyName} onChange={set('companyName')} style={styles.input} />
        </div>
        <div style={styles.field}>
          <label>Vị trí</label>
          <input value={form.position} onChange={set('position')} style={styles.input} />
        </div>
        <div style={styles.field}>
          <label>Địa điểm</label>
          <input value={form.location} onChange={set('location')} style={styles.input} />
        </div>
        <div style={styles.field}>
          <label>Mức lương</label>
          <input value={form.salaryRange} onChange={set('salaryRange')} style={styles.input} />
        </div>
        <div style={styles.field}>
          <label>Mô tả công việc</label>
          <textarea value={form.description} onChange={set('description')} style={{ ...styles.input, minHeight: 120 }} />
        </div>
        <div style={styles.field}>
          <label>Yêu cầu</label>
          <textarea value={form.requirements} onChange={set('requirements')} style={{ ...styles.input, minHeight: 120 }} />
        </div>
        <div style={styles.field}>
          <label>Kỹ năng yêu cầu (phân cách bởi dấu phẩy)</label>
          <input
            value={form.requiredSkills}
            onChange={set('requiredSkills')}
            placeholder="Java, Spring Boot, MySQL"
            style={styles.input}
          />
        </div>
        <button type="submit">{isEdit ? 'Lưu thay đổi' : 'Đăng tin'}</button>
      </form>

      <p style={{ marginTop: 24 }}><Link to="/my-jobs">← Quản lý tin của tôi</Link></p>
    </div>
  );
};

export default JobFormPage;
