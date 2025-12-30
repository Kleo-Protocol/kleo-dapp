'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        {icon && <div className="flex justify-center mb-4 text-muted-foreground">{icon}</div>}
        <h3 className="text-lg font-semibold text-card-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">{description}</p>
        {action && (
          <Button variant="primary" onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

