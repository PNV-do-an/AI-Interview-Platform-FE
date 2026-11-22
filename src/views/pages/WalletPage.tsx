import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PaymentService from '../../services/payment.service';
import { Wallet } from '../../models/Payment.model';
import { formatVnd } from '../../models/Order.model';

const CARD = 'rounded-2xl border border-slate-200 bg-white shadow-sm';
const BTN_PRIMARY =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white no-underline shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60';
const BTN_SECONDARY =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 no-underline transition-colors hover:border-indigo-300 hover:bg-slate-50';

const PRESET_AMOUNTS = [50000, 100000, 200000, 500000, 1000000, 2000000];
const MIN_AMOUNT = 10000;
const MAX_AMOUNT = 50000000;

type Step = 'form' | 'confirm' | 'success';

interface TopupRecord {
  code: string;
  amount: number;
  at: string;
}

const formatDateTime = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const WalletPage: React.FC = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [step, setStep] = useState<Step>('form');
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<TopupRecord[]>([]);
  const [lastTopup, setLastTopup] = useState<TopupRecord | null>(null);

  const amount = useMemo(() => {
    const raw = Number(amountInput);
    return Number.isFinite(raw) ? Math.floor(raw) : 0;
  }, [amountInput]);

  const amountError = useMemo(() => {
    if (!amountInput) return '';
    if (amount < MIN_AMOUNT) return `Số tiền tối thiểu là ${formatVnd(MIN_AMOUNT)}.`;
    if (amount > MAX_AMOUNT) return `Số tiền tối đa là ${formatVnd(MAX_AMOUNT)} mỗi lần nạp.`;
    return '';
  }, [amount, amountInput]);

  const loadWallet = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await PaymentService.getWallet();
      setWallet(res.data?.data ?? null);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không tải được thông tin ví.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadWallet();
  }, []);

  const choosePreset = (value: number) => {
    setAmountInput(String(value));
    setError('');
    setNotice('');
    if (step === 'confirm') setStep('form');
  };

  const goToConfirm = () => {
    setError('');
    setNotice('');
    if (!amountInput) {
      setError('Vui lòng nhập số tiền muốn nạp.');
      return;
    }
    if (amountError) {
      setError(amountError);
      return;
    }
    setStep('confirm');
  };

  const confirmTopup = async () => {
    if (amountError || amount <= 0) {
      setError(amountError || 'Số tiền không hợp lệ.');
      setStep('form');
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    const idempotencyKey = `topup-${user?.id ?? 'guest'}-${Date.now()}`;
    try {
      const res = await PaymentService.topup({ amount, idempotencyKey });
      const nextWallet = res.data?.data ?? wallet;
      setWallet(nextWallet);
      const record: TopupRecord = {
        code: idempotencyKey.replace('topup-', 'TOP-'),
        amount,
        at: new Date().toISOString(),
      };
      setLastTopup(record);
      setHistory((current) => [record, ...current]);
      setNotice(`Đã nạp ${formatVnd(amount)} vào ví thành công.`);
      setStep('success');
      setAmountInput('');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Nạp tiền thất bại. Vui lòng kiểm tra kết nối và thử lại.');
      setStep('form');
    } finally {
      setBusy(false);
    }
  };

  const resetFlow = () => {
    setStep('form');
    setAmountInput('');
    setError('');
    setNotice('');
    setLastTopup(null);
  };

  if (loading) {
    return (
      <div className={`${CARD} flex items-center justify-center gap-3 p-10 text-sm text-slate-500`}>
        <span className="material-symbols-outlined animate-spin text-[22px] text-indigo-500">progress_activity</span>
        Đang tải thông tin ví...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 px-6 py-8 text-white shadow-xl sm:px-10 sm:py-10">
        <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-20 right-24 h-44 w-44 rounded-full bg-teal-300/20 blur-2xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
              <span className="material-symbols-outlined text-[15px]">account_balance_wallet</span>
              Ví AI Interview
            </span>
            <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Nạp tiền vào ví</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-indigo-100">
              Nạp tiền nhanh chóng để mua gói dịch vụ, đặt lịch mentor và thanh toán các giao dịch trên nền tảng.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/payments"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white no-underline backdrop-blur transition-colors hover:bg-white/20"
            >
              <span className="material-symbols-outlined text-[18px]">space_dashboard</span>
              Trung tâm thanh toán
            </Link>
            <Link
              to="/packages"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 no-underline shadow-sm transition-transform hover:-translate-y-0.5"
            >
              <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
              Xem gói dịch vụ
            </Link>
          </div>
        </div>
      </section>

      {/* Balance cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-1">
        <div className={`${CARD} flex items-start gap-3 p-5`}>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <span className="material-symbols-outlined text-[22px]">account_balance_wallet</span>
          </span>
          <div className="min-w-0">
            <p className="m-0 text-xs font-medium uppercase tracking-wide text-slate-500">Số dư khả dụng</p>
            <p className="m-0 mt-1 truncate text-lg font-bold text-slate-900">{wallet ? formatVnd(wallet.availableBalance) : '—'}</p>
            <p className="m-0 mt-0.5 text-[11px] text-slate-400">Có thể dùng ngay để thanh toán</p>
          </div>
        </div>
      </div>

      {notice && (
        <div className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          <span>{notice}</span>
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Top-up flow */}
        <section className={`${CARD} p-5 sm:p-6 lg:col-span-7`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <span className="material-symbols-outlined text-[21px]">add_card</span>
              </span>
              <div>
                <h2 className="m-0 text-lg font-bold text-slate-900">
                  {step === 'success' ? 'Nạp tiền thành công' : step === 'confirm' ? 'Xác nhận nạp tiền' : 'Chọn số tiền nạp'}
                </h2>
                <p className="m-0 text-xs text-slate-500">
                  {step === 'success'
                    ? 'Số dư ví đã được cập nhật.'
                    : step === 'confirm'
                      ? 'Kiểm tra thông tin trước khi hoàn tất.'
                      : 'Tiền sẽ được cộng ngay vào số dư khả dụng.'}
                </p>
              </div>
            </div>
            {step !== 'form' && (
              <button
                type="button"
                onClick={resetFlow}
                className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                Nạp khoản khác
              </button>
            )}
          </div>

          {step === 'success' && lastTopup ? (
            <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-6 py-8 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <span className="material-symbols-outlined text-[30px]">check_circle</span>
              </span>
              <p className="m-0 text-2xl font-bold text-slate-900">{formatVnd(lastTopup.amount)}</p>
              <p className="m-0 text-sm text-slate-600">
                đã được cộng vào ví. Số dư khả dụng hiện tại:{' '}
                <strong className="text-slate-900">{wallet ? formatVnd(wallet.availableBalance) : '—'}</strong>
              </p>
              <div className="mt-2 grid w-full max-w-sm grid-cols-1 gap-2 rounded-xl border border-emerald-200 bg-white p-4 text-left text-xs text-slate-600">
                <div className="flex items-center justify-between gap-2">
                  <span>Mã giao dịch</span>
                  <span className="font-mono font-semibold text-slate-900">{lastTopup.code}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span>Thời gian</span>
                  <span className="font-medium text-slate-900">{formatDateTime(lastTopup.at)}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span>Phương thức</span>
                  <span className="font-medium text-slate-900">VNPay</span>
                </div>
              </div>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <button type="button" onClick={resetFlow} className={BTN_PRIMARY}>
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Nạp thêm
                </button>
                <Link to="/packages" className={BTN_SECONDARY}>
                  <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
                  Xem gói dịch vụ
                </Link>
              </div>
            </div>
          ) : step === 'confirm' ? (
            <div className="mt-6 flex flex-col gap-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Số tiền nạp</span>
                  <span className="text-xl font-bold text-indigo-600">{formatVnd(amount)}</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-slate-600">Phí giao dịch</span>
                  <span className="font-semibold text-emerald-600">Miễn phí</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-slate-600">Phương thức</span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-900 shadow-sm">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    VNPay
                  </span>
                </div>
                <div className="mt-3 border-t border-slate-200 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900">Tổng thanh toán</span>
                    <span className="text-2xl font-extrabold text-slate-900">{formatVnd(amount)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3 text-xs leading-relaxed text-indigo-900">
                <span className="material-symbols-outlined text-[18px] text-indigo-600">info</span>
                <span>Đây là môi trường thanh toán thử nghiệm. Tiền sẽ được cộng ngay vào ví sau khi xác nhận.</span>
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setStep('form')} className={BTN_SECONDARY}>
                  Quay lại
                </button>
                <button type="button" onClick={confirmTopup} disabled={busy} className={BTN_PRIMARY}>
                  <span className="material-symbols-outlined text-[18px]">lock</span>
                  {busy ? 'Đang xử lý...' : 'Xác nhận nạp tiền'}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-6 flex flex-col gap-5">
              <div>
                <label htmlFor="topup-amount" className="mb-2 block text-sm font-semibold text-slate-900">
                  Số tiền muốn nạp
                </label>
                <div className="relative">
                  <input
                    id="topup-amount"
                    type="number"
                    min={MIN_AMOUNT}
                    max={MAX_AMOUNT}
                    step={1000}
                    inputMode="numeric"
                    value={amountInput}
                    onChange={(e) => {
                      setAmountInput(e.target.value);
                      setError('');
                      setNotice('');
                    }}
                    placeholder="Nhập số tiền (VND)"
                    className={`h-12 w-full rounded-xl border bg-white px-4 pr-16 text-base font-semibold text-slate-900 outline-none transition focus:ring-2 ${
                      amountError
                        ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                        : 'border-slate-200 focus:border-indigo-400 focus:ring-indigo-100'
                    }`}
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                    VND
                  </span>
                </div>
                {amountError ? (
                  <p className="m-0 mt-1.5 text-xs font-medium text-red-600">{amountError}</p>
                ) : (
                  <p className="m-0 mt-1.5 text-xs text-slate-500">
                    Tối thiểu {formatVnd(MIN_AMOUNT)} · Tối đa {formatVnd(MAX_AMOUNT)} mỗi lần nạp.
                  </p>
                )}
              </div>

              <div>
                <p className="m-0 mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Chọn nhanh</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {PRESET_AMOUNTS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => choosePreset(value)}
                      className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all ${
                        amount === value
                          ? 'border-indigo-400 bg-indigo-50 text-indigo-700 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:text-indigo-600'
                      }`}
                    >
                      {value.toLocaleString('vi-VN')} ₫
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="m-0 mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Phương thức thanh toán</p>
                <div className="flex items-center justify-between rounded-xl border border-indigo-300 bg-indigo-50/50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm">
                      <span className="material-symbols-outlined text-[20px]">credit_card</span>
                    </span>
                    <div>
                      <p className="m-0 text-sm font-semibold text-slate-900">VNPay</p>
                      <p className="m-0 text-[11px] text-slate-500">Cổng thanh toán thử nghiệm · Miễn phí giao dịch</p>
                    </div>
                  </div>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white">
                    <span className="material-symbols-outlined text-[14px]">check</span>
                  </span>
                </div>
              </div>

              <button type="button" onClick={goToConfirm} className={`${BTN_PRIMARY} w-full`}>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                Tiếp tục
              </button>
            </div>
          )}
        </section>

        {/* History + guidance */}
        <aside className="flex flex-col gap-6 lg:col-span-5">
          <section className={`${CARD} p-5 sm:p-6`}>
            <div className="flex items-center justify-between gap-2">
              <h2 className="m-0 text-base font-bold text-slate-900">Giao dịch trong phiên này</h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                {history.length} giao dịch
              </span>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {history.map((record) => (
                <div key={record.code} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                      <span className="material-symbols-outlined text-[17px]">south_west</span>
                    </span>
                    <div className="min-w-0">
                      <p className="m-0 text-sm font-semibold text-slate-900">Nạp tiền vào ví</p>
                      <p className="m-0 truncate text-[11px] text-slate-500">{formatDateTime(record.at)} · {record.code}</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-emerald-600">+{formatVnd(record.amount)}</span>
                </div>
              ))}
              {history.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center">
                  <span className="material-symbols-outlined text-[26px] text-slate-300">receipt_long</span>
                  <p className="m-0 mt-1 text-xs text-slate-500">Chưa có giao dịch nạp tiền nào trong phiên này.</p>
                </div>
              )}
            </div>
          </section>

          <section className={`${CARD} p-5 sm:p-6`}>
            <h2 className="m-0 text-base font-bold text-slate-900">Lưu ý khi nạp tiền</h2>
            <ul className="mt-3 flex flex-col gap-2.5 text-sm text-slate-600">
              {[
                'Số tiền nạp được cộng ngay vào số dư khả dụng.',
                'Số dư ví dùng để mua gói dịch vụ và đặt lịch mentor.',
                'Mỗi giao dịch có mã riêng để đối soát khi cần.',
                'Liên hệ hỗ trợ nếu tiền chưa được cộng sau 5 phút.',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="material-symbols-outlined mt-0.5 text-[17px] text-teal-600">check_circle</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link to="/bug-reports" className={`${BTN_SECONDARY} mt-4 w-full`}>
              <span className="material-symbols-outlined text-[18px]">support_agent</span>
              Liên hệ hỗ trợ
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default WalletPage;
