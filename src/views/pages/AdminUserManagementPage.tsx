import React, { useCallback, useEffect, useState } from 'react';
import { useAdminUserController } from '../../controllers/useAdminUserController';
import { Role, UserSummary } from '../../models/User.model';
import ConfirmDialog from '../components/ConfirmDialog';
import UserDetailModal from '../components/UserDetailModal';

const ROLE_LABELS: Record<string, string> = {
  ROLE_USER: 'Khách hàng',
  ROLE_STAFF: 'Nhân viên',
  ROLE_ADMIN: 'Quản trị viên',
  ROLE_INTERVIEWER: 'Phỏng vấn viên',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#dcfce7', INACTIVE: '#f3f4f6', LOCKED: '#fee2e2', DELETED: '#e5e7eb',
};
const STATUS_TEXT_COLORS: Record<string, string> = {
  ACTIVE: '#16a34a', INACTIVE: '#6b7280', LOCKED: '#dc2626', DELETED: '#9ca3af',
};

type TabType = 'users' | 'auditLogs';

const AdminUserManagementPage: React.FC = () => {
  const ctrl = useAdminUserController();
  const [tab, setTab] = useState<TabType>('users');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean; title: string; message: string;
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', onConfirm: () => {} });

  useEffect(() => { ctrl.fetchUsers(0); }, []); // eslint-disable-line

  const handleSearch = useCallback(() => {
    ctrl.applyFilters({ search: searchInput, status: statusFilter, role: roleFilter });
  }, [searchInput, statusFilter, roleFilter, ctrl]);

  const handleFilterChange = useCallback((
    key: 'status' | 'role', value: string,
  ) => {
    const newFilters = {
      search: searchInput,
      status: key === 'status' ? value : statusFilter,
      role:   key === 'role'   ? value : roleFilter,
    };
    if (key === 'status') setStatusFilter(value);
    else setRoleFilter(value);
    ctrl.applyFilters(newFilters);
  }, [searchInput, statusFilter, roleFilter, ctrl]);

  const askConfirm = (title: string, message: string, onConfirm: () => void) =>
    setConfirmDialog({ open: true, title, message, onConfirm });

  const closeConfirm = () =>
    setConfirmDialog(d => ({ ...d, open: false }));

  const handleDelete = (id: number, email: string) => {
    askConfirm(
      'Xác nhận xóa tài khoản',
      `Bạn có chắc muốn xóa tài khoản "${email}"? Hành động này không thể khôi phục.`,
      async () => { closeConfirm(); await ctrl.deleteUser(id); },
    );
  };

  return (
    <div style={styles.page}>
      <h2 style={{ margin: '0 0 24px' }}>Quản lý người dùng</h2>

      {/* Tabs */}
      <div style={styles.tabs}>
        {(['users', 'auditLogs'] as TabType[]).map(t => (
          <button
            key={t}
            style={{ ...styles.tab, ...(tab === t ? styles.tabActive : {}) }}
            onClick={() => {
              setTab(t);
              if (t === 'auditLogs' && !ctrl.auditLogs) ctrl.fetchAuditLogs(0);
            }}
          >
            {t === 'users' ? 'Danh sách người dùng' : 'Audit Log'}
          </button>
        ))}
      </div>

      {/* Messages */}
      {ctrl.error && <div style={styles.errorBanner}>{ctrl.error}</div>}
      {ctrl.successMsg && <div style={styles.successBanner}>{ctrl.successMsg}</div>}

      {tab === 'users' && (
        <>
          {/* Filters */}
          <div style={styles.filterBar}>
            <input
              style={styles.searchInput}
              placeholder="Tìm kiếm theo email hoặc tên..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            <button style={styles.searchBtn} onClick={handleSearch}>Tìm</button>

            <select style={styles.select} value={statusFilter}
              onChange={e => handleFilterChange('status', e.target.value)}>
              <option value="">Tất cả trạng thái</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="LOCKED">Locked</option>
            </select>

            <select style={styles.select} value={roleFilter}
              onChange={e => handleFilterChange('role', e.target.value)}>
              <option value="">Tất cả vai trò</option>
              <option value="ROLE_USER">Khách hàng</option>
              <option value="ROLE_STAFF">Nhân viên</option>
              <option value="ROLE_INTERVIEWER">Phỏng vấn viên</option>
              <option value="ROLE_ADMIN">Quản trị viên</option>
            </select>
          </div>

          {/* Table */}
          {ctrl.loading ? (
            <div style={styles.loading}>Đang tải...</div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.theadRow}>
                      {['Email', 'Họ tên', 'Vai trò', 'Trạng thái', 'Ngày tạo', 'Hành động'].map(h => (
                        <th key={h} style={styles.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ctrl.users?.content.length === 0 && (
                      <tr><td colSpan={6} style={styles.empty}>Không có dữ liệu</td></tr>
                    )}
                    {ctrl.users?.content.map((u: UserSummary) => (
                      <tr
                        key={u.id}
                        style={styles.row}
                        onClick={() => ctrl.fetchUserDetail(u.id)}
                      >
                        <td style={styles.td}>{u.email}</td>
                        <td style={styles.td}>{u.fullName}</td>
                        <td style={styles.td}>{ROLE_LABELS[u.role] ?? u.role}</td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.badge,
                            background: STATUS_COLORS[u.status] ?? '#f3f4f6',
                            color: STATUS_TEXT_COLORS[u.status] ?? '#333',
                          }}>
                            {u.status}
                          </span>
                        </td>
                        <td style={styles.td}>
                          {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td style={{ ...styles.td, whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                          <ActionButtons
                            user={u}
                            loading={ctrl.actionLoading}
                            onLock={() => ctrl.lockUser(u.id)}
                            onUnlock={() => ctrl.unlockUser(u.id)}
                            onDelete={() => handleDelete(u.id, u.email)}
                            onReset={() => ctrl.resetPassword(u.id)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {ctrl.users && ctrl.users.totalPages > 1 && (
                <Pagination
                  currentPage={ctrl.currentPage}
                  totalPages={ctrl.users.totalPages}
                  totalElements={ctrl.users.totalElements}
                  onPageChange={p => ctrl.fetchUsers(p)}
                />
              )}
            </>
          )}
        </>
      )}

      {tab === 'auditLogs' && (
        <AuditLogTab
          logs={ctrl.auditLogs}
          page={ctrl.auditPage}
          onPageChange={ctrl.fetchAuditLogs}
        />
      )}

      {/* User detail modal */}
      <UserDetailModal
        user={ctrl.selectedUser}
        onClose={() => ctrl.setSelectedUser(null)}
        onLock={ctrl.lockUser}
        onUnlock={ctrl.unlockUser}
        onDelete={id => handleDelete(id, ctrl.selectedUser?.email ?? '')}
        onResetPassword={ctrl.resetPassword}
        onChangeRole={ctrl.changeRole}
        actionLoading={ctrl.actionLoading}
      />

      {/* Confirm dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel="Xóa"
        danger
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirm}
      />
    </div>
  );
};

// ── Sub-components ──────────────────────────────────────────────────────────

const ActionButtons: React.FC<{
  user: UserSummary;
  loading: boolean;
  onLock: () => void;
  onUnlock: () => void;
  onDelete: () => void;
  onReset: () => void;
}> = ({ user, loading, onLock, onUnlock, onDelete, onReset }) => {
  if (user.status === 'DELETED') return <span style={{ color: '#9ca3af', fontSize: 13 }}>—</span>;
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {user.status === 'LOCKED'
        ? <SmBtn label="Mở khóa" color="#16a34a" disabled={loading} onClick={onUnlock} />
        : <SmBtn label="Khóa" color="#f59e0b" disabled={loading} onClick={onLock} />
      }
      <SmBtn label="Reset PW" color="#6366f1" disabled={loading} onClick={onReset} />
      <SmBtn label="Xóa" color="#ef4444" disabled={loading} onClick={onDelete} />
    </div>
  );
};

const SmBtn: React.FC<{
  label: string; color: string; disabled?: boolean; onClick: () => void;
}> = ({ label, color, disabled, onClick }) => (
  <button
    onClick={onClick} disabled={disabled}
    style={{
      padding: '4px 10px', borderRadius: 5, border: 'none',
      background: color, color: '#fff', cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1, fontSize: 12,
    }}
  >
    {label}
  </button>
);

const Pagination: React.FC<{
  currentPage: number; totalPages: number; totalElements: number;
  onPageChange: (p: number) => void;
}> = ({ currentPage, totalPages, totalElements, onPageChange }) => (
  <div style={styles.pagination}>
    <span style={{ color: '#6b7280', fontSize: 13 }}>
      Tổng: {totalElements} người dùng
    </span>
    <div style={{ display: 'flex', gap: 4 }}>
      <button style={styles.pageBtn} disabled={currentPage === 0}
        onClick={() => onPageChange(currentPage - 1)}>‹</button>
      {Array.from({ length: totalPages }, (_, i) => i)
        .filter(p => Math.abs(p - currentPage) <= 2)
        .map(p => (
          <button
            key={p}
            style={{ ...styles.pageBtn, ...(p === currentPage ? styles.pageBtnActive : {}) }}
            onClick={() => onPageChange(p)}
          >
            {p + 1}
          </button>
        ))}
      <button style={styles.pageBtn} disabled={currentPage >= totalPages - 1}
        onClick={() => onPageChange(currentPage + 1)}>›</button>
    </div>
  </div>
);

const AuditLogTab: React.FC<{
  logs: any; page: number; onPageChange: (p: number) => void;
}> = ({ logs, page, onPageChange }) => {
  if (!logs) return <div style={styles.loading}>Đang tải...</div>;
  return (
    <>
      <div style={{ overflowX: 'auto' }}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.theadRow}>
              {['Admin', 'Hành động', 'Target user', 'Chi tiết', 'Thời gian'].map(h => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.content.length === 0 && (
              <tr><td colSpan={5} style={styles.empty}>Chưa có log nào</td></tr>
            )}
            {logs.content.map((l: any) => (
              <tr key={l.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={styles.td}>{l.adminEmail}</td>
                <td style={styles.td}>
                  <span style={{ ...styles.badge, background: '#eff6ff', color: '#2563eb' }}>
                    {l.action}
                  </span>
                </td>
                <td style={styles.td}>{l.targetUserId ?? '—'}</td>
                <td style={{ ...styles.td, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {l.detail ?? '—'}
                </td>
                <td style={styles.td}>
                  {new Date(l.createdAt).toLocaleString('vi-VN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {logs.totalPages > 1 && (
        <Pagination
          currentPage={page} totalPages={logs.totalPages}
          totalElements={logs.totalElements} onPageChange={onPageChange}
        />
      )}
    </>
  );
};

// ── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '24px', maxWidth: 1200, margin: '0 auto' },
  tabs: { display: 'flex', gap: 0, borderBottom: '2px solid #e5e7eb', marginBottom: 24 },
  tab: {
    padding: '10px 24px', border: 'none', background: 'none',
    cursor: 'pointer', fontSize: 14, color: '#6b7280', borderBottom: '2px solid transparent',
    marginBottom: -2,
  },
  tabActive: { color: '#2563eb', borderBottomColor: '#2563eb', fontWeight: 600 },
  filterBar: { display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' },
  searchInput: {
    flex: 1, minWidth: 200, padding: '8px 12px', borderRadius: 7,
    border: '1px solid #d1d5db', fontSize: 14,
  },
  searchBtn: {
    padding: '8px 20px', borderRadius: 7, border: 'none',
    background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: 14,
  },
  select: {
    padding: '8px 12px', borderRadius: 7,
    border: '1px solid #d1d5db', fontSize: 14, cursor: 'pointer',
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  theadRow: { background: '#f9fafb' },
  th: {
    padding: '12px 16px', textAlign: 'left', fontWeight: 600,
    color: '#374151', borderBottom: '2px solid #e5e7eb', whiteSpace: 'nowrap',
  },
  td: { padding: '12px 16px', borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle' },
  row: { cursor: 'pointer', transition: 'background 0.15s' },
  badge: {
    display: 'inline-block', padding: '2px 10px', borderRadius: 99,
    fontSize: 12, fontWeight: 600,
  },
  empty: { padding: 32, textAlign: 'center', color: '#9ca3af' },
  loading: { padding: 48, textAlign: 'center', color: '#6b7280' },
  pagination: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 16, flexWrap: 'wrap', gap: 12,
  },
  pageBtn: {
    padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db',
    background: '#fff', cursor: 'pointer', fontSize: 13,
  },
  pageBtnActive: { background: '#2563eb', color: '#fff', borderColor: '#2563eb' },
  errorBanner: {
    padding: '12px 16px', borderRadius: 8, background: '#fee2e2',
    color: '#dc2626', marginBottom: 16, fontSize: 14,
  },
  successBanner: {
    padding: '12px 16px', borderRadius: 8, background: '#dcfce7',
    color: '#16a34a', marginBottom: 16, fontSize: 14,
  },
};

export default AdminUserManagementPage;
