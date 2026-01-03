'use client';

import { NetworkSelection } from '@/shared/components/network-selection';
import { GithubSvgIcon, XSvgIcon } from '@/shared/components/icons';

export function MainFooter() {
  return (
    <div className='border-t border-border'>
      <div className='max-w-5xl px-4 mx-auto flex justify-between items-center gap-4 py-4'>
        <div className='flex gap-6'>
          <a href='https://twitter.com/kleoprotocol' target='_blank' rel='noopener noreferrer' className='text-muted-foreground hover:text-atomic-tangerine transition-colors'>
            <XSvgIcon />
          </a>
          <a href='https://github.com/Kleo-Protocol' target='_blank' rel='noopener noreferrer' className='text-muted-foreground hover:text-amber-honey transition-colors'>
            <GithubSvgIcon />
          </a>
        </div>
        <NetworkSelection />
      </div>
    </div>
  );
}
