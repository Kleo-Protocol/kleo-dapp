'use client';

import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppLayout } from '@/components/layout/app-layout';
import { LandingPage } from '@/components/pages/landing-page';
import { ProfilePage } from '@/components/pages/profile-page';

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


function PoolsPage() {
  return <div>Pools Page</div>;
}

function NotFoundPage() {
  return <div>Not Found</div>;
}

const router = createBrowserRouter([
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
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}

