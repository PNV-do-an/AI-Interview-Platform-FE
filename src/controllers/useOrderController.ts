import { useCallback, useState } from 'react';
import OrderService from '../services/order.service';
import { Order, OrderRequest, ServicePackage, ServicePackageRequest } from '../models/Order.model';

export const useOrderController = () => {
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [allPackages, setAllPackages] = useState<ServicePackage[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const clearMessages = () => { setError(''); setSuccessMsg(''); };

  const fetchPackages = useCallback(async () => {
    try {
      const res = await OrderService.getPackages();
      setPackages(res.data.data!);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không tải được danh sách gói dịch vụ');
    }
  }, []);

  const fetchAllPackages = useCallback(async () => {
    try {
      const res = await OrderService.getAllPackages();
      setAllPackages(res.data.data!);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không tải được danh sách gói dịch vụ');
    }
  }, []);

  const createPackage = useCallback(async (body: ServicePackageRequest) => {
    clearMessages();
    try {
      await OrderService.createPackage(body);
      setSuccessMsg('Đã tạo gói dịch vụ');
      return true;
    } catch (e: any) {
      setError(e.response?.data?.message || 'Tạo gói thất bại');
      return false;
    }
  }, []);

  const updatePackage = useCallback(async (id: number, body: ServicePackageRequest) => {
    clearMessages();
    try {
      await OrderService.updatePackage(id, body);
      setSuccessMsg('Đã cập nhật gói dịch vụ');
      return true;
    } catch (e: any) {
      setError(e.response?.data?.message || 'Cập nhật gói thất bại');
      return false;
    }
  }, []);

  const togglePackageActive = useCallback(async (id: number) => {
    clearMessages();
    try {
      await OrderService.togglePackageActive(id);
      return true;
    } catch (e: any) {
      setError(e.response?.data?.message || 'Thay đổi trạng thái gói thất bại');
      return false;
    }
  }, []);

  const deletePackage = useCallback(async (id: number) => {
    clearMessages();
    try {
      await OrderService.deletePackage(id);
      setSuccessMsg('Đã xóa gói dịch vụ');
      return true;
    } catch (e: any) {
      setError(e.response?.data?.message || 'Xóa gói thất bại');
      return false;
    }
  }, []);

  const createOrder = useCallback(async (body: OrderRequest) => {
    clearMessages();
    setLoading(true);
    try {
      const res = await OrderService.createOrder(body);
      setCurrentOrder(res.data.data!);
      return res.data.data!;
    } catch (e: any) {
      setError(e.response?.data?.message || 'Tạo đơn hàng thất bại');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyOrders = useCallback(async () => {
    try {
      const res = await OrderService.getMyOrders();
      setOrders(res.data.data!);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không tải được lịch sử đơn hàng');
    }
  }, []);

  const fetchAllOrders = useCallback(async () => {
    try {
      const res = await OrderService.getAllOrders();
      setAllOrders(res.data.data!);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không tải được danh sách đơn hàng');
    }
  }, []);

  const payOrder = useCallback(async (id: number) => {
    clearMessages();
    setLoading(true);
    try {
      const res = await OrderService.payOrder(id);
      setSuccessMsg('Thanh toán thành công — email xác nhận đã được gửi');
      setCurrentOrder(res.data.data!);
      return true;
    } catch (e: any) {
      setError(e.response?.data?.message || 'Thanh toán thất bại');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelOrder = useCallback(async (id: number) => {
    clearMessages();
    try {
      await OrderService.cancelOrder(id);
      setSuccessMsg('Đã hủy đơn hàng');
      return true;
    } catch (e: any) {
      setError(e.response?.data?.message || 'Hủy đơn hàng thất bại');
      return false;
    }
  }, []);

  return {
    packages, allPackages, orders, allOrders, currentOrder,
    loading, error, successMsg,
    fetchPackages, fetchAllPackages, createPackage, updatePackage,
    togglePackageActive, deletePackage,
    createOrder, fetchMyOrders, fetchAllOrders, payOrder, cancelOrder,
    clearMessages,
  };
};
