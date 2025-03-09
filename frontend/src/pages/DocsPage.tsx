import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DocsPage() {
  const [activeEndpoint, setActiveEndpoint] = useState('album'); // 'album', 'album-python', 'album-typescript', 'search', 'search-python', or 'search-typescript'
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
      {/* Left column - heading and description (fixed position, vertically centered) */}
      <div className="flex-col justify-center h-full md:mb-0 hidden md:flex sticky top-0">
        <div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl text-left font-bold text-white mb-3">
            API Docs
          </h1>
          <p className="text-sm text-left md:text-lg text-white/60">
            Integrate Spotify streaming data into your applications
          </p>
        </div>
      </div>
      
      {/* Right column - API docs card */}
      <div className="h-full flex items-start">
        <Card className="w-full p-4 md:p-6 bg-black/40 border-white/10 overflow-scroll max-h-[calc(100vh-12rem)]">
          <h2 className="text-2xl font-bold text-white mb-4">Endpoints</h2>

          {/* Custom endpoint toggle */}
          <div className="flex mb-6 w-full">
            <div className="flex-1 grid grid-cols-2 gap-1 bg-black/30 p-1 rounded-lg">
              <button
                className={`py-2 px-4 rounded text-sm transition-colors ${
                  activeEndpoint.startsWith('search') 
                    ? 'bg-green-950 text-white'
                    : 'text-white/60 hover:text-white/80'
                }`}
                onClick={() => setActiveEndpoint('search')}
              >
                Search Albums
              </button>
              <button
                className={`py-2 px-4 rounded text-sm transition-colors ${
                  activeEndpoint.startsWith('album') 
                    ? 'bg-green-950 text-white'
                    : 'text-white/60 hover:text-white/80'
                }`}
                onClick={() => setActiveEndpoint('album')}
              >
                Fetch Album
              </button>
            </div>
          </div>

          {/* Get Album Details Section */}
          {(activeEndpoint === 'album' || activeEndpoint === 'album-python' || activeEndpoint === 'album-typescript') && (
            <div className="space-y-4 overflow-auto">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-white">Get Album Details</h3>
                <div className="bg-gray-800 text-green-400 px-3 py-1 rounded font-mono text-sm">
                  GET /albums/{'{album_id}'}
                </div>
              </div>

              <div className="mb-2">
                <p className="text-white/80 mb-4">
                  Get album details, all tracks, and their latest stream counts. If the album exists in the database, returns data from there. Otherwise, attempts to fetch data from Spotify.
                </p>

                <div className="p-4 bg-black/30 rounded-md mb-4">
                  <h4 className="text-white font-medium mb-2">Parameters</h4>
                  <div className="grid grid-cols-3 gap-4 mb-2 text-sm font-medium text-white/60">
                    <div>Name</div>
                    <div>Type</div>
                    <div>Description</div>
                  </div>
                  <hr className="border-white/10 mb-2" />
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-emerald-400">album_id</div>
                    <div className="text-white/80">string</div>
                    <div className="text-white/80">Spotify album ID</div>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-white font-medium mb-2">Example Request</h4>
                
                {/* Language Toggle */}
                <div className="flex mb-2 space-x-2">
                  <button
                    className={`px-3 py-1 text-xs rounded ${activeEndpoint === 'album' ? 'bg-emerald-900/70 text-white' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}
                    onClick={() => setActiveEndpoint('album')}
                  >
                    cURL
                  </button>
                  <button
                    className={`px-3 py-1 text-xs rounded ${activeEndpoint === 'album-python' ? 'bg-emerald-900/70 text-white' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}
                    onClick={() => setActiveEndpoint('album-python')}
                  >
                    Python
                  </button>
                  <button
                    className={`px-3 py-1 text-xs rounded ${activeEndpoint === 'album-typescript' ? 'bg-emerald-900/70 text-white' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}
                    onClick={() => setActiveEndpoint('album-typescript')}
                  >
                    TypeScript
                  </button>
                </div>
                
                {/* cURL Example */}
                {activeEndpoint === 'album' && (
                  <div className="bg-gray-900 p-3 rounded-md font-mono text-sm text-white/80 mb-2 relative group">
                    <pre className="whitespace-pre-wrap">
                      {`curl --request GET \\
  --url https://api.streamclout.io/albums/4LH4d3cOWNNsVw41Gqt2kv \\
  --header 'X-API-Key: your_api_key_here'`}
                    </pre>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
                      onClick={() => copyToClipboard(`curl --request GET \\
  --url https://api.streamclout.io/albums/4LH4d3cOWNNsVw41Gqt2kv \\
  --header 'X-API-Key: your_api_key_here'`)}
                    >
                      <Copy size={12} />
                    </Button>
                  </div>
                )}
                
                {/* Python Example */}
                {activeEndpoint === 'album-python' && (
                  <div className="bg-gray-900 p-3 rounded-md font-mono text-sm text-white/80 mb-2 relative group">
                    <pre className="whitespace-pre-wrap">
                      {`import requests

url = "https://api.streamclout.io/albums/4LH4d3cOWNNsVw41Gqt2kv"
headers = {"X-API-Key": "your_api_key_here"}

response = requests.get(url, headers=headers)
data = response.json()
print(data)`}
                    </pre>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
                      onClick={() => copyToClipboard(`import requests

url = "https://api.streamclout.io/albums/4LH4d3cOWNNsVw41Gqt2kv"
headers = {"X-API-Key": "your_api_key_here"}

response = requests.get(url, headers=headers)
data = response.json()
print(data)`)}
                    >
                      <Copy size={12} />
                    </Button>
                  </div>
                )}
                
                {/* TypeScript Example */}
                {activeEndpoint === 'album-typescript' && (
                  <div className="bg-gray-900 p-3 rounded-md font-mono text-sm text-white/80 mb-2 relative group">
                    <pre className="whitespace-pre-wrap">
                      {`// Using fetch API
const fetchAlbum = async () => {
  const response = await fetch(
    'https://api.streamclout.io/albums/4LH4d3cOWNNsVw41Gqt2kv', 
    {
      headers: {
        'X-API-Key': 'your_api_key_here'
      }
    }
  );
  
  const data = await response.json();
  console.log(data);
};

fetchAlbum();`}
                    </pre>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
                      onClick={() => copyToClipboard(`// Using fetch API
const fetchAlbum = async () => {
  const response = await fetch(
    'https://api.streamclout.io/albums/4LH4d3cOWNNsVw41Gqt2kv', 
    {
      headers: {
        'X-API-Key': 'your_api_key_here'
      }
    }
  );
  
  const data = await response.json();
  console.log(data);
};

fetchAlbum();`)}
                    >
                      <Copy size={12} />
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-white font-medium mb-2">Example Response</h4>
                <div className="bg-gray-900 p-3 rounded-md font-mono text-sm text-white/80 mb-2 overflow-auto max-h-72">
                  <pre>{JSON.stringify({
                    "album": {
                      "album_id": "4LH4d3cOWNNsVw41Gqt2kv",
                      "album_name": "The Dark Side of the Moon",
                      "artist_id": "0k17h0D3J5VfsdmQ1iZtE9",
                      "artist_name": "Pink Floyd",
                      "cover_art": "https://i.scdn.co/image/ab67616d0000b273ea7caaff71dea1051d49b2fe",
                      "release_date": "1973-03-01"
                    },
                    "tracks": [
                      {
                        "track_id": "2up3OPMp9Tb4dAKM2erWXQ",
                        "name": "Speak to Me",
                        "day": "2025-03-09",
                        "playcount": 25683415,
                        "streamHistory": [
                          {"date": "2025-03-02", "streams": 25638290},
                          {"date": "2025-03-03", "streams": 25648982},
                          {"date": "2025-03-04", "streams": 25659104},
                          {"date": "2025-03-05", "streams": 25669325},
                          {"date": "2025-03-06", "streams": 25676803},
                          {"date": "2025-03-07", "streams": 25681090},
                          {"date": "2025-03-08", "streams": 25683415}
                        ]
                      },
                      {
                        "track_id": "0vFOzaXqZHahrZp6enQwQb",
                        "name": "Breathe (In the Air)",
                        "day": "2025-03-09",
                        "playcount": 78934526,
                        "streamHistory": [
                          {"date": "2025-03-02", "streams": 78798124},
                          {"date": "2025-03-03", "streams": 78834576},
                          {"date": "2025-03-04", "streams": 78865432},
                          {"date": "2025-03-05", "streams": 78890651},
                          {"date": "2025-03-06", "streams": 78913587},
                          {"date": "2025-03-07", "streams": 78926135},
                          {"date": "2025-03-08", "streams": 78934526}
                        ]
                      }
                    ],
                    "total_streams": 104617941
                  }, null, 2)}</pre>
                </div>
              </div>
              
              <div className="h-4"></div>
            </div>
          )}

          {/* Search Albums Section */}
          {(activeEndpoint === 'search' || activeEndpoint === 'search-python' || activeEndpoint === 'search-typescript') && (
            <div className="space-y-4 overflow-auto max-h-[calc(100vh-12rem)]">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-white">Search Albums</h3>
                <div className="bg-gray-800 text-green-400 px-3 py-1 rounded font-mono text-sm">
                  GET /search/albums
                </div>
              </div>

              <div className="mb-2">
                <p className="text-white/80 mb-4">
                  Search for albums by name. This endpoint checks the database for results,
                  and if none are found, falls back to searching Spotify directly.
                </p>

                <div className="p-4 bg-black/30 rounded-md mb-4">
                  <h4 className="text-white font-medium mb-2">Parameters</h4>
                  <div className="grid grid-cols-3 gap-4 mb-2 text-sm font-medium text-white/60">
                    <div>Name</div>
                    <div>Type</div>
                    <div>Description</div>
                  </div>
                  <hr className="border-white/10 mb-2" />
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-emerald-400">query</div>
                    <div className="text-white/80">string</div>
                    <div className="text-white/80">album name</div>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-white font-medium mb-2">Example Request</h4>
                
                {/* Language Toggle */}
                <div className="flex mb-2 space-x-2">
                  <button
                    className={`px-3 py-1 text-xs rounded ${activeEndpoint === 'search' ? 'bg-emerald-900/70 text-white' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}
                    onClick={() => setActiveEndpoint('search')}
                  >
                    cURL
                  </button>
                  <button
                    className={`px-3 py-1 text-xs rounded ${activeEndpoint === 'search-python' ? 'bg-emerald-900/70 text-white' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}
                    onClick={() => setActiveEndpoint('search-python')}
                  >
                    Python
                  </button>
                  <button
                    className={`px-3 py-1 text-xs rounded ${activeEndpoint === 'search-typescript' ? 'bg-emerald-900/70 text-white' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}
                    onClick={() => setActiveEndpoint('search-typescript')}
                  >
                    TypeScript
                  </button>
                </div>
                
                {/* cURL Example */}
                {activeEndpoint === 'search' && (
                  <div className="bg-gray-900 p-3 rounded-md font-mono text-sm text-white/80 mb-2 relative group">
                    <pre className="whitespace-pre-wrap">
                      {`curl --request GET \\
  --url "https://api.streamclout.io/search/albums?query=Dark+Side+of+the+Moon" \\
  --header 'X-API-Key: your_api_key_here'`}
                    </pre>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
                      onClick={() => copyToClipboard(`curl --request GET \\
  --url "https://api.streamclout.io/search/albums?query=Dark+Side+of+the+Moon" \\
  --header 'X-API-Key: your_api_key_here'`)}
                    >
                      <Copy size={12} />
                    </Button>
                  </div>
                )}
                
                {/* Python Example */}
                {activeEndpoint === 'search-python' && (
                  <div className="bg-gray-900 p-3 rounded-md font-mono text-sm text-white/80 mb-2 relative group">
                    <pre className="whitespace-pre-wrap">
                      {`import requests

url = "https://api.streamclout.io/search/albums"
params = {"query": "Dark Side of the Moon"}
headers = {"X-API-Key": "your_api_key_here"}

response = requests.get(url, params=params, headers=headers)
data = response.json()
print(data)`}
                    </pre>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
                      onClick={() => copyToClipboard(`import requests

url = "https://api.streamclout.io/search/albums"
params = {"query": "Dark Side of the Moon"}
headers = {"X-API-Key": "your_api_key_here"}

response = requests.get(url, params=params, headers=headers)
data = response.json()
print(data)`)}
                    >
                      <Copy size={12} />
                    </Button>
                  </div>
                )}
                
                {/* TypeScript Example */}
                {activeEndpoint === 'search-typescript' && (
                  <div className="bg-gray-900 p-3 rounded-md font-mono text-sm text-white/80 mb-2 relative group">
                    <pre className="whitespace-pre-wrap">
                      {`// Using fetch API
const searchAlbums = async () => {
  const query = encodeURIComponent('Dark Side of the Moon');
  const response = await fetch(
    \`https://api.streamclout.io/search/albums?query=\${query}\`, 
    {
      headers: {
        'X-API-Key': 'your_api_key_here'
      }
    }
  );
  
  const data = await response.json();
  console.log(data);
};

searchAlbums();`}
                    </pre>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
                      onClick={() => copyToClipboard(`// Using fetch API
const searchAlbums = async () => {
  const query = encodeURIComponent('Dark Side of the Moon');
  const response = await fetch(
    \`https://api.streamclout.io/search/albums?query=\${query}\`, 
    {
      headers: {
        'X-API-Key': 'your_api_key_here'
      }
    }
  );
  
  const data = await response.json();
  console.log(data);
};

searchAlbums();`)}
                    >
                      <Copy size={12} />
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-white font-medium mb-2">Example Response</h4>
                <div className="bg-gray-900 p-3 rounded-md font-mono text-sm text-white/80 mb-2 overflow-auto max-h-72">
                  <pre>{JSON.stringify([
                    {
                      "album_id": "4LH4d3cOWNNsVw41Gqt2kv",
                      "album_name": "The Dark Side of the Moon",
                      "artist_name": "Pink Floyd",
                      "artist_id": "0k17h0D3J5VfsdmQ1iZtE9",
                      "cover_art": "https://i.scdn.co/image/ab67616d0000b273ea7caaff71dea1051d49b2fe",
                      "release_date": "1973-03-01"
                    },
                    {
                      "album_id": "2WT1pbYjLJciAR26yMebkH",
                      "album_name": "The Dark Side of the Moon [50th Anniversary]",
                      "artist_name": "Pink Floyd",
                      "artist_id": "0k17h0D3J5VfsdmQ1iZtE9",
                      "cover_art": "https://i.scdn.co/image/ab67616d0000b273502b599930aa7536cf83528d",
                      "release_date": "1973-03-01"
                    }
                  ], null, 2)}</pre>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default DocsPage;