import { Database, GitBranch, Menu, Sparkles, Table2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/tabelas', label: 'Tabelas', icon: Table2 },
  { to: '/relacionamentos', label: 'Relacionamentos', icon: GitBranch },
];

export function AppShell() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const currentSection = useMemo(() => {
    if (location.pathname.startsWith('/relacionamentos')) {
      return '/relacionamentos';
    }

    return '/tabelas';
  }, [location.pathname]);

  const sectionLabel = currentSection === '/relacionamentos' ? 'malha de relacionamentos' : 'catalogo de tabelas';

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,208,132,0.14),transparent_28%),radial-gradient(circle_at_top_right,rgba(30,174,219,0.16),transparent_22%),linear-gradient(180deg,#131722_0%,#1a1f2c_100%)]" />
        <div className="absolute top-[-12rem] left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-[rgba(0,208,132,0.16)] blur-3xl" />
        <div className="absolute right-[-6rem] bottom-[-5rem] h-[22rem] w-[22rem] rounded-full bg-[rgba(30,174,219,0.16)] blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 border-b border-[var(--app-border)] bg-[rgba(19,23,34,0.82)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1680px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/tabelas" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-white/70 bg-white/88 text-[var(--app-primary)] shadow-[var(--app-shadow-soft)]">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--app-muted)]">VESPERTTINE</p>
              <div className="flex items-center gap-2">
                <p className="text-base font-semibold tracking-[-0.04em] text-[var(--app-ink)]">DB-PROTHEUS</p>
                <Badge variant="teal" className="hidden sm:inline-flex">vesperttine.com</Badge>
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = currentSection === item.to;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition',
                    active
                      ? 'border border-[var(--app-border)] bg-[var(--app-surface-soft)] text-[var(--app-ink)] shadow-[var(--app-shadow-soft)]'
                      : 'text-[var(--app-muted-strong)] hover:bg-[rgba(30,174,219,0.08)] hover:text-[var(--app-ink)]',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <div className="flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-3 py-2 shadow-[var(--app-shadow-soft)]">
              <Sparkles className="h-4 w-4 text-[var(--app-primary)]" />
              <span className="text-sm text-[var(--app-muted-strong)]">Visao atual: {sectionLabel}</span>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen((current) => !current)}
            aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

        {mobileOpen ? (
          <div className="border-t border-[var(--app-border)] bg-[rgba(19,23,34,0.94)] px-4 py-4 shadow-[var(--app-shadow-soft)] md:hidden">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = currentSection === item.to;

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={cn(
                      'inline-flex items-center gap-3 rounded-[18px] px-4 py-3 text-sm font-semibold transition',
                      active
                        ? 'border border-[var(--app-border)] bg-[var(--app-surface-soft)] text-[var(--app-ink)] shadow-[var(--app-shadow-soft)]'
                        : 'text-[var(--app-muted-strong)] hover:bg-[rgba(30,174,219,0.08)] hover:text-[var(--app-ink)]',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ) : null}
      </header>

      <main className="mx-auto w-full max-w-[1680px] px-4 pb-12 pt-6 sm:px-6 lg:px-8 lg:pt-8">
        <Outlet />
      </main>
    </div>
  );
}