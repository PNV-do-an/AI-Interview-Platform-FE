export type OrderStatus = 'PENDING' | 'PAID' | 'CANCELLED';

export interface ServicePackage {
  id: number;
  name: string;
  description?: string;
  price: number;
  durationDays: number;
  jobPostLimit: number;
  features: string[];
  active: boolean;
  createdAt: string;
}

export interface Order {
  id: number;
  orderCode: string;
  packageId: number;
  packageName: string;
  amount: number;
  status: OrderStatus;
  paymentMethod?: string;
  createdAt: string;
  paidAt?: string;
}

export interface OrderRequest {
  packageId: number;
  paymentMethod: string;
}

export interface ServicePackageRequest {
  name: string;
  description?: string;
  price: number;
  durationDays: number;
  jobPostLimit: number;
  features: string[];
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Chờ thanh toán',
  PAID: 'Đã thanh toán',
  CANCELLED: 'Đã huỷ',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  MOMO: 'Ví MoMo',
  VNPAY: 'VNPay',
  BANK_TRANSFER: 'Chuyển khoản ngân hàng',
};

export const formatVnd = (amount: number): string =>
  `${amount.toLocaleString('vi-VN')} VND`;
