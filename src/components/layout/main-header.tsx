'use client';

import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Wallet, User, LayoutDashboard, Building2, Menu, X } from 'lucide-react';

// Mock wallet state - replace with real wallet integration later
const MOCK_WALLET_CONNECTED = true;
const MOCK_WALLET_ADDRESS = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';

export function MainHeader() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/pools', label: 'Pools', icon: Building2 },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="flex items-center">
              <img
                src="/logos/v2/kleo_logo_v2_white.png"
                alt="Kleo Logo"
                className="h-8 w-auto"
              />
            </div>
            <span className="hidden text-xl font-semibold text-slate-900 sm:block">Kleo</span>
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
                  <Link to={link.path}>
                    <Icon className="size-4" />
                    {link.label}
                  </Link>
                </Button>
              );
            })}
          </nav>

          {/* Wallet State & Mobile Menu Button */}
          <div className="flex items-center gap-3">
            {/* Wallet Connected State */}
            {MOCK_WALLET_CONNECTED ? (
              <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 sm:flex">
                <Wallet className="size-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-900">
                  {formatAddress(MOCK_WALLET_ADDRESS)}
                </span>
              </div>
            ) : (
              <Button variant="primary" size="sm" className="hidden gap-2 sm:flex">
                <Wallet className="size-4" />
                Connect Wallet
              </Button>
            )}

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
          <div className="border-t border-slate-200 py-4 md:hidden">
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
                    <Link to={link.path}>
                      <Icon className="size-4" />
                      {link.label}
                    </Link>
                  </Button>
                );
              })}
              {/* Mobile Wallet State */}
              {MOCK_WALLET_CONNECTED ? (
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <Wallet className="size-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-900">
                    {formatAddress(MOCK_WALLET_ADDRESS)}
                  </span>
                </div>
              ) : (
                <Button variant="primary" size="sm" className="mt-2 gap-2">
                  <Wallet className="size-4" />
                  Connect Wallet
                </Button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
