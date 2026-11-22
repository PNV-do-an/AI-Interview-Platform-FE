import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PaymentService from '../../services/payment.service';
import OrderService from '../../services/order.service';
import { Wallet } from '../../models/Payment.model';
import {
  Order,
  ORDER_STATUS_LABELS,
  ServicePackage,
  formatVnd,
} from '../../models/Order.model';
import { parseServerTimestamp } from '../../utils/date';

const CARD = 'rounded-2xl border border-slate-200 bg-white shadow-sm';
const BTN_PRIMARY =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white no-underline shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60';
const BTN_SECONDARY =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 no-underline transition-colors hover:border-indigo-300 hover:bg-slate-50';

const statusTone: Record<Order['status'], string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-slate-100 text-slate-500 border-slate-200',
};

type PlanId = 'FREE' | 'PRO' | 'PREMIUM';

const PLAN_LABELS: Record<PlanId, string> = {
  FREE: 'Gói 1 – Free',
  PRO: 'Gói 2 – Pro',
  PREMIUM: 'Gói 3 – Premium',
};

const PLAN_PRICES: Record<PlanId, number> = {
  FREE: 0,
  PRO: 99000,
  PREMIUM: 299000,
};

const planStorageKey = (userId?: number) => `ai-interview:plan:${userId ?? 'guest'}`;

const PaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const isCandidate = user?.role === 'ROLE_USER';

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busyPackage, setBusyPackage] = useState<number | null>(null);
  const [busyOrder, setBusyOrder] = useState<number | null>(null);
  const [currentPlan, setCurrentPlan] = useState<PlanId>('FREE');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(planStorageKey(user?.id)) as PlanId | null;
      if (stored === 'FREE' || stored === 'PRO' || stored === 'PREMIUM') {
        setCurrentPlan(stored);
      } else if (stored === 'MENTOR') {
        setCurrentPlan('PREMIUM');
      }
    } catch {
      /* bỏ qua khi localStorage bị chặn */
    }
  }, [user?.id]);

  const load = async () => {
    setLoading(true);
    const tasks: Promise<void>[] = [
      PaymentService.getWallet()
        .then((res) => setWallet(res.data?.data ?? null))
        .catch(() => undefined),
    ];
    if (!isCandidate) {
      tasks.push(
        OrderService.getMyOrders()
          .then((res) => setOrders(res.data?.data ?? []))
          .catch(() => undefined),
        OrderService.getPackages()
          .then((res) => setPackages(res.data?.data ?? []))
          .catch(() => undefined),
      );
    }
    await Promise.all(tasks);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCandidate]);

  const buyPackage = async (pkg: ServicePackage) => {
    setBusyPackage(pkg.id);
    setError('');
    setNotice('');
    try {
      const created = await OrderService.createOrder({ packageId: pkg.id, paymentMethod: 'VNPAY' });
      const order = created.data?.data;
      if (!order) throw new Error('Không tạo được đơn hàng.');
      await OrderService.payOrder(order.id);
      setNotice(`Đã thanh toán gói "${pkg.name}".`);
      await load();
    } catch (e: any) {
      const message = e?.response?.data?.message || 'Không thể tạo hoặc thanh toán đơn hàng.';
      setError(
        /số dư|so du|balance|insufficient/i.test(message)
          ? 'Số dư ví không đủ để mua gói này. Hãy nạp thêm tiền rồi thử lại.'
          : message,
      );
    } finally {
      setBusyPackage(null);
    }
  };

  const payOrder = async (order: Order) => {
    setBusyOrder(order.id);
    setError('');
    setNotice('');
    try {
      await OrderService.payOrder(order.id);
      setNotice(`Đã thanh toán đơn ${order.orderCode}.`);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Thanh toán đơn hàng thất bại.');
    } finally {
      setBusyOrder(null);
    }
  };

  const cancelOrder = async (order: Order) => {
    setBusyOrder(order.id);
    setError('');
    setNotice('');
    try {
      await OrderService.cancelOrder(order.id);
      setNotice(`Đã huỷ đơn ${order.orderCode}.`);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Huỷ đơn hàng thất bại.');
    } finally {
      setBusyOrder(null);
    }
  };

  const pendingOrders = useMemo(
    () => orders.filter((order) => order.status === 'PENDING'),
    [orders],
  );
  const paidTotal = useMemo(
    () => orders.filter((order) => order.status === 'PAID').reduce((sum, order) => sum + order.amount, 0),
    [orders],
  );
  const recentOrders = useMemo(() => [...orders].sort((a, b) => b.id - a.id).slice(0, 6), [orders]);

  const summaryCards = isCandidate
    ? [
        {
          label: 'Số dư khả dụng',
          value: wallet ? formatVnd(wallet.availableBalance) : '—',
          icon: 'account_balance_wallet',
          tone: 'bg-indigo-50 text-indigo-600',
        },
        {
          label: 'Gói tài khoản',
          value: PLAN_LABELS[currentPlan],
          icon: 'workspace_premium',
          tone: 'bg-violet-50 text-violet-600',
        },
      ]
    : [
        {
          label: 'Số dư khả dụng',
          value: wallet ? formatVnd(wallet.availableBalance) : '—',
          icon: 'account_balance_wallet',
          tone: 'bg-indigo-50 text-indigo-600',
        },
        {
          label: 'Đơn chờ thanh toán',
          value: `${pendingOrders.length} đơn`,
          icon: 'receipt_long',
          tone: 'bg-violet-50 text-violet-600',
        },
      ];

  const quickActions = isCandidate
    ? [
        { to: '/wallet', icon: 'add_card', title: 'Nạp tiền vào ví', desc: 'Nạp tiền nhanh để thanh toán gói dịch vụ.' },
        { to: '/packages', icon: 'workspace_premium', title: 'Nâng cấp tài khoản', desc: 'Mở khoá thêm tính năng luyện tập.' },
        { to: '/packages', icon: 'inventory_2', title: 'Gói của tôi', desc: 'Xem các gói nâng cấp và quyền lợi.' },
        { to: '/my-profile', icon: 'person', title: 'Hồ sơ & CV', desc: 'Cập nhật hồ sơ để nhận gợi ý tốt hơn.' },
        { to: '/mock-interviews', icon: 'smart_toy', title: 'Luyện phỏng vấn AI', desc: 'Luyện tập và cải thiện kỹ năng.' },
        { to: '/bug-reports', icon: 'support_agent', title: 'Hỗ trợ thanh toán', desc: 'Gửi yêu cầu khi cần đối soát giao dịch.' },
      ]
    : [
        { to: '/wallet', icon: 'add_card', title: 'Nạp tiền vào ví', desc: 'Nạp tiền nhanh để thanh toán gói dịch vụ.' },
        { to: '/packages', icon: 'inventory_2', title: 'Gói dịch vụ', desc: 'Chọn gói phù hợp cho nhu cầu tuyển dụng.' },
        { to: '/my-orders', icon: 'receipt_long', title: 'Đơn hàng của tôi', desc: 'Xem, thanh toán hoặc huỷ các đơn hàng.' },
        { to: '/withdrawals', icon: 'account_balance', title: 'Rút tiền', desc: 'Gửi yêu cầu rút thu nhập về tài khoản.' },
        { to: '/my-bookings', icon: 'event_available', title: 'Lịch sử đặt lịch', desc: 'Theo dõi các buổi phỏng vấn đã đặt.' },
        { to: '/mentor-pricing', icon: 'sell', title: 'Bảng giá mentor', desc: 'Thiết lập giá và gói mentor của bạn.' },
      ];

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
              Trung tâm thanh toán
            </span>
            <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              Quản lý ví, gói dịch vụ và giao dịch ở một nơi
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-indigo-100">
              {isCandidate
                ? 'Nạp tiền, nâng cấp tài khoản và theo dõi toàn bộ giao dịch của bạn.'
                : 'Nạp tiền, mua gói tuyển dụng, thanh toán đơn hàng và theo dõi toàn bộ giao dịch.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/wallet"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 no-underline shadow-sm transition-transform hover:-translate-y-0.5"
            >
              <span className="material-symbols-outlined text-[18px]">add_card</span>
              Nạp tiền
            </Link>
            <Link
              to="/packages"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white no-underline backdrop-blur transition-colors hover:bg-white/20"
            >
              <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
              {isCandidate ? 'Nâng cấp tài khoản' : 'Gói dịch vụ'}
            </Link>
          </div>
        </div>
      </section>

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

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((item) => (
          <div key={item.label} className={`${CARD} flex items-start gap-3 p-5`}>
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${item.tone}`}>
              <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
            </span>
            <div className="min-w-0">
              <p className="m-0 text-xs font-medium uppercase tracking-wide text-slate-500">{item.label}</p>
              <p className="m-0 mt-1 truncate text-lg font-bold text-slate-900">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quickActions.map((action) => (
          <Link
            key={`${action.to}-${action.title}`}
            to={action.to}
            className={`${CARD} group flex items-start gap-3 p-5 no-underline transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md`}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600">
              <span className="material-symbols-outlined text-[22px]">{action.icon}</span>
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-slate-900 group-hover:text-indigo-600">{action.title}</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{action.desc}</span>
            </span>
            <span className="material-symbols-outlined ml-auto text-[18px] text-slate-300 group-hover:text-indigo-500">arrow_forward</span>
          </Link>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Main content */}
        <section className={`${CARD} p-5 sm:p-6 lg:col-span-7`}>
          {isCandidate ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="m-0 text-lg font-bold text-slate-900">Nâng cấp tài khoản</h2>
                  <p className="m-0 mt-0.5 text-sm text-slate-500">Chọn gói phù hợp để mở khoá thêm tính năng.</p>
                </div>
                <Link to="/packages" className="text-sm font-semibold text-indigo-600 no-underline hover:underline">
                  Xem tất cả
                </Link>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3">
                {(['FREE', 'PRO', 'PREMIUM'] as PlanId[]).map((plan) => {
                  const isCurrent = plan === currentPlan;
                  const price = PLAN_PRICES[plan];
                  return (
                    <div
                      key={plan}
                      className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 ${
                        plan === 'PRO' ? 'border-indigo-200 bg-indigo-50/40' : 'border-slate-200 bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                          plan === 'PRO' ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-slate-600 shadow-sm'
                        }`}>
                          <span className="material-symbols-outlined text-[20px]">
                            {plan === 'FREE' ? 'rocket_launch' : plan === 'PRO' ? 'psychology' : 'workspace_premium'}
                          </span>
                        </span>
                        <div>
                          <p className="m-0 text-sm font-bold text-slate-900">{PLAN_LABELS[plan]}</p>
                          <p className="m-0 text-xs text-slate-500">
                            {price === 0 ? 'Miễn phí' : `${formatVnd(price)} / tháng`}
                          </p>
                        </div>
                      </div>
                      {isCurrent ? (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                          Gói hiện tại
                        </span>
                      ) : (
                        <Link
                          to="/packages"
                          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white no-underline transition-colors hover:bg-indigo-700"
                        >
                          Nâng cấp
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="m-0 text-lg font-bold text-slate-900">Gói dịch vụ đang bán</h2>
                  <p className="m-0 mt-0.5 text-sm text-slate-500">Chọn gói và thanh toán ngay bằng số dư ví.</p>
                </div>
                <Link to="/packages" className="text-sm font-semibold text-indigo-600 no-underline hover:underline">
                  Xem tất cả
                </Link>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                {packages.slice(0, 4).map((pkg) => (
                  <div key={pkg.id} className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="m-0 text-sm font-bold text-slate-900">{pkg.name}</h3>
                        <p className="m-0 mt-1 text-xs text-slate-500">{pkg.description || `${pkg.durationDays} ngày sử dụng`}</p>
                      </div>
                      {pkg.active && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Đang bán</span>
                      )}
                    </div>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-lg font-bold text-indigo-600">{formatVnd(pkg.price)}</span>
                      <span className="text-xs text-slate-500">/ {pkg.durationDays} ngày</span>
                    </div>
                    <ul className="mt-2 flex flex-1 flex-col gap-1 text-xs text-slate-600">
                      <li className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px] text-teal-600">check</span>
                        Đăng tối đa {pkg.jobPostLimit} tin tuyển dụng
                      </li>
                      {(pkg.features ?? []).slice(0, 2).map((feature) => (
                        <li key={feature} className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px] text-teal-600">check</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => buyPackage(pkg)}
                      disabled={busyPackage === pkg.id || !pkg.active}
                      className={`${BTN_PRIMARY} mt-3 w-full`}
                    >
                      <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
                      {busyPackage === pkg.id ? 'Đang thanh toán...' : 'Mua gói'}
                    </button>
                  </div>
                ))}
                {!loading && packages.length === 0 && (
                  <p className="m-0 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500 md:col-span-2">
                    Chưa có gói dịch vụ nào đang bán.
                  </p>
                )}
                {loading && (
                  <p className="m-0 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500 md:col-span-2">
                    Đang tải gói dịch vụ...
                  </p>
                )}
              </div>
            </>
          )}
        </section>

        {/* Side column */}
        <section className="flex flex-col gap-6 lg:col-span-5">
          <div className={`${CARD} overflow-hidden`}>
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 px-5 py-4 text-white">
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10 blur-xl" />
              <p className="relative m-0 text-[11px] font-medium uppercase tracking-wide text-indigo-200">Số dư khả dụng</p>
              <p className="relative m-0 text-2xl font-bold tracking-tight">
                {wallet ? formatVnd(wallet.availableBalance) : '—'}
              </p>
            </div>
            <div className="flex flex-col gap-2 p-4">
              <Link to="/wallet" className={`${BTN_PRIMARY} w-full`}>
                <span className="material-symbols-outlined text-[18px]">add_card</span>
                Nạp tiền vào ví
              </Link>
              <Link to="/packages" className={`${BTN_SECONDARY} w-full`}>
                <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
                {isCandidate ? 'Nâng cấp tài khoản' : 'Mua gói dịch vụ'}
              </Link>
            </div>
          </div>

          {!isCandidate && (
            <div className={`${CARD} p-5 sm:p-6`}>
              <div className="flex items-center justify-between gap-2">
                <h2 className="m-0 text-base font-bold text-slate-900">Đơn chờ thanh toán</h2>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                  {pendingOrders.length} đơn
                </span>
              </div>
              <div className="mt-3 flex flex-col gap-2">
                {pendingOrders.slice(0, 3).map((order) => (
                  <div key={order.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="min-w-0">
                      <p className="m-0 truncate text-xs font-semibold text-slate-900">{order.packageName}</p>
                      <p className="m-0 text-[11px] text-slate-500">{order.orderCode} · {formatVnd(order.amount)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => payOrder(order)}
                      disabled={busyOrder === order.id}
                      className="rounded-lg bg-indigo-600 px-2.5 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
                    >
                      {busyOrder === order.id ? '...' : 'Thanh toán'}
                    </button>
                  </div>
                ))}
                {pendingOrders.length === 0 && (
                  <p className="m-0 rounded-xl border border-dashed border-slate-200 px-3 py-5 text-center text-xs text-slate-500">
                    Không có đơn hàng nào đang chờ thanh toán.
                  </p>
                )}
              </div>
            </div>
          )}

          {isCandidate && (
            <div className={`${CARD} p-5 sm:p-6`}>
              <h2 className="m-0 text-base font-bold text-slate-900">Quyền lợi gói {PLAN_LABELS[currentPlan]}</h2>
              <ul className="mt-3 flex flex-col gap-2 text-sm text-slate-600">
                {(currentPlan === 'FREE'
                  ? ['1 lượt phỏng vấn AI', 'Chỉ câu hỏi dễ', 'Báo cáo cơ bản']
                  : currentPlan === 'PRO'
                    ? ['10 lượt phỏng vấn AI', 'Câu hỏi dễ/trung bình/khó', 'Báo cáo chi tiết', 'Lưu lịch sử']
                    : ['30 lượt phỏng vấn AI', 'Toàn bộ cấp độ', 'Báo cáo chuyên sâu', 'Ưu đãi mentor 5%']
                ).map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="material-symbols-outlined mt-0.5 text-[17px] text-teal-600">check_circle</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/packages" className={`${BTN_SECONDARY} mt-4 w-full`}>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                Xem các gói nâng cấp
              </Link>
            </div>
          )}
        </section>
      </div>

      {/* Orders (employer only) */}
      {!isCandidate && (
        <section className={`${CARD} overflow-hidden`}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-4 sm:px-6">
            <div>
              <h2 className="m-0 text-lg font-bold text-slate-900">Đơn hàng gần đây</h2>
              <p className="m-0 mt-0.5 text-sm text-slate-500">
                Tổng đã thanh toán: <strong className="text-slate-900">{formatVnd(paidTotal)}</strong>
              </p>
            </div>
            <Link to="/my-orders" className="text-sm font-semibold text-indigo-600 no-underline hover:underline">
              Xem tất cả
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-semibold">Mã đơn</th>
                  <th className="px-5 py-3 font-semibold">Gói dịch vụ</th>
                  <th className="px-5 py-3 font-semibold">Số tiền</th>
                  <th className="px-5 py-3 font-semibold">Trạng thái</th>
                  <th className="px-5 py-3 font-semibold">Ngày tạo</th>
                  <th className="px-5 py-3 text-right font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                    <td className="px-5 py-3 font-mono text-xs font-semibold text-slate-700">{order.orderCode}</td>
                    <td className="px-5 py-3 font-medium text-slate-900">{order.packageName}</td>
                    <td className="px-5 py-3 font-semibold text-slate-900">{formatVnd(order.amount)}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusTone[order.status]}`}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">
                      {(() => {
                        const date = parseServerTimestamp(order.createdAt);
                        return date ? date.toLocaleDateString('vi-VN') : '—';
                      })()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {order.status === 'PENDING' ? (
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => payOrder(order)}
                            disabled={busyOrder === order.id}
                            className="rounded-lg bg-indigo-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                          >
                            Thanh toán
                          </button>
                          <button
                            type="button"
                            onClick={() => cancelOrder(order)}
                            disabled={busyOrder === order.id}
                            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-60"
                          >
                            Huỷ
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {!loading && recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">
                      Chưa có đơn hàng nào. Hãy mua gói dịch vụ đầu tiên của bạn.
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">
                      Đang tải đơn hàng...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};

export default PaymentsPage;
