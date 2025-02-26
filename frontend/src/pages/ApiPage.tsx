import { Card } from '@/components/ui/card';
import { Database, Code, Server, Zap } from 'lucide-react';

export function ApiPage() {
  return (
    <div className="relative min-h-screen">
      <main className="container mx-auto px-4 min-h-screen pt-24 pb-16">
        <div className="w-full max-w-5xl mx-auto">
          <div className="space-y-6 mb-12">
            <h1 className="text-5xl md:text-7xl font-bold text-white">api access</h1>
            <p className="text-xl text-white/80 max-w-3xl">
              programmatic access to Spotify's streaming data is coming soon
            </p>
          </div>

          {/* Main API card */}
          <Card className="p-6 md:p-10 bg-white/5 backdrop-blur-md border-white/10 shadow-xl">
            <div className="text-center mb-12">
              <div className="relative w-24 h-24 mx-auto mb-8">
                <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
                <div className="absolute inset-0 bg-purple-500/20 rounded-full animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }} />
                <div className="absolute inset-0 bg-pink-500/20 rounded-full animate-ping" style={{ animationDuration: '3s', animationDelay: '2s' }} />
                <Server className="my-4 relative w-full h-full text-white p-5" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-4">Access Spotify Data Programmatically</h2>
              <p className="text-lg text-white/80 max-w-2xl mx-auto">
                Our developer API is currently under development. Soon you'll be able to integrate
                Spotify's internal streaming data directly into your applications.
              </p>
            </div>

            {/* API Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-12">
              <div className="flex items-start gap-5 p-6 bg-white/5 hover:bg-white/10 transition-all rounded-xl border border-white/10">
                <div className="bg-gradient-to-br from-blue-500/30 to-purple-500/30 p-3 rounded-lg">
                  <Database className="h-6 w-6 text-blue-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-white mb-2">Real-Time Data</h3>
                  <p className="text-base text-white/70">
                    Access Spotify's internal streaming data with daily updates via simple REST endpoints
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-5 p-6 bg-white/5 hover:bg-white/10 transition-all rounded-xl border border-white/10">
                <div className="bg-gradient-to-br from-purple-500/30 to-pink-500/30 p-3 rounded-lg">
                  <Code className="h-6 w-6 text-purple-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-white">Simple Integration</h3>
                  <p className="text-base text-white/70">
                    Well-documented API with client libraries for JavaScript, Python, and more
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-5 p-6 bg-white/5 hover:bg-white/10 transition-all rounded-xl border border-white/10">
                <div className="bg-gradient-to-br from-pink-500/30 to-orange-500/30 p-3 rounded-lg">
                  <Zap className="h-6 w-6 text-pink-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-white">High Performance</h3>
                  <p className="text-base text-white/70">
                    Optimized for speed with global CDN distribution and caching
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-5 p-6 bg-white/5 hover:bg-white/10 transition-all rounded-xl border border-white/10">
                <div className="bg-gradient-to-br from-orange-500/30 to-yellow-500/30 p-3 rounded-lg">
                  <Server className="h-6 w-6 text-orange-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-white mb-2">Reliable Infrastructure</h3>
                  <p className="text-base text-white/70">
                    Built on enterprise-grade cloud infrastructure with 99.9% uptime SLA
                  </p>
                </div>
              </div>
            </div>

            
          </Card>
        </div>
      </main>
    </div>
  );
}

export default ApiPage;