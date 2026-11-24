export interface Wallet {
  availableBalance: number;
  pendingBalance: number;
  escrowBalance: number;
}

export interface TopupRequest {
  amount: number;
  idempotencyKey: string;
}

export interface TopupWebhookRequest {
  userId: number;
  amount: number;
  providerTxId: string;
}

/** payOS là cổng thanh toán duy nhất (BE: POST /api/v1/payment/payos/create). */
export type PaymentProvider = 'PAYOS';

export interface PaymentCreateRequest {
  amount: number;
  /** Nội dung chuyển khoản (tối đa 9 ký tự sau khi BE chuẩn hóa). */
  description?: string;
}

export interface PaymentCreateResponse {
  /** Trang checkout payOS để redirect người dùng. */
  checkoutUrl: string;
  /** Mã đơn payOS (integer), dùng để đối soát. */
  orderCode: number;
  /** Nội dung VietQR payOS trả về; FE render thành mã QR. */
  qrCode?: string;
}

/** GET /api/v1/payment/payos/status — backend đối soát trực tiếp với payOS. */
export interface PayosPaymentStatus {
  orderCode: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  amount: number;
  paymentLinkId?: string;
}

export interface Withdrawal {
  id: number;
  mentorId: number;
  amount: number;
  status: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  adminNote?: string;
  createdAt: string;
  processedAt?: string;
}

export interface WithdrawalRequest {
  amount: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

export interface MentorPricing {
  mentorId: number;
  minPrice: number;
  maxPrice: number;
  hourlyRate: number;
  level?: string;
  featured?: boolean;
}

export interface MentorPricingRequest {
  minPrice: number;
  maxPrice: number;
  hourlyRate: number;
  level?: string;
  featured?: boolean;
}

export interface Booking {
  id: number;
  candidateId: number;
  mentorId: number;
  slotId?: number;
  amount: number;
  mentorAmount: number;
  commissionAmount: number;
  commissionRate: number;
  status: string;
  heldAt?: string;
  releasedAt?: string;
  complaintDeadline?: string;
}

export interface BookingRequest {
  slotId: number;
  amount: number;
  idempotencyKey?: string;
}

export interface AiCreditPackage {
  id: number;
  name: string;
  description?: string;
  price: number;
  credits: number;
  discountPercent: number;
  validityDays: number;
  active: boolean;
  createdAt?: string;
}

export interface AiCreditBalance {
  balance: number;
  todayUsage: number;
}

export interface PaymentMetrics {
  [key: string]: any;
}
