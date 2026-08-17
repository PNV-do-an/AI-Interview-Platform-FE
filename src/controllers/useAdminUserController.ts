import { useState, useCallback } from 'react';
import AdminService from '../services/admin.service';
import { AuditLog, PagedResponse, Role, UserDetail, UserSummary } from '../models/User.model';

interface Filters {
  search: string;
  status: string;
  role: string;
}

const PAGE_SIZE = 20;

export const useAdminUserController = () => {
  const [users, setUsers] = useState<PagedResponse<UserSummary> | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [auditLogs, setAuditLogs] = useState<PagedResponse<AuditLog> | null>(null);
  const [filters, setFilters] = useState<Filters>({ search: '', status: '', role: '' });
  const [currentPage, setCurrentPage] = useState(0);
  const [auditPage, setAuditPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const clearMessages = () => { setError(''); setSuccessMsg(''); };

  const fetchUsers = useCallback(async (page = 0, f: Filters = filters) => {
    setLoading(true);
    clearMessages();
    try {
      const params = {
        page,
        size: PAGE_SIZE,
        ...(f.search   ? { search: f.search }   : {}),
        ...(f.status   ? { status: f.status }   : {}),
        ...(f.role     ? { role: f.role }        : {}),
      };
      const res = await AdminService.getUsers(params);
      setUsers(res.data.data!);
      setCurrentPage(page);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchUserDetail = useCallback(async (id: number) => {
    try {
      const res = await AdminService.getUserDetail(id);
      setSelectedUser(res.data.data!);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không thể tải thông tin người dùng');
    }
  }, []);

  const lockUser = useCallback(async (id: number) => {
    setActionLoading(true); clearMessages();
    try {
      await AdminService.lockUser(id);
      setSuccessMsg('Tài khoản đã bị khóa');
      await fetchUsers(currentPage);
      if (selectedUser?.id === id) await fetchUserDetail(id);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không thể khóa tài khoản');
    } finally { setActionLoading(false); }
  }, [currentPage, fetchUsers, fetchUserDetail, selectedUser]);

  const unlockUser = useCallback(async (id: number) => {
    setActionLoading(true); clearMessages();
    try {
      await AdminService.unlockUser(id);
      setSuccessMsg('Tài khoản đã được mở khóa');
      await fetchUsers(currentPage);
      if (selectedUser?.id === id) await fetchUserDetail(id);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không thể mở khóa tài khoản');
    } finally { setActionLoading(false); }
  }, [currentPage, fetchUsers, fetchUserDetail, selectedUser]);

  const deleteUser = useCallback(async (id: number) => {
    setActionLoading(true); clearMessages();
    try {
      await AdminService.deleteUser(id);
      setSuccessMsg('Tài khoản đã được xóa');
      if (selectedUser?.id === id) setSelectedUser(null);
      await fetchUsers(currentPage);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không thể xóa tài khoản');
    } finally { setActionLoading(false); }
  }, [currentPage, fetchUsers, selectedUser]);

  const resetPassword = useCallback(async (id: number) => {
    setActionLoading(true); clearMessages();
    try {
      await AdminService.resetPassword(id);
      setSuccessMsg('Email đặt lại mật khẩu đã được gửi');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không thể gửi email reset mật khẩu');
    } finally { setActionLoading(false); }
  }, []);

  const changeRole = useCallback(async (id: number, role: Role) => {
    setActionLoading(true); clearMessages();
    try {
      await AdminService.changeRole(id, role);
      setSuccessMsg('Vai trò đã được cập nhật');
      await fetchUsers(currentPage);
      if (selectedUser?.id === id) await fetchUserDetail(id);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không thể thay đổi vai trò');
    } finally { setActionLoading(false); }
  }, [currentPage, fetchUsers, fetchUserDetail, selectedUser]);

  const fetchAuditLogs = useCallback(async (page = 0) => {
    try {
      const res = await AdminService.getAuditLogs({ page, size: PAGE_SIZE });
      setAuditLogs(res.data.data!);
      setAuditPage(page);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không thể tải audit log');
    }
  }, []);

  const applyFilters = useCallback((newFilters: Filters) => {
    setFilters(newFilters);
    fetchUsers(0, newFilters);
  }, [fetchUsers]);

  return {
    users, selectedUser, auditLogs,
    filters, currentPage, auditPage,
    loading, actionLoading, error, successMsg,
    fetchUsers, fetchUserDetail, fetchAuditLogs,
    lockUser, unlockUser, deleteUser, resetPassword, changeRole,
    applyFilters, setSelectedUser, clearMessages,
  };
};
