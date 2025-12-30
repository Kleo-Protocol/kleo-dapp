'use client';

import { useMemo } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppLayout } from '@/components/layout/app-layout';
import { LandingPage } from '@/components/pages/landing-page';
import { ProfilePage } from '@/components/pages/profile-page';
import { PoolsPage } from '@/components/pages/pools-page';
import { PoolDetailPage } from '@/components/pages/pool-detail-page';

// Empty route components - to be implemented later
function HomePage() {
  return <LandingPage />;
}

function DashboardPage() {
  return <div>Dashboard Page</div>;
}

function BorrowPage() {
  return <div>Borrow Page</div>;
}

function LendPage() {
  return <div>Lend Page</div>;
}

function NotFoundPage() {
  return <div>Not Found</div>;
}

export function AppRouter() {
  // Create router inside component to avoid SSR issues
  const router = useMemo(
    () =>
      createBrowserRouter([
        {
          path: '/',
          element: <AppLayout />,
          children: [
            {
              index: true,
              element: <HomePage />,
            },
            {
              path: 'dashboard',
              element: <DashboardPage />,
            },
            {
              path: 'borrow',
              element: <BorrowPage />,
            },
            {
              path: 'lend',
              element: <LendPage />,
            },
            {
              path: 'profile',
              element: <ProfilePage />,
            },
            {
              path: 'pools',
              element: <PoolsPage />,
            },
            {
              path: 'pools/:poolId',
              element: <PoolDetailPage />,
            },
            {
              path: '*',
              element: <NotFoundPage />,
            },
          ],
        },
      ]),
    []
  );

  return <RouterProvider router={router} />;
}

