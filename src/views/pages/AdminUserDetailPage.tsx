/**
 * Màn "Hồ sơ người dùng" (screen_22 — admin user detail) — DATA page.
 *
 * Số thật: GET /admin/users/{id} — từ 009 endpoint này kèm `lastLoginAt`, `lastIp`,
 * `aiReadinessScore`, `activity{applications,mockSessions,bookedInterviews}`, `profile{...}`;
 * tab "Hoạt động" = GET /admin/users/{id}/activity?page&size (mới, 009 FR-003);
 * tab "Lịch sử" = GET /admin/audit-logs?targetUserId; "Khóa tài khoản" = PATCH /users/{id}/lock
 * kèm reason bắt buộc + notifyUser; "Đổi vai trò" = PATCH /users/{id}/role.
 * Không còn phải tra `lastLoginAt` qua GET /admin/users nữa (009 đã trả trong detail).
 *
 * Khối demo còn lại (BE không có field/endpoint — đã ghi ở spec/INDEX.md): ngày sinh, nơi cư trú,
 * ảnh avatar + dot online. Chip góc phải tiêu đề thay "Đang kết nối" (không có realtime presence)
 * bằng trạng thái thật của tài khoản.
 * Lưu ý: các endpoint ghi trả UserDetailResponse KHÔNG kèm 5 field 009, nên sau mỗi hành động
 * controller gọi lại GET /users/{id} (xem useAdminUserController.refreshAfterAction).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AdminService from '../../services/admin.service';
import { useAdminUserController } from '../../controllers/useAdminUserController';
import { Role, UserActivityRow, UserDetail } from '../../models/User.model';
import { parseServerTimestamp } from '../../utils/date';
import {
  AUDIT_ACTION_ICON, AUDIT_ACTION_VN, DemoTag, EmptyBlock, ErrorBlock, ICON, LoadingBlock, ModalBackdrop,
  ROLE_AVATAR, ROLE_DESCRIPTION, ROLE_ICON, ROLE_OPTIONS, StatusChip, RoleChip, adminTdClass,
  adminThClass, adminTableClass, errorText, fmtServer, initialsOf, modalCancelClass,
  modalDangerClass, modalPrimaryClass, timeAgo,
} from '../components/adminKit';

type TabKey = 'info' | 'activity' | 'history';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'info', label: 'Thông tin', icon: 'badge' },
  { key: 'activity', label: 'Hoạt động', icon: 'query_stats' },
  { key: 'history', label: 'Lịch sử', icon: 'history' },
];

const CARD = 'bg-surface-container-lowest rounded-xl shadow-sm';
const FIELD_LABEL = 'text-ds-label-sm text-outline-strong uppercase tracking-wider';
const FIELD_VALUE = 'text-ds-headline-sm text-[15px] text-on-surface mt-1 font-medium';
const WIDE_BTN = (tone: string) =>
  `w-full py-2.5 px-space-md rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${tone}`;

/** Mockup ghi "Hôm nay, 10:15"; mốc khác thì "dd/MM/yyyy, HH:mm". */
const timeLabel = (iso: string | null): string => {
  if (!iso) return '—';
  const d = parseServerTimestamp(iso);
  if (!d) return '—';
  const today = new Date();
  const sameDay = d.getFullYear() === today.getFullYear()
    && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
  const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  if (sameDay) return `Hôm nay, ${time}`;
  return `${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}, ${time}`;
};

const lastLoginLabel = (iso: string | null): string => (iso ? timeLabel(iso) : 'Chưa đăng nhập');

const MetaRow: React.FC<{ icon: string; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
  <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low gap-space-sm">
    <span className="text-on-surface-variant flex items-center gap-1.5 text-ds-label-md">
      <span className={`${ICON} text-[16px] text-outline-strong`}>{icon}</span>
      {label}
    </span>
    <span className="text-right text-ds-label-md text-on-surface font-medium">{value}</span>
  </div>
);

const InfoField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col">
    <span className={FIELD_LABEL}>{label}</span>
    <span className={FIELD_VALUE}>{children}</span>
  </div>
);

const AdminUserDetailPage: React.FC = () => {
  const ctrl = useAdminUserController();
  const { id } = useParams<{ id: string }>();
  const userId = Number(id);
  const validId = Number.isInteger(userId) && userId > 0;

  const [tab, setTab] = useState<TabKey>('info');
  const [activity, setActivity] = useState<UserActivityRow[] | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [lockOpen, setLockOpen] = useState(false);
  const [lockReason, setLockReason] = useState('');
  const [notifyUser, setNotifyUser] = useState(true);
  const [roleOpen, setRoleOpen] = useState(false);
  const [pendingRole, setPendingRole] = useState<Role>('ROLE_USER');
  const [historyLoading, setHistoryLoading] = useState(true);
  const [flash, setFlash] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);

  const user: UserDetail | null = ctrl.selectedUser?.id === userId ? ctrl.selectedUser : null;
  const ctrlRef = useRef(ctrl);
  ctrlRef.current = ctrl;

  const loadHistory = useCallback((page: number) => {
    setHistoryLoading(true);
    void ctrlRef.current
      .fetchAuditLogs(page, { action: '', from: '', to: '', targetUserId: userId })
      .finally(() => setHistoryLoading(false));
  }, [userId]);

  // `ctrl` là object mới sau mỗi render; đưa vào deps sẽ tạo vòng fetch -> ghi thêm dòng VIEW_USER.
  useEffect(() => {
    if (!validId) return;
    void ctrlRef.current.fetchUserDetail(userId);
    loadHistory(0);
  }, [validId, userId, loadHistory]);

  // Dòng thời gian chỉ cần khi mở tab "Hoạt động" -> gọi lười, BE chặn (page+1)*size > 1000.
  useEffect(() => {
    if (!validId || tab !== 'activity') return undefined;
    let alive = true;
    setActivityLoading(true);
    AdminService.getUserActivity(userId, { page: 0, size: 10 })
      .then((res) => { if (alive) setActivity(res.data.data?.content ?? []); })
      .catch(() => { if (alive) setActivity([]); })
      .finally(() => { if (alive) setActivityLoading(false); });
    return () => { alive = false; };
  }, [validId, userId, tab]);

  useEffect(() => {
    if (user) setPendingRole(user.role);
  }, [user]);

  const reloadDetail = useCallback(async () => {
    await ctrlRef.current.fetchUserDetail(userId);
    loadHistory(ctrlRef.current.auditPage);
  }, [loadHistory, userId]);

  const sendSystemEmail = async () => {
    if (!user) return;
    setFlash(null);
    try {
      await AdminService.resetPassword(user.id);
      setFlash({ kind: 'success', text: `Đã gửi email đặt lại mật khẩu tới ${user.email}.` });
      loadHistory(0);
    } catch (err) {
      setFlash({ kind: 'error', text: errorText(err, 'Không gửi được email hệ thống.') });
    }
  };

  const submitLock = async () => {
    if (!user || !lockReason.trim()) return;
    setFlash(null);
    try {
      await AdminService.lockUserWithReason(user.id, { reason: lockReason.trim(), notifyUser });
      setLockOpen(false);
      setLockReason('');
      setFlash({ kind: 'success', text: 'Đã khóa tài khoản và ghi lý do vào nhật ký kiểm toán.' });
      await reloadDetail();
    } catch (err) {
      setFlash({ kind: 'error', text: errorText(err, 'Không khóa được tài khoản.') });
      await reloadDetail(); // BE vẫn ghi audit cả attempt thất bại
    }
  };

  const submitUnlock = async () => {
    if (!user) return;
    setFlash(null);
    await ctrl.unlockUser(user.id);
    loadHistory(0);
  };

  const submitRole = async () => {
    if (!user || pendingRole === user.role) { setRoleOpen(false); return; }
    setFlash(null);
    await ctrl.changeRole(user.id, pendingRole);
    setRoleOpen(false);
    loadHistory(0);
  };

  if (!validId) {
    return (
      <div className="flex flex-col gap-space-md">
        <ErrorBlock message="ID người dùng trong đường dẫn không hợp lệ." />
        <Link to="/admin/users" className="text-ds-label-md text-primary hover:underline">
          ← Quay lại danh sách người dùng
        </Link>
      </div>
    );
  }

  const accountStatus = !user ? 'ACTIVE'
    : user.locked || user.status === 'LOCKED' ? 'LOCKED'
      : user.pendingVerification ? 'PENDING'
        : !user.enabled ? 'INACTIVE' : user.status;

  const historyRows = ctrl.auditLogs?.content ?? [];
  const historyTotal = ctrl.auditLogs?.totalElements ?? 0;

  /** 009: trung bình overall_score phiên của riêng tài khoản, BE làm tròn 1 chữ số. */
  const readiness = user?.aiReadinessScore ?? null;

  const downloadHistory = () => {
    const esc = (v: string | null | undefined) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const head = ['Thời gian', 'Hành động', 'Chi tiết / Lý do', 'Người thực hiện', 'Trạng thái'];
    const body = historyRows.map((l) => [
      fmtServer(l.createdAt), AUDIT_ACTION_VN[l.action] ?? l.action,
      l.detail ?? l.reason ?? '', l.adminEmail, l.succeeded ? 'Thành công' : 'Bị chặn',
    ].map(esc).join(','));
    const blob = new Blob([`\uFEFF${[head.map(esc).join(','), ...body].join('\r\n')}`],
      { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nhat-ky-usr-${userId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col w-full">
      {/* Header: breadcrumb + tiêu đề + hành động cấp trang */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-space-md mb-space-lg">
        <div className="flex flex-col gap-space-xs">
          <nav className="flex items-center gap-1.5 flex-wrap text-ds-body-sm text-on-surface-variant">
            <Link to="/admin/dashboard" className="hover:text-primary transition-colors flex items-center gap-1 text-inherit no-underline">
              <span className={`${ICON} text-[16px]`}>admin_panel_settings</span>
              <span>Quản trị hệ thống</span>
            </Link>
            <span className={`${ICON} text-[14px] text-outline-strong`}>chevron_right</span>
            <Link to="/admin/users" className="hover:text-primary transition-colors text-inherit no-underline">
              Người dùng &amp; Tài khoản
            </Link>
            <span className={`${ICON} text-[14px] text-outline-strong`}>chevron_right</span>
            <span className="text-ds-headline-sm text-on-surface font-semibold">
              Chi tiết người dùng: {user?.fullName ?? `#${userId}`}
            </span>
          </nav>
          <div className="flex flex-wrap items-center gap-space-sm mt-1">
            <h1 className="text-ds-headline-lg text-on-surface tracking-tight font-semibold m-0">Hồ sơ người dùng</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-ds-label-sm font-semibold tracking-wider">
              #USR-{String(userId).padStart(5, '0')}
            </span>
            {user && <StatusChip status={accountStatus} />}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-space-sm self-start md:self-auto">
          <button
            type="button"
            onClick={() => { void sendSystemEmail(); }}
            disabled={ctrl.actionLoading || !user}
            className="inline-flex items-center gap-space-xs px-space-md py-2 rounded-xl bg-primary text-on-primary hover:bg-primary-container transition-all text-ds-label-md shadow-sm border-0 cursor-pointer disabled:opacity-50"
          >
            <span className={`${ICON} text-[18px]`}>mail</span>
            <span>Gửi email hệ thống</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {ctrl.error && (
        <div className="mb-space-md">
          <ErrorBlock message={ctrl.error} />
        </div>
      )}
      {flash && (
        <div className={`mb-space-md flex items-start gap-2 rounded-xl px-4 py-3 text-ds-body-md ${
          flash.kind === 'error' ? 'bg-error-container text-on-error-container' : 'bg-secondary-container/50 text-on-secondary-container'
        }`}
        role={flash.kind === 'error' ? 'alert' : 'status'}
        >
          <span className={`${ICON} text-[20px]`}>{flash.kind === 'error' ? 'error' : 'check_circle'}</span>
          <span>{flash.text}</span>
        </div>
      )}
      {ctrl.successMsg && (
        <div className="mb-space-md flex items-start gap-2 rounded-xl bg-secondary-container/50 px-4 py-3 text-ds-body-md text-on-secondary-container" role="status">
          <span className={`${ICON} text-[20px]`}>check_circle</span>
          <span>{ctrl.successMsg}</span>
        </div>
      )}

      {!user ? (
        <LoadingBlock label="Đang tải hồ sơ người dùng..." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
          {/* Cột trái: danh tính + hành quyền */}
          <div className="lg:col-span-4 flex flex-col gap-space-md">
            <div className={`${CARD} p-space-lg flex flex-col items-center text-center relative overflow-hidden border border-surface-container-high`}>
              <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
              <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-secondary-teal/15 blur-2xl pointer-events-none" />

              <div className="relative mb-space-sm">
                <div className="w-24 h-24 rounded-full p-1 bg-surface-container-high flex items-center justify-center shadow-md">
                  <div className={`w-full h-full rounded-full flex items-center justify-center text-ds-headline-md font-bold ${ROLE_AVATAR[user.role]}`}>
                    {initialsOf(user.fullName)}
                  </div>
                </div>
                {accountStatus === 'ACTIVE' && (
                  <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-secondary-teal ring-2 ring-surface-container-lowest flex items-center justify-center">
                    <span className={`${ICON} text-surface-container-lowest text-[12px] font-bold`}>check</span>
                  </span>
                )}
              </div>

              <h2 className="text-ds-headline-md text-on-surface font-bold tracking-tight m-0">{user.fullName}</h2>
              <p className="text-ds-body-md text-on-surface-variant flex items-center gap-1 mt-0.5 mb-0">
                <span className={`${ICON} text-[16px] text-outline-strong`}>mail</span>
                {user.email}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-space-xs mt-space-md">
                <RoleChip role={user.role} />
                <StatusChip status={accountStatus} />
              </div>

              <div className="w-full h-px bg-surface-container-high my-space-lg" />

              <div className="w-full flex flex-col gap-space-sm text-left text-ds-body-sm">
                <MetaRow
                  icon="calendar_today"
                  label="Ngày tạo tài khoản"
                  value={`${fmtServer(user.createdAt, 'date')} - ${fmtServer(user.createdAt, 'time')}`}
                />
                <MetaRow icon="schedule" label="Đăng nhập gần nhất" value={lastLoginLabel(user.lastLoginAt)} />
                <MetaRow
                  icon="verified_user"
                  label="Xác thực email"
                  value={user.pendingVerification ? (
                    <span className="inline-flex items-center gap-1 text-tertiary font-semibold">
                      <span className={`${ICON} text-[16px]`}>hourglass_top</span>
                      Chờ xác thực
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-secondary-teal font-semibold">
                      <span className={`${ICON} text-[16px]`}>check_circle</span>
                      Đã xác thực
                    </span>
                  )}
                />
                <MetaRow
                  icon="lan"
                  label="Địa chỉ IP gần nhất"
                  value={user.lastIp
                    ? <span className="font-mono text-ds-label-sm text-on-surface-variant">{user.lastIp}</span>
                    : <span className="text-on-surface-variant italic">Chưa có</span>}
                />
                {user.blockedUntil && (
                  <MetaRow
                    icon="timer_off"
                    label="Chặn đăng nhập tới"
                    value={<span className="text-error font-semibold">{fmtServer(user.blockedUntil)}</span>}
                  />
                )}
              </div>

              <div className="w-full flex flex-col gap-space-xs mt-space-lg">
                {user.locked || user.status === 'LOCKED' ? (
                  <button
                    type="button"
                    className={WIDE_BTN('bg-secondary-container text-on-secondary-container hover:brightness-95')}
                    disabled={ctrl.actionLoading}
                    onClick={() => { void submitUnlock(); }}
                  >
                    <span className={`${ICON} text-[18px]`}>lock_open</span>
                    <span>Mở khóa tài khoản</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className={WIDE_BTN('bg-error-container text-on-error-container hover:bg-error hover:text-on-error')}
                    disabled={ctrl.actionLoading}
                    onClick={() => { setLockReason(''); setLockOpen(true); }}
                  >
                    <span className={`${ICON} text-[18px]`}>lock</span>
                    <span>Khóa tài khoản</span>
                  </button>
                )}
                <button
                  type="button"
                  className={WIDE_BTN('bg-surface-container-high text-on-surface hover:bg-surface-container-highest')}
                  disabled={ctrl.actionLoading}
                  onClick={() => { setPendingRole(user.role); setRoleOpen(true); }}
                >
                  <span className={`${ICON} text-[18px]`}>manage_accounts</span>
                  <span>Đổi vai trò</span>
                </button>
              </div>
            </div>

            <div className={`${CARD} border border-surface-container-high/60 p-space-md flex flex-col gap-space-sm`}>
              <div className="flex items-center justify-between gap-space-sm">
                <div className="flex items-center gap-space-sm">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <span className={`${ICON} text-[20px]`}>psychology</span>
                  </div>
                  <div>
                    <div className="text-ds-headline-sm text-[13px] text-on-surface font-semibold">Chỉ số sẵn sàng AI</div>
                    <div className="text-ds-body-sm text-[12px] text-on-surface-variant">
                      Điểm trung bình các phiên phỏng vấn đã hoàn thành
                    </div>
                  </div>
                </div>
                <span className="text-ds-headline-sm text-primary font-bold text-[16px] whitespace-nowrap">
                  {readiness === null ? '—' : `${readiness}%`}
                </span>
              </div>
              <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden">
                <div className="bg-primary h-2 rounded-full" style={{ width: `${readiness ?? 0}%` }} />
              </div>
              <div className="text-ds-label-sm text-[11px] text-outline-strong">
                {readiness === null ? 'Tài khoản chưa có phiên nào được chấm điểm' : `Đo trên ${user.activity?.mockSessions ?? 0} phiên AI`}
              </div>
            </div>
          </div>

          {/* Cột phải: 3 tab */}
          <div className="lg:col-span-8 flex flex-col gap-space-md">
            <div className={`${CARD} p-1.5 flex items-center gap-1`}>
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-ds-label-lg transition-all flex items-center justify-center gap-2 border-0 cursor-pointer ${
                    tab === t.key
                      ? 'bg-primary-container text-on-primary shadow-sm'
                      : 'bg-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  <span className={`${ICON} text-[18px]`}>{t.icon}</span>
                  <span>{t.label}</span>
                  {t.key === 'history' && historyTotal > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      tab === t.key ? 'bg-white/20 text-on-primary' : 'bg-surface-container-highest text-on-surface'
                    }`}
                    >
                      {historyTotal}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {tab === 'info' && <InfoTab user={user} />}
            {tab === 'activity' && (
              <ActivityTab
                counts={user.activity}
                readiness={readiness}
                rows={activity ?? []}
                loading={activityLoading}
                onSeeAll={() => setTab('history')}
              />
            )}
            {tab === 'history' && (
              <div className={`${CARD} overflow-hidden`}>
                <div className="p-space-lg pb-space-sm flex items-center justify-between gap-space-md">
                  <div>
                    <h3 className="text-ds-headline-sm text-on-surface font-semibold flex items-center gap-2 m-0">
                      <span className={`${ICON} text-primary text-[20px]`}>manage_search</span>
                      Nhật ký kiểm toán &amp; Thay đổi tài khoản
                    </h3>
                    <p className="text-ds-body-sm text-on-surface-variant mt-0.5 mb-0">
                      Lưu vết tất cả các sự kiện thay đổi dữ liệu nhân thân và bảo mật
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Tải nhật ký trang này"
                    onClick={downloadHistory}
                    disabled={historyRows.length === 0}
                    className="p-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface transition-colors border-0 cursor-pointer disabled:opacity-40"
                  >
                    <span className={`${ICON} text-[18px]`}>download</span>
                  </button>
                </div>

                {historyLoading ? (
                  <LoadingBlock label="Đang tải lịch sử..." />
                ) : historyRows.length === 0 ? (
                  <EmptyBlock
                    icon="history"
                    title="Chưa có sự kiện kiểm toán"
                    description="Mọi thao tác quản trị trên tài khoản này sẽ xuất hiện tại đây."
                  />
                ) : (
                  <>
                    <div className="w-full overflow-x-auto">
                      <table className={`${adminTableClass} text-left text-ds-body-sm`}>
                        <thead className="bg-surface-container-low text-outline-strong text-ds-label-sm uppercase tracking-wider">
                          <tr>
                            {['Thời gian', 'Hành động', 'Chi tiết / Lý do', 'Người thực hiện', 'Trạng thái'].map((h) => (
                              <th key={h} className={`${adminThClass} bg-transparent`}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {historyRows.map((l) => (
                            <tr key={l.id} className="hover:bg-surface-container-low/50 transition-colors">
                              <td className={`${adminTdClass} text-on-surface font-medium whitespace-nowrap`} title={timeAgo(l.createdAt)}>
                                {fmtServer(l.createdAt)}
                              </td>
                              <td className={adminTdClass}>
                                <span className="inline-flex items-center gap-1 font-semibold text-primary">
                                  <span className={`${ICON} text-[16px]`}>{AUDIT_ACTION_ICON[l.action] ?? 'history'}</span>
                                  {AUDIT_ACTION_VN[l.action] ?? l.action}
                                </span>
                              </td>
                              <td className={`${adminTdClass} text-on-surface-variant max-w-sm break-words`}>
                                {l.detail || l.reason || '—'}
                              </td>
                              <td className={`${adminTdClass} text-on-surface font-medium whitespace-nowrap`}>{l.adminEmail}</td>
                              <td className={`${adminTdClass} whitespace-nowrap`}>
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-ds-label-sm font-semibold ${
                                  l.succeeded
                                    ? 'bg-secondary-container/50 text-secondary-teal'
                                    : 'bg-error-container text-on-error-container'
                                }`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${l.succeeded ? 'bg-secondary-teal' : 'bg-error'}`} />
                                  {l.succeeded ? 'Thành công' : 'Bị chặn'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="p-space-md bg-surface-container-low flex flex-wrap items-center justify-between gap-space-sm text-ds-label-sm text-on-surface-variant">
                      <span>
                        Hiển thị {historyRows.length} trên {historyTotal} bản ghi hệ thống
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className="px-2.5 py-1 rounded bg-surface-container-highest text-on-surface border-0 cursor-pointer disabled:opacity-50"
                          disabled={ctrl.auditPage <= 0}
                          onClick={() => loadHistory(ctrl.auditPage - 1)}
                        >
                          Trước
                        </button>
                        <button
                          type="button"
                          className="px-2.5 py-1 rounded bg-surface-container-highest text-on-surface border-0 cursor-pointer disabled:opacity-50"
                          disabled={ctrl.auditPage + 1 >= (ctrl.auditLogs?.totalPages ?? 1)}
                          onClick={() => loadHistory(ctrl.auditPage + 1)}
                        >
                          Sau
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* #lockAccountModal — lý do bắt buộc, email thông báo là tham số notifyUser thật của BE */}
      {lockOpen && user && (
        <ModalBackdrop onClose={() => setLockOpen(false)}>
          <div className="relative w-full max-w-md bg-surface-container-lowest rounded-xl p-space-lg shadow-xl flex flex-col gap-space-md">
            <div className="flex items-start gap-space-md">
              <div className="w-12 h-12 rounded-xl bg-error-container text-error flex items-center justify-center shrink-0">
                <span className={`${ICON} text-[28px]`}>warning</span>
              </div>
              <div className="flex flex-col">
                <h3 className="text-ds-headline-md text-on-surface font-bold tracking-tight m-0">Khóa tài khoản này?</h3>
                <p className="text-ds-body-sm text-on-surface-variant mt-1 leading-normal">
                  Bạn đang chuẩn bị khóa tài khoản của <strong>{user.fullName}</strong> (
                  <span className="font-mono text-outline-strong">{user.email}</span>
                  ). Người dùng sẽ không thể đăng nhập hoặc tham gia phỏng vấn sau khi tài khoản bị khóa.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-space-xs">
              <label htmlFor="lockReasonInput" className="text-ds-label-md text-on-surface font-semibold flex items-center justify-between">
                <span>
                  Lý do khóa tài khoản <span className="text-error">*</span>
                </span>
                <span className="text-ds-body-sm text-outline-strong">Bắt buộc</span>
              </label>
              <textarea
                id="lockReasonInput"
                value={lockReason}
                onChange={(e) => setLockReason(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="VD: Nhiều lần đoán mật khẩu bất thường, nghi vấn gian lận bài thi..."
                className="w-full p-space-sm bg-surface-container-low text-on-surface placeholder:text-outline-strong text-ds-body-md rounded-lg focus:outline-none focus:ring-2 focus:ring-error transition resize-none border-0"
              />
              <span className="text-ds-label-sm text-outline-strong">
                Lý do này sẽ được ghi vào nhật ký kiểm toán và gửi qua email cho người dùng nếu chọn thông báo.
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {['Spam đơn ứng tuyển', 'Vi phạm bản quyền JD', 'Yêu cầu an ninh'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setLockReason(`Khóa tài khoản do: ${s.toLowerCase()}.`)}
                  className="px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest text-ds-label-sm transition-colors border-0 cursor-pointer"
                >
                  + {s}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-space-xs cursor-pointer select-none">
              <input
                type="checkbox"
                checked={notifyUser}
                onChange={(e) => setNotifyUser(e.target.checked)}
                className="h-4 w-4 rounded accent-primary-container"
              />
              <span className="text-ds-body-sm text-on-surface">Gửi thông báo qua email cho người dùng</span>
            </label>

            <div className="flex items-center justify-end gap-space-sm mt-space-sm pt-space-sm border-t border-surface-container-high">
              <button type="button" className={modalCancelClass} onClick={() => setLockOpen(false)}>Hủy bỏ</button>
              <button
                type="button"
                className={modalDangerClass}
                disabled={!lockReason.trim()}
                onClick={() => { void submitLock(); }}
              >
                <span className={`${ICON} text-[18px]`}>lock</span>
                Xác nhận khóa
              </button>
            </div>
          </div>
        </ModalBackdrop>
      )}

      {/* #modal-change-role */}
      {roleOpen && user && (
        <ModalBackdrop onClose={() => setRoleOpen(false)}>
          <div className="bg-surface-container-lowest rounded-xl shadow-2xl w-full max-w-lg p-space-xl flex flex-col gap-space-lg">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-space-md">
                <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary shrink-0">
                  <span className={`${ICON} text-[24px]`}>manage_accounts</span>
                </div>
                <div className="flex flex-col">
                  <h3 className="text-ds-headline-sm text-on-surface font-bold m-0">Thay đổi vai trò người dùng</h3>
                  <span className="text-ds-body-sm text-on-surface-variant">
                    Áp dụng cho {user.fullName} — phân quyền áp dụng ngay khi lưu
                  </span>
                </div>
              </div>
              <button
                type="button"
                aria-label="Đóng"
                onClick={() => setRoleOpen(false)}
                className="text-on-surface-variant hover:text-on-surface bg-transparent border-0 cursor-pointer"
              >
                <span className={`${ICON} text-[20px]`}>close</span>
              </button>
            </div>

            <div className="flex flex-col gap-space-sm">
              {ROLE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center justify-between p-space-md rounded-xl cursor-pointer transition-all border ${
                    pendingRole === opt.value
                      ? 'bg-surface-container-high border-primary'
                      : 'bg-surface-container-low border-transparent hover:bg-surface-container-high/60'
                  }`}
                >
                  <span className="flex items-center gap-space-md">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${ROLE_AVATAR[opt.value]}`}>
                      <span className={`${ICON} text-[18px]`}>{ROLE_ICON[opt.value]}</span>
                    </span>
                    <span className="flex flex-col">
                      <span className="text-ds-label-lg text-on-surface">{opt.label}</span>
                      <span className="text-ds-body-sm text-on-surface-variant">{ROLE_DESCRIPTION[opt.value]}</span>
                    </span>
                  </span>
                  <input
                    type="radio"
                    name="detail-role"
                    className="accent-primary-container"
                    checked={pendingRole === opt.value}
                    onChange={() => setPendingRole(opt.value)}
                  />
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-space-sm pt-2">
              <button type="button" className={modalCancelClass} onClick={() => setRoleOpen(false)}>Hủy</button>
              <button
                type="button"
                className={modalPrimaryClass}
                disabled={pendingRole === user.role || ctrl.actionLoading}
                onClick={() => { void submitRole(); }}
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </ModalBackdrop>
      )}
    </div>
  );
};

// ── Tab Thông tin ───────────────────────────────────────────────────────────

/** 009: phone + toàn bộ ô nghề nghiệp/kỹ năng/CV lấy từ `user.profile`; chỉ ngày sinh và nơi cư trú là demo. */
const InfoTab: React.FC<{ user: UserDetail }> = ({ user }) => {
  const profile = user.profile;
  return (
    <div className="flex flex-col gap-space-md">
    <div className={`${CARD} p-space-lg flex flex-col gap-space-md`}>
      <div className="flex items-center justify-between pb-space-sm border-b border-surface-container-high gap-space-sm">
        <div className="flex items-center gap-space-xs">
          <span className={`${ICON} text-primary text-[20px]`}>account_box</span>
          <h3 className="text-ds-headline-sm text-on-surface font-semibold m-0">Thông tin cá nhân &amp; Nghề nghiệp</h3>
        </div>
        <span className="text-ds-label-sm text-on-surface-variant bg-surface-container-high px-2.5 py-1 rounded-md whitespace-nowrap">
          Chỉ xem (Read-only)
        </span>
        <DemoTag>Khối demo — riêng ngày sinh, nơi cư trú (BE không có cột)</DemoTag>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
        <InfoField label="Số điện thoại">
          {user.phone || <span className="text-on-surface-variant italic">Chưa cập nhật</span>}
        </InfoField>
        <InfoField label="Ngày sinh">18/09/1998 (28 tuổi)</InfoField>
        <InfoField label="Địa điểm cư trú">
          <span className="flex items-center gap-1">
            <span className={`${ICON} text-[16px] text-secondary-teal`}>location_on</span>
            Hà Nội, Việt Nam
          </span>
        </InfoField>
        <InfoField label="Kinh nghiệm làm việc">
          {profile?.experienceYears != null
            ? `${profile.experienceYears} năm kinh nghiệm`
            : <span className="text-on-surface-variant italic">Chưa cập nhật</span>}
        </InfoField>
      </div>

      <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col gap-1.5 mt-1">
        <span className={`${FIELD_LABEL} flex items-center gap-1`}>
          <span className={`${ICON} text-[16px] text-primary`}>target</span>
          Mục tiêu nghề nghiệp
        </span>
        <p className="text-ds-body-md text-on-surface leading-relaxed m-0 break-words">
          {profile?.careerGoal || <span className="text-on-surface-variant italic">Tài khoản chưa điền mục tiêu nghề nghiệp.</span>}
        </p>
      </div>

      {profile?.summary && (
        <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col gap-1.5">
          <span className={`${FIELD_LABEL} flex items-center gap-1`}>
            <span className={`${ICON} text-[16px] text-primary`}>person</span>
            Mô tả bản thân
          </span>
          <p className="text-ds-body-md text-on-surface leading-relaxed m-0 break-words">{profile.summary}</p>
        </div>
      )}

      <div className="flex flex-col gap-space-xs mt-2">
        <div className="flex items-center justify-between gap-space-sm">
          <span className={FIELD_LABEL}>Kỹ năng tự khai</span>
          <span className="text-ds-label-sm text-on-surface-variant">
            {(profile?.skills.length ?? 0) > 0 ? `${profile?.skills.length} kỹ năng` : 'Chưa có kỹ năng'}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {(profile?.skills ?? []).map((s) => (
            <span key={s} className="px-3 py-1.5 rounded-full bg-surface-container-high text-on-surface text-ds-label-md">
              {s}
            </span>
          ))}
          {!(profile?.skills.length) && (
            <span className="text-ds-body-sm text-on-surface-variant italic">
              Tài khoản chưa tạo hồ sơ ứng viên nên danh sách kỹ năng đang trống.
            </span>
          )}
        </div>
      </div>
    </div>

    <div className={`${CARD} p-space-lg flex flex-col gap-space-sm`}>
      <div className="flex items-center justify-between pb-space-xs border-b border-surface-container-high gap-space-sm">
        <span className="text-ds-headline-sm text-on-surface font-semibold flex items-center gap-2">
          <span className={`${ICON} text-error text-[20px]`}>description</span>
          Hồ sơ ứng tuyển đính kèm (CV)
        </span>
        <span className="text-ds-label-sm text-secondary-teal font-medium">
          {profile?.updatedAt ? `Bản cập nhật: ${fmtServer(profile.updatedAt, 'date')}` : 'Chưa có tệp'}
        </span>
      </div>
      <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high/60 flex flex-col sm:flex-row sm:items-center justify-between gap-space-md mt-1">
        <div className="flex items-center gap-space-md min-w-0 flex-1">
          <div className="w-12 h-12 rounded-xl bg-error-container text-error flex items-center justify-center shrink-0 shadow-sm">
            <span className={`${ICON} text-[26px]`}>picture_as_pdf</span>
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <div className="text-ds-headline-sm text-[14px] text-on-surface font-semibold truncate">
              {profile?.cvFileName || <span className="text-on-surface-variant italic font-normal">Tài khoản chưa tải tệp CV nào</span>}
            </div>
            {profile?.cvFileName && (
              <div className="text-ds-body-sm text-on-surface-variant mt-0.5">
                BE chỉ lưu tên tệp — không có dung lượng, không có API tải tệp nên không mở được từ màn này.
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 sm:self-center">
          <button
            type="button"
            disabled
            title="Chưa có API tệp CV"
            className="inline-flex items-center gap-1.5 px-space-md py-2 rounded-lg bg-surface-container-high text-outline-strong text-ds-label-md border border-surface-container-high cursor-not-allowed"
          >
            <span className={`${ICON} text-[18px]`}>visibility</span>
            <span>Xem trước</span>
          </button>
          <button
            type="button"
            disabled
            title="Chưa có API tệp CV"
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-surface-container-high text-outline-strong text-ds-label-md shadow-sm border-0 cursor-not-allowed"
          >
            <span className={`${ICON} text-[18px]`}>download</span>
            <span>Tải về</span>
          </button>
        </div>
      </div>
    </div>
  </div>
  );
};

// ── Tab Hoạt động ───────────────────────────────────────────────────────────

const ActivityCard: React.FC<{
  label: string; icon: string; chip: string; value: string; children?: React.ReactNode;
}> = ({ label, icon, chip, value, children }) => (
  <div className={`${CARD} p-space-md flex flex-col justify-between`}>
    <div className="flex items-center justify-between gap-space-sm">
      <span className={`${FIELD_LABEL} font-semibold`}>{label}</span>
      <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${chip}`}>
        <span className={`${ICON} text-[18px]`}>{icon}</span>
      </span>
    </div>
    <div className="mt-space-sm">
      <div className="text-ds-headline-xl text-on-surface font-bold">{value}</div>
      {children && <div className="text-ds-body-sm text-on-surface-variant mt-1 flex flex-wrap gap-1">{children}</div>}
    </div>
  </div>
);

const TimelineEntry: React.FC<{ dot: string; time: string; tag: string; tagClass: string; title: string; body?: React.ReactNode }> = ({
  dot, time, tag, tagClass, title, body,
}) => (
  <div className="relative flex flex-col gap-1">
    <span className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full ring-4 ring-surface-container-lowest ${dot}`} />
    <div className="flex items-center gap-space-sm">
      <span className="text-ds-label-sm text-outline-strong font-semibold">{time}</span>
      <span className={`px-2 py-0.5 rounded-full text-[11px] ${tagClass}`}>{tag}</span>
    </div>
    <div className="text-ds-headline-sm text-[14px] text-on-surface font-medium">{title}</div>
    {body && <div className="text-ds-body-sm text-on-surface-variant">{body}</div>}
  </div>
);

const ACTIVITY_META: Record<UserActivityRow['type'], { dot: string; tag: string; tagClass: string }> = {
  APPLICATION: { dot: 'bg-tertiary', tag: 'Tuyển dụng', tagClass: 'bg-tertiary-fixed text-on-tertiary-fixed' },
  MOCK_SESSION: { dot: 'bg-primary', tag: 'Mock Interview', tagClass: 'bg-primary-fixed text-on-primary-fixed' },
  INTERVIEW_SLOT: { dot: 'bg-secondary-teal', tag: 'Lịch hẹn', tagClass: 'bg-secondary-container/40 text-secondary-teal' },
};

/** `status` là nguyên văn enum nguồn (ApplicationStatus / InterviewSessionStatus / "BOOKED"). */
const ACTIVITY_STATUS_VN: Record<string, string> = {
  PENDING: 'Chờ doanh nghiệp xét',
  SHORTLISTED: 'Sơ loại đạt',
  INTERVIEWED: 'Đã phỏng vấn',
  ACCEPTED: 'Đạt',
  REJECTED: 'Không đạt',
  CANCELLED: 'Đã rút',
  IN_PROGRESS: 'Đang diễn ra',
  COMPLETED: 'Hoàn thành',
  BOOKED: 'Đã đặt lịch',
};

const ActivityTab: React.FC<{
  counts: UserDetail['activity'];
  readiness: number | null;
  rows: UserActivityRow[];
  loading: boolean;
  onSeeAll: () => void;
}> = ({ counts, readiness, rows, loading, onSeeAll }) => (
  <div className="flex flex-col gap-space-md">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
      <ActivityCard label="Đơn ứng tuyển" icon="send" chip="bg-primary-fixed text-primary" value={`${(counts?.applications ?? 0).toLocaleString('vi-VN')} đơn`} />
      <ActivityCard
        label="Phiên AI Interview"
        icon="smart_toy"
        chip="bg-secondary-container/40 text-secondary-teal"
        value={`${(counts?.mockSessions ?? 0).toLocaleString('vi-VN')} phiên`}
      >
        {readiness === null
          ? <span>Chưa có phiên nào được chấm điểm</span>
          : (
            <span>
              Điểm TB: <span className="font-bold text-secondary-teal">{readiness}/100</span>
            </span>
          )}
      </ActivityCard>
      <ActivityCard label="Lịch hẹn phỏng vấn" icon="event" chip="bg-tertiary-fixed text-tertiary" value={`${(counts?.bookedInterviews ?? 0).toLocaleString('vi-VN')} buổi`} />
    </div>

    <div className={`${CARD} p-space-lg flex flex-col gap-space-md`}>
      <div className="flex items-center justify-between pb-space-xs border-b border-surface-container-high gap-space-sm">
        <h3 className="text-ds-headline-sm text-on-surface font-semibold flex items-center gap-2 m-0">
          <span className={`${ICON} text-primary text-[20px]`}>timeline</span>
          Dòng thời gian các hành động gần đây
        </h3>
        <button
          type="button"
          onClick={onSeeAll}
          className="text-primary hover:underline text-ds-label-md font-semibold bg-transparent border-0 cursor-pointer"
        >
          Xem tất cả
        </button>
      </div>

      {loading ? (
        <LoadingBlock label="Đang tải dòng thời gian..." />
      ) : rows.length === 0 ? (
        <EmptyBlock
          icon="timeline"
          title="Chưa có hoạt động nào"
          description="Tài khoản này chưa nộp đơn, chưa tham gia phiên luyện tập và chưa đặt lịch phỏng vấn."
        />
      ) : (
        <div className="relative pl-6 flex flex-col gap-space-lg before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-container-high">
          {rows.map((row) => {
            const meta = ACTIVITY_META[row.type] ?? ACTIVITY_META.APPLICATION;
            return (
              <TimelineEntry
                key={`${row.type}-${row.id}`}
                dot={meta.dot}
                time={timeLabel(row.occurredAt)}
                tag={meta.tag}
                tagClass={meta.tagClass}
                title={row.title ?? '—'}
                body={row.status
                  ? `Trạng thái: ${ACTIVITY_STATUS_VN[row.status] ?? row.status}`
                  : undefined}
              />
            );
          })}
        </div>
      )}
      <p className="text-ds-label-sm text-outline-strong m-0">
        Hiển thị 10 sự kiện gần nhất; nguồn là đơn ứng tuyển, phiên luyện tập và lịch hẹn đã đặt.
      </p>
    </div>
  </div>
);

export default AdminUserDetailPage;
