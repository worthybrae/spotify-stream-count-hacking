# tests/test_local_setup.py
import asyncio
from backend.config import settings
from backend.db import get_db

async def test_database_connection():
    """Test if we can connect to the database"""
    try:
        async with get_db() as conn:
            version = await conn.fetchval('SELECT version()')
            print(f"✅ Successfully connected to database!\nDatabase version: {version}")
    except Exception as e:
        print(f"❌ Database connection failed: {str(e)}")

async def test_env_variables():
    """Test if all necessary environment variables are set"""
    required_vars = [
        'COCKROACH_DB_USER',
        'COCKROACH_DB_PW',
        'SPOTIFY_CLIENT_ID',
        'SPOTIFY_CLIENT_SECRET',
        'API_KEY'
    ]
    
    print("\nChecking environment variables:")
    all_good = True
    for var in required_vars:
        value = getattr(settings, var, None)
        if value:
            print(f"✅ {var} is set")
        else:
            print(f"❌ {var} is missing")
            all_good = False
    
    if all_good:
        print("\nAll required environment variables are set!")
    else:
        print("\nSome environment variables are missing. Check your .env file.")

if __name__ == "__main__":
    asyncio.run(test_database_connection())
    asyncio.run(test_env_variables())