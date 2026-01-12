'use client';

import { useMemo } from 'react';
import { Card, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { checkTierRequirements, getAllTiers } from '@/lib/loan-tiers';
import { useStars } from '@/features/profile/hooks/use-reputation-queries';
import { useTypink } from 'typink';

interface TierRequirementsInfoProps {
  loanAmount: number;
  currentVouchers?: number;
  showAllTiers?: boolean;
}

export function TierRequirementsInfo({ 
  loanAmount, 
  currentVouchers = 0,
  showAllTiers = false 
}: TierRequirementsInfoProps) {
  const { connectedAccount } = useTypink();
  const { data: userStars = 0 } = useStars(connectedAccount?.address);

  const tierInfo = useMemo(() => {
    if (loanAmount <= 0) {
      return null;
    }
    return checkTierRequirements(loanAmount, userStars, currentVouchers);
  }, [loanAmount, userStars, currentVouchers]);

  const allTiers = getAllTiers();

  if (showAllTiers) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Info className="size-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-card-foreground">Loan Tier Requirements</h3>
            </div>
            <div className="space-y-3">
              {allTiers.map((tier) => {
                const isActive = tierInfo?.tier === tier.tier;
                return (
                  <div
                    key={tier.tier}
                    className={`p-3 rounded-lg border ${
                      isActive
                        ? 'border-atomic-tangerine bg-atomic-tangerine/5'
                        : 'border-border bg-secondary/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={isActive ? 'verde' : 'secondary'}>
                          Tier {tier.tier}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {tier.minTokens === 0 ? '0' : tier.minTokens} - {tier.maxTokens} tokens
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        {userStars >= tier.minStars ? (
                          <CheckCircle2 className="size-3 text-forest-green" />
                        ) : (
                          <AlertCircle className="size-3 text-atomic-tangerine" />
                        )}
                        <span>
                          Min Stars: {tier.minStars} 
                          {userStars > 0 && ` (You have: ${userStars})`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {currentVouchers >= tier.minVouchers ? (
                          <CheckCircle2 className="size-3 text-forest-green" />
                        ) : (
                          <AlertCircle className="size-3 text-atomic-tangerine" />
                        )}
                        <span>
                          Min Vouchers: {tier.minVouchers}
                          {currentVouchers > 0 && ` (Current: ${currentVouchers})`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!tierInfo || !tierInfo.requirements) {
    if (loanAmount > 0) {
      return (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-atomic-tangerine">
              <AlertCircle className="size-4" />
              <span>Loan amount exceeds maximum tier limit (1000 tokens)</span>
            </div>
          </CardContent>
        </Card>
      );
    }
    return null;
  }

  const { requirements, missingStars } = tierInfo;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="size-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-card-foreground">
                Tier {requirements.tier} Requirements
              </span>
            </div>
            <Badge variant={missingStars === 0 ? 'verde' : 'rojo'}>
              {missingStars === 0 ? 'Stars Requirement Met' : 'Stars Requirement Not Met'}
            </Badge>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Token Range</span>
              <span className="font-medium text-card-foreground">
                {requirements.minTokens === 0 ? '0' : requirements.minTokens} - {requirements.maxTokens} tokens
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Min Stars Required</span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-card-foreground">{requirements.minStars}</span>
                {userStars > 0 && (
                  <span className={`text-xs ${userStars >= requirements.minStars ? 'text-forest-green' : 'text-atomic-tangerine'}`}>
                    (You: {userStars})
                  </span>
                )}
              </div>
            </div>

            {missingStars > 0 && (
              <div className="flex items-center gap-2 text-xs text-atomic-tangerine bg-atomic-tangerine/10 p-2 rounded">
                <AlertCircle className="size-3" />
                <span>You need {missingStars} more stars</span>
              </div>
            )}

            <div className="text-sm text-muted-foreground pt-2 border-t border-border">
              <p>You will need {requirements.minVouchers} vouchers to start this loan</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
