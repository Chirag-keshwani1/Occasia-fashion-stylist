import { UserTable } from '@/components/admin/UserTable';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Users</h2>
        <p className="text-muted-foreground">
          View all registered users on the platform.
        </p>
      </div>

      <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-muted-foreground" /></div>}>
        <UserTable />
      </Suspense>
    </div>
  );
}
