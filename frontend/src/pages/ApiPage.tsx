import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import ApiKeyManagement from '@/components/features/api/ApiKeyManagement';

export function ApiPage() {
  const [ipAddress, setIpAddress] = useState<string>('Loading...');

  // Debug info
  useEffect(() => {
    console.log('ApiPage component loaded');
  }, []);

  // Fetch client IP on page load
  useEffect(() => {
    // Get IP address
    fetch('https://api.ipify.org?format=json')
      .then(response => response.json())
      .then(data => {
        console.log('IP fetched:', data.ip);
        setIpAddress(data.ip);
      })
      .catch(error => {
        console.error('Error fetching IP:', error);
        setIpAddress('Unable to detect');
      });
  }, []);

  return (
    <div className="relative h-full">
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center h-full">
          {/* Left column - heading and description, similar to home page */}
          <div className="mb-8 md:mb-0">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-3">
              Access Spotify Data Via API
            </h1>
            <p className="text-lg text-white/80 max-w-xl">
              Access daily Spotify streaming data programmatically
            </p>
          </div>
          
          {/* Right column - Single API card with all info */}
          <div className="w-full">
            <Card className="p-4 md:p-6 bg-black/40 border-white/10  max-h-[calc(100vh-16rem)]">
              <h2 className="text-2xl font-bold text-white mb-6">API Access</h2>
              
              {/* IP Address Section */}
              <div className="mb-6">
                <div className="text-lg text-white mb-2">IP Address</div>
                <code className="bg-black/30 px-3 py-2 rounded text-white font-mono block">
                  {ipAddress}
                </code>
              </div>
              
              {/* API Key Management Component */}
              <ApiKeyManagement />
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ApiPage;