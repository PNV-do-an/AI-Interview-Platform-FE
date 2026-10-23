import React from 'react';
import logoMark from '../../assets/logo-mark.png';

/**
 * Mark chính thức của nền tảng (micro + profile đầu, dải xanh `#3525cd`), nền trong suốt nên
 * dùng được trên cả nền sáng lẫn nền tối. Asset là bản 128px cắt sát cạnh (33KB) — file gốc
 * 1254px nặng 1.2MB, không đưa vào bundle.
 */
export const LogoMark: React.FC<{ className?: string }> = ({ className = 'h-6' }) => (
  <img src={logoMark} alt="AI Interview" className={`${className} w-auto object-contain shrink-0`} />
);

/**
 * Mark không chứa chữ nên mọi chỗ cần nhận diện thương hiệu đều phải kèm tên sản phẩm —
 * chỉ dùng `LogoMark` trần khi cạnh bên đã có chữ mô tả sản phẩm (tile đăng nhập/đăng ký).
 * Màu chữ lấy theo parent để mỗi shell giữ token riêng (`text-ink`, `text-on-surface`, ...).
 */
const BrandLogo: React.FC<{ markClass?: string; nameClass?: string; sub?: string }> = ({
  markClass = 'h-6',
  nameClass = 'text-[15px] font-bold tracking-tight',
  sub,
}) => (
  <span className="inline-flex items-center gap-2 min-w-0">
    <LogoMark className={markClass} />
    <span className="flex flex-col min-w-0 leading-tight">
      <span className={`${nameClass} truncate`}>AI Interview</span>
      {sub && (
        <span className="text-[11px] font-medium uppercase tracking-wider opacity-70 truncate">{sub}</span>
      )}
    </span>
  </span>
);

export default BrandLogo;
