import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  alt?: string;
}

// Official bKash Logo
export function BkashLogo({ className = "w-7 h-7", size, alt = "bKash" }: LogoProps) {
  return (
    <img
      src="/logos/bkash.svg"
      alt={alt}
      className={`object-contain inline-block shrink-0 ${className}`}
      style={size ? { width: size, height: size } : undefined}
    />
  );
}

// Official Nagad Logo
export function NagadLogo({ className = "w-7 h-7", size, alt = "Nagad" }: LogoProps) {
  return (
    <img
      src="/logos/nagad.svg"
      alt={alt}
      className={`object-contain inline-block shrink-0 ${className}`}
      style={size ? { width: size, height: size } : undefined}
    />
  );
}

// Official Rocket (Dutch-Bangla Bank) Logo
export function RocketLogo({ className = "w-7 h-7", size, alt = "Rocket" }: LogoProps) {
  return (
    <img
      src="/logos/rocket.svg"
      alt={alt}
      className={`object-contain inline-block shrink-0 ${className}`}
      style={size ? { width: size, height: size } : undefined}
    />
  );
}

// Official Upay Logo
export function UpayLogo({ className = "w-7 h-7", size, alt = "Upay" }: LogoProps) {
  return (
    <img
      src="/logos/upay.svg"
      alt={alt}
      className={`object-contain inline-block shrink-0 ${className}`}
      style={size ? { width: size, height: size } : undefined}
    />
  );
}

export function MfsLogo({ type, className = "w-7 h-7", size }: { type: string; className?: string; size?: number }) {
  const norm = (type || '').toLowerCase();
  switch (norm) {
    case 'bkash':
      return <BkashLogo className={className} size={size} />;
    case 'nagad':
      return <NagadLogo className={className} size={size} />;
    case 'rocket':
      return <RocketLogo className={className} size={size} />;
    case 'upay':
      return <UpayLogo className={className} size={size} />;
    default:
      return <span className="w-5 h-5 rounded-xs bg-slate-300 inline-block shrink-0" />;
  }
}

// MFS Badge with official logo + brand colored border/background
export function MfsBadge({
  type,
  showName = true,
  className = "",
}: {
  type: string;
  showName?: boolean;
  className?: string;
}) {
  const norm = (type || '').toLowerCase();
  const meta: Record<string, { name: string; bg: string; text: string; border: string }> = {
    bkash: { name: 'bKash', bg: 'bg-[#C5A880]/10', text: 'text-[#C5A880]', border: 'border-[#C5A880]/30' },
    nagad: { name: 'Nagad', bg: 'bg-[#F7941D]/10', text: 'text-[#F7941D]', border: 'border-[#F7941D]/30' },
    rocket: { name: 'Rocket', bg: 'bg-[#8C3494]/10', text: 'text-[#8C3494]', border: 'border-[#8C3494]/30' },
    upay: { name: 'Upay', bg: 'bg-[#002D62]/10', text: 'text-[#002D62]', border: 'border-[#002D62]/30' },
  };

  const info = meta[norm] || { name: type, bg: 'bg-slate-900', text: 'text-slate-300', border: 'border-slate-800' };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-sm border ${info.bg} ${info.border} ${className}`}>
      <span className="w-5 h-4 flex items-center justify-center p-0.5 bg-white rounded-xs shrink-0 shadow-xs">
        <MfsLogo type={norm} className="h-full w-full object-contain" />
      </span>
      {showName && <span className={`text-[11px] font-bold tracking-wider uppercase ${info.text}`}>{info.name}</span>}
    </span>
  );
}
