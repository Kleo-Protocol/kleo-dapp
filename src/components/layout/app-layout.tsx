'use client';

import { Outlet } from 'react-router-dom';
import { MainHeaderRouter } from './main-header-router';
import { MainFooter } from './main-footer';

export function AppLayout() {
  return (
    <div className='min-h-screen flex flex-col'>
      <MainHeaderRouter />
      <main className='max-w-5xl mx-auto w-full flex-1'>
        <Outlet />
      </main>
      <MainFooter />
    </div>
  );
}

