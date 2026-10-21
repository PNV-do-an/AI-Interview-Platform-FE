import { useState, useCallback } from 'react';
import AdminService from '../services/admin.service';
import {
  AuditLog, PagedResponse, Role, UserDetail, UserStats, UserSummary,
} from '../models/User.model';
import { readApiErrorMessage } from '../utils/apiError';

interface Filters {
  search: string;
  status: string;
  role: string;
}

export interface AuditFilters {
  action: string;
  from: string;
  to: string;
  targetUserId?: number;
}

export interface InviteInput {
  fullName: string;
  email: string;
  role: Role;
  phone?: string;
}

export interface ProfileEditInput {
  fullName?: string;
  email?: string;
  phone?: string;
}

const PAGE_SIZE = 10;

const EMPTY_FILTERS: Filters = { search: '', status: '', role: '' };
const EMPTY_AUDIT_FILTERS: AuditFilters = { action: '', from: '', to: '' };

export const useAdminUserController = () => {
  const [users, setUsers] = useState<PagedResponse<UserSummary> | null>(null);
  const [deletedUsers, setDeletedUsers] = useState<PagedResponse<UserSummary> | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [auditLogs, setAuditLogs] = useState<PagedResponse<AuditLog> | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [auditFilters, setAuditFilters] = useState<AuditFilters>(EMPTY_AUDIT_FILTERS);
  const [currentPage, setCurrentPage] = useState(0);
  /** BE cho size 1..100; mockup có selector 10/25/50. */
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [deletedPage, setDeletedPage] = useState(0);
  const [deletedSearch, setDeletedSearch] = useState('');
  const [auditPage, setAuditPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingDeleted, setLoadingDeleted] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const clearMessages = () => { setError(''); setSuccessMsg(''); };

  // KPI + badge tab: BE dem bang 1 query voi cung rule bo loc (search/role) voi danh sach.
  const fetchStats = useCallback(async (f: Partial<Pick<Filters, 'search' | 'role'>> = {}) => {
    try {
      const res = await AdminService.getUserStats({
        ...(f.search ? { search: f.search } : {}),
        ...(f.role ? { role: f.role } : {}),
      });
      setStats(res.data.data!);
    } catch {
      // KPI la phu; loi danh sach chinh da co banner khac.
      setStats(null);
    }
  }, []);

  const fetchUsers = useCallback(async (page = 0, f: Filters = filters, size = pageSize) => {
    setLoading(true);
    clearMessages();
    try {
      const params = {
        page,
        size,
        ...(f.search ? { search: f.search } : {}),
        ...(f.status ? { status: f.status } : {}),
        ...(f.role ? { role: f.role } : {}),
      };
      const res = await AdminService.getUsers(params);
      setUsers(res.data.data!);
      setCurrentPage(page);
      setFilters(f);
      setPageSize(size);
      void fetchStats(f);
    } catch (e: any) {
      setError(readApiErrorMessage(e, 'Không tải được danh sách người dùng'));
    } finally {
      setLoading(false);
    }
  }, [filters, fetchStats, pageSize]);

  const fetchDeletedUsers = useCallback(async (page = 0, search = deletedSearch) => {
    setLoadingDeleted(true);
    clearMessages();
    try {
      const res = await AdminService.getDeletedUsers({
        page, size: PAGE_SIZE, ...(search ? { search } : {}),
      });
      setDeletedUsers(res.data.data!);
      setDeletedPage(page);
      setDeletedSearch(search);
    } catch (e: any) {
      setError(readApiErrorMessage(e, 'Không tải được tài khoản đã xóa'));
    } finally {
      setLoadingDeleted(false);
    }
  }, [deletedSearch]);

  const fetchUserDetail = useCallback(async (id: number) => {
    try {
      const res = await AdminService.getUserDetail(id);
      setSelectedUser(res.data.data!);
    } catch (e: any) {
      setError(readApiErrorMessage(e, 'Không tải được hồ sơ người dùng'));
    }
  }, []);

  /** Tai detail phuc vu form Edit Profile - khong dong `selectedUser` de tranh mo luon modal chi tiet. */
  const loadProfileForEdit = useCallback(async (id: number): Promise<UserDetail | null> => {
    try {
      const res = await AdminService.getUserDetail(id);
      return res.data.data!;
    } catch (e: any) {
      setError(readApiErrorMessage(e, 'Không tải được hồ sơ người dùng'));
      return null;
    }
  }, []);

  /** Sau mutation: refresh danh sách đang hiển thị + detail đang mở để grid đúng trạng thái thật. */
  const refreshAfterAction = useCallback(async (id: number) => {
    await fetchUsers(currentPage);
    if (selectedUser?.id === id) await fetchUserDetail(id);
  }, [currentPage, fetchUsers, fetchUserDetail, selectedUser]);

  const lockUser = useCallback(async (id: number) => {
    setActionLoading(true); clearMessages();
    try {
      await AdminService.lockUser(id);
      setSuccessMsg('Đã khóa tài khoản');
      await refreshAfterAction(id);
    } catch (e: any) {
      setError(readApiErrorMessage(e, 'Không khóa được tài khoản'));
      if (selectedUser?.id === id) await fetchUserDetail(id); // BE van ghi audit ca attempt that bai
    } finally { setActionLoading(false); }
  }, [fetchUserDetail, refreshAfterAction, selectedUser]);

  const unlockUser = useCallback(async (id: number) => {
    setActionLoading(true); clearMessages();
    try {
      await AdminService.unlockUser(id);
      setSuccessMsg('Đã mở khóa tài khoản');
      await refreshAfterAction(id);
    } catch (e: any) {
      setError(readApiErrorMessage(e, 'Không mở khóa được tài khoản'));
      if (selectedUser?.id === id) await fetchUserDetail(id);
    } finally { setActionLoading(false); }
  }, [fetchUserDetail, refreshAfterAction, selectedUser]);

  const setUserStatus = useCallback(async (id: number, enabled: boolean) => {
    setActionLoading(true); clearMessages();
    try {
      await AdminService.setUserStatus(id, enabled);
      setSuccessMsg(enabled ? 'Đã kích hoạt tài khoản' : 'Đã vô hiệu hóa tài khoản');
      await refreshAfterAction(id);
    } catch (e: any) {
      setError(readApiErrorMessage(e, 'Không đổi được trạng thái tài khoản'));
      if (selectedUser?.id === id) await fetchUserDetail(id);
    } finally { setActionLoading(false); }
  }, [fetchUserDetail, refreshAfterAction, selectedUser]);

  const deleteUser = useCallback(async (id: number) => {
    setActionLoading(true); clearMessages();
    try {
      await AdminService.deleteUser(id);
      setSuccessMsg('Đã xóa tài khoản');
      if (selectedUser?.id === id) setSelectedUser(null);
      await fetchUsers(currentPage);
    } catch (e: any) {
      setError(readApiErrorMessage(e, 'Không xóa được tài khoản'));
    } finally { setActionLoading(false); }
  }, [currentPage, fetchUsers, selectedUser]);

  const restoreUser = useCallback(async (id: number) => {
    setActionLoading(true); clearMessages();
    try {
      await AdminService.restoreUser(id);
      setSuccessMsg('Đã khôi phục tài khoản');
      await fetchDeletedUsers(deletedPage);
      if (selectedUser?.id === id) setSelectedUser(null);
      void fetchStats(filters);
    } catch (e: any) {
      setError(readApiErrorMessage(e, 'Không khôi phục được tài khoản'));
    } finally { setActionLoading(false); }
  }, [deletedPage, fetchDeletedUsers, fetchStats, filters, selectedUser]);

  const resetPassword = useCallback(async (id: number) => {
    setActionLoading(true); clearMessages();
    try {
      await AdminService.resetPassword(id);
      setSuccessMsg('Đã gửi email đặt lại mật khẩu');
    } catch (e: any) {
      setError(readApiErrorMessage(e, 'Không gửi được email đặt lại mật khẩu'));
    } finally { setActionLoading(false); }
  }, []);

  const changeRole = useCallback(async (id: number, role: Role) => {
    setActionLoading(true); clearMessages();
    try {
      await AdminService.changeRole(id, role);
      setSuccessMsg('Đã cập nhật vai trò');
      await refreshAfterAction(id);
    } catch (e: any) {
      // 400 "Validation failed" (role ngoai enum) se duoc mo qua detail trong readApiErrorMessage.
      setError(readApiErrorMessage(e, 'Không đổi được vai trò'));
      if (selectedUser?.id === id) await fetchUserDetail(id);
    } finally { setActionLoading(false); }
  }, [fetchUserDetail, refreshAfterAction, selectedUser]);

  /**
   * Bulk = loop từng request đơn (BE chưa có POST /users/bulk — việc 6.5 trong spec).
   * Mỗi item vẫn qua rule nghiệp vụ riêng của BE nên phải đi hết danh sách rồi đếm
   * thành công/thất bại, không dừng ở lỗi đầu tiên.
   */
  /**
   * Thao tác hàng loạt. BE có endpoint bulk thật (tối đa 100 id/lần) cho lock/unlock/role;
   * delete không có bulk nên gọi tuần tự. Kết quả `failed[]` của BE được đưa thẳng vào banner.
   */
  const runBulkAction = useCallback(async (
    action: 'lock' | 'unlock' | 'delete' | 'role', ids: number[],
    opts: { reason?: string; role?: Role } = {},
  ): Promise<boolean> => {
    if (!ids.length) return false;
    setActionLoading(true);
    clearMessages();
    const chunk = ids.slice(0, 100);
    try {
      let failed: { id: number; message: string }[] = [];
      if (action === 'lock') {
        const res = await AdminService.bulkLockUsers({ ids: chunk, reason: opts.reason });
        failed = res.data.data!.failed;
      } else if (action === 'unlock') {
        const res = await AdminService.bulkUnlockUsers({ ids: chunk });
        failed = res.data.data!.failed;
      } else if (action === 'role') {
        if (!opts.role) throw new Error('Chưa chọn vai trò');
        const res = await AdminService.bulkChangeRole({ ids: chunk, role: opts.role });
        failed = res.data.data!.failed;
      } else {
        for (const id of chunk) {
          try { await AdminService.deleteUser(id); }
          catch (e: any) { failed = [...failed, { id, message: readApiErrorMessage(e, 'Bị rule nghiệp vụ từ chối') }]; }
        }
      }
      const done = chunk.length - failed.length;
      const label = { lock: 'Đã khóa', unlock: 'Đã mở khóa', delete: 'Đã xóa', role: 'Đã đổi vai trò' }[action];
      setSuccessMsg(`${label} ${done}/${chunk.length} tài khoản`);
      if (failed.length) setError(`${failed.length} tài khoản bị chặn: ${failed[0].message}`);
      await fetchUsers(currentPage, filters, pageSize);
      return failed.length === 0;
    } catch (e: any) {
      setError(readApiErrorMessage(e, 'Thao tác hàng loạt thất bại'));
      return false;
    } finally {
      setActionLoading(false);
    }
  }, [currentPage, fetchUsers, filters, pageSize]);

  const fetchAuditLogs = useCallback(async (page = 0, f: AuditFilters = auditFilters) => {
    try {
      const res = await AdminService.getAuditLogs({
        page, size: PAGE_SIZE,
        ...(f.action ? { action: f.action } : {}),
        ...(f.from ? { from: f.from } : {}),
        ...(f.to ? { to: f.to } : {}),
        ...(f.targetUserId ? { targetUserId: f.targetUserId } : {}),
      });
      setAuditLogs(res.data.data!);
      setAuditPage(page);
      setAuditFilters(f);
    } catch (e: any) {
      setError(readApiErrorMessage(e, 'Không tải được nhật ký kiểm toán'));
    }
  }, [auditFilters]);

  const applyFilters = useCallback((newFilters: Filters) => {
    fetchUsers(0, newFilters);
  }, [fetchUsers]);

  const applyAuditFilters = useCallback((newFilters: AuditFilters) => {
    fetchAuditLogs(0, newFilters);
  }, [fetchAuditLogs]);

  /**
   * Export CSV toan tap loc hien tai bang endpoint server-side (1 request, cap 10.000 dong).
   * Nguon: GET /users/export - cung bo loc voi danh sach.
   */
  const exportUsersCsv = useCallback(async (): Promise<boolean> => {
    setExporting(true);
    clearMessages();
    try {
      const res = await AdminService.exportUsersCsv({
        ...(filters.search ? { search: filters.search } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.role ? { role: filters.role } : {}),
      });
      const blob = new Blob([res.data as unknown as string], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccessMsg('Đã tải file CSV');
      return true;
    } catch (e: any) {
      // responseType 'text' nen payload loi la JSON-string - parse truoc khi doc message.
      let parsed = e;
      if (typeof e?.response?.data === 'string') {
        try { parsed = { ...e, response: { ...e.response, data: JSON.parse(e.response.data) } }; }
        catch { /* khong phai JSON -> dung message goc */ }
      }
      setError(readApiErrorMessage(parsed, 'Export failed'));
      return false;
    } finally {
      setExporting(false);
    }
  }, [filters]);

  const inviteUser = useCallback(async (input: InviteInput): Promise<boolean> => {
    setActionLoading(true); clearMessages();
    try {
      const res = await AdminService.inviteUser(input);
      setSuccessMsg(res.data.message || 'Đã gửi email mời');
      await fetchUsers(0, filters);
      return true;
    } catch (e: any) {
      setError(readApiErrorMessage(e, 'Không gửi được lời mời'));
      return false;
    } finally { setActionLoading(false); }
  }, [fetchUsers, filters]);

  const resendInvitation = useCallback(async (id: number) => {
    setActionLoading(true); clearMessages();
    try {
      await AdminService.resendInvitation(id);
      setSuccessMsg('Đã gửi lại email mời');
      await refreshAfterAction(id);
    } catch (e: any) {
      setError(readApiErrorMessage(e, 'Không gửi lại được lời mời'));
      if (selectedUser?.id === id) await fetchUserDetail(id);
    } finally { setActionLoading(false); }
  }, [fetchUserDetail, refreshAfterAction, selectedUser]);

  const revokeInvitation = useCallback(async (id: number) => {
    setActionLoading(true); clearMessages();
    try {
      await AdminService.revokeInvitation(id);
      setSuccessMsg('Đã thu hồi link mời');
      await refreshAfterAction(id);
    } catch (e: any) {
      setError(readApiErrorMessage(e, 'Không thu hồi được link mời'));
      if (selectedUser?.id === id) await fetchUserDetail(id);
    } finally { setActionLoading(false); }
  }, [fetchUserDetail, refreshAfterAction, selectedUser]);

  const updateProfile = useCallback(async (id: number, input: ProfileEditInput): Promise<boolean> => {
    setActionLoading(true); clearMessages();
    try {
      const res = await AdminService.updateProfile(id, input);
      // BE ty message dung he qua (doi email = quay ve cho moi, thu hoi phien cu).
      setSuccessMsg(res.data.message || 'Đã cập nhật hồ sơ');
      await fetchUsers(currentPage);
      if (selectedUser?.id === id) await fetchUserDetail(id);
      return true;
    } catch (e: any) {
      setError(readApiErrorMessage(e, 'Không cập nhật được hồ sơ'));
      return false;
    } finally { setActionLoading(false); }
  }, [currentPage, fetchUserDetail, fetchUsers, selectedUser]);

  return {
    users, deletedUsers, selectedUser, auditLogs, stats, pageSize,
    filters, auditFilters,
    currentPage, deletedPage, deletedSearch, auditPage,
    loading, loadingDeleted, actionLoading, exporting, error, successMsg,
    fetchUsers, fetchDeletedUsers, fetchUserDetail, fetchAuditLogs, fetchStats, loadProfileForEdit,
    lockUser, unlockUser, setUserStatus, deleteUser, restoreUser, resetPassword, changeRole,
    inviteUser, resendInvitation, revokeInvitation, updateProfile,
    runBulkAction,
    applyFilters, applyAuditFilters, exportUsersCsv,
    setSelectedUser, clearMessages,
  };
};
