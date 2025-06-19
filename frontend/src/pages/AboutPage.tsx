import { Card } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import SEOHead from '@/components/seo/SEOHead';
import { FAQStructuredData } from '@/components/seo/StructuredData';

export function AboutPage() {
  // Calculate content height (viewport - header - footer) to match HomePage and ApiPage
  const contentHeight = 'calc(100vh - 5.5rem)';

  return (
    <>
      {/* SEO Head for about page */}
      <SEOHead
        title="About StreamClout - Spotify Streaming Data Analytics Platform"
        description="Learn about StreamClout's mission to democratize access to Spotify streaming data analytics. Discover how we provide accurate track stream counts and performance insights to artists and fans."
        keywords="about streamclout, spotify data analytics, streaming data platform, track performance insights, spotify streaming transparency, music analytics tools"
        canonicalUrl="https://streamclout.io/about"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          "name": "About StreamClout",
          "description": "StreamClout provides transparent access to Spotify streaming data and analytics",
          "mainEntity": {
            "@type": "Organization",
            "name": "StreamClout",
            "description": "Platform for Spotify streaming data analytics and transparency",
            "foundingDate": "2024",
            "knowsAbout": [
              "Spotify streaming data",
              "Music analytics",
              "Track performance metrics",
              "Streaming transparency"
            ]
          }
        }}
            />

      {/* FAQ Structured Data for search engines */}
      <FAQStructuredData />

      <main className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center h-full" role="main">
        {/* Left column - heading (matches other pages styling) */}
        <section className="items-center h-full mb-8 md:mb-0 hidden md:flex" aria-labelledby="about-heading">
          <div className="md:mt-0 md:mb-0">
            <h1 id="about-heading" className="text-5xl md:text-6xl lg:text-7xl text-center md:text-left font-bold text-white mb-3">
              About StreamClout
            </h1>
            <p className="text-sm text-center md:text-left md:text-lg text-white/60">
              Democratizing access to <strong>Spotify streaming data</strong> for transparency and insights
            </p>
          </div>
        </section>

        {/* Right column - FAQ card (matches other pages card styling) */}
        <section className="h-full flex items-center">
          <div className="w-full" style={{ maxHeight: contentHeight }}>
            <Card className="p-4 md:p-6 bg-black/40 border-white/10 overflow-auto">
              <h2 className="text-2xl font-bold text-white mb-4">Frequently Asked Questions</h2>

              <Accordion type="single" collapsible className="w-full">
                {/* Mission as an FAQ item */}
                <AccordionItem value="mission">
                  <AccordionTrigger className="text-lg font-light text-white hover:text-white/90">
                    What is StreamClout's mission for Spotify streaming data?
                  </AccordionTrigger>
                  <AccordionContent className="text-white/80">
                    <div className="space-y-4">
                      <p>
                        StreamClout was created to bring transparency to the music streaming industry by providing
                        artists, managers, and fans with access to real-time <strong>Spotify streaming data</strong> that was previously
                        unavailable to the public.
                      </p>
                      <p>
                        We believe that creators deserve clear insights into how their music performs, and fans should be
                        able to see the true impact of their listening habits. Our platform bridges this information gap by
                        offering accurate, daily-updated <strong>Spotify track streams</strong> and <strong>stream count</strong> metrics directly from the source.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Objective as an FAQ item */}
                <AccordionItem value="objective">
                  <AccordionTrigger className="text-lg font-light text-white hover:text-white/90">
                    What are StreamClout's objectives for streaming analytics?
                  </AccordionTrigger>
                  <AccordionContent className="text-white/80">
                    <div className="space-y-4">
                      <p>
                        Our primary objectives for <strong>Spotify streaming data analytics</strong> are to:
                      </p>
                      <ul className="list-disc pl-5 space-y-2">
                        <li>Democratize access to <strong>Spotify track streams</strong> data that was previously locked behind closed doors</li>
                        <li>Provide artists and managers with insights to make better career decisions</li>
                        <li>Create transparency in music streaming economics and reveal the <strong>most streamed songs on Spotify</strong></li>
                        <li>Build tools that help creators understand their <strong>stream count</strong> performance metrics</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Original FAQ items */}
                <AccordionItem value="data-source">
                  <AccordionTrigger className="text-lg font-light text-white hover:text-white/90">
                    Where does the Spotify streaming data come from?
                  </AccordionTrigger>
                  <AccordionContent className="text-white/80">
                    The <strong>Spotify streaming data</strong> comes from Spotify's internal API that employees and internal services use.
                    We found a way of accessing these internal systems through legal methods and are now
                    offering the real-time <strong>track stream counts</strong> to the public for transparency.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="accuracy">
                  <AccordionTrigger className="text-lg font-light text-white hover:text-white/90">
                    How accurate are the Spotify track streams?
                  </AccordionTrigger>
                  <AccordionContent className="text-white/80">
                    The <strong>Spotify track streams</strong> and daily <strong>stream counts</strong> are updated every day and are 100% accurate - feel free
                    to verify using the Spotify desktop application. Our data matches exactly with Spotify's internal systems.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="revenue">
                  <AccordionTrigger className="text-lg font-light text-white hover:text-white/90">
                    How is revenue calculated from stream counts?
                  </AccordionTrigger>
                  <AccordionContent className="text-white/80">
                    We estimate revenue based on the total <strong>Spotify track streams</strong> a song or album collected. We then multiply
                    the total <strong>stream count</strong> by $0.004, which is an estimation for the average amount Spotify pays
                    per stream. Keep in mind that the geography and free/paid breakdown of listeners affect the
                    average dollar amount per stream paid out to the artist.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="updates">
                  <AccordionTrigger className="text-lg font-light text-white hover:text-white/90">
                    How frequently is Spotify streaming data updated?
                  </AccordionTrigger>
                  <AccordionContent className="text-white/80">
                    <strong>Spotify streaming data</strong> and <strong>track stream counts</strong> are updated every day around 9pm EST,
                    ensuring you always have access to the latest streaming performance metrics.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="api-limits">
                  <AccordionTrigger className="text-lg font-light text-white hover:text-white/90">
                    Can I increase my streaming data API rate limits?
                  </AccordionTrigger>
                  <AccordionContent className="text-white/80">
                    For now, everyone is capped at 10 requests per IP address per hour for accessing <strong>Spotify streaming data</strong> (you can only create
                    one active API key per IP address). Upgraded paid tier limits for enhanced streaming analytics will be available soon.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Message to Spotify */}
              <aside className="mt-6 p-5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg border border-white/10">
                <h3 className="text-xl font-semibold text-white mb-3">Hey Spotify 👋</h3>
                <p className="text-white/80">
                  If you're reading this, I'd love to talk. StreamClout demonstrates the potential for
                  open access to <strong>streaming data</strong> and <strong>track performance metrics</strong>. Rather than fighting this innovation, let's collaborate
                  on bringing more transparency to the music industry with better <strong>Spotify streaming data</strong> access. Reach out and let's build something
                  together that benefits artists, fans, and the platform.
                </p>
              </aside>
            </Card>
          </div>
        </section>
      </main>
    </>
  );
}

export default AboutPage;