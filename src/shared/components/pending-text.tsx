import { Skeleton } from '@/shared/ui/skeleton';

interface PendingTextProps extends React.ComponentProps<'span'> {
  isLoading: boolean;
}

export function PendingText(props: PendingTextProps) {
  const { isLoading, children, className, ...rest } = props;

  if (isLoading) {
    return <Skeleton className={`bg-oxford-blue inline-block h-4 w-32`} />;
  }

  return (
    <span className={className} {...rest}>
      {children}
    </span>
  );
}
