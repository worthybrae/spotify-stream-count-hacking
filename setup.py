from setuptools import setup, find_packages

setup(
    name="spotify-stream-count-hacking",  # Updated to match repo name
    version="0.1",
    packages=find_packages(),
    install_requires=[
        'fastapi',
        'uvicorn',
        'httpx',
        'spotipy',
        'python-dotenv',
        'asyncpg',
        'pydantic',
        'pydantic-settings'
    ],
    extras_require={
        'dev': [
            'pytest',
            'pytest-asyncio',
            'pytest-cov'
        ]
    }
)