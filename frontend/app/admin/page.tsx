import { Suspense } from 'react';
import { AdminDashboard } from './AdminDashboard';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

// Simple admin auth check - in production use proper auth
async function checkAdminAuth() {
  const headersList = await headers();
  const authHeader = headersList.get('authorization');
  
  // For now, check for a simple bearer token
  // In production, use NextAuth or Clerk
  if (authHeader !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    redirect('/');
  }
}

export default async function AdminPage() {
  await checkAdminAuth();
  
  return (
    <div className="min-h-screen bg-zinc-950">
      <Suspense fallback={<AdminDashboardSkeleton />}>
        <AdminDashboard />
      </Suspense>
    </div>
  );
}

function AdminDashboardSkeleton() {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="h-8 w-48 bg-zinc-800 rounded animate-pulse" />
          <div className="h-4 w-32 bg-zinc-800 rounded animate-pulse mt-2" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <div className="h-4 w-24 bg-zinc-800 rounded animate-pulse mb-2" />
              <div className="h-8 w-16 bg-zinc-800 rounded animate-pulse" />
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <div className="h-6 w-32 bg-zinc-800 rounded animate-pulse mb-4" />
              <div className="h-64 bg-zinc-800 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}