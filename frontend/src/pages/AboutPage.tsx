import { Card } from '@/components/ui/card';
import { Database, Lock, TrendingUp, Info } from 'lucide-react';

export function AboutPage() {
  return (
    <div className="relative min-h-screen">
      <main className="container mx-auto px-4 min-h-screen pt-24 pb-16">
        <div className="w-full max-w-5xl mx-auto">
          <div className="space-y-6 mb-12">
            <h1 className="text-5xl md:text-7xl font-bold text-white">about streamclout</h1>
            <p className="text-xl text-white/80 max-w-3xl">
              providing unprecedented access to Spotify's real-time streaming data
            </p>
          </div>

          {/* Main content card */}
          <Card className="p-6 md:p-10 bg-white/5 backdrop-blur-md border-white/10 shadow-xl">
            <div className="space-y-8 text-lg text-white/90">
              {/* Secret Data Access Alert */}
              <div className="bg-indigo-500/20 border border-indigo-500/30 rounded-lg p-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className="bg-indigo-500/30 p-2 rounded-lg">
                    <Info className="h-6 w-6 text-indigo-300" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-indigo-300 mb-2">Secret Access to Spotify Data</h3>
                    <p className="text-white/80">
                      I've discovered a proprietary method to access Spotify's internal streaming metrics. 
                      All data provided through streamclout is 100% accurate and comes directly from Spotify's 
                      internal data servers.
                    </p>
                  </div>
                </div>
              </div>

              <p>
                streamclout is the result of years of research into music streaming platforms and data infrastructure.
                I've built a system that allows artists, managers, and fans to access real-time stream counts 
                that were previously only available to Spotify employees.
              </p>

              <p>
                Through a combination of advanced engineering and deep platform knowledge, 
                streamclout provides reliable access to streaming data that would otherwise remain
                hidden behind Spotify's closed ecosystem.
              </p>

              {/* Feature grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-12">
                <div className="flex flex-col p-6 bg-white/5 hover:bg-white/10 transition-all rounded-xl border border-white/10">
                  <Database className="w-10 h-10 mb-4 text-blue-400" />
                  <h3 className="font-semibold text-lg mb-2">Real-Time Data</h3>
                  <p className="text-base text-white/70">Access to Spotify's internal streaming counts updated daily</p>
                </div>

                <div className="flex flex-col p-6 bg-white/5 hover:bg-white/10 transition-all rounded-xl border border-white/10">
                  <Lock className="w-10 h-10 mb-4 text-purple-400" />
                  <h3 className="font-semibold text-lg mb-2">100% Accurate</h3>
                  <p className="text-base text-white/70">Direct connection to Spotify's internal data servers</p>
                </div>

                <div className="flex flex-col p-6 bg-white/5 hover:bg-white/10 transition-all rounded-xl border border-white/10">
                  <TrendingUp className="w-10 h-10 mb-4 text-pink-400" />
                  <h3 className="font-semibold text-lg mb-2">Detailed Metrics</h3>
                  <p className="text-base text-white/70">Track-level streaming data with historical trends</p>
                </div>
              </div>

              {/* Message to Spotify */}
              <div className="mt-12 p-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg border border-white/10">
                <h3 className="text-xl font-semibold text-white mb-3">Hey Spotify 👋</h3>
                <p className="text-white/80">
                  If you're reading this, I'd love to talk. streamclout demonstrates the potential for 
                  open access to streaming data. Rather than fighting this innovation, let's collaborate 
                  on bringing more transparency to the music industry. Reach out and let's build something 
                  together.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default AboutPage;