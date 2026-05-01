import { createElement } from 'react';
import { cn } from './classNames.js';

const buttonVariants = {
  primary: 'bg-emerald-500 text-slate-950 hover:bg-emerald-400',
  dark: 'bg-slate-950 text-white hover:bg-slate-800',
  secondary: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
  danger: 'bg-red-50 text-red-700 hover:bg-red-100',
  ghost: 'text-slate-600 hover:bg-slate-100',
};

const buttonSizes = {
  sm: 'min-h-10 px-3 py-2 text-sm',
  md: 'min-h-11 px-4 py-3 text-sm',
  icon: 'h-11 w-11 p-0',
};

const badgeVariants = {
  neutral: 'bg-slate-100 text-slate-700',
  success: 'bg-emerald-50 text-emerald-700',
  danger: 'bg-red-50 text-red-700',
};

const feedbackVariants = {
  muted: 'border-slate-200 bg-white text-slate-500',
  success: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  danger: 'border-red-100 bg-red-50 text-red-700',
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
        'inline-flex items-center justify-center gap-2 rounded-md font-black transition disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-700',
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
        'w-full rounded-md border border-slate-200 bg-white px-3 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100',
        className,
      )}
      {...props}
    />
  );
}

export function Card({ as = 'div', children, className = '', ...props }) {
  return createElement(
    as,
    {
      className: cn('rounded-lg border border-slate-200 bg-white shadow-sm', className),
      ...props,
    },
    children,
  );
}

export function Badge({ children, className = '', variant = 'neutral' }) {
  return (
    <span className={cn('inline-flex min-h-7 items-center rounded-full px-3 text-xs font-black', badgeVariants[variant], className)}>
      {children}
    </span>
  );
}

export function Feedback({ children, className = '', variant = 'muted' }) {
  return (
    <section className={cn('rounded-lg border p-5 text-sm font-bold', feedbackVariants[variant], className)}>
      {children}
    </section>
  );
}

export function Dialog({ children, className = '', as = 'section', ...props }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-4 sm:items-center">
      <Card as={as} className={cn('w-full max-w-md p-5 shadow-xl', className)} {...props}>
        {children}
      </Card>
    </div>
  );
}
