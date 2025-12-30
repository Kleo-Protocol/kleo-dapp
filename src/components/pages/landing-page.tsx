'use client';

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ArrowRight, Shield, Users, TrendingUp } from 'lucide-react';

export function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="py-20 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Trust-Based DeFi
            <br />
            <span className="text-muted-foreground">Without Collateral</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl">
            Access micro loans through decentralized finance powered by reputation and trust networks.
            No collateral required—just your track record.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" variant="primary">
              <Link to="/dashboard">
                Get Started
                <ArrowRight className="size-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link to="/pools">Explore Pools</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 3-Step Explainer Cards */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Three simple steps to access decentralized lending
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Step 1 */}
            <Card className="flex flex-col">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
                  <Shield className="size-6 text-secondary-foreground" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-muted-foreground">Step 1</span>
                </div>
                <CardTitle className="text-xl">Build Your Reputation</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Establish your creditworthiness through verified transactions and income references.
                  Your reputation score determines your access to better rates and higher loan amounts.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card className="flex flex-col">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
                  <Users className="size-6 text-secondary-foreground" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-muted-foreground">Step 2</span>
                </div>
                <CardTitle className="text-xl">Join a Lending Pool</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Connect with lenders in decentralized pools. Browse available pools, compare rates,
                  and choose the best terms for your borrowing needs.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card className="flex flex-col">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
                  <TrendingUp className="size-6 text-secondary-foreground" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-muted-foreground">Step 3</span>
                </div>
                <CardTitle className="text-xl">Access Capital</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Receive funding from multiple lenders without posting collateral. Repay on time to
                  improve your reputation and unlock better terms for future loans.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-lg border border-border bg-card p-8 sm:p-12 text-center">
            <h2 className="text-3xl font-bold text-card-foreground sm:text-4xl">
              Ready to Get Started?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join the future of decentralized lending. No collateral, no barriers—just trust-based finance.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" variant="primary">
                <Link to="/dashboard">
                  Start Borrowing
                  <ArrowRight className="size-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link to="/pools">Become a Lender</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

