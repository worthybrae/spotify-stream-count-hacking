import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { getApiKeyInfo, createApiKey } from '@/lib/api/authApi';
import { ApiKeyInfo } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Copy, Eye, EyeOff, RefreshCw } from 'lucide-react';
import RequestStatsTable from '@/components/features/api/RequestStatsTable';

export function ApiPage() {
  const [ipAddress, setIpAddress] = useState<string>('Loading...');
  const [loading, setLoading] = useState(true);
  const [apiKeyInfo, setApiKeyInfo] = useState<ApiKeyInfo | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debug info
  useEffect(() => {
    console.log('ApiPage component loaded');
  }, []);

  // Debug when apiKeyInfo changes
  useEffect(() => {
    console.log('apiKeyInfo state changed:', apiKeyInfo);
  }, [apiKeyInfo]);

  // Fetch client IP and API key info on page load
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
    
    // Get API key info
    fetchApiKeyInfo();
  }, []);

  const fetchApiKeyInfo = async () => {
    console.log('Fetching API key info...');
    setError(null);
    setLoading(true);
    
    try {
      const info = await getApiKeyInfo();
      console.log('API key info response:', info);
      
      // Extra safety check to prevent null values
      if (info) {
        setApiKeyInfo(info);
        console.log('API key info state set successfully');
      } else {
        console.log('getApiKeyInfo returned null/undefined');
        setApiKeyInfo(null);
      }
    } catch (error) {
      console.error('Failed to fetch API key info:', error);
      setError('Failed to fetch API key info. Please try again.');
      setApiKeyInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApiKey = async () => {
    console.log('Creating new API key...');
    setError(null);
    setLoading(true);
    
    try {
      const response = await createApiKey();
      console.log('API key creation response:', response);
      
      // Extra validation to ensure we have a valid response
      if (response && response.api_key) {
        setApiKeyInfo(response);
        setShowApiKey(true); // Automatically show the newly created key
        console.log('API key created and state updated successfully');
      } else {
        console.error('Create API key returned invalid data:', response);
        setError('Received invalid data when creating API key');
      }
    } catch (error) {
      console.error('Failed to create API key:', error);
      setError('Failed to create API key. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyApiKey = () => {
    if (apiKeyInfo?.api_key) {
      navigator.clipboard.writeText(apiKeyInfo.api_key);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  // Format API key for display (show last 4 digits, rest as stars)
  const formatApiKey = (key: string) => {
    if (!showApiKey) {
      return key.substring(key.length - 4).padStart(key.length, '*');
    }
    return key;
  };

  return (
    <div className="relative">
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center h-full">
          {/* Left column - heading and description, similar to home page */}
          <div className="mb-8 md:mb-0">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-3">
              api access
            </h1>
            <p className="text-lg text-white/80 max-w-xl">
              Access Spotify streaming data programmatically
            </p>
          </div>
          
          {/* Right column - Single API card with all info */}
          <div className="w-full">
            <Card className="bg-white/5 border-white/10 p-6 w-full">
              <h2 className="text-2xl font-bold text-white mb-6">API Access</h2>
              
              {/* Debug State Display (will remove later) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mb-3 p-2 bg-gray-900 rounded text-xs text-white/70 font-mono overflow-auto max-h-20">
                  <div>Debug: apiKeyInfo present: {apiKeyInfo ? 'Yes' : 'No'}</div>
                  <div>Debug: loading: {loading ? 'True' : 'False'}</div>
                </div>
              )}
              
              {/* IP Address Section */}
              <div className="mb-6">
                <div className="text-sm text-white/60 mb-2">Your IP Address</div>
                <code className="bg-black/30 px-3 py-2 rounded text-white font-mono block">
                  {ipAddress}
                </code>
              </div>
              
              {/* Error Message */}
              {error && (
                <div className="mb-6 p-3 bg-red-900/30 border border-red-500/30 rounded text-red-200 text-sm">
                  {error}
                </div>
              )}
              
              {/* API Key Section */}
              <div className="mb-6">
                <div className="text-sm text-white/60 mb-2">API Key</div>
                
                {loading ? (
                  <div className="flex items-center p-3 bg-black/30 rounded">
                    <RefreshCw className="h-5 w-5 animate-spin text-blue-400 mr-2" />
                    <span className="text-white/80">Loading...</span>
                  </div>
                ) : apiKeyInfo ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-3 bg-black/30 rounded text-white font-mono">
                        {formatApiKey(apiKeyInfo.api_key)}
                      </code>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="bg-transparent hover:bg-white/10 border-white/20"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4 text-white/80" /> : <Eye className="h-4 w-4 text-white/80" />}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        className="bg-transparent hover:bg-white/10 border-white/20"
                        onClick={handleCopyApiKey}
                      >
                        <Copy className="h-4 w-4 text-white/80" />
                      </Button>
                    </div>
                    {copySuccess && <p className="text-xs text-green-400">API key copied to clipboard!</p>}
                    
                    <div className="flex justify-between text-sm text-white/80">
                      <div>
                        <span className="text-white/60">Created:</span>{' '}
                        <span>{new Date(apiKeyInfo.created_at).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-white/60">Status:</span>{' '}
                        <span className={apiKeyInfo.is_active ? "text-green-400" : "text-red-400"}>
                          {apiKeyInfo.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-3">
                      <Button 
                        onClick={handleCreateApiKey} 
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                      >
                        Regenerate API Key
                      </Button>
                      <Button 
                        onClick={fetchApiKeyInfo} 
                        disabled={loading}
                        variant="outline"
                        className="border-white/20 hover:bg-white/10"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-white/80 p-3 bg-black/30 rounded">No API key found for your IP address</p>
                    <Button 
                      onClick={handleCreateApiKey} 
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                    >
                      Generate API Key
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Recent Requests Section */}
              <div>
                <div className="text-sm text-white/60 mb-2">API Requests (Last Hour)</div>
                {apiKeyInfo?.requests ? (
                  <RequestStatsTable requests={apiKeyInfo.requests} />
                ) : (
                  <div className="text-sm text-white/60 text-center py-6 bg-black/20 rounded-md">
                    No requests in the past hour
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ApiPage;