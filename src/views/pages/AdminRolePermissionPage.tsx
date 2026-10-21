import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminService from '../../services/admin.service';
import { PermissionMatrix } from '../../models/AdminConsole.model';
import {
  ICON,
  LoadingBlock,
  adminButton,
  errorText,
} from '../components/adminKit';

/**
 * Phân quyền hệ thống (mockup Stitch `phân quyền hệ thống`) — DATA page.
 * Nguồn số thật: GET /admin/permissions/matrix -> 4 vai trò + userCount thật, 9 module × 5 hành động,
 * mỗi ô là `granted[role]` dẫn xuất từ @PreAuthorize trong code BE (không phải bảng DB).
 * Vì matrix là code nên FE hiển thị READ-ONLY: checkbox/toggle không sửa được và nút Lưu bị khóa.
 * Khác mockup (ghi ở spec/INDEX.md):
 *   - Mockup 3 thẻ vai trò, BE trả 4 (thêm Nhân viên vận hành) -> grid 3 cột, thẻ thứ tư tự xuống hàng.
 *   - Mockup có ô "Không áp dụng" (remove) -> ánh xạ từ hành động mà BE không cấp cho vai trò nào.
 *   - Mô tả module không có trong payload -> lấy theo chuỗi mockup cho module trùng key.
 *   - "Thêm vai trò" và thanh Lưu: BE chưa có API ghi phân quyền -> nút khóa kèm giải thích.
 */

const ROLE_ORDER = ['ROLE_USER', 'ROLE_INTERVIEWER', 'ROLE_STAFF', 'ROLE_ADMIN'] as const;

const ACTIONS: { key: string; label: string; icon: string; iconClass: string }[] = [
  { key: 'VIEW', label: 'Xem', icon: 'visibility', iconClass: 'text-primary' },
  { key: 'CREATE', label: 'Tạo', icon: 'add_circle', iconClass: 'text-secondary-teal' },
  { key: 'UPDATE', label: 'Sửa', icon: 'edit_square', iconClass: 'text-tertiary' },
  { key: 'DELETE', label: 'Xóa', icon: 'delete', iconClass: 'text-error' },
  { key: 'APPROVE', label: 'Duyệt', icon: 'verified', iconClass: 'text-primary-container' },
];

const MODULE_ICON: Record<string, { icon: string; cls: string }> = {
  'candidate-profile': { icon: 'badge', cls: 'bg-surface-container text-primary' },
  jobs: { icon: 'description', cls: 'bg-surface-container text-secondary-teal' },
  applications: { icon: 'assignment_ind', cls: 'bg-surface-container text-tertiary-container' },
  slots: { icon: 'calendar_month', cls: 'bg-surface-container text-primary' },
  'mock-interviews': { icon: 'smart_toy', cls: 'bg-secondary-container/60 text-secondary-teal' },
  'packages-orders': { icon: 'shopping_bag', cls: 'bg-surface-container text-primary-container' },
  reviews: { icon: 'rate_review', cls: 'bg-surface-container text-primary-container' },
  'bug-reports': { icon: 'bug_report', cls: 'bg-surface-container text-error' },
  'admin-console': { icon: 'manage_accounts', cls: 'bg-surface-container-high text-outline-strong' },
};

const MODULE_DESC: Record<string, string> = {
  'candidate-profile': 'Truy xuất thông tin chi tiết ứng viên, tải CV gốc và hồ sơ kỹ năng trích xuất bởi AI',
  jobs: 'Soạn thảo, xuất bản vị trí tuyển dụng, chỉnh sửa bộ câu hỏi phỏng vấn chuẩn hóa',
  applications: 'Theo dõi luồng ứng viên qua các phễu tuyển dụng, sàng lọc và phân loại trạng thái',
  slots: 'Tạo slot rảnh cho chuyên gia, gửi lời mời phỏng vấn và đồng bộ lịch',
  'mock-interviews': 'Xem video ghi hình, bản transcript giọng nói và điểm radar năng lực AI đánh giá',
  'packages-orders': 'Danh mục gói dịch vụ, đơn hàng và hạn mức sử dụng của doanh nghiệp',
  reviews: 'Đánh giá sau phiên phỏng vấn và phản hồi của người dùng gửi về hệ thống',
  'bug-reports': 'Tiếp nhận báo lỗi từ người dùng và cập nhật trạng thái xử lý',
  'admin-console': 'Toàn bộ endpoint /admin: kiểm duyệt JD, audit log, cấu hình hệ thống',
};

const MODULE_TAG: Record<string, { label: string; cls: string }> = {
  'mock-interviews': { label: 'AI Core', cls: 'bg-secondary-container text-on-secondary-container' },
};

const ROLE_CARD: Record<string, { icon: string; iconCls: string; chip: string; chipCls: string; dot: string; countCls: string; desc: string }> = {
  ROLE_USER: {
    icon: 'person', iconCls: 'bg-surface-container text-primary',
    chip: 'Mặc định hệ thống', chipCls: 'bg-surface-container-low text-on-surface-variant',
    dot: 'bg-secondary-teal', countCls: 'text-secondary-teal',
    desc: 'Quyền tìm việc làm, nộp CV trực tuyến, trải nghiệm phòng phỏng vấn giả lập AI và tham gia lịch phỏng vấn chính thức.',
  },
  ROLE_INTERVIEWER: {
    icon: 'apartment', iconCls: 'bg-primary-container text-on-primary',
    chip: 'Doanh nghiệp', chipCls: 'bg-secondary-container text-on-secondary-container',
    dot: 'bg-primary', countCls: 'text-primary font-semibold',
    desc: 'Quyền đăng tin JD, tiếp nhận & duyệt hồ sơ ứng viên, đặt lịch phỏng vấn vòng chuyên môn và xem phân tích AI.',
  },
  ROLE_STAFF: {
    icon: 'badge', iconCls: 'bg-surface-container text-tertiary-container',
    chip: 'Vận hành', chipCls: 'bg-surface-container-high text-on-surface-variant',
    dot: 'bg-tertiary', countCls: 'text-tertiary',
    desc: 'Kiểm duyệt tin tuyển dụng, xử lý phản ánh và hỗ trợ vận hành hằng ngày; không truy cập cấu hình hệ thống.',
  },
  ROLE_ADMIN: {
    icon: 'admin_panel_settings', iconCls: 'bg-surface-container text-tertiary-container',
    chip: 'Toàn quyền SuperAdmin', chipCls: 'bg-error-container text-on-error-container',
    dot: 'bg-outline-strong', countCls: 'text-outline-strong',
    desc: 'Toàn quyền hệ thống, phê duyệt tin tuyển dụng, phân quyền phân vai, cấu hình mô hình AI và xem audit logs.',
  },
};

type CellKind = 'grant' | 'na' | 'lock';

const roleSorted = (matrix: PermissionMatrix) =>
  [...matrix.roles].sort(
    (a, b) => ROLE_ORDER.indexOf(a.role as (typeof ROLE_ORDER)[number]) - ROLE_ORDER.indexOf(b.role as (typeof ROLE_ORDER)[number]),
  );

const actionOf = (module: PermissionMatrix['modules'][number], key: string) =>
  module.actions.find((a) => a.action === key) ?? null;

const cellKindOf = (
  adminOnly: boolean,
  role: string,
  granted: Record<string, boolean> | null,
): CellKind => {
  if (!granted) return 'na';
  const anyone = ROLE_ORDER.some((r) => granted[r]);
  if (!anyone) return 'na';
  if (adminOnly && role !== 'ROLE_ADMIN') return 'lock';
  return 'grant';
};

const AdminRolePermissionPage: React.FC = () => {
  const [matrix, setMatrix] = useState<PermissionMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roleId, setRoleId] = useState<string>('ROLE_INTERVIEWER');
  const [filter, setFilter] = useState<'all' | 'granted' | 'restricted'>('all');
  const [showDesc, setShowDesc] = useState(true);
  const [bannerOpen, setBannerOpen] = useState(true);
  const [search, setSearch] = useState('');

  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await AdminService.getPermissionMatrix();
      if (!alive.current) return;
      const body = res.data.data!;
      setMatrix(body);
      if (!body.roles.some((r) => r.role === roleId)) {
        setRoleId(body.roles[0]?.role ?? 'ROLE_INTERVIEWER');
      }
    } catch (err) {
      if (alive.current) setError(errorText(err, 'Không tải được ma trận phân quyền.'));
    } finally {
      if (alive.current) setLoading(false);
    }
  }, [roleId]);

  useEffect(() => {
    void load();
  }, []);

  const roles = useMemo(() => (matrix ? roleSorted(matrix) : []), [matrix]);

  const modules = useMemo(() => {
    if (!matrix) return [];
    const kw = search.trim().toLowerCase();
    return matrix.modules.filter((m) => {
      if (kw && m.label.toLowerCase().indexOf(kw) === -1 && m.key.toLowerCase().indexOf(kw) === -1) return false;
      if (filter === 'restricted') return m.adminOnly;
      if (filter === 'granted') {
        return m.actions.some((a) => cellKindOf(m.adminOnly, roleId, a.granted) === 'grant' && a.granted[roleId]);
      }
      return true;
    });
  }, [filter, matrix, roleId, search]);

  const grantedCount = useMemo(() => {
    if (!matrix) return { granted: 0, total: 0 };
    let granted = 0;
    let total = 0;
    matrix.modules.forEach((m) => {
      ACTIONS.forEach((a) => {
        const act = actionOf(m, a.key);
        const kind = cellKindOf(m.adminOnly, roleId, act ? act.granted : null);
        if (kind !== 'grant') return;
        total += 1;
        if (act && act.granted[roleId]) granted += 1;
      });
    });
    return { granted, total };
  }, [matrix, roleId]);

  const activeRole = roles.find((r) => r.role === roleId) ?? null;

  const exportCsv = () => {
    if (!matrix) return;
    const header = ['Module', 'Hành động', ...roles.map((r) => r.label)];
    const body: (string | number)[][] = [];
    matrix.modules.forEach((m) => {
      ACTIONS.forEach((a) => {
        const act = actionOf(m, a.key);
        if (!act) {
          body.push([m.label, a.label, ...roles.map(() => 'N/A')]);
          return;
        }
        body.push([
          m.label,
          a.label,
          ...roles.map((r) => {
            const kind = cellKindOf(m.adminOnly, r.role, act.granted);
            if (kind === 'na') return 'N/A';
            if (kind === 'lock') return 'Admin only';
            return act.granted[r.role] ? 'Yes' : 'No';
          }),
        ]);
      });
    });
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [header, ...body].map((row) => row.map(esc).join(',')).join('\r\n');
    const blob = new Blob([`${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ma-tran-phan-quyen.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col w-full">
      <div className="px-space-xl py-space-lg flex flex-col gap-space-lg">
        {/* Header */}
        <div className="flex flex-col gap-space-xs">
          <nav className="flex items-center gap-space-xs text-ds-label-md text-outline-strong">
            <span>Hệ thống</span>
            <span className={`${ICON} text-[16px] text-outline-variant`}>chevron_right</span>
            <span className="text-on-surface font-semibold">Phân quyền & Vai trò</span>
          </nav>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md pt-space-xs">
            <div>
              <h1 className="text-ds-headline-xl text-on-surface tracking-tight font-bold">Phân quyền hệ thống</h1>
              <p className="text-ds-body-md text-on-surface-variant mt-0.5">
                Quản lý quyền truy cập theo vai trò và kiểm soát phạm vi hoạt động của người dùng trên nền tảng
              </p>
            </div>
            <div className="flex items-center gap-space-sm flex-wrap">
              <div className="relative w-64">
                <span className={`${ICON} absolute left-space-sm top-1/2 -translate-y-1/2 text-outline-strong pointer-events-none text-[18px]`}>
                  search
                </span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm module..."
                  className="w-full h-10 pl-10 pr-3 rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface text-ds-body-sm focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                />
              </div>
              <button type="button" onClick={exportCsv} disabled={!matrix} className={adminButton('ghost', 'disabled:opacity-50')}>
                <span className={`${ICON} text-[18px]`}>download</span>
                Xuất ma trận
              </button>
              <button
                type="button"
                disabled
                title="Backend chưa có API tạo vai trò — 4 vai trò hệ thống là builtin"
                className={`${adminButton('primary')} disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <span className={`${ICON} text-[18px]`}>add_moderator</span>
                Thêm vai trò
              </button>
            </div>
          </div>
        </div>

        {/* Banner RBAC */}
        {bannerOpen && (
          <div className="bg-surface-container-high rounded-xl p-space-md flex items-start justify-between gap-space-md shadow-sm">
            <div className="flex items-start gap-space-md">
              <div className="w-9 h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center shrink-0 mt-0.5">
                <span className={`${ICON} text-[20px]`}>shield</span>
              </div>
              <div className="flex flex-col">
                <span className="text-ds-headline-sm text-on-surface font-semibold">
                  Chính sách bảo mật phân quyền RBAC (Role-Based Access Control)
                </span>
                <p className="text-ds-body-sm text-on-surface-variant mt-1 leading-relaxed">
                  Bất kỳ nỗ lực truy cập tính năng, thực thi truy vấn hoặc gọi API trái phép ngoài cấu hình phân quyền bên dưới sẽ bị hệ
                  thống tự động từ chối (
                  <code className="bg-surface-container-lowest px-1.5 py-0.5 rounded text-primary font-mono text-[11px] font-bold">403 Forbidden</code>
                  ). Ma trận này đọc trực tiếp từ cấu hình bảo mật của backend nên chỉ hiển thị, không chỉnh sửa tại đây.
                </p>
              </div>
            </div>
            <button type="button" aria-label="Đóng" onClick={() => setBannerOpen(false)} className="text-outline-strong hover:text-on-surface transition-colors p-1">
              <span className={`${ICON} text-[20px]`}>close</span>
            </button>
          </div>
        )}

        {error && (
          <div className="flex items-start justify-between gap-space-md rounded-xl bg-error-container px-4 py-3 text-ds-body-md text-on-error-container">
            <span className="flex items-start gap-2">
              <span className={`${ICON} text-[20px]`}>error</span>
              <span>{error}</span>
            </span>
            <button type="button" onClick={() => void load()} className={adminButton('ghost', 'h-9 shrink-0')}>
              <span className={`${ICON} text-[18px]`}>refresh</span>Thử lại
            </button>
          </div>
        )}

        {loading && !matrix ? (
          <LoadingBlock label="Đang tải ma trận phân quyền..." />
        ) : matrix ? (
          <>
            {/* Thẻ vai trò */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg">
              {roles.map((r) => {
                const card = ROLE_CARD[r.role] ?? ROLE_CARD.ROLE_USER;
                const active = r.role === roleId;
                return (
                  <div
                    key={r.role}
                    className={`bg-surface-container-lowest rounded-xl p-space-lg flex flex-col justify-between relative transition-shadow ${
                      active ? 'shadow-md ring-2 ring-primary' : 'shadow-sm hover:shadow-md'
                    }`}
                  >
                    {active && (
                      <span className="absolute -top-3 left-space-lg px-space-sm py-0.5 rounded-full bg-primary text-on-primary text-ds-label-sm font-bold flex items-center gap-1 shadow-sm">
                        <span className={`${ICON} text-[14px]`}>check_circle</span>
                        Đang chọn cấu hình
                      </span>
                    )}
                    <div>
                      <div className="flex items-start justify-between mb-space-md">
                        <button
                          type="button"
                          aria-label={`Chọn vai trò ${r.label}`}
                          onClick={() => setRoleId(r.role)}
                          className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.iconCls} ${active ? '' : 'hover:scale-105 transition-transform'}`}
                        >
                          <span className={`${ICON} text-[26px]`}>{card.icon}</span>
                        </button>
                        <span className={`px-space-sm py-1 rounded-full text-ds-label-sm font-medium ${card.chipCls}`}>{card.chip}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <h3 className="text-ds-headline-md text-on-surface font-bold">{r.label}</h3>
                        <div className={`flex items-center gap-space-xs text-ds-label-md ${card.countCls}`}>
                          <span className={`w-2 h-2 rounded-full ${card.dot}`} />
                          <span>{r.userCount.toLocaleString('vi-VN')} người dùng</span>
                          {r.builtin && <span className="text-outline-strong">• builtin</span>}
                        </div>
                        <p className="text-ds-body-sm text-on-surface-variant mt-space-sm leading-relaxed">{card.desc}</p>
                      </div>
                    </div>
                    <div className="pt-space-lg">
                      <button
                        type="button"
                        onClick={() => setRoleId(r.role)}
                        className={
                          active
                            ? 'w-full h-10 rounded-lg text-ds-label-lg text-on-primary bg-primary hover:bg-primary-container transition-colors flex items-center justify-center gap-space-xs shadow-sm'
                            : 'w-full h-10 rounded-lg text-ds-label-lg text-on-surface bg-surface-container-low hover:bg-surface-container transition-colors flex items-center justify-center gap-space-xs'
                        }
                      >
                        {active ? (
                          <>
                            <span className={`${ICON} text-[18px]`}>edit_note</span>
                            Đang xem ma trận vai trò này
                          </>
                        ) : (
                          <>
                            Xem quyền hạn
                            <span className={`${ICON} text-[16px]`}>arrow_forward</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Ma trận quyền hạn */}
            <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col mb-24">
              <div className="p-space-lg bg-surface-container-low/50 flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
                <div className="flex items-center gap-space-md flex-wrap">
                  <div className="flex items-center gap-space-xs">
                    <h2 className="text-ds-headline-md text-on-surface font-bold">Ma trận quyền hạn</h2>
                    <span className="px-space-sm py-0.5 rounded-full bg-surface-container text-ds-label-sm text-primary font-bold">
                      {grantedCount.granted} / {grantedCount.total} quyền được cấp
                    </span>
                  </div>
                  <span className="text-outline-strong text-ds-label-sm hidden sm:inline">•</span>
                  <span className="text-ds-body-sm text-on-surface-variant hidden sm:inline">
                    Phạm vi tác động: {activeRole ? activeRole.label : '—'}
                  </span>
                </div>
                <div className="flex items-center gap-space-sm flex-wrap">
                  <button type="button" onClick={() => setShowDesc((v) => !v)} className={`${adminButton('soft')} h-9`}>
                    <span className={`${ICON} text-[16px]`}>{showDesc ? 'unfold_less' : 'unfold_more'}</span>
                    {showDesc ? 'Thu gọn mô tả' : 'Hiện mô tả'}
                  </button>
                  <div className="relative">
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value as typeof filter)}
                      className="h-9 pl-space-md pr-8 rounded-lg text-ds-label-md bg-surface-container-lowest text-on-surface shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary-container cursor-pointer border-0"
                    >
                      <option value="all">Lọc module: Tất cả ({matrix.modules.length} modules)</option>
                      <option value="granted">Chỉ hiển thị module có quyền</option>
                      <option value="restricted">Module giới hạn cho Admin</option>
                    </select>
                    <span className={`${ICON} text-outline-strong absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[16px]`}>
                      expand_more
                    </span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low text-ds-label-md text-on-surface-variant uppercase tracking-wider">
                      <th className="py-space-md px-space-lg w-2/5">Module & Nhóm tính năng</th>
                      {ACTIONS.map((a) => (
                        <th key={a.key} className="py-space-md px-space-md text-center w-[12%]">
                          <span className="flex items-center justify-center gap-1">
                            <span className={`${ICON} text-[16px] ${a.iconClass}`}>{a.icon}</span>
                            {a.label}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container text-ds-body-sm text-on-surface">
                    {modules.length === 0 && (
                      <tr>
                        <td colSpan={ACTIONS.length + 1} className="py-space-2xl px-space-lg text-center text-on-surface-variant">
                          Không có module nào khớp bộ lọc.
                        </td>
                      </tr>
                    )}
                    {modules.map((m) => {
                      const meta = MODULE_ICON[m.key] ?? { icon: 'apps', cls: 'bg-surface-container text-primary' };
                      const tag = m.adminOnly
                        ? { label: 'Admin Only', cls: 'bg-error-container text-on-error-container' }
                        : MODULE_TAG[m.key] ?? null;
                      const locked = m.adminOnly && roleId !== 'ROLE_ADMIN';
                      return (
                        <tr key={m.key} className={`transition-colors ${locked ? 'bg-surface-container-low/20' : 'hover:bg-surface-container-low/40'}`}>
                          <td className="py-space-md px-space-lg">
                            <div className="flex items-start gap-space-md">
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${locked ? 'bg-surface-container-high text-outline-strong' : meta.cls}`}>
                                <span className={`${ICON} text-[20px]`}>{meta.icon}</span>
                              </div>
                              <div>
                                <div className="flex items-center gap-space-xs">
                                  <span className={`text-ds-headline-sm font-semibold ${locked ? 'text-on-surface-variant' : 'text-on-surface'}`}>
                                    {m.label}
                                  </span>
                                  {tag && (
                                    <span className={`px-1.5 py-0.5 rounded text-ds-label-sm font-bold ${tag.cls}`}>{tag.label}</span>
                                  )}
                                </div>
                                {showDesc && MODULE_DESC[m.key] && (
                                  <p className={`text-ds-body-sm mt-0.5 ${locked ? 'text-outline-strong' : 'text-on-surface-variant'}`}>
                                    {MODULE_DESC[m.key]}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          {ACTIONS.map((a) => {
                            const act = actionOf(m, a.key);
                            const kind = cellKindOf(m.adminOnly, roleId, act ? act.granted : null);
                            if (kind === 'na') {
                              return (
                                <td key={a.key} className="py-space-md px-space-md text-center bg-surface-container-low/30">
                                  <span className="inline-flex items-center justify-center text-outline-variant" title="Hành động không áp dụng cho module này">
                                    <span className={`${ICON} text-[18px]`}>remove</span>
                                  </span>
                                </td>
                              );
                            }
                            if (kind === 'lock') {
                              return (
                                <td key={a.key} className="py-space-md px-space-md text-center bg-surface-container-low/40">
                                  <span className="inline-flex items-center justify-center gap-1 text-outline-strong text-ds-label-sm" title="Chỉ quản trị viên">
                                    <span className={`${ICON} text-[16px]`}>lock</span>
                                    <span className="hidden xl:inline">Chỉ Admin</span>
                                  </span>
                                </td>
                              );
                            }
                            const on = !!act?.granted[roleId];
                            return (
                              <td key={a.key} className="py-space-md px-space-md text-center">
                                <label className="inline-flex items-center justify-center">
                                  <input
                                    type="checkbox"
                                    checked={on}
                                    disabled
                                    readOnly
                                    aria-label={`${a.label} — ${m.label} — ${activeRole ? activeRole.label : roleId}`}
                                    className={`h-5 w-5 ${on ? 'accent-primary' : 'accent-outline-variant'}`}
                                  />
                                </label>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <p className="border-t border-surface-container bg-surface-container-low px-space-lg py-2.5 text-ds-body-sm text-on-surface-variant">
                Ma trận sinh ra từ chú thích bảo mật trong mã nguồn backend
                <code className="mx-1.5 px-1.5 py-0.5 rounded bg-surface-container-lowest text-primary font-mono text-[11px] font-bold">@PreAuthorize</code>
                nên không có API ghi. Đổi vai trò tài khoản thực hiện ở{' '}
                <Link to="/admin/users" className="text-primary hover:underline">Người dùng & Tài khoản</Link>.
              </p>
            </div>
          </>
        ) : null}
      </div>

      {/* Thanh trạng thái sticky */}
      <div className="fixed bottom-0 left-72 right-0 z-30 bg-surface-container-lowest/95 backdrop-blur-md p-space-md shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-md">
            <span className="relative flex items-center justify-center">
              <span className="w-3.5 h-3.5 rounded-full bg-secondary-fixed-dim" />
            </span>
            <div className="flex flex-col">
              <div className="flex items-center gap-space-xs text-ds-label-lg text-on-surface">
                <span className="font-bold">
                  {matrix ? `${grantedCount.granted} / ${grantedCount.total} quyền được cấp` : 'Chưa tải được ma trận'}
                </span>
                <span className="text-outline-strong">•</span>
                <span className="font-normal text-on-surface-variant">
                  Vai trò: <span className="font-semibold text-primary">{activeRole ? activeRole.label : '—'}</span>
                </span>
              </div>
              <span className="text-ds-body-sm text-outline-strong">
                Nguồn: GET /admin/permissions/matrix • Ma trận chỉ đọc, thay đổi quyền do kỹ sư backend cấu hình trong mã nguồn.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-space-sm w-full sm:w-auto justify-end">
            <button type="button" onClick={() => void load()} className="px-space-md py-2 rounded-lg text-ds-label-md text-outline-strong hover:text-on-surface transition-colors">
              Tải lại ma trận
            </button>
            <button
              type="button"
              disabled
              title="Backend chưa có API ghi phân quyền"
              className={`${adminButton('primary', 'disabled:opacity-50 disabled:cursor-not-allowed')} px-space-lg`}
            >
              <span className={`${ICON} text-[20px]`}>save</span>
              Lưu cấu hình phân quyền
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRolePermissionPage;
