import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ApiKeyManagement from '@/components/features/api/ApiKeyManagement';

export function ApiPage() {
  const [ipAddress, setIpAddress] = useState<string>('Loading...');

  // Fetch client IP on page load
  useEffect(() => {
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

  const contentHeight = 'calc(100vh - 5.5rem)';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center h-full">
            {/* Left column - heading and description (matches home page styling) */}
            <div className="items-center h-full md:mb-0 hidden md:flex">
              <div className='md:mt-0 md:mb-0'>
                <h1 className="text-5xl md:text-6xl lg:text-7xl text-center md:text-left font-bold text-white mb-3">
                  Access Spotify Data Via API
                </h1>
                <p className="text-sm text-center md:text-left md:text-lg text-white/60 ">
                  Get daily spotify streaming data using code
                </p>
              </div>
            </div>
            
            {/* Right column - API card (matches home page card styling) */}
            <div className="h-full flex items-center">
            <div className="w-full" style={{ maxHeight: contentHeight }}>
            <Card className="p-4 md:p-6 bg-black/40 border-white/10 overflow-hidden">
            <div className='flex justify-between mb-4 items-start'>
              <h2 className="text-2xl font-bold text-white mb-4">API Access</h2>
              <Button 
              onClick={() => window.open('https://api.streamclout.io/docs', '_blank')}
              className="bg-white/10 hover:bg-white/80 text-white hover:text-black/80"
              >Interactive Docs</Button>
            </div>
            
            {/* IP Address Section */}
            <div className="mb-6">
              <div className="text-lg text-white mb-2">IP Address</div>
              <code className="bg-black/30 px-3 py-2 rounded font-mono block text-green-400">
                {ipAddress}
              </code>
            </div>
            
            {/* API Key Management Component */}
            <ApiKeyManagement />
          </Card>
          </div>
            </div>
          </div>
  );
}

export default ApiPage;