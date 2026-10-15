import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCandidateController } from '../../controllers/useCandidateController';
import { useSlotController } from '../../controllers/useSlotController';
import { useAuth } from '../../context/AuthContext';
import { APPLICATION_STATUS_LABELS, Application } from '../../models/Program.model';

const statusStyle: Record<string, { background: string; color: string }> = {
  PENDING: { background: '#D5DEEF', color: '#395886' },
  SCHEDULED: { background: '#B1C9EF', color: '#22385C' },
  INTERVIEWED: { background: '#D5DEEF', color: '#395886' },
  ACCEPTED: { background: '#8AA6ED', color: '#fff' },
  REJECTED: { background: '#F0F3FA', color: '#395886' },
  CANCELLED: { background: '#E4E4E4', color: '#666' },
};

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

  if (!user || user.role !== 'ROLE_USER') {
    return (
      <div style={{ padding: '40px', color: '#395886' }}>
        Vui lòng đăng nhập với tài khoản ứng viên.
      </div>
    );
  }
  if (loading && !applications) return <div style={{ padding: '40px', color: '#395886' }}>Đang tải...</div>;

  return (
    <div style={{ padding: '40px', maxWidth: 1000, margin: '0 auto' }}>
      <h1 style={{ color: '#395886' }}>Đơn ứng tuyển của tôi</h1>

      {profile && !profile.cvFileName && (
        <p style={{ background: '#F0F3FA', padding: 10, borderRadius: 4 }}>
          Bạn chưa cập nhật hồ sơ (kỹ năng, CV). Cập nhật tại{' '}
          <Link to="/my-profile" style={{ color: '#628ECB' }}>trang hồ sơ</Link> để nhà tuyển dụng tìm thấy bạn.
        </p>
      )}
      {successMsg && <p style={{ color: 'green' }}>{successMsg}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!applications || applications.content.length === 0 ? (
        <div style={{ background: '#F0F3FA', padding: 30, textAlign: 'center', borderRadius: 6 }}>
          <p>Bạn chưa ứng tuyển công việc nào.</p>
          <button
            onClick={() => navigate('/jobs')}
            style={{ padding: '10px 20px', background: '#628ECB', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
          >
            Xem việc làm
          </button>
        </div>
      ) : (
        <>
          {applications.content.map((app) => (
            <div key={app.id} style={{ border: '1px solid #D5DEEF', borderRadius: 6, padding: 16, marginBottom: 12, background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <strong style={{ color: '#395886', fontSize: 16 }}>{app.jobTitle}</strong>
                  <div style={{ color: '#628ECB' }}>{app.companyName}</div>
                  <div style={{ color: '#888', fontSize: 13 }}>
                    Ứng tuyển: {new Date(app.createdAt).toLocaleString('vi-VN')}
                  </div>
                  {app.slot && (
                    <div style={{ color: '#395886', marginTop: 6 }}>
                      Lịch phỏng vấn:{' '}
                      <strong>
                        {new Date(app.slot.startTime).toLocaleString('vi-VN')} — {new Date(app.slot.endTime).toLocaleTimeString('vi-VN')}
                      </strong>
                    </div>
                  )}
                  {app.score != null && (
                    <div style={{ color: '#395886', marginTop: 6 }}>
                      Điểm đánh giá: <strong>{app.score}/100</strong>
                    </div>
                  )}
                  {app.feedback && (
                    <div style={{ color: '#555', marginTop: 6 }}>Nhận xét: {app.feedback}</div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ padding: '4px 12px', borderRadius: 4, fontSize: 13, ...statusStyle[app.status] }}>
                    {APPLICATION_STATUS_LABELS[app.status]}
                  </span>
                  {app.status === 'PENDING' && (
                    <button
                      onClick={() => openBooking(app)}
                      style={{ padding: '6px 14px', background: '#628ECB', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                    >
                      Đặt lịch
                    </button>
                  )}
                  {(app.status === 'PENDING' || app.status === 'SCHEDULED') && (
                    <button
                      onClick={async () => {
                        if (!window.confirm('Bạn chắc chắn muốn hủy đơn ứng tuyển này?')) return;
                        const ok = await cancelApplication(app.id);
                        if (ok) fetchMyApplications(page);
                      }}
                      style={{ padding: '6px 14px', background: '#fff', color: '#B33', border: '1px solid #B33', borderRadius: 4, cursor: 'pointer' }}
                    >
                      Hủy
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {applications.totalPages > 1 && (
            <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center' }}>
              {Array.from({ length: applications.totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => { setPage(i); fetchMyApplications(i); }}
                  style={{
                    padding: '6px 12px',
                    background: i === page ? '#628ECB' : '#F0F3FA',
                    color: i === page ? '#fff' : '#395886',
                    border: '1px solid #D5DEEF',
                    borderRadius: 4,
                    cursor: 'pointer',
                  }}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {bookingApp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(57,88,134,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 8, width: 480, maxHeight: '80vh', overflowY: 'auto' }}>
            <h3 style={{ color: '#395886' }}>Chọn lịch phỏng vấn — {bookingApp.jobTitle}</h3>
            {availableSlots.length === 0 ? (
              <p style={{ color: '#888' }}>Nhà tuyển dụng chưa có lịch trống. Vui lòng quay lại sau.</p>
            ) : (
              availableSlots.map((s) => (
                <label
                  key={s.id}
                  style={{
                    display: 'block',
                    padding: 10,
                    border: `2px solid ${selectedSlot === s.id ? '#628ECB' : '#D5DEEF'}`,
                    borderRadius: 4,
                    marginBottom: 8,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="slot"
                    checked={selectedSlot === s.id}
                    onChange={() => setSelectedSlot(s.id)}
                    style={{ marginRight: 8 }}
                  />
                  {new Date(s.startTime).toLocaleString('vi-VN')} — {new Date(s.endTime).toLocaleTimeString('vi-VN')}
                </label>
              ))
            )}
            <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setBookingApp(null)}
                style={{ padding: '8px 16px', border: '1px solid #D5DEEF', background: '#fff', borderRadius: 4, cursor: 'pointer' }}
              >
                Đóng
              </button>
              {availableSlots.length > 0 && (
                <button
                  onClick={confirmBooking}
                  disabled={!selectedSlot}
                  style={{ padding: '8px 16px', background: selectedSlot ? '#628ECB' : '#B1C9EF', color: '#fff', border: 'none', borderRadius: 4, cursor: selectedSlot ? 'pointer' : 'not-allowed' }}
                >
                  Xác nhận đặt lịch
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
