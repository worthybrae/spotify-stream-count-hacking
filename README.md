# Spotify Analytics API

A FastAPI-based service that tracks Spotify new releases and stream counts using both official and unofficial Spotify APIs.

## Project Structure

```
├── backend/
│   ├── __init__.py
│   ├── config.py           # Environment and configuration settings
│   ├── db.py              # Database connection and queries
│   ├── main.py            # FastAPI application and routes
│   ├── models.py          # Pydantic models
│   ├── official_spotify.py # Official Spotify API client
│   └── unofficial_spotify.py # Unofficial Spotify API client
├── scripts/
│   ├── check_new_releases.py # Script to fetch new releases
│   └── update_streams.py    # Script to update stream counts
└── tests/
    ├── conftest.py          # pytest fixtures
    ├── mock_spotify_data.py # Mock data for testing
    ├── test_*.py           # Test files
    └── pytest.ini          # pytest configuration
```

## Setup

### Prerequisites

- Python 3.8+
- PostgreSQL/CockroachDB instance
- Spotify Developer account with API credentials

### Local Development Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/spotify-stream-count-hacking
cd spotify-analytics-api
```

2. Create and activate a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the root directory with the following variables:

```env
COCKROACH_DB_USER=your_db_user
COCKROACH_DB_PW=your_db_password
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
API_KEY=your_api_key
```

### Running the Application

1. Start the FastAPI server:

```bash
uvicorn backend.main:app --reload
```

2. Access the API documentation at:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Running Scripts

The project includes two utility scripts:

1. Check for new releases:

```bash
python scripts/check_new_releases.py
```

2. Update stream counts:

```bash
python scripts/update_streams.py
```

## Testing

The project uses pytest for testing. The test suite includes unit tests and integration tests.

Run all tests:

```bash
pytest
```

Run specific test files:

```bash
pytest tests/test_integration.py
pytest tests/test_official_spotify.py
```

Run tests with coverage:

```bash
pytest --cov=backend tests/
```

### Local Setup Testing

To verify your local setup:

```bash
python tests/test_local_setup.py
```

This will check:

- Database connection
- Environment variables
- Basic functionality

## API Endpoints

- `GET /new-releases`: Get latest album releases
- `GET /album/{album_id}/tracks`: Get tracks and play counts for an album
- `GET /track/{track_id}`: Get current track information
- `GET /track/{track_id}/history`: Get historical stream counts

## Authentication

All endpoints require an API key to be passed in the `X-API-Key` header.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

[Your License Here]
