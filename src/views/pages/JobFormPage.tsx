import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ProgramService from '../../services/program.service';
import { useEmployerJobController } from '../../controllers/useEmployerJobController';
import { JobRequest } from '../../models/Program.model';
import { ErrorBanner, PageHeader, buttonClass, inputClass, labelClass } from '../components/ui';

const textareaClass = `${inputClass.replace('h-9', 'py-2')} min-h-[120px] resize-y`;

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
      .catch((e) => setLoadError(e.response?.data?.message || 'Failed to load the job posting'));
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
    <div className="max-w-[640px]">
      <PageHeader title={isEdit ? 'Edit Job Posting' : 'Create Job Posting'} />

      <ErrorBanner message={loadError} />
      <ErrorBanner message={error} />
      {successMsg && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-success-bg px-3 py-2.5 text-body-sm text-success-text" role="status">
          <span className="material-symbols-outlined shrink-0 text-[18px]">check_circle</span>
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded-lg border border-[#e2e8f0] bg-card p-4 shadow-card">
        <div>
          <label className={labelClass}>Job Title *</label>
          <input required value={form.title} onChange={set('title')} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Company Name *</label>
          <input required value={form.companyName} onChange={set('companyName')} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Position</label>
          <input value={form.position} onChange={set('position')} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Location</label>
          <input value={form.location} onChange={set('location')} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Salary Range</label>
          <input value={form.salaryRange} onChange={set('salaryRange')} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Job Description</label>
          <textarea value={form.description} onChange={set('description')} className={textareaClass} />
        </div>
        <div>
          <label className={labelClass}>Requirements</label>
          <textarea value={form.requirements} onChange={set('requirements')} className={textareaClass} />
        </div>
        <div>
          <label className={labelClass}>Required Skills (comma-separated)</label>
          <input
            value={form.requiredSkills}
            onChange={set('requiredSkills')}
            placeholder="Java, Spring Boot, MySQL"
            className={inputClass}
          />
        </div>
        <button type="submit" className={buttonClass('primary', 'self-start')}>
          <span className="material-symbols-outlined text-[18px]">{isEdit ? 'edit' : 'add'}</span>
          {isEdit ? 'Save Changes' : 'Create Job Posting'}
        </button>
      </form>

      <p className="pt-6">
        <Link
          to="/my-jobs"
          className="text-label-md text-ink-variant no-underline transition-colors hover:text-primary"
        >
          ← My Job Postings
        </Link>
      </p>
    </div>
  );
};

export default JobFormPage;
