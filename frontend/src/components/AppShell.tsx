import { useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, Sparkles, X, type LucideIcon } from 'lucide-react';
import AiConfigModal from './AiConfigModal';

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-3 rounded-xl px-2 py-1">
      <img src="/favicon.svg" alt="" className="size-9 rounded-xl shadow-lg shadow-brand-950/40" />
      <div className="leading-tight">
        <div className="font-display text-[17px] font-bold tracking-tight text-white">Grid Creator</div>
        <div className="text-xs text-slate-400">Grade horária escolar</div>
      </div>
    </Link>
  );
}

export function NavSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">{title}</div>
      {children}
    </div>
  );
}

export function NavItem({ to, icon: Icon, label, end, badge }: { to: string; icon: LucideIcon; label: string; end?: boolean; badge?: ReactNode }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
          isActive ? 'bg-white/10 text-white shadow-inner' : 'text-slate-400 hover:bg-white/5 hover:text-white'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={18} className={isActive ? 'text-brand-300' : 'text-slate-500 group-hover:text-slate-300'} />
          <span className="flex-1 truncate">{label}</span>
          {badge !== undefined && <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-xs text-slate-300 tabular-nums">{badge}</span>}
        </>
      )}
    </NavLink>
  );
}

/** Estrutura das telas: menu lateral escuro (gaveta no celular) + conteúdo. */
export default function AppShell({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) {
  const [menuAberto, setMenuAberto] = useState(false);
  const [configAberta, setConfigAberta] = useState(false);

  const conteudoMenu = (
    <div className="flex h-full flex-col gap-8 bg-brand-950 p-5">
      <Logo />
      {/* Fecha a gaveta ao navegar (no celular) */}
      <nav className="flex flex-1 flex-col gap-7 overflow-y-auto" onClick={e => (e.target as HTMLElement).closest('a') && setMenuAberto(false)}>
        {sidebar}
      </nav>
      <button
        onClick={() => { setConfigAberta(true); setMenuAberto(false); }}
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 ring-1 ring-white/10 transition-colors hover:bg-white/5 hover:text-white"
      >
        <Sparkles size={18} className="text-fuchsia-400" />
        Configurações de IA
      </button>
    </div>
  );

  return (
    <div className="min-h-screen lg:flex">
      {/* Menu fixo (desktop) */}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 lg:block">{conteudoMenu}</aside>

      {/* Barra superior + gaveta (celular/tablet) */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-brand-950 px-4 py-3 lg:hidden">
        <Logo />
        <button onClick={() => setMenuAberto(true)} className="rounded-lg p-2 text-slate-300 hover:bg-white/10" aria-label="Abrir menu">
          <Menu size={22} />
        </button>
      </header>
      {menuAberto && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-fade-in" onClick={() => setMenuAberto(false)} />
          <div className="relative h-full w-72 max-w-[85vw] animate-slide-in">
            {conteudoMenu}
            <button onClick={() => setMenuAberto(false)} className="absolute top-5 right-3 rounded-lg p-2 text-slate-400 hover:bg-white/10" aria-label="Fechar menu">
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      <main className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:px-12 lg:py-10">
        <div className="mx-auto max-w-6xl animate-fade-in">{children}</div>
      </main>

      {configAberta && <AiConfigModal onClose={() => setConfigAberta(false)} />}
    </div>
  );
}
