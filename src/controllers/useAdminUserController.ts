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

  const fetchUsers = useCallback(async (page = 0, f: Filters = filters) => {
    setLoading(true);
    clearMessages();
    try {
      const params = {
        page,
        size: PAGE_SIZE,
        ...(f.search ? { search: f.search } : {}),
        ...(f.status ? { status: f.status } : {}),
        ...(f.role ? { role: f.role } : {}),
      };
      const res = await AdminService.getUsers(params);
      setUsers(res.data.data!);
      setCurrentPage(page);
      setFilters(f);
      void fetchStats(f);
    } catch (e: any) {
      setError(readApiErrorMessage(e, 'Failed to load user list'));
    } finally {
      setLoading(false);
    }
  }, [filters, fetchStats]);

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
      setError(readApiErrorMessage(e, 'Failed to load deleted accounts'));
    } finally {
      setLoadingDeleted(false);
    }
  }, [deletedSearch]);

  const fetchUserDetail = useCallback(async (id: number) => {
    try {
      const res = await AdminService.getUserDetail(id);
      setSelectedUser(res.data.data!);
    } catch (e: any) {
      setError(readApiErrorMessage(e, 'Failed to load user details'));
    }
  }, []);

  /** Tai detail phuc vu form Edit Profile - khong dong `selectedUser` de tranh mo luon modal chi tiet. */
  const loadProfileForEdit = useCallback(async (id: number): Promise<UserDetail | null> => {
    try {
      const res = await AdminService.getUserDetail(id);
      return res.data.data!;
    } catch (e: any) {
      setError(readApiErrorMessage(e, 'Failed to load user details'));
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
      setSuccessMsg('Account locked');
      await refreshAfterAction(id);
    } catch (e: any) {
      setError(readApiErrorMessage(e, 'Failed to lock account'));
      if (selectedUser?.id === id) await fetchUserDetail(id); // BE van ghi audit ca attempt that bai
    } finally { setActionLoading(false); }
  }, [fetchUserDetail, refreshAfterAction, selectedUser]);

  const unlockUser = useCallback(async (id: number) => {
    setActionLoading(true); clearMessages();
    try {
      await AdminService.unlockUser(id);
      setSuccessMsg('Account unlocked');
      await refreshAfterAction(id);
    } catch (e: any) {
      setError(readApiErrorMessage(e, 'Failed to unlock account'));
      if (selectedUser?.id === id) await fetchUserDetail(id);
    } finally { setActionLoading(false); }
  }, [fetchUserDetail, refreshAfterAction, selectedUser]);

  const setUserStatus = useCallback(async (id: number, enabled: boolean) => {
    setActionLoading(true); clearMessages();
    try {
      await AdminService.setUserStatus(id, enabled);
      setSuccessMsg(enabled ? 'Account enabled' : 'Account disabled');
      await refreshAfterAction(id);
    } catch (e: any) {
      setError(readApiErrorMessage(e, 'Failed to change account status'));
      if (selectedUser?.id === id) await fetchUserDetail(id);
    } finally { setActionLoading(false); }
  }, [fetchUserDetail, refreshAfterAction, selectedUser]);

  const deleteUser = useCallback(async (id: number) => {
    setActionLoading(true); clearMessages();
    try {
      await AdminService.deleteUser(id);
      setSuccessMsg('Account deleted');
      if (selectedUser?.id === id) setSelectedUser(null);
      await fetchUsers(currentPage);
    } catch (e: any) {
      setError(readApiErrorMessage(e, 'Failed to delete account'));
    } finally { setActionLoading(false); }
  }, [currentPage, fetchUsers, selectedUser]);

  const restoreUser = useCallback(async (id: number) => {
    setActionLoading(true); clearMessages();
    try {
      await AdminService.restoreUser(id);
      setSuccessMsg('Account restored');
      await fetchDeletedUsers(deletedPage);
      if (selectedUser?.id === id) setSelectedUser(null);
      void fetchStats(filters);
    } catch (e: any) {
      setError(readApiErrorMessage(e, 'Failed to restore account'));
    } finally { setActionLoading(false); }
  }, [deletedPage, fetchDeletedUsers, fetchStats, filters, selectedUser]);

  const resetPassword = useCallback(async (id: number) => {
    setActionLoading(true); clearMessages();
    try {
      await AdminService.resetPassword(id);
      setSuccessMsg('Password reset email sent');
    } catch (e: any) {
      setError(readApiErrorMessage(e, 'Failed to send password reset email'));
    } finally { setActionLoading(false); }
  }, []);

  const changeRole = useCallback(async (id: number, role: Role) => {
    setActionLoading(true); clearMessages();
    try {
      await AdminService.changeRole(id, role);
      setSuccessMsg('Role updated');
      await refreshAfterAction(id);
    } catch (e: any) {
      // 400 "Validation failed" (role ngoai enum) se duoc mo qua detail trong readApiErrorMessage.
      setError(readApiErrorMessage(e, 'Failed to change role'));
      if (selectedUser?.id === id) await fetchUserDetail(id);
    } finally { setActionLoading(false); }
  }, [fetchUserDetail, refreshAfterAction, selectedUser]);

  /**
   * Bulk = loop từng request đơn (BE chưa có POST /users/bulk — việc 6.5 trong spec).
   * Mỗi item vẫn qua rule nghiệp vụ riêng của BE nên phải đi hết danh sách rồi đếm
   * thành công/thất bại, không dừng ở lỗi đầu tiên.
   */
  const runBulkAction = useCallback(async (
    action: 'lock' | 'unlock' | 'delete', ids: number[],
  ): Promise<void> => {
    if (!ids.length) return;
    setActionLoading(true);
    clearMessages();
    const call = {
      lock: AdminService.lockUser, unlock: AdminService.unlockUser, delete: AdminService.deleteUser,
    }[action];
    let done = 0;
    let firstError = '';
    for (const id of ids) {
      try {
        await call(id);
        done += 1;
      } catch (e: any) {
        if (!firstError) firstError = readApiErrorMessage(e, 'Rejected by validation');
      }
    }
    const past = { lock: 'Locked', unlock: 'Unlocked', delete: 'Deleted' }[action];
    if (done > 0) setSuccessMsg(`${past} ${done} of ${ids.length} account(s)`);
    if (done < ids.length) {
      setError(`${ids.length - done} of ${ids.length} account(s) were rejected — ${firstError}`);
    }
    await fetchUsers(currentPage);
    if (selectedUser && ids.includes(selectedUser.id)) await fetchUserDetail(selectedUser.id);
    setActionLoading(false);
  }, [currentPage, fetchUserDetail, fetchUsers, selectedUser]);

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
      setError(readApiErrorMessage(e, 'Failed to load audit logs'));
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
      setSuccessMsg('CSV downloaded');
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
      setSuccessMsg(res.data.message || 'Invitation email sent');
      await fetchUsers(0, filters);
      return true;
    } catch (e: any) {
      setError(readApiErrorMessage(e, 'Failed to invite member'));
      return false;
    } finally { setActionLoading(false); }
  }, [fetchUsers, filters]);

  const resendInvitation = useCallback(async (id: number) => {
    setActionLoading(true); clearMessages();
    try {
      await AdminService.resendInvitation(id);
      setSuccessMsg('Invitation email resent');
      await refreshAfterAction(id);
    } catch (e: any) {
      setError(readApiErrorMessage(e, 'Failed to resend invitation'));
      if (selectedUser?.id === id) await fetchUserDetail(id);
    } finally { setActionLoading(false); }
  }, [fetchUserDetail, refreshAfterAction, selectedUser]);

  const revokeInvitation = useCallback(async (id: number) => {
    setActionLoading(true); clearMessages();
    try {
      await AdminService.revokeInvitation(id);
      setSuccessMsg('Invitation link revoked');
      await refreshAfterAction(id);
    } catch (e: any) {
      setError(readApiErrorMessage(e, 'Failed to revoke invitation'));
      if (selectedUser?.id === id) await fetchUserDetail(id);
    } finally { setActionLoading(false); }
  }, [fetchUserDetail, refreshAfterAction, selectedUser]);

  const updateProfile = useCallback(async (id: number, input: ProfileEditInput): Promise<boolean> => {
    setActionLoading(true); clearMessages();
    try {
      const res = await AdminService.updateProfile(id, input);
      // BE ty message dung he qua (doi email = quay ve cho moi, thu hoi phien cu).
      setSuccessMsg(res.data.message || 'Profile updated');
      await fetchUsers(currentPage);
      if (selectedUser?.id === id) await fetchUserDetail(id);
      return true;
    } catch (e: any) {
      setError(readApiErrorMessage(e, 'Failed to update profile'));
      return false;
    } finally { setActionLoading(false); }
  }, [currentPage, fetchUserDetail, fetchUsers, selectedUser]);

  return {
    users, deletedUsers, selectedUser, auditLogs, stats,
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
