'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Building2, User, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip';
import { cn } from '@/lib/utils';
import { WalletDrawer } from './wallet-drawer';
import { ProfileModal } from './profile-modal';
import { useWalletDrawer } from './wallet-drawer-context';

export function Sidebar() {
  const pathname = usePathname();
  const { isWalletDrawerOpen, setIsWalletDrawerOpen } = useWalletDrawer();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    {
      path: '/dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
    },
    {
      path: '/pools',
      icon: Building2,
      label: 'Pools',
    },
  ];

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + '/');
  };

  const handleNavClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <TooltipProvider>
      <>
        {/* Mobile Header */}
        <div className="md:hidden sticky top-0 z-50 w-full border-b border-border/50 bg-card/80 backdrop-blur-md">
          <div className="flex h-16 items-center justify-between px-4">
            <button
              className="p-2 rounded-md hover:bg-muted"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <Link href="/" className="flex items-center gap-2">
              <img
                src="/logos/v2/kleo_logo_v2_white.png"
                alt="Kleo Logo"
                className="h-8 w-auto"
              />
              <span className="text-xl font-semibold text-foreground">Kleo</span>
            </Link>

            <button
              className="p-2 rounded-md hover:bg-muted"
              onClick={() => setIsWalletDrawerOpen(!isWalletDrawerOpen)}
            >
              {isWalletDrawerOpen ? (
                <ChevronLeft className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <nav
          className={cn(
            'fixed left-0 top-0 z-40 h-screen w-20 flex flex-col items-center py-4 bg-card border-r border-border/50 transition-transform',
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          )}
        >
          {/* Wallet Toggle Button - Desktop Only */}
          <div className="hidden md:flex items-center justify-center mb-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="p-2 rounded-md hover:bg-muted transition-colors"
                  onClick={() => setIsWalletDrawerOpen(!isWalletDrawerOpen)}
                >
                  {isWalletDrawerOpen ? (
                    <ChevronLeft className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {isWalletDrawerOpen ? 'Close Wallet' : 'Open Wallet'}
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Logo - Desktop Only */}
          <div className="hidden md:flex items-center justify-center mb-6">
            <Link href="/" className="flex items-center justify-center">
              <img
                src="/logos/v2/kleo_logo_v2_white.png"
                alt="Kleo Logo"
                className="h-10 w-auto"
              />
            </Link>
          </div>

          {/* Divider - Desktop Only */}
          <div className="hidden md:block w-full h-px bg-border/50 mb-6" />

          {/* Navigation Items */}
          <div className="flex-1 flex flex-col gap-2 w-full px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Tooltip key={item.path}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.path}
                      className={cn(
                        'flex flex-col md:flex-row items-center justify-center gap-2 p-3 rounded-lg transition-colors w-full',
                        active
                          ? 'bg-atomic-tangerine/20 text-atomic-tangerine border border-atomic-tangerine/30'
                          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                      )}
                      onClick={handleNavClick}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs md:hidden">{item.label}</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="hidden md:block">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>

          {/* Profile Section */}
          <div className="w-full px-2 pt-4 border-t border-border/50">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className={cn(
                    'flex flex-col md:flex-row items-center justify-center gap-2 p-3 rounded-lg transition-colors w-full',
                    'hover:bg-muted text-muted-foreground hover:text-foreground'
                  )}
                  onClick={() => {
                    setIsProfileModalOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <User className="h-5 w-5" />
                  <span className="text-xs md:hidden">Profile</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="hidden md:block">
                Profile
              </TooltipContent>
            </Tooltip>
          </div>
        </nav>

        {/* Wallet Drawer - Only render when open */}
        {isWalletDrawerOpen && <WalletDrawer isOpen={isWalletDrawerOpen} />}

        {/* Profile Modal */}
        <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
      </>
    </TooltipProvider>
  );
}
