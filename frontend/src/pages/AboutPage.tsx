import { Card } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export function AboutPage() {
  // Calculate content height (viewport - header - footer) to match HomePage and ApiPage
  const contentHeight = 'calc(100vh - 5.5rem)';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center h-full">
      {/* Left column - heading (matches other pages styling) */}
      <div className="items-center h-full mb-8 md:mb-0 hidden md:flex">
        <div className="md:mt-0 md:mb-0">
          <h1 className="text-5xl md:text-6xl lg:text-7xl text-center md:text-left font-bold text-white mb-3">
            About Us
          </h1>
          <p className="text-sm text-center md:text-left md:text-lg text-white/60">
            Understand how streamclout.io works
          </p>
        </div>
      </div>
      
      {/* Right column - FAQ card (matches other pages card styling) */}
      <div className="h-full flex items-center">
        <div className="w-full" style={{ maxHeight: contentHeight }}>
          <Card className="p-4 md:p-6 bg-black/40 border-white/10 overflow-auto">
            <h2 className="text-2xl font-bold text-white mb-4">FAQs</h2>
            
            <Accordion type="single" collapsible className="w-full">
              {/* Mission as an FAQ item */}
              <AccordionItem value="mission">
                <AccordionTrigger className="text-lg font-light text-white hover:text-white/90">
                  What is streamclout.io's mission?
                </AccordionTrigger>
                <AccordionContent className="text-white/80">
                  <div className="space-y-4">
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
                </AccordionContent>
              </AccordionItem>
              
              {/* Objective as an FAQ item */}
              <AccordionItem value="objective">
                <AccordionTrigger className="text-lg font-light text-white hover:text-white/90">
                  What are streamclout.io's objectives?
                </AccordionTrigger>
                <AccordionContent className="text-white/80">
                  <div className="space-y-4">
                    <p>
                      Our primary objectives are to:
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>Democratize access to streaming data that was previously locked behind closed doors</li>
                      <li>Provide artists and managers with insights to make better career decisions</li>
                      <li>Create transparency in music streaming economics</li>
                      <li>Build tools that help creators understand their performance metrics</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              {/* Original FAQ items */}
              <AccordionItem value="data-source">
                <AccordionTrigger className="text-lg font-light text-white hover:text-white/90">
                  Where does the data come from?
                </AccordionTrigger>
                <AccordionContent className="text-white/80">
                  The data comes from Spotify's internal API that employees and internal services use. 
                  We found a way of accessing these internal systems through legal methods and are now 
                  offering the data to the public.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="accuracy">
                <AccordionTrigger className="text-lg font-light text-white hover:text-white/90">
                  How accurate is the data?
                </AccordionTrigger>
                <AccordionContent className="text-white/80">
                  The Spotify daily stream counts are updated every day and are 100% accurate - feel free 
                  to verify using the Spotify desktop application.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="revenue">
                <AccordionTrigger className="text-lg font-light text-white hover:text-white/90">
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
                <AccordionTrigger className="text-lg font-light text-white hover:text-white/90">
                  How frequently is data updated?
                </AccordionTrigger>
                <AccordionContent className="text-white/80">
                  Data is updated every day around 9pm EST.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="api-limits">
                <AccordionTrigger className="text-lg font-light text-white hover:text-white/90">
                  Can I increase my API rate limits?
                </AccordionTrigger>
                <AccordionContent className="text-white/80">
                  For now, everyone is capped at 10 requests per IP address per hour (you can only create 
                  one active API key per IP address). Upgraded paid tier limits will be available soon.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            {/* Message to Spotify */}
            <div className="mt-6 p-5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-3">Hey Spotify 👋</h3>
              <p className="text-white/80">
                If you're reading this, I'd love to talk. streamclout.io demonstrates the potential for 
                open access to streaming data. Rather than fighting this innovation, let's collaborate 
                on bringing more transparency to the music industry. Reach out and let's build something 
                together.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default AboutPage;