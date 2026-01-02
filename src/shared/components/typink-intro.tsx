import { NotebookText } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { GithubSvgIcon, TypinkTextLogo } from '@/shared/components/icons';

export function TypinkIntro() {
  return (
    <div className='relative z-10 flex flex-col items-center justify-center px-4 py-20'>
      <div className='text-center space-y-6'>
        <div className='flex items-center justify-center'>
          <TypinkTextLogo width={250} />
        </div>

        <h1 className='text-4xl font-medium tracking-tight text-foreground'>
          Microloans using a decentralized DeFi protocol built on trust
        </h1>

        <p className='text-4xl font-medium text-atomic-tangerine'>
          Powered by the Kleo Mechanism!
        </p>

        {/* Action Buttons */}
        <div className='flex flex-col sm:flex-row gap-4 justify-center items-center pt-8'>
          <Button
            size='xl'
            className='min-w-[184px] rounded-[14px] border-border/40 transition-all hover:border-atomic-tangerine/70'
            asChild>
            <a
              href='https://docs.google.com/document/d/1cprLlST7alIFdnsflJ7I-The5Y79KM5TBG_fvv-QDZk/edit?usp=sharing'
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center gap-2 text-white'>
              Whitepaper
              <NotebookText className='h-5 w-5 text-white' />
            </a>
          </Button>

          <Button
            size='xl'
            className='min-w-[184px] rounded-[14px] border-border/40 transition-all hover:border-atomic-tangerine/70'
            asChild>
            <a
              href='https://github.com/Kleo-Protocol'
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center gap-2 text-white'>
              Github
              <GithubSvgIcon />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
