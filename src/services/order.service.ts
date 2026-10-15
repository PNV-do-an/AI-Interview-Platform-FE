import httpService from './http.service';
import { ApiResponse } from '../models/Api.model';
import { Order, OrderRequest, ServicePackage, ServicePackageRequest } from '../models/Order.model';

const PACKAGES = '/api/v1/packages';
const ORDERS = '/api/v1/orders';

const OrderService = {
  getPackages: () =>
    httpService.get<ApiResponse<ServicePackage[]>>(PACKAGES),

  getAllPackages: () =>
    httpService.get<ApiResponse<ServicePackage[]>>(`${PACKAGES}/all`),

  createPackage: (body: ServicePackageRequest) =>
    httpService.post<ApiResponse<ServicePackage>>(PACKAGES, body),

  updatePackage: (id: number, body: ServicePackageRequest) =>
    httpService.put<ApiResponse<ServicePackage>>(`${PACKAGES}/${id}`, body),

  togglePackageActive: (id: number) =>
    httpService.patch<ApiResponse<ServicePackage>>(`${PACKAGES}/${id}/toggle-active`, {}),

  deletePackage: (id: number) =>
    httpService.delete<ApiResponse<void>>(`${PACKAGES}/${id}`),

  createOrder: (body: OrderRequest) =>
    httpService.post<ApiResponse<Order>>(ORDERS, body),

  getMyOrders: () =>
    httpService.get<ApiResponse<Order[]>>(`${ORDERS}/my`),

  getOrder: (id: number) =>
    httpService.get<ApiResponse<Order>>(`${ORDERS}/${id}`),

  payOrder: (id: number) =>
    httpService.post<ApiResponse<Order>>(`${ORDERS}/${id}/pay`, {}),

  cancelOrder: (id: number) =>
    httpService.post<ApiResponse<Order>>(`${ORDERS}/${id}/cancel`, {}),

  getAllOrders: () =>
    httpService.get<ApiResponse<Order[]>>(`${ORDERS}/admin/all`),
};

export default OrderService;
