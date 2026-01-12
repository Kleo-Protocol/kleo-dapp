'use client';

import Link from 'next/link';
import { Button } from '@/shared/ui/button';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-8">
        <Image
          src="/logos/v2/kleo_logo_v2_white.png"
          alt="Kleo Logo"
          width={120}
          height={120}
          className="h-auto"
        />
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-3xl font-bold text-foreground font-sora">Welcome to Kleo</h1>
          <p className="text-muted-foreground font-inter">Access micro loans through trust-based DeFi</p>
        </div>
        <Button asChild size="lg" className="mt-4">
          <Link href="/signin">Sign In</Link>
        </Button>
      </div>
    </div>
  );
}
