import { useEffect, useId, useRef, type ButtonHTMLAttributes, type HTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2, Info, Loader2, Search, X, XCircle, type LucideIcon } from 'lucide-react';

const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(' ');

/* ------------------------------------------------------------------ Botões */

const VARIANTES = {
  primary: 'bg-brand-600 text-white shadow-sm shadow-brand-600/20 hover:bg-brand-700',
  secondary: 'bg-white text-slate-700 ring-1 ring-inset ring-slate-200 shadow-xs hover:bg-slate-50 hover:text-slate-900',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700',
  success: 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700',
  magic: 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-sm hover:from-violet-500 hover:to-fuchsia-500',
};
const TAMANHOS = {
  sm: 'h-9 px-3 text-sm gap-1.5 rounded-lg',
  md: 'h-11 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2 rounded-xl',
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof VARIANTES;
  size?: keyof typeof TAMANHOS;
  icon?: LucideIcon;
  loading?: boolean;
};

export function Button({ variant = 'primary', size = 'md', icon: Icon, loading, className, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={cx(
        'inline-flex shrink-0 items-center justify-center font-semibold whitespace-nowrap transition-colors disabled:opacity-50 disabled:pointer-events-none',
        VARIANTES[variant], TAMANHOS[size], className,
      )}
      {...props}
    >
      {loading ? <Loader2 size={18} className="animate-spin" /> : Icon && <Icon size={18} />}
      {children}
    </button>
  );
}

/** Botão só com ícone: `label` vira tooltip e texto para leitores de tela. */
export function IconButton({ icon: Icon, label, tone = 'default', className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: LucideIcon;
  label: string;
  tone?: 'default' | 'danger';
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={cx(
        'inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors',
        tone === 'danger' ? 'hover:bg-red-50 hover:text-red-600' : 'hover:bg-slate-100 hover:text-slate-900',
        className,
      )}
      {...props}
    >
      <Icon size={18} />
    </button>
  );
}

/* ------------------------------------------------------------- Formulários */

export const inputClass =
  'h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 shadow-xs placeholder:text-slate-400 transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(inputClass, className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cx(inputClass, 'appearance-none bg-[url("data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2716%27%20height=%2716%27%20fill=%27none%27%20stroke=%27%2394a3b8%27%20stroke-width=%272%27%3E%3Cpath%20d=%27m4%206%204%204%204-4%27/%3E%3C/svg%3E")] bg-[position:right_0.75rem_center] bg-no-repeat pr-9', className)} {...props}>
      {children}
    </select>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">{label}</label>
      {children(id)}
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Buscar...' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative w-full sm:w-64">
      <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cx(inputClass, 'h-10 pl-9')}
      />
    </div>
  );
}

/** Barra "digite e adicione" usada no topo das listas de cadastro. */
export function QuickAdd({ children, onSubmit }: { children: ReactNode; onSubmit: () => void }) {
  return (
    <form
      onSubmit={e => { e.preventDefault(); onSubmit(); }}
      className="mb-8 flex flex-col gap-2 rounded-2xl bg-white p-2 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-center"
    >
      {children}
    </form>
  );
}

export const quickAddInputClass = 'h-12 min-w-0 flex-1 bg-transparent px-4 text-[15px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none';

/* ------------------------------------------------------------ Layout/textos */

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('rounded-2xl bg-white shadow-sm ring-1 ring-slate-200', className)} {...props}>{children}</div>;
}

/** Cartão clicável das listas (professores, turmas, disciplinas...). */
export function TileButton({ className, children, warning, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { warning?: boolean }) {
  return (
    <button
      type="button"
      className={cx(
        'group flex w-full flex-col rounded-2xl bg-white p-5 text-left shadow-sm ring-1 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/70',
        warning ? 'ring-red-300 hover:ring-red-400' : 'ring-slate-200 hover:ring-brand-300',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function IconBadge({ icon: Icon, tone = 'brand', size = 'md' }: { icon: LucideIcon; tone?: 'brand' | 'amber' | 'emerald' | 'violet' | 'slate' | 'red'; size?: 'sm' | 'md' | 'lg' }) {
  const tons = {
    brand: 'bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    violet: 'bg-violet-50 text-violet-600',
    slate: 'bg-slate-100 text-slate-500',
    red: 'bg-red-50 text-red-600',
  };
  const tamanhos = { sm: 'size-9 rounded-lg', md: 'size-11 rounded-xl', lg: 'size-14 rounded-2xl' };
  return (
    <div className={cx('flex shrink-0 items-center justify-center transition-colors', tons[tone], tamanhos[size])}>
      <Icon size={size === 'lg' ? 26 : size === 'md' ? 22 : 18} />
    </div>
  );
}

export function Badge({ tone = 'slate', children, className }: { tone?: 'slate' | 'brand' | 'red' | 'amber' | 'emerald'; children: ReactNode; className?: string }) {
  const tons = {
    slate: 'bg-slate-100 text-slate-600',
    brand: 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200/60',
    red: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200',
    amber: 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200',
    emerald: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  };
  return <span className={cx('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold', tons[tone], className)}>{children}</span>;
}

export function EmptyState({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="col-span-full flex flex-col items-center rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 px-6 py-14 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Icon size={28} />
      </div>
      <h3 className="font-semibold text-slate-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

const ALERTAS = {
  error: { icon: XCircle, cls: 'bg-red-50 text-red-800 ring-red-200', iconCls: 'text-red-500' },
  warning: { icon: AlertTriangle, cls: 'bg-amber-50 text-amber-900 ring-amber-200', iconCls: 'text-amber-500' },
  success: { icon: CheckCircle2, cls: 'bg-emerald-50 text-emerald-800 ring-emerald-200', iconCls: 'text-emerald-500' },
  info: { icon: Info, cls: 'bg-brand-50 text-brand-900 ring-brand-200', iconCls: 'text-brand-500' },
};

export function Alert({ tone = 'info', title, children, className }: { tone?: keyof typeof ALERTAS; title?: ReactNode; children?: ReactNode; className?: string }) {
  const { icon: Icon, cls, iconCls } = ALERTAS[tone];
  return (
    <div role={tone === 'error' ? 'alert' : undefined} className={cx('flex gap-3 rounded-xl p-4 text-sm ring-1 ring-inset', cls, className)}>
      <Icon size={20} className={cx('mt-px shrink-0', iconCls)} />
      <div className="min-w-0 flex-1">
        {title && <div className="font-semibold">{title}</div>}
        {children && <div className={title ? 'mt-1 opacity-90' : ''}>{children}</div>}
      </div>
    </div>
  );
}

export function Tabs<T extends string>({ value, onChange, tabs }: {
  value: T;
  onChange: (v: T) => void;
  tabs: { value: T; label: string; icon?: LucideIcon; count?: number }[];
}) {
  return (
    <div role="tablist" className="inline-flex rounded-xl bg-slate-100 p-1">
      {tabs.map(({ value: v, label, icon: Icon, count }) => (
        <button
          key={v}
          role="tab"
          type="button"
          aria-selected={value === v}
          onClick={() => onChange(v)}
          className={cx(
            'flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-all',
            value === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800',
          )}
        >
          {Icon && <Icon size={16} />} {label}
          {count !== undefined && (
            <span className={cx('rounded-full px-1.5 text-xs', value === v ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-500')}>{count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------- Modal */

export function Modal({ title, subtitle, icon, headerActions, footer, size = 'md', onClose, children }: {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  headerActions?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  // Guarda o onClose mais recente sem refazer o efeito (que roubaria o foco a cada render).
  const fechar = useRef(onClose);
  useEffect(() => { fechar.current = onClose; });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && fechar.current();
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Foca o primeiro campo, ou o próprio diálogo.
    const alvo = ref.current?.querySelector<HTMLElement>('input, select, textarea') ?? ref.current;
    alvo?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, []);

  const larguras = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-3xl', xl: 'max-w-5xl' };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onMouseDown={e => e.stopPropagation()}
        className={cx('flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl outline-none animate-pop-in sm:rounded-3xl', larguras[size])}
      >
        <div className="flex items-start gap-4 border-b border-slate-100 px-6 py-5">
          {icon}
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="truncate text-xl font-bold text-slate-900">{title}</h2>
            {subtitle && <div className="mt-0.5 text-sm text-slate-500">{subtitle}</div>}
          </div>
          <div className="-mr-2 flex items-center gap-1">
            {headerActions}
            <IconButton icon={X} label="Fechar" onClick={onClose} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 bg-slate-50/70 px-6 py-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
