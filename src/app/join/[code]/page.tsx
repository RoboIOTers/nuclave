'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, AlertTriangle } from 'lucide-react';

export default function JoinArenaPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const [notFound, setNotFound] = useState(false);

  // Auto-redirect to the arena — no intermediate join page
  useEffect(() => {
    async function lookup() {
      try {
        const response = await fetch(`/api/arenas/join/${code}`);
        if (response.ok) {
          const data = await response.json();
          router.replace(`/arena/${data.data.id}`);
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      }
    }
    lookup();
  }, [code, router]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="max-w-sm w-full mx-4 text-center">
          <h1 className="font-display text-3xl font-extrabold tracking-tight mb-4">
            NU<span className="text-accent">CLAVE</span>
          </h1>
          <div className="border border-border bg-card p-6">
            <AlertTriangle className="w-6 h-6 text-accent-4 mx-auto mb-3" />
            <p className="text-sm text-dim mb-1">Arena not found</p>
            <p className="text-xs text-dim/70">
              Code <span className="font-mono font-semibold text-ink">{code}</span> is invalid or the session has ended.
            </p>
            <a
              href="/arena/create"
              className="inline-block mt-5 bg-ink text-paper px-5 py-2 font-display font-semibold text-xs"
            >
              Create a New Arena
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-6 h-6 text-dim animate-spin mx-auto mb-3" />
        <p className="text-xs text-dim">Joining arena...</p>
      </div>
    </div>
  );
}
