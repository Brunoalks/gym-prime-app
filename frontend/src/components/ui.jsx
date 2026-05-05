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
  success: 'bg-gp-success-soft text-gp-success',
  warning: 'bg-gp-warning-soft text-gp-warning',
  danger: 'bg-gp-danger-soft text-gp-danger',
};

const feedbackVariants = {
  muted: 'border-gp-border bg-white text-slate-500',
  success: 'border-gp-success/25 bg-gp-success-soft text-gp-text-inverse',
  danger: 'border-gp-danger/25 bg-gp-danger-soft text-gp-danger',
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
        'inline-flex items-center justify-center gap-2 rounded-gp font-gp-black transition disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none',
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
        'gp-field w-full px-3 py-3',
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
    <span className={cn('inline-flex min-h-7 items-center gap-1.5 rounded-gp-pill px-3 text-gp-xs font-gp-black', badgeVariants[variant], className)}>
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-gp-bg-main/70 p-4 sm:items-center">
      <Card as={as} className={cn('w-full max-w-md p-5 shadow-gp-modal', className)} {...props}>
        {children}
      </Card>
    </div>
  );
}
