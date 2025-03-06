// components/features/api/ApiKeyManagement.tsx
import { useState, useEffect } from 'react';
import { Copy, Eye, EyeOff, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  createApiKey, 
  getApiKeyInfo, 
  regenerateApiKey, 
  deleteApiKey,
  refreshRequestLogs 
} from '@/lib/api/authApi';
import RequestStatsTable from './RequestStatsTable';
import { ApiKeyInfo } from '@/types/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

const ApiKeyManagement = () => {
  const [loading, setLoading] = useState(true);
  const [refreshingLogs, setRefreshingLogs] = useState(false);
  const [apiKeyInfo, setApiKeyInfo] = useState<ApiKeyInfo | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Fetch existing API key info on component mount
  useEffect(() => {
    fetchApiKeyInfo();
  }, []);

  const fetchApiKeyInfo = async () => {
    console.log('Fetching API key info...');
    setError(null);
    setLoading(true);
    
    try {
      const info = await getApiKeyInfo();
      console.log('API key info response:', info);
      setApiKeyInfo(info);
    } catch (error) {
      console.error('Failed to fetch API key info:', error);
      setError('Failed to fetch API key info. Please try again.');
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
      setApiKeyInfo(response);
      setShowApiKey(true); // Automatically show the newly created key
    } catch (error) {
      console.error('Failed to create API key:', error);
      setError('Failed to create API key. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateApiKey = async () => {
    console.log('Regenerating API key...');
    setError(null);
    setLoading(true);
    
    try {
      const response = await regenerateApiKey();
      console.log('API key regeneration response:', response);
      setApiKeyInfo(response);
      setShowApiKey(true); // Automatically show the newly created key
    } catch (error) {
      console.error('Failed to regenerate API key:', error);
      setError('Failed to regenerate API key. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteApiKey = async () => {
    console.log('Deleting API key...');
    setError(null);
    setLoading(true);
    setConfirmDelete(false);
    
    try {
      await deleteApiKey();
      console.log('API key deleted successfully');
      setApiKeyInfo(null);
    } catch (error) {
      console.error('Failed to delete API key:', error);
      setError('Failed to delete API key. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshRequestLogs = async () => {
    console.log('Refreshing request logs...');
    setError(null);
    setRefreshingLogs(true);
    
    try {
      const response = await refreshRequestLogs();
      console.log('Request logs refresh response:', response);
      
      // Only update the requests part of the API key info
      if (apiKeyInfo && response) {
        setApiKeyInfo({
          ...apiKeyInfo,
          requests: response.requests
        });
      }
    } catch (error) {
      console.error('Failed to refresh request logs:', error);
      setError('Failed to refresh request logs. Please try again.');
    } finally {
      setRefreshingLogs(false);
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
    <div className="space-y-4">
      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="bg-gray-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Delete API Key?</DialogTitle>
            <DialogDescription className="text-white/70">
              This will permanently delete your API key. You won't be able to use existing API access until you generate a new key.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setConfirmDelete(false)}
              className="border-white/20 hover:bg-white/10 text-white/80"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteApiKey}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* API Key Section */}
      <div className=" rounded-lg">
        <h2 className="text-lg text-white mb-4">API Key</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-500/30 rounded text-red-200 text-sm">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="flex items-center justify-center p-6">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-400" />
            <span className="ml-2 text-white/80">Loading...</span>
          </div>
        ) : apiKeyInfo ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <code className="flex-1 p-3 bg-black/30 rounded text-white font-mono text-base">
                  {formatApiKey(apiKeyInfo.api_key)}
                </code>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="bg-transparent hover:bg-white/10 border-white/20"
                  onClick={() => setShowApiKey(!showApiKey)}
                  title={showApiKey ? "Hide API key" : "Show API key"}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4 text-white/80" /> : <Eye className="h-4 w-4 text-white/80" />}
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="bg-transparent hover:bg-white/10 border-white/20"
                  onClick={handleCopyApiKey}
                  title="Copy API key"
                >
                  <Copy className="h-4 w-4 text-white/80" />
                </Button>
              </div>
              {copySuccess && <p className="text-xs text-green-400">API key copied to clipboard!</p>}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm text-white/80">
              <div>
                <div className="text-white/60 mb-1">Created</div>
                <div>{new Date(apiKeyInfo.created_at).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-white/60 mb-1">Status</div>
                <div className={apiKeyInfo.is_active ? "text-green-400" : "text-red-400"}>
                  {apiKeyInfo.is_active ? "Active" : "Inactive"}
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <Button 
                onClick={handleRegenerateApiKey} 
                disabled={loading}
                className="bg-white/10 hover:bg-white/80 text-white hover:text-black/80 flex-1"
              >
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  'Regenerate API Key'
                )}
              </Button>
              
              <Button 
                onClick={() => setConfirmDelete(true)} 
                disabled={loading}
                className="bg-red-500/30 hover:bg-red-500/60 text-white"
              >
                <Trash2 className="mr-2 h-4 w-4 text-red-400" />
                Delete
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Button 
              onClick={handleCreateApiKey} 
              disabled={loading}
              className="bg-black/40 hover:bg-black/70 text-white w-full"
            >
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate API Key'
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Request History Section */}
<div className="rounded-lg">
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-lg text-white">Requests</h2>
    <Button 
      size="sm"
      className="bg-white/10 hover:bg-white/80 text-white hover:text-black/80"
      onClick={handleRefreshRequestLogs}
      disabled={refreshingLogs}
    >
      <RefreshCw className={`h-3 w-3 mr-2 ${refreshingLogs ? 'animate-spin' : ''}`} />
      Refresh Logs
    </Button>
  </div>
  
  <div className="flex max-h-36"> {/* Added fixed height container */}
    {apiKeyInfo?.requests ? (
      <RequestStatsTable requests={apiKeyInfo.requests}/>
    ) : (
      <div className="text-sm text-white/60 text-center py-6 bg-black/20 rounded-md">
        No requests in the past hour
      </div>
    )}
  </div>
</div>
    </div>
  );
};

export default ApiKeyManagement;