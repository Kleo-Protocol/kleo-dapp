'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/shared/ui/button';
import { useState } from 'react';
import { User, LayoutDashboard, Building2, Menu, X } from 'lucide-react';
import { AccountSelection } from '@/shared/components/account-selection';
import { WalletSelection } from '@/shared/components/wallet-selection';
import { useTypink } from 'typink';

export function MainHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { accounts } = useTypink();

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + '/');
  };

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/pools', label: 'Pools', icon: Building2 },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-card/80 backdrop-blur-md shadow-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center">
              <img
                src="/logos/v2/kleo_logo_v2_white.png"
                alt="Kleo Logo"
                className="h-8 w-auto"
              />
            </div>
            <span className="hidden text-xl font-semibold text-foreground sm:block">Kleo</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Button
                  key={link.path}
                  asChild
                  variant={isActive(link.path) ? 'secondary' : 'ghost'}
                  size="sm"
                  className="gap-2"
                >
                  <Link href={link.path}>
                    <Icon className="size-4" />
                    {link.label}
                  </Link>
                </Button>
              );
            })}
          </nav>

          {/* Wallet State & Mobile Menu Button */}
          <div className="flex items-center gap-3">
            {/* Wallet Selection */}
            <div className="hidden sm:flex">
              {accounts.length > 0 ? <AccountSelection /> : <WalletSelection />}
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="border-t border-border/50 py-4 md:hidden">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Button
                    key={link.path}
                    asChild
                    variant={isActive(link.path) ? 'secondary' : 'ghost'}
                    size="sm"
                    className="justify-start gap-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Link href={link.path}>
                      <Icon className="size-4" />
                      {link.label}
                    </Link>
                  </Button>
                );
              })}
              {/* Mobile Wallet State */}
              <div className="mt-2">
                {accounts.length > 0 ? <AccountSelection /> : <WalletSelection />}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
