'use client';

import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppLayout } from '@/components/layout/app-layout';

// Empty route components - to be implemented later
function HomePage() {
  return <div>Home Page</div>;
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

function ProfilePage() {
  return <div>Profile Page</div>;
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
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}

