import os
from supabase import create_client
import requests
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get your Supabase credentials
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_ANON_KEY")  # Use service key, not anon key

# Initialize Supabase client
supabase = create_client(supabase_url, supabase_key)

def get_users_with_spotify_auth():
    """
    Get users who have authenticated with Spotify.
    This uses the proper auth.users access method.
    """
    # Use admin API to list users instead of querying auth.users directly
    response = supabase.auth.admin.list_users()
    print(response)
    
    # Filter for users with Spotify provider
    spotify_users = []
    for user in response:
        # Check if user has authenticated with Spotify
        for identity in user.identities or []:
            if identity.provider == "spotify":
                spotify_users.append(user)
                break
    
    return spotify_users

def get_spotify_tokens_for_user(user):
    """Extract Spotify tokens from a user object"""
    for identity in user.identities or []:
        if identity.provider == "spotify":
            return {
                "access_token": identity.provider_token,
                "refresh_token": identity.provider_refresh_token,
                "expires_at": identity.updated_at  # This might need adjustment
            }
    return None

def refresh_token_if_needed(refresh_token):
    """Refresh the Spotify token if needed"""
    # Get Spotify API credentials
    client_id = os.getenv("SPOTIFY_CLIENT_ID")
    client_secret = os.getenv("SPOTIFY_CLIENT_SECRET")
    
    import base64
    
    # Create the Basic auth header
    auth_header = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
    
    headers = {
        "Authorization": f"Basic {auth_header}",
        "Content-Type": "application/x-www-form-urlencoded"
    }
    
    data = {
        "grant_type": "refresh_token",
        "refresh_token": refresh_token
    }
    
    response = requests.post("https://accounts.spotify.com/api/token", headers=headers, data=data)
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error refreshing token: {response.status_code} - {response.text}")
        return None

def test_spotify_api(access_token):
    """Test the Spotify API using the access token"""
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get("https://api.spotify.com/v1/me", headers=headers)
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"API call failed: {response.status_code} - {response.text}")
        return None

def main():
    # Get all users who have authenticated with Spotify
    spotify_users = get_users_with_spotify_auth()
    print(f"Found {len(spotify_users)} users with Spotify authentication")
    
    for user in spotify_users:
        print(f"\nProcessing user: {user.email}")
        
        # Get the Spotify tokens for this user
        tokens = get_spotify_tokens_for_user(user)
        
        if not tokens:
            print("  No Spotify tokens found for this user")
            continue
        
        print(f"  Access token: {tokens['access_token'][:10]}...")
        print(f"  Refresh token: {tokens['refresh_token'][:10]}...")
        
        # Test the current token
        user_profile = test_spotify_api(tokens['access_token'])
        
        if user_profile:
            print(f"  Successfully accessed Spotify API for {user_profile.get('display_name')}")
        else:
            print("  Token appears to be expired, refreshing...")
            new_tokens = refresh_token_if_needed(tokens['refresh_token'])
            
            if new_tokens:
                print(f"  Successfully refreshed token: {new_tokens['access_token'][:10]}...")
                
                # Test the new token
                user_profile = test_spotify_api(new_tokens['access_token'])
                if user_profile:
                    print(f"  Successfully accessed Spotify API with new token for {user_profile.get('display_name')}")
                else:
                    print("  Failed to access Spotify API with new token")
            else:
                print("  Failed to refresh token")

if __name__ == "__main__":
    main()