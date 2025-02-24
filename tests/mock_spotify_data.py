# tests/mock_spotify_data.py
"""Sample data for testing without real API keys"""
SAMPLE_ALBUM = {
    'id': 'sample_album_1',
    'name': 'Test Album',
    'artists': [{'id': 'artist_1', 'name': 'Test Artist'}],
    'images': [{'url': 'https://example.com/cover.jpg'}],
    'release_date': '2024-02-23'
}

SAMPLE_TRACK = {
    'track_id': 'sample_track_1',
    'name': 'Test Track',
    'playcount': 1000,
    'artist_name': 'Test Artist'
}