'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import Link from 'next/link';
import { 
  ArrowRight, 
  Wallet, 
  TrendingUp, 
  Building2, 
  User,
  FileText,
  PlusCircle
} from 'lucide-react';

interface DashboardQuickActionsProps {
  userRole: 'lender' | 'borrower' | null;
}

export function DashboardQuickActions({ userRole }: DashboardQuickActionsProps) {
  const actions = userRole === 'borrower' 
    ? [
        {
          title: 'Request Loan',
          description: 'Create a new loan request',
          href: '/borrow',
          icon: PlusCircle,
          variant: 'default' as const,
        },
        {
          title: 'View Pools',
          description: 'Explore available lending pools',
          href: '/pools',
          icon: Building2,
          variant: 'outline' as const,
        },
        {
          title: 'My Profile',
          description: 'Manage your profile and settings',
          href: '/profile',
          icon: User,
          variant: 'outline' as const,
        },
      ]
    : userRole === 'lender'
    ? [
        {
          title: 'Start Lending',
          description: 'Browse and fund loan requests',
          href: '/lend',
          icon: TrendingUp,
          variant: 'default' as const,
        },
        {
          title: 'Explore Pools',
          description: 'Discover lending pools',
          href: '/pools',
          icon: Building2,
          variant: 'outline' as const,
        },
        {
          title: 'My Profile',
          description: 'View your lending statistics',
          href: '/profile',
          icon: User,
          variant: 'outline' as const,
        },
      ]
    : [
        {
          title: 'Select Role',
          description: 'Choose to be a lender or borrower',
          href: '/',
          icon: User,
          variant: 'default' as const,
        },
        {
          title: 'Explore Pools',
          description: 'Browse available lending pools',
          href: '/pools',
          icon: Building2,
          variant: 'outline' as const,
        },
      ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          {userRole 
            ? `Common actions for ${userRole === 'lender' ? 'lenders' : 'borrowers'}`
            : 'Get started with Kleo'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.title}
                asChild
                variant={action.variant}
                className="w-full justify-start gap-3 h-auto py-3"
              >
                <Link href={action.href}>
                  <Icon className="size-5" />
                  <div className="flex-1 text-left">
                    <div className="font-semibold">{action.title}</div>
                    <div className="text-xs text-muted-foreground font-normal">
                      {action.description}
                    </div>
                  </div>
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
