'use client';

import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { adminService } from '@/lib/services/admin.service';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

export function UserTable() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const page = parseInt(searchParams.get('page') || '1', 10);
  const search = searchParams.get('search') || '';

  const [searchInput, setSearchInput] = useState(search);

  const { data: response, isLoading, isError } = useQuery({
    queryKey: ['admin', 'users', page, search],
    queryFn: () => adminService.getUsers(page, 10, search),
    placeholderData: keepPreviousData,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchInput) {
      params.set('search', searchInput);
    } else {
      params.delete('search');
    }
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <form onSubmit={handleSearch} className="relative max-w-sm w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Search users by name or email..." 
            className="pl-9"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>
      </div>

      <div className="rounded-md border bg-card overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
            <tr>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b last:border-0 animate-pulse">
                  <td className="px-4 py-4"><div className="h-4 w-32 bg-muted rounded"></div></td>
                  <td className="px-4 py-4"><div className="h-4 w-48 bg-muted rounded"></div></td>
                  <td className="px-4 py-4"><div className="h-4 w-16 bg-muted rounded"></div></td>
                  <td className="px-4 py-4"><div className="h-4 w-24 bg-muted rounded"></div></td>
                </tr>
              ))
            ) : isError ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-destructive">
                  Failed to load users.
                </td>
              </tr>
            ) : response?.data?.users.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  No users found.
                </td>
              </tr>
            ) : (
              response?.data?.users.map((user) => (
                <tr key={user._id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">
                    {user.name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {user.email}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {response?.data?.pagination && response.data.pagination.pages > 1 && (
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1 || isLoading}
            className="p-2 rounded-md border bg-card hover:bg-muted disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium">
            Page {page} of {response.data.pagination.pages}
          </span>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === response.data.pagination.pages || isLoading}
            className="p-2 rounded-md border bg-card hover:bg-muted disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
