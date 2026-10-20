import AdminShell from '@/components/admin/AdminShell';
import { Toaster } from '@/components/ui/sonner';

export default function AdminMainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminShell>
      {children}
      <Toaster position="bottom-right" richColors />
    </AdminShell>
  );
}
