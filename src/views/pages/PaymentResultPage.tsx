import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PaymentService from '../../services/payment.service';
import { Wallet } from '../../models/Payment.model';
import { formatVnd } from '../../models/Order.model';

const CARD = 'rounded-2xl border border-slate-200 bg-white shadow-sm';
const BTN_PRIMARY =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white no-underline shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md';
const BTN_SECONDARY =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 no-underline transition-colors hover:border-indigo-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60';

const PENDING_KEY = 'payment:pending-topup';
const MAX_VERIFY_ATTEMPTS = 20;
const VERIFY_INTERVAL_MS = 2500;

type ResultStatus = 'success' | 'failed' | 'pending' | 'invalid-signature' | 'error' | 'unknown';

const STATUS_CONTENT: Record<ResultStatus, { title: string; description: string; icon: string; tone: string }> = {
  success: {
    title: 'Nạp tiền thành công',
    description: 'Giao dịch đã được cổng thanh toán xác nhận. Số dư ví đã được cập nhật.',
    icon: 'check_circle',
    tone: 'emerald',
  },
  pending: {
    title: 'Giao dịch đang xử lý',
    description: 'Cổng thanh toán chưa xác nhận. Số dư sẽ được cập nhật sau khi callback tới hệ thống.',
    icon: 'schedule',
    tone: 'amber',
  },
  failed: {
    title: 'Thanh toán chưa thành công',
    description: 'Giao dịch không thành công. Ví của bạn không bị trừ tiền.',
    icon: 'error',
    tone: 'amber',
  },
  'invalid-signature': {
    title: 'Chữ ký giao dịch không hợp lệ',
    description: 'Thông tin trả về không xác thực được. Vui lòng liên hệ hỗ trợ nếu bạn đã thanh toán.',
    icon: 'verified_user',
    tone: 'red',
  },
  error: {
    title: 'Không xác định được giao dịch',
    description: 'Mã giao dịch không tồn tại trong hệ thống. Vui lòng liên hệ hỗ trợ nếu bạn đã thanh toán.',
    icon: 'help',
    tone: 'red',
  },
  unknown: {
    title: 'Đang xử lý kết quả thanh toán',
    description: 'Vui lòng đợi trong giây lát...',
    icon: 'progress_activity',
    tone: 'indigo',
  },
};

const TONE_CLASS: Record<string, string> = {
  emerald: 'border-emerald-200 bg-emerald-50/70 text-emerald-700',
  amber: 'border-amber-200 bg-amber-50/70 text-amber-700',
  red: 'border-red-200 bg-red-50/70 text-red-700',
  indigo: 'border-indigo-200 bg-indigo-50/70 text-indigo-700',
};

const PaymentResultPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const rawStatusParam = (searchParams.get('status') ?? searchParams.get('code') ?? '').toLowerCase();
  const cancelled = searchParams.get('cancel') === 'true';
  const rawStatus =
    rawStatusParam === 'paid' || rawStatusParam === '00'
      ? 'success'
      : rawStatusParam === 'cancelled' || cancelled
        ? 'failed'
        : rawStatusParam === 'processing'
          ? 'pending'
          : rawStatusParam;
  const initialStatus: ResultStatus = (
    ['success', 'failed', 'pending', 'invalid-signature', 'error'] as const
  ).includes(rawStatus as any)
    ? (rawStatus as ResultStatus)
    : 'unknown';
  const paymentRef = searchParams.get('orderCode') ?? searchParams.get('id') ?? '';
  const parsedOrderCode = Number(paymentRef);
  const hasOrderCode = Number.isSafeInteger(parsedOrderCode) && parsedOrderCode > 0;

  const [status, setStatus] = useState<ResultStatus>(initialStatus);
  const [verifying, setVerifying] = useState(hasOrderCode);
  const [verifyTick, setVerifyTick] = useState(0);
  const [amount, setAmount] = useState<number | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(true);

  const providerName = 'payOS';

  const loadWallet = useCallback(async () => {
    try {
      const res = await PaymentService.getWallet();
      setWallet(res.data?.data ?? null);
    } catch {
      // lỗi tải ví không làm mất thông tin kết quả thanh toán
    } finally {
      setLoadingWallet(false);
    }
  }, []);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(PENDING_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (!paymentRef || parsed.ref === paymentRef) {
          setAmount((current) => current ?? parsed.amount ?? null);
        }
        if (initialStatus !== 'pending' && initialStatus !== 'unknown') {
          sessionStorage.removeItem(PENDING_KEY);
        }
      }
    } catch {
      // bỏ qua dữ liệu phiên không hợp lệ
    }
  }, [initialStatus, paymentRef]);

  useEffect(() => {
    void loadWallet();
    const timer = window.setTimeout(loadWallet, 2500);
    return () => window.clearTimeout(timer);
  }, [loadWallet]);

  /**
   * Không tin tưởng query param một cách mù quáng: gọi backend để đối soát với payOS.
   * Nhờ vậy giao dịch vẫn được cộng ví dù webhook hoặc return URL bị lỡ.
   */
  useEffect(() => {
    if (!hasOrderCode) {
      setVerifying(false);
      return;
    }

    let active = true;
    let attempts = 0;
    let timer: number | undefined;
    setVerifying(true);

    const verify = async () => {
      attempts += 1;
      try {
        const res = await PaymentService.getPayosStatus(parsedOrderCode);
        const data = res.data?.data;
        if (!active || !data) return;

        if (typeof data.amount === 'number') setAmount(data.amount);

        if (data.status === 'SUCCESS') {
          setStatus('success');
          setVerifying(false);
          void loadWallet();
          return;
        }
        if (data.status === 'FAILED') {
          setStatus('failed');
          setVerifying(false);
          return;
        }
        setStatus('pending');
      } catch {
        // Backend cũ chưa có endpoint /status: giữ kết quả đọc từ query param.
        if (active) setVerifying(false);
        return;
      }

      if (!active) return;
      if (attempts < MAX_VERIFY_ATTEMPTS) {
        timer = window.setTimeout(verify, VERIFY_INTERVAL_MS);
      } else {
        setVerifying(false);
      }
    };

    void verify();

    return () => {
      active = false;
      if (timer) window.clearTimeout(timer);
    };
  }, [hasOrderCode, parsedOrderCode, verifyTick, loadWallet]);

  const isPending = status === 'pending' || status === 'unknown';
  const content =
    verifying && isPending
      ? {
          ...STATUS_CONTENT.pending,
          title: 'Đang xác minh giao dịch',
          description:
            'Hệ thống đang đối soát giao dịch với payOS. Số dư ví sẽ được cập nhật ngay khi xác nhận.',
        }
      : STATUS_CONTENT[status];

  return (
    <div className="flex flex-col gap-6">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-900 px-6 py-8 text-white shadow-xl sm:px-10">
        <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-indigo-500/20 blur-2xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur">
            <span className="material-symbols-outlined text-[15px]">payments</span>
            Kết quả thanh toán {providerName}
          </span>
          <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Xác nhận giao dịch</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">
            Kết quả được xác thực trực tiếp từ cổng thanh toán {providerName}.
          </p>
        </div>
      </section>

      <section className={`${CARD} mx-auto w-full max-w-2xl p-6 sm:p-8`}>
        <div className={`flex flex-col items-center gap-3 rounded-2xl border px-6 py-8 text-center ${TONE_CLASS[content.tone]}`}>
          <span className={`material-symbols-outlined text-[46px] ${status === 'unknown' || verifying ? 'animate-spin' : ''}`}>
            {content.icon}
          </span>
          <h2 className="m-0 text-xl font-bold">{content.title}</h2>
          <p className="m-0 max-w-md text-sm leading-relaxed">{content.description}</p>
        </div>

        {(amount !== null || paymentRef) && (
          <div className="mt-5 grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm sm:grid-cols-2">
            {amount !== null && (
              <div>
                <p className="m-0 text-xs text-slate-500">Số tiền thanh toán</p>
                <p className="m-0 mt-0.5 font-bold text-slate-900">{formatVnd(amount)}</p>
              </div>
            )}
            {paymentRef && (
              <div className="min-w-0">
                <p className="m-0 text-xs text-slate-500">Mã giao dịch</p>
                <p className="m-0 mt-0.5 truncate font-mono text-xs font-semibold text-slate-900">{paymentRef}</p>
              </div>
            )}
            <div>
              <p className="m-0 text-xs text-slate-500">Phương thức</p>
              <p className="m-0 mt-0.5 font-bold text-slate-900">{providerName}</p>
            </div>
            <div>
              <p className="m-0 text-xs text-slate-500">Số dư khả dụng</p>
              <p className="m-0 mt-0.5 font-bold text-slate-900">
                {loadingWallet ? 'Đang cập nhật...' : wallet ? formatVnd(wallet.availableBalance) : '—'}
              </p>
            </div>
          </div>
        )}

        {hasOrderCode && isPending && (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => setVerifyTick((tick) => tick + 1)}
              className={BTN_SECONDARY}
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              Kiểm tra lại giao dịch
            </button>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link to="/wallet" className={BTN_PRIMARY}>
            <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
            Về ví & nạp tiền
          </Link>
          <Link to="/packages" className={BTN_SECONDARY}>
            <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
            Xem gói dịch vụ
          </Link>
        </div>
      </section>
    </div>
  );
};

export default PaymentResultPage;
