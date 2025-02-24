from setuptools import setup, find_packages

setup(
    name="spotify-stream-count",
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
)