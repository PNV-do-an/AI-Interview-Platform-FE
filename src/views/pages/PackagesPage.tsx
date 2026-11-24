import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PaymentService from '../../services/payment.service';
import OrderService from '../../services/order.service';
import { Wallet } from '../../models/Payment.model';
import { Order, ServicePackage, formatVnd } from '../../models/Order.model';

const CARD = 'rounded-2xl border border-slate-200 bg-white shadow-sm';
const BTN_PRIMARY =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white no-underline shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60';
const BTN_SECONDARY =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 no-underline transition-colors hover:border-indigo-300 hover:bg-slate-50';

type PlanId = 'FREE' | 'PRO' | 'PREMIUM';

interface UpgradePlan {
  id: PlanId;
  name: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  badge: string;
  icon: string;
  features: string[];
  highlight?: boolean;
}

const UPGRADE_PLANS: UpgradePlan[] = [
  {
    id: 'FREE',
    name: 'Gói 1 – Free',
    tagline: 'Thu hút người dùng · Dành cho người mới trải nghiệm',
    monthlyPrice: 0,
    yearlyPrice: 0,
    badge: 'Miễn phí',
    icon: 'rocket_launch',
    features: [
      '1 lượt phỏng vấn AI miễn phí',
      'Chỉ sử dụng câu hỏi dễ',
      'Báo cáo kết quả cơ bản',
      'Xem danh sách mentor',
      'Không bao gồm đặt lịch mentor miễn phí',
    ],
  },
  {
    id: 'PRO',
    name: 'Gói 2 – Pro',
    tagline: 'Gói chủ lực · Gói trả trước dành cho sinh viên',
    monthlyPrice: 99000,
    yearlyPrice: 99000,
    badge: 'Gói chủ lực',
    icon: 'psychology',
    highlight: true,
    features: [
      '10 lượt phỏng vấn AI',
      'Câu hỏi dễ, trung bình và khó',
      'Báo cáo phân tích chi tiết',
      'Lưu lịch sử phỏng vấn',
      'Gợi ý cải thiện câu trả lời',
      'Hạn sử dụng 30 ngày',
    ],
  },
  {
    id: 'PREMIUM',
    name: 'Gói 3 – Premium',
    tagline: 'Cao cấp · Dành cho người chuẩn bị ứng tuyển',
    monthlyPrice: 299000,
    yearlyPrice: 299000,
    badge: 'Cao cấp',
    icon: 'workspace_premium',
    features: [
      '30 lượt phỏng vấn AI',
      'Toàn bộ cấp độ câu hỏi',
      'Báo cáo phân tích chuyên sâu',
      'Lưu lịch sử và theo dõi tiến độ',
      'Ưu tiên mở khóa bộ câu hỏi chuyên ngành',
      'Ưu đãi đặt lịch mentor tối đa 5%',
      'Hạn sử dụng 60 ngày',
    ],
  },
];

const planKey = (userId?: number) => `ai-interview:plan:${userId ?? 'guest'}`;

const PackagesPage: React.FC = () => {
  const { user } = useAuth();
  const isCandidate = user?.role === 'ROLE_USER';

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyPackage, setBusyPackage] = useState<number | null>(null);
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
  const [paying, setPaying] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<PlanId>('FREE');
  const [selectedPlan, setSelectedPlan] = useState<UpgradePlan | null>(null);
  const [requestBusy, setRequestBusy] = useState(false);

  useEffect(() => {
    try {
      const storedPlan = localStorage.getItem(planKey(user?.id)) as PlanId | null;
      if (storedPlan === 'FREE' || storedPlan === 'PRO' || storedPlan === 'PREMIUM') {
        setCurrentPlan(storedPlan);
      } else if (storedPlan === 'MENTOR') {
        setCurrentPlan('PREMIUM');
      }
    } catch {
      /* localStorage có thể bị chặn - bỏ qua trạng thái gói */
    }
  }, [user?.id]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    const tasks: Promise<void>[] = [
      PaymentService.getWallet()
        .then((res) => {
          if (!cancelled) setWallet(res.data?.data ?? null);
        })
        .catch(() => undefined),
    ];
    if (!isCandidate) {
      tasks.push(
        OrderService.getPackages()
          .then((res) => {
            if (!cancelled) setPackages(res.data?.data ?? []);
          })
          .catch(() => undefined),
      );
    }
    void Promise.all(tasks).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [isCandidate]);

  const activePackages = useMemo(
    () => packages.filter((pkg) => pkg.active),
    [packages],
  );

  const buyPackage = async (pkg: ServicePackage) => {
    setBusyPackage(pkg.id);
    setError('');
    setNotice('');
    try {
      const created = await OrderService.createOrder({ packageId: pkg.id, paymentMethod: 'WALLET' });
      const order = created.data?.data;
      if (!order) throw new Error('Không tạo được đơn hàng.');
      setPendingOrder(order);
    } catch (e: any) {
      const message = e?.response?.data?.message || 'Không thể tạo đơn hàng. Vui lòng thử lại.';
      setError(
        /số dư|so du|balance|insufficient/i.test(message)
          ? 'Số dư ví không đủ để mua gói này. Hãy nạp thêm tiền rồi thử lại.'
          : message,
      );
    } finally {
      setBusyPackage(null);
    }
  };

  const confirmPayOrder = async () => {
    if (!pendingOrder) return;
    setPaying(true);
    setError('');
    setNotice('');
    try {
      await OrderService.payOrder(pendingOrder.id);
      const walletRes = await PaymentService.getWallet();
      setWallet(walletRes.data?.data ?? wallet);
      setNotice(`Đã thanh toán gói "${pendingOrder.packageName}" thành công từ ví (nạp tiền qua payOS).`);
      setPendingOrder(null);
    } catch (e: any) {
      const message = e?.response?.data?.message || 'Thanh toán thất bại. Vui lòng thử lại.';
      setError(
        /số dư|so du|balance|insufficient/i.test(message)
          ? 'Số dư ví không đủ để thanh toán. Hãy nạp thêm tiền rồi thử lại.'
          : message,
      );
      setPendingOrder(null);
    } finally {
      setPaying(false);
    }
  };

  const confirmUpgrade = async () => {
    if (!selectedPlan || selectedPlan.id === 'FREE') return;
    setRequestBusy(true);
    setError('');
    setNotice('');
    try {
      const backendPlan = selectedPlan.id === 'PRO' ? 'NORMAL' : 'ADVANCED';
      const res = await PaymentService.upgradeAccount({
        plan: backendPlan,
        billingCycle: 'MONTHLY',
      });
      const payload = res.data?.data;
      const nextPlan: PlanId = backendPlan === 'NORMAL' ? 'PRO' : 'PREMIUM';
      try {
        localStorage.setItem(planKey(user?.id), nextPlan);
      } catch {
        /* bỏ qua khi localStorage bị chặn */
      }
      setCurrentPlan(nextPlan);
      if (payload?.wallet) {
        setWallet(payload.wallet);
      } else {
        const walletRes = await PaymentService.getWallet();
        setWallet(walletRes.data?.data ?? wallet);
      }
      setSelectedPlan(null);
      setNotice(
        `Đã nâng cấp lên gói ${selectedPlan.name} thành công. Số tiền ${formatVnd(
          selectedPlan.monthlyPrice,
        )} đã được trừ vào ví.`,
      );
    } catch (e: any) {
      const message = e?.response?.data?.message || 'Không thể nâng cấp tài khoản. Vui lòng thử lại.';
      setError(
        /số dư|so du|balance|insufficient/i.test(message)
          ? 'Số dư ví không đủ để nâng cấp. Hãy nạp thêm tiền rồi thử lại.'
          : message,
      );
    } finally {
      setRequestBusy(false);
    }
  };

  const renderUpgradePlans = () => (
    <>
      <div className="flex flex-col items-center gap-3">
        <p className="m-0 text-xs text-slate-500">
          Gói hiện tại: <strong className="text-slate-900">{UPGRADE_PLANS.find((p) => p.id === currentPlan)?.name ?? 'Gói 1 – Free'}</strong>
        </p>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-3">
        {UPGRADE_PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          const price = plan.monthlyPrice;
          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
                plan.highlight ? 'border-indigo-300 ring-2 ring-indigo-100' : 'border-slate-200'
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-md">
                  {plan.badge}
                </span>
              )}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    plan.id === 'FREE'
                      ? 'bg-slate-100 text-slate-700'
                      : plan.id === 'PRO'
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'bg-teal-50 text-teal-700'
                  }`}>
                    {plan.badge}
                  </span>
                  <h3 className="m-0 mt-3 text-xl font-bold text-slate-900">{plan.name}</h3>
                  <p className="m-0 mt-1 text-sm leading-relaxed text-slate-500">{plan.tagline}</p>
                </div>
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                  plan.id === 'FREE'
                    ? 'bg-slate-100 text-slate-500'
                    : plan.id === 'PRO'
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'bg-teal-50 text-teal-600'
                }`}>
                  <span className="material-symbols-outlined text-[24px]">{plan.icon}</span>
                </span>
              </div>

              <div className="mt-5 border-y border-slate-100 py-4">
                <div className="flex items-baseline gap-1">
                  <span className={`text-3xl font-extrabold tracking-tight ${plan.highlight ? 'text-indigo-600' : 'text-slate-900'}`}>
                    {price === 0 ? '0' : price.toLocaleString('vi-VN')}
                  </span>
                  <span className="text-sm font-semibold text-slate-900">VND</span>
                  <span className="text-xs text-slate-400">/ tháng</span>
                </div>
                <p className="m-0 mt-1 text-xs text-slate-500">
                  {plan.monthlyPrice === 0
                    ? 'Không cần thanh toán'
                    : 'Thanh toán một lần, sử dụng theo hạn mức'}
                </p>
              </div>

              <ul className="mt-4 flex flex-1 flex-col gap-2.5 text-sm text-slate-600">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span className={`material-symbols-outlined mt-0.5 text-[17px] ${plan.highlight ? 'text-indigo-500' : 'text-teal-600'}`}>check_circle</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-5">
                {isCurrent ? (
                  <button type="button" disabled className={`${BTN_SECONDARY} w-full opacity-70`}>
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    Gói hiện tại
                  </button>
                ) : plan.id === 'FREE' ? (
                  <button type="button" disabled className={`${BTN_SECONDARY} w-full opacity-70`}>
                    Gói mặc định
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPlan(plan);
                      setError('');
                      setNotice('');
                    }}
                    className={`${BTN_PRIMARY} w-full`}
                  >
                    <span className="material-symbols-outlined text-[18px]">star</span>
                    Nâng cấp ngay
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 px-5 py-4 text-sm text-indigo-900">
        <div className="flex items-start gap-2">
          <span className="material-symbols-outlined text-[20px] text-indigo-600">info</span>
          <p className="m-0 leading-relaxed">
            Gói nâng cấp áp dụng cho tài khoản ứng viên. Sau khi thanh toán, gói sẽ được kích hoạt ngay và bạn có thể sử dụng đầy đủ quyền lợi.
          </p>
        </div>
      </div>
    </>
  );

  const renderServicePackages = () => (
    <>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="m-0 text-xl font-bold text-slate-900">Gói dịch vụ tuyển dụng</h2>
          <p className="m-0 mt-1 text-sm text-slate-500">
            Chọn gói phù hợp với quy mô tuyển dụng. Thanh toán trực tiếp bằng số dư ví.
          </p>
        </div>
        <Link to="/wallet" className={BTN_SECONDARY}>
          <span className="material-symbols-outlined text-[18px]">add_card</span>
          Nạp thêm tiền
        </Link>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">
        {activePackages.map((pkg) => (
          <div key={pkg.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                  Đang bán
                </span>
                <h3 className="m-0 mt-3 text-xl font-bold text-slate-900">{pkg.name}</h3>
                <p className="m-0 mt-1 min-h-[40px] text-sm leading-relaxed text-slate-500">
                  {pkg.description || `Gói sử dụng trong ${pkg.durationDays} ngày.`}
                </p>
              </div>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <span className="material-symbols-outlined text-[24px]">inventory_2</span>
              </span>
            </div>

            <div className="mt-5 border-y border-slate-100 py-4">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold tracking-tight text-indigo-600">{pkg.price.toLocaleString('vi-VN')}</span>
                <span className="text-sm font-semibold text-slate-900">VND</span>
                <span className="text-xs text-slate-400">/ {pkg.durationDays} ngày</span>
              </div>
              <p className="m-0 mt-1 text-xs text-slate-500">Đăng tối đa {pkg.jobPostLimit} tin tuyển dụng</p>
            </div>

            <ul className="mt-4 flex flex-1 flex-col gap-2.5 text-sm text-slate-600">
              {(pkg.features ?? []).map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <span className="material-symbols-outlined mt-0.5 text-[17px] text-teal-600">check_circle</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => buyPackage(pkg)}
              disabled={busyPackage === pkg.id}
              className={`${BTN_PRIMARY} mt-5 w-full`}
            >
              <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
              {busyPackage === pkg.id ? 'Đang thanh toán...' : 'Mua gói'}
            </button>
          </div>
        ))}
      </div>

      {!loading && activePackages.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
          <span className="material-symbols-outlined text-[32px] text-slate-400">inventory_2</span>
          <p className="m-0 mt-2 text-sm font-semibold text-slate-700">Chưa có gói dịch vụ nào đang bán</p>
          <p className="m-0 mt-1 text-xs text-slate-500">Vui lòng quay lại sau hoặc liên hệ bộ phận hỗ trợ.</p>
        </div>
      )}
      {loading && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
          Đang tải gói dịch vụ...
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { icon: 'account_balance_wallet', title: 'Thanh toán bằng ví', desc: 'Số dư được trừ ngay khi mua gói.' },
          { icon: 'receipt_long', title: 'Hoá đơn minh bạch', desc: 'Theo dõi đơn hàng trong mục Đơn hàng.' },
          { icon: 'support_agent', title: 'Hỗ trợ 24/7', desc: 'Liên hệ khi cần thay đổi hoặc gia hạn gói.' },
        ].map((item) => (
          <div key={item.title} className={`${CARD} flex items-start gap-3 p-4`}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
            </span>
            <div>
              <p className="m-0 text-sm font-semibold text-slate-900">{item.title}</p>
              <p className="m-0 mt-0.5 text-xs leading-relaxed text-slate-500">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 px-6 py-8 text-white shadow-xl sm:px-10 sm:py-10">
        <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-20 right-24 h-44 w-44 rounded-full bg-teal-300/20 blur-2xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
              <span className="material-symbols-outlined text-[15px]">workspace_premium</span>
              {isCandidate ? 'Nâng cấp tài khoản' : 'Gói dịch vụ tuyển dụng'}
            </span>
            <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              {isCandidate
                ? 'Đầu tư cho sự nghiệp với gói luyện phỏng vấn phù hợp'
                : 'Chọn gói dịch vụ phù hợp với doanh nghiệp của bạn'}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-indigo-100">
              {isCandidate
                ? 'Mở khoá thêm lượt luyện AI, báo cáo chuyên sâu và đồng hành cùng mentor giàu kinh nghiệm.'
                : 'Đăng tin không giới hạn, tiếp cận ứng viên chất lượng và quản lý toàn bộ quy trình tuyển dụng.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 backdrop-blur">
              <p className="m-0 text-[10px] font-medium uppercase tracking-wide text-indigo-200">Số dư khả dụng</p>
              <p className="m-0 text-lg font-bold">{wallet ? formatVnd(wallet.availableBalance) : '—'}</p>
            </div>
            <Link
              to="/wallet"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 no-underline shadow-sm transition-transform hover:-translate-y-0.5"
            >
              <span className="material-symbols-outlined text-[18px]">add_card</span>
              Nạp tiền
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

      {isCandidate ? renderUpgradePlans() : renderServicePackages()}

      {/* Footer links */}
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span className="material-symbols-outlined text-[20px] text-indigo-500">receipt_long</span>
          Cần xem lại giao dịch?
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/payments" className={BTN_SECONDARY}>
            <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
            Trung tâm thanh toán
          </Link>
          {!isCandidate && (
            <Link to="/my-orders" className={BTN_SECONDARY}>
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
              Đơn hàng của tôi
            </Link>
          )}
        </div>
      </section>

      {/* Upgrade request modal */}
      {selectedPlan && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={() => setSelectedPlan(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="m-0 text-xs font-semibold uppercase tracking-wide text-indigo-600">Xác nhận nâng cấp</p>
                <h3 className="m-0 mt-1 text-xl font-bold text-slate-900">{selectedPlan.name}</h3>
                <p className="m-0 mt-1 text-sm text-slate-500">{selectedPlan.tagline}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlan(null)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label="Đóng"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Số tiền thanh toán</span>
                <span className="text-lg font-bold text-indigo-600">
                  {formatVnd(selectedPlan.monthlyPrice)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-slate-600">Email liên hệ</span>
                <span className="font-medium text-slate-900">{user?.email}</span>
              </div>
            </div>

            <ul className="mt-4 flex flex-col gap-2 text-sm text-slate-600">
              {selectedPlan.features.slice(0, 4).map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <span className="material-symbols-outlined mt-0.5 text-[17px] text-teal-600">check_circle</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <p className="mt-4 text-xs leading-relaxed text-slate-500">
              Số tiền sẽ được trừ ngay vào ví khả dụng và gói sẽ được kích hoạt ngay sau khi thanh toán thành công.
            </p>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setSelectedPlan(null)} className={BTN_SECONDARY}>
                Để sau
              </button>
              <button type="button" onClick={confirmUpgrade} disabled={requestBusy} className={BTN_PRIMARY}>
                <span className="material-symbols-outlined text-[18px]">lock</span>
                {requestBusy ? 'Đang thanh toán...' : 'Thanh toán & nâng cấp'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Wallet checkout modal */}
      {pendingOrder && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={() => !paying && setPendingOrder(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="m-0 text-xs font-semibold uppercase tracking-wide text-indigo-600">Wallet Checkout</p>
                <h3 className="m-0 mt-1 text-xl font-bold text-slate-900">Thanh toán đơn hàng</h3>
                <p className="m-0 mt-1 text-sm text-slate-500">Số dư ví đã nạp qua payOS sẽ được sử dụng để thanh toán.</p>
              </div>
              <button
                type="button"
                onClick={() => !paying && setPendingOrder(null)}
                disabled={paying}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                aria-label="Đóng"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Mã đơn hàng</span>
                <span className="font-mono font-semibold text-slate-900">{pendingOrder.orderCode}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-slate-600">Gói dịch vụ</span>
                <span className="font-semibold text-slate-900">{pendingOrder.packageName}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-slate-600">Phương thức</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[#0068FF] shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-[#0068FF]" />
                  Ví payOS
                </span>
              </div>
              <div className="mt-3 border-t border-slate-200 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-900">Tổng thanh toán</span>
                  <span className="text-2xl font-extrabold text-[#0068FF]">{formatVnd(pendingOrder.amount)}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3 text-xs leading-relaxed text-indigo-900">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[18px] text-indigo-600">info</span>
                <span>Số dư ví sẽ được trừ ngay sau khi xác nhận. Nếu chưa có tiền, hãy nạp qua payOS tại trang Ví.</span>
              </div>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setPendingOrder(null)}
                disabled={paying}
                className={BTN_SECONDARY}
              >
                Huỷ
              </button>
              <button
                type="button"
                onClick={confirmPayOrder}
                disabled={paying}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0068FF] px-4 py-2.5 text-sm font-semibold text-white no-underline shadow-sm transition-all hover:bg-[#0052cc] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                {paying ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                    Đang xử lý thanh toán...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">lock</span>
                    Thanh toán từ ví
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default PackagesPage;
