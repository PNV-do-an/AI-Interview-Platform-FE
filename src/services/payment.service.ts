import httpService from './http.service';
import { ApiResponse } from '../models/Api.model';
import {
  AiCreditBalance,
  AiCreditPackage,
  Booking,
  BookingRequest,
  MentorPricing,
  MentorPricingRequest,
  PaymentMetrics,
  TopupRequest,
  TopupWebhookRequest,
  Wallet,
  Withdrawal,
  WithdrawalRequest,
} from '../models/Payment.model';

const PaymentService = {
  // Wallet
  getWallet: () => httpService.get<ApiResponse<Wallet>>('/api/v1/wallet/me'),
  topup: (body: TopupRequest) => httpService.post<ApiResponse<Wallet>>('/api/v1/wallet/topup', body),
  upgradeAccount: (body: { plan: string; billingCycle: string }) =>
    httpService.post<ApiResponse<any>>('/api/v1/wallet/upgrade', body),
  topupWebhook: (body: TopupWebhookRequest) =>
    httpService.post<ApiResponse<string>>('/api/v1/wallet/webhook/topup', body),

  // Withdrawals
  requestWithdrawal: (body: WithdrawalRequest) =>
    httpService.post<ApiResponse<Withdrawal>>('/api/v1/withdrawals', body),
  getMyWithdrawals: () => httpService.get<ApiResponse<Withdrawal[]>>('/api/v1/withdrawals/my'),
  getPendingWithdrawals: () => httpService.get<ApiResponse<Withdrawal[]>>('/api/v1/withdrawals/admin/pending'),
  approveWithdrawal: (id: number, note?: string) =>
    httpService.post<ApiResponse<Withdrawal>>(`/api/v1/withdrawals/admin/${id}/approve`, null, { params: { note } }),
  rejectWithdrawal: (id: number, note?: string) =>
    httpService.post<ApiResponse<Withdrawal>>(`/api/v1/withdrawals/admin/${id}/reject`, null, { params: { note } }),

  // Mentor pricing
  getMyMentorPricing: () => httpService.get<ApiResponse<MentorPricing>>('/api/v1/mentor-pricing/me'),
  updateMyMentorPricing: (body: MentorPricingRequest) =>
    httpService.put<ApiResponse<MentorPricing>>('/api/v1/mentor-pricing/me', body),
  getMentorPricing: (mentorId: number) =>
    httpService.get<ApiResponse<MentorPricing>>(`/api/v1/mentor-pricing/${mentorId}`),

  // Bookings / escrow
  bookSlot: (body: BookingRequest) => httpService.post<ApiResponse<Booking>>('/api/v1/bookings', body),
  completeBooking: (id: number) => httpService.post<ApiResponse<Booking>>(`/api/v1/bookings/${id}/complete`, {}),
  cancelBooking: (id: number, reason?: string) =>
    httpService.post<ApiResponse<Booking>>(`/api/v1/bookings/${id}/cancel`, null, { params: { reason } }),
  getMyBookings: () => httpService.get<ApiResponse<Booking[]>>('/api/v1/bookings/my'),
  getBooking: (id: number) => httpService.get<ApiResponse<Booking>>(`/api/v1/bookings/${id}`),

  // AI credits
  getAiCreditBalance: () => httpService.get<ApiResponse<AiCreditBalance>>('/api/v1/ai-credits/balance'),
  getAiCreditPackages: () => httpService.get<ApiResponse<AiCreditPackage[]>>('/api/v1/ai-credits/packages'),
  purchaseAiCreditPackage: (packageId: number) =>
    httpService.post<ApiResponse<string>>(`/api/v1/ai-credits/purchase/${packageId}`, {}),
  useAiCredit: (difficulty: string) =>
    httpService.post<ApiResponse<string>>('/api/v1/ai-credits/use', null, { params: { difficulty } }),

  // Admin payment metrics
  getPaymentMetrics: () => httpService.get<ApiResponse<PaymentMetrics>>('/api/v1/admin/payment-metrics'),
};

export default PaymentService;
