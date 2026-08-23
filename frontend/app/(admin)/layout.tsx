import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute adminOnly={true}>
      <div className="flex min-h-screen flex-col md:flex-row bg-muted/20">
        {/* Desktop Sidebar */}
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile Header */}
          <header className="md:hidden flex items-center justify-between p-4 border-b bg-card">
            <div className="font-bold">Admin Panel</div>
            <Sheet>
              <SheetTrigger className="p-2 -mr-2">
                <Menu className="h-6 w-6" />
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <AdminSidebar />
              </SheetContent>
            </Sheet>
          </header>
          
          {/* Main Content */}
          <main className="flex-1 p-4 md:p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
