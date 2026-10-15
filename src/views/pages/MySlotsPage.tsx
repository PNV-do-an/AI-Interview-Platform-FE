import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSlotController } from '../../controllers/useSlotController';

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 720, margin: '40px auto', padding: 24, fontFamily: 'sans-serif' },
  card: { border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 12 },
  row: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  field: { marginBottom: 12 },
  input: { display: 'block', padding: 6, marginTop: 4 },
};

const toLocalInput = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const MySlotsPage: React.FC = () => {
  const { mySlots, loading, error, successMsg, fetchMySlots, createSlot, cancelSlot } = useSlotController();
  const [start, setStart] = useState(toLocalInput(new Date()));
  const [end, setEnd] = useState(toLocalInput(new Date(Date.now() + 3600_000)));
  const [note, setNote] = useState('');

  useEffect(() => { fetchMySlots(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await createSlot({ startTime: new Date(start).toISOString(), endTime: new Date(end).toISOString(), note: note || undefined });
    if (ok) {
      setNote('');
      await fetchMySlots();
    }
  };

  return (
    <div style={styles.page}>
      <h2>Quản lý khung giờ trống</h2>
      {loading && <p>Đang tải...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {successMsg && <p style={{ color: 'green' }}>{successMsg}</p>}

      <form onSubmit={onCreate} style={{ ...styles.card, background: '#f9fafb' }}>
        <div style={styles.row}>
          <div style={styles.field}>
            <label>Bắt đầu</label>
            <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} style={styles.input} />
          </div>
          <div style={styles.field}>
            <label>Kết thúc</label>
            <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} style={styles.input} />
          </div>
          <div style={styles.field}>
            <label>Ghi chú</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} style={styles.input} />
          </div>
        </div>
        <button type="submit">Thêm khung giờ</button>
      </form>

      {mySlots.map((slot) => (
        <div key={slot.id} style={styles.card}>
          <div style={styles.row}>
            <strong style={{ flex: 1 }}>
              {new Date(slot.startTime).toLocaleString('vi-VN')} — {new Date(slot.endTime).toLocaleTimeString('vi-VN')}
            </strong>
            <span style={{ color: slot.booked ? '#991b1b' : '#166534' }}>
              {slot.booked ? `Đã đặt bởi ${slot.bookedByName}` : 'Còn trống'}
            </span>
          </div>
          {slot.note && <p style={{ color: '#6b7280' }}>{slot.note}</p>}
          {!slot.booked && (
            <button onClick={() => cancelSlot(slot.id).then(() => fetchMySlots())}>Hủy khung giờ</button>
          )}
        </div>
      ))}
      {mySlots.length === 0 && !loading && <p>Chưa có khung giờ nào.</p>}

      <p style={{ marginTop: 24 }}><Link to="/my-jobs">← Quản lý tin của tôi</Link></p>
    </div>
  );
};

export default MySlotsPage;
