import { createElement } from 'react';
import { cn } from './classNames.js';

const buttonVariants = {
  primary: 'bg-gp-lime text-gp-text-inverse shadow-gp-sm hover:bg-gp-lime/90',
  dark: 'bg-gp-bg-panel text-gp-text-primary hover:bg-gp-bg-card',
  secondary: 'border border-gp-border bg-white text-gp-text-inverse hover:bg-slate-50',
  inverse: 'border border-gp-border-inverse bg-white/10 text-gp-text-primary hover:bg-white/20',
  danger: 'bg-gp-danger-soft text-gp-danger hover:bg-gp-danger/20',
  ghost: 'text-gp-text-muted hover:bg-slate-100 hover:text-gp-text-inverse',
};

const buttonSizes = {
  sm: 'min-h-10 px-3 py-2 text-gp-sm',
  md: 'min-h-11 px-4 py-3 text-gp-sm',
  icon: 'h-11 w-11 p-0',
};

const badgeVariants = {
  neutral: 'bg-slate-100 text-slate-700',
  success: 'bg-emerald-100 text-emerald-800',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-red-100 text-red-700',
};

const feedbackVariants = {
  muted: 'border-gp-border bg-white text-slate-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  danger: 'border-red-200 bg-red-50 text-red-800',
};

const cardTones = {
  light: 'gp-card-light',
  dark: 'gp-card',
  panel: 'gp-panel',
};

export function Button({
  children,
  className = '',
  size = 'md',
  variant = 'primary',
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex min-w-0 items-center justify-center gap-2 rounded-gp font-gp-black transition disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-700 disabled:shadow-none',
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function TextInput({ className = '', ...props }) {
  return (
    <input
      className={cn(
        'gp-field min-w-0 w-full px-3 py-3',
        className,
      )}
      {...props}
    />
  );
}

export function Card({ as = 'div', children, className = '', tone = 'light', ...props }) {
  return createElement(
    as,
    {
      className: cn(cardTones[tone] || cardTones.light, className),
      ...props,
    },
    children,
  );
}

export function Badge({ children, className = '', variant = 'neutral' }) {
  return (
    <span className={cn('inline-flex min-h-7 max-w-full items-center gap-1.5 rounded-gp-pill px-3 text-gp-xs font-gp-black', badgeVariants[variant], className)}>
      {children}
    </span>
  );
}

export function Feedback({ children, className = '', variant = 'muted' }) {
  return (
    <section className={cn('rounded-gp border p-5 text-gp-sm font-gp-bold', feedbackVariants[variant], className)}>
      {children}
    </section>
  );
}

export function Dialog({ children, className = '', as = 'section', ...props }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-gp-bg-main/70 p-4 sm:items-center">
      <Card as={as} className={cn('max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto overscroll-contain p-5 shadow-gp-modal', className)} {...props}>
        {children}
      </Card>
    </div>
  );
}

export function EmptyState({ icon = null, title, children, className = '', iconClassName = '', ...props }) {
  return (
    <div
      className={cn('rounded-gp border border-dashed border-gp-border-inverse bg-white/5 px-4 py-8 text-center', className)}
      {...props}
    >
      {icon && (
        <div className={cn('mx-auto flex justify-center text-gp-text-muted', iconClassName)}>
          {icon}
        </div>
      )}
      {title && <strong className="mt-3 block text-gp-base">{title}</strong>}
      {children && <span className="mt-1 block text-gp-sm font-gp-bold text-gp-text-muted">{children}</span>}
    </div>
  );
}

export function DataTable({ children, className = '', ...props }) {
  return (
    <table className={cn('gp-table w-full text-left text-gp-sm', className)} {...props}>
      {children}
    </table>
  );
}

export function ModalActions({ children, className = '', ...props }) {
  return (
    <div className={cn('mt-5 grid grid-cols-2 gap-3', className)} {...props}>
      {children}
    </div>
  );
}

export function PanelHeader({ title, subtitle, action = null, children = null, className = '', ...props }) {
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3 border-b border-gp-border-inverse p-4', className)} {...props}>
      <div>
        {title && <h2 className="text-lg font-black">{title}</h2>}
        {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
      </div>
      {action || children}
    </div>
  );
}
