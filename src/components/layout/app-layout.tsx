'use client';

import { Outlet } from 'react-router-dom';
import { MainHeader } from './main-header';
import { MainFooter } from './main-footer';

export function AppLayout() {
  return (
    <div className='min-h-screen flex flex-col'>
      <MainHeader />
      <main className='max-w-7xl mx-auto w-full flex-1 px-4 sm:px-6 lg:px-8 py-8'>
        <Outlet />
      </main>
      <MainFooter />
    </div>
  );
}

