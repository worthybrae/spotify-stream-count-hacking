import { Card } from '@/components/ui/card';
import { Database, Lock, Sparkles } from 'lucide-react';

export function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header is now in App.tsx */}
      
      {/* Main Content */}
      <main className="container mx-auto px-4 min-h-screen pt-14">
        <div className="w-full max-w-4xl mx-auto py-16">
          <div className="space-y-6 mb-12">
            <h1 className="text-7xl font-bold text-white">About StreamClout</h1>
            <p className="text-xl text-white/60 max-w-2xl">
              Making Spotify's streaming data accessible to everyone through scalable engineering.
            </p>
          </div>

          <Card className="p-8 bg-white/5 border-white/10">
            <div className="space-y-6 text-lg text-white/80">
              <p>
                Hi, I'm a software engineer with a passion for data transparency and scalable systems. 
                I built StreamClout because I believe streaming data shouldn't be locked away in Spotify's walled garden.
              </p>

              <p>
                Through extensive research and engineering, I developed a scalable system to extract and store Spotify's 
                streaming data, making it accessible to everyone. This platform processes millions of data points daily, 
                providing unprecedented insight into music streaming patterns.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-12">
                <div className="flex flex-col items-center text-center p-6 bg-white/5 rounded-xl">
                  <Database className="w-12 h-12 mb-4 text-blue-400" />
                  <h3 className="font-semibold mb-2">Scalable Infrastructure</h3>
                  <p className="text-sm text-white/60">Processing millions of streaming records daily</p>
                </div>

                <div className="flex flex-col items-center text-center p-6 bg-white/5 rounded-xl">
                  <Lock className="w-12 h-12 mb-4 text-purple-400" />
                  <h3 className="font-semibold mb-2">Data Transparency</h3>
                  <p className="text-sm text-white/60">Making streaming data accessible to all</p>
                </div>

                <div className="flex flex-col items-center text-center p-6 bg-white/5 rounded-xl">
                  <Sparkles className="w-12 h-12 mb-4 text-pink-400" />
                  <h3 className="font-semibold mb-2">Real-time Updates</h3>
                  <p className="text-sm text-white/60">Fresh data every 24 hours</p>
                </div>
              </div>

              <p>
                Hey Spotify 👋 - If you're reading this, I'd love to chat about how we could work together. 
                I'm passionate about scaling data systems and believe in the power of open data ecosystems.
              </p>
            </div>
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