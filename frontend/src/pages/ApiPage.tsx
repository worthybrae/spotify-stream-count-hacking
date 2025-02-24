import { Card } from '@/components/ui/card';
import { Database } from 'lucide-react';

export function ApiPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header is now in App.tsx */}
      
      {/* Main Content */}
      <main className="container mx-auto px-4 min-h-screen pt-14">
        <div className="w-full max-w-4xl mx-auto py-16">
          <div className="space-y-6 mb-12">
            <h1 className="text-7xl font-bold text-white">API Coming Soon</h1>
            <p className="text-xl text-white/60 max-w-2xl">
              Get programmatic access to streaming data through our powerful API.
            </p>
          </div>

          <Card className="p-8 bg-white/5 border-white/10 text-center">
            <div className="relative w-24 h-24 mx-auto mb-8">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping" />
              <div className="absolute inset-0 bg-purple-500/20 rounded-full animate-ping delay-200" />
              <div className="absolute inset-0 bg-pink-500/20 rounded-full animate-ping delay-400" />
              <Database className="relative w-full h-full text-white" />
            </div>

            <p className="text-lg text-white/80 max-w-xl mx-auto">
              Our API is currently under development
            </p>
          </Card>
        </div>
      </main>

      {/* Background Effect */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <svg className="absolute w-full h-full opacity-10" viewBox="0 0 1000 1000">
          <path
            d="M0,500 Q250,400 500,500 T1000,500"
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="1"
            className="animate-flow"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4F46E5" />
              <stop offset="100%" stopColor="#7C3AED" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}