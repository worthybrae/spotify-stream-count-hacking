import { Card } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export function AboutPage() {
  return (
    <div className="relative min-h-screen">
      <main className="container mx-auto px-4 min-h-screen pt-24 pb-16">
        <div className="w-full max-w-5xl mx-auto">
          {/* Header Section */}
          <div className="space-y-6 mb-12 text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white">about streamclout</h1>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              providing unprecedented access to Spotify's real-time streaming data
            </p>
          </div>

          {/* Main content card */}
          <Card className="p-6 md:p-10 bg-white/5 backdrop-blur-md border-white/10 shadow-xl mb-12">
            {/* Mission Section */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-white mb-6">Our Mission</h2>
              <div className="space-y-4 text-lg text-white/90">
                <p>
                  streamclout was created to bring transparency to the music streaming industry by providing 
                  artists, managers, and fans with access to real-time Spotify streaming data that was previously 
                  unavailable to the public.
                </p>
                <p>
                  We believe that creators deserve clear insights into how their music performs, and fans should be 
                  able to see the true impact of their listening habits. Our platform bridges this information gap by
                  offering accurate, daily-updated streaming metrics directly from the source.
                </p>
              </div>
            </div>

            

            {/* FAQ Section */}
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">Frequently Asked Questions</h2>
              <Accordion type="single" collapsible className="w-full">
                
                <AccordionItem value="data-source">
                  <AccordionTrigger className="text-lg font-medium text-white hover:text-white/90">
                    Where does the data come from?
                  </AccordionTrigger>
                  <AccordionContent className="text-white/80">
                    The data comes from Spotify's internal API that employees and internal services use. 
                    We found a way of accessing these internal systems through legal methods and are now 
                    offering the data to the public.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="accuracy">
                  <AccordionTrigger className="text-lg font-medium text-white hover:text-white/90">
                    How accurate is the data?
                  </AccordionTrigger>
                  <AccordionContent className="text-white/80">
                    The Spotify daily stream counts are updated every day and are 100% accurate - feel free 
                    to verify using the Spotify desktop application.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="revenue">
                  <AccordionTrigger className="text-lg font-medium text-white hover:text-white/90">
                    How is revenue calculated?
                  </AccordionTrigger>
                  <AccordionContent className="text-white/80">
                    We estimate revenue based on the total streams a song or album collected. We then multiply 
                    the total stream count by $0.004, which is an estimation for the average amount Spotify pays 
                    per stream. Keep in mind that the geography and free/paid breakdown of listeners affect the 
                    average dollar amount per stream paid out to the artist.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="updates">
                  <AccordionTrigger className="text-lg font-medium text-white hover:text-white/90">
                    How frequently is data updated?
                  </AccordionTrigger>
                  <AccordionContent className="text-white/80">
                    Data is updated every day around 5pm EST.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="api-limits">
                  <AccordionTrigger className="text-lg font-medium text-white hover:text-white/90">
                    Can I increase my API rate limits?
                  </AccordionTrigger>
                  <AccordionContent className="text-white/80">
                    For now, everyone is capped at 10 requests per IP address per hour (you can only create 
                    one active API key per IP address). Upgraded paid tier limits will be available soon.
                  </AccordionContent>
                </AccordionItem>
                
              </Accordion>
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
          </Card>
        </div>
      </main>
    </div>
  );
}

export default AboutPage;