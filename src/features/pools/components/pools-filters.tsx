'use client';

import { Card, CardContent } from '@/shared/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Filter } from 'lucide-react';

export type SortOption = 'name' | 'interestRate' | 'availableLiquidity' | 'totalLiquidity' | 'activeLoans';
export type StatusFilter = 'all' | 'active' | 'paused' | 'closed';

interface PoolsFiltersProps {
  statusFilter: StatusFilter;
  onStatusFilterChange: (status: StatusFilter) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export function PoolsFilters({
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortChange,
}: PoolsFiltersProps) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Filter className="size-5 text-slate-500" />
            <span className="text-sm font-medium text-slate-900">Filters</span>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <label htmlFor="status-filter" className="text-sm text-slate-600 whitespace-nowrap">
                Status:
              </label>
              <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                <SelectTrigger id="status-filter" className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="sort-by" className="text-sm text-slate-600 whitespace-nowrap">
                Sort by:
              </label>
              <Select value={sortBy} onValueChange={onSortChange}>
                <SelectTrigger id="sort-by" className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="interestRate">Interest Rate</SelectItem>
                  <SelectItem value="availableLiquidity">Available Liquidity</SelectItem>
                  <SelectItem value="totalLiquidity">Total Liquidity</SelectItem>
                  <SelectItem value="activeLoans">Active Loans</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

