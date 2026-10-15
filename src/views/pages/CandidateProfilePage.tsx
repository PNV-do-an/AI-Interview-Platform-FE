import React, { useEffect, useState } from 'react';
import { useCandidateController } from '../../controllers/useCandidateController';
import { useAuth } from '../../context/AuthContext';

const CandidateProfilePage = () => {
  const { user } = useAuth();
  const { profile, loading, error, successMsg, fetchProfile, updateProfile, clearMessages } =
    useCandidateController();

  const [skills, setSkills] = useState('');
  const [experienceYears, setExperienceYears] = useState('0');
  const [summary, setSummary] = useState('');
  const [careerGoal, setCareerGoal] = useState('');
  const [cvFileName, setCvFileName] = useState('');

  useEffect(() => {
    if (user?.role === 'ROLE_USER') fetchProfile();
  }, [user]);

  useEffect(() => {
    if (profile) {
      setSkills(profile.skills || '');
      setExperienceYears(String(profile.experienceYears ?? 0));
      setSummary(profile.summary || '');
      setCareerGoal(profile.careerGoal || '');
      setCvFileName(profile.cvFileName || '');
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    await updateProfile({
      skills,
      experienceYears: Number(experienceYears) || 0,
      summary,
      careerGoal,
      cvFileName,
    });
  };

  if (!user || user.role !== 'ROLE_USER') {
    return (
      <div style={{ padding: '40px', color: '#395886' }}>
        Vui lòng đăng nhập với tài khoản ứng viên.
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #D5DEEF',
    borderRadius: 4,
    boxSizing: 'border-box',
    fontSize: 14,
  };
  const labelStyle: React.CSSProperties = { display: 'block', marginBottom: 6, color: '#395886', fontWeight: 600 };

  return (
    <div style={{ padding: '40px', maxWidth: 640, margin: '0 auto' }}>
      <h1 style={{ color: '#395886' }}>Hồ sơ ứng viên</h1>
      <p style={{ color: '#628ECB' }}>
        Hồ sơ giúp nhà tuyển dụng tìm thấy bạn qua chức năng gợi ý ứng viên phù hợp.
      </p>

      {successMsg && <p style={{ color: 'green' }}>{successMsg}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {loading && <p style={{ color: '#395886' }}>Đang tải...</p>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={labelStyle}>Kỹ năng (phân cách bởi dấu phẩy)</label>
          <input
            style={inputStyle}
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="VD: Java, Spring Boot, React, MySQL"
          />
        </div>
        <div>
          <label style={labelStyle}>Số năm kinh nghiệm</label>
          <input
            style={inputStyle}
            type="number"
            min={0}
            max={50}
            value={experienceYears}
            onChange={(e) => setExperienceYears(e.target.value)}
          />
        </div>
        <div>
          <label style={labelStyle}>Giới thiệu bản thân</label>
          <textarea
            style={{ ...inputStyle, minHeight: 100 }}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Tóm tắt kinh nghiệm và thế mạnh của bạn"
          />
        </div>
        <div>
          <label style={labelStyle}>Mục tiêu nghề nghiệp</label>
          <textarea
            style={{ ...inputStyle, minHeight: 80 }}
            value={careerGoal}
            onChange={(e) => setCareerGoal(e.target.value)}
            placeholder="VD: Trở thành Senior Backend Engineer trong 3 năm tới"
          />
        </div>
        <div>
          <label style={labelStyle}>Tên file CV</label>
          <input
            style={inputStyle}
            value={cvFileName}
            onChange={(e) => setCvFileName(e.target.value)}
            placeholder="VD: CV_NguyenVanA.pdf"
          />
        </div>
        <button
          type="submit"
          style={{
            padding: '12px 24px',
            background: '#628ECB',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 15,
          }}
        >
          Lưu hồ sơ
        </button>
      </form>
    </div>
  );
};

export default CandidateProfilePage;
