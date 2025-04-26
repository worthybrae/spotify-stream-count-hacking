# services/token_manager.py
"""
TokenManager class responsible for obtaining and managing Spotify API tokens.
This version uses network request monitoring for reliable token acquisition.
"""

import asyncio
import json
import logging
import os
import time
from typing import Tuple

import httpx
from fastapi import HTTPException
from playwright.async_api import async_playwright

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("token_manager")


class TokenManager:
    """
    Manages authentication tokens for the unofficial Spotify API
    using Playwright to monitor network requests
    """

    def __init__(self):
        self.client_token = None
        self.bearer_token = None
        self.bearer_expiry = 0  # Milliseconds timestamp
        self.token_expiry = 0  # Seconds timestamp
        self.client = httpx.AsyncClient(timeout=30.0)
        self.max_retries = 3
        self.cache_file = "tokens/spotify_tokens.json"
        self.lock = asyncio.Lock()  # For thread safety when refreshing tokens

    async def _fetch_tokens_with_playwright(self) -> Tuple[str, str]:
        """
        Fetch tokens by monitoring network requests to Spotify API
        Exit immediately once we get both tokens
        """
        # Storage for our tokens
        tokens = {"bearer": None, "client": None}
        # Event to signal when both tokens are found
        tokens_found = asyncio.Event()

        logger.info("Starting token fetch with Playwright using network monitoring")

        async with async_playwright() as p:
            # Launch the browser in headless mode
            browser = await p.chromium.launch(
                headless=True,
                args=["--disable-blink-features=AutomationControlled", "--no-sandbox"],
            )

            try:
                # Set up browser context with realistic profile
                context = await browser.new_context(
                    user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                    viewport={"width": 1280, "height": 800},
                    locale="en-US",
                )

                page = await context.new_page()

                # Set up request monitoring
                async def handle_request(request):
                    # Check if this is a Spotify API request
                    if (
                        "api-partner.spotify.com" in request.url
                        or "api.spotify.com" in request.url
                    ):
                        headers = request.headers

                        # Look for authorization header (bearer token)
                        if "authorization" in headers and headers[
                            "authorization"
                        ].startswith("Bearer "):
                            bearer = headers["authorization"].replace("Bearer ", "")
                            tokens["bearer"] = bearer
                            logger.info(
                                f"Found bearer token in request (length: {len(bearer)})"
                            )

                        # Look for client token
                        if "client-token" in headers:
                            client = headers["client-token"]
                            tokens["client"] = client
                            logger.info(
                                f"Found client token in request (length: {len(client)})"
                            )

                        # If we found both tokens, signal that we're done
                        if tokens["bearer"] and tokens["client"]:
                            tokens_found.set()

                # Register the request handler
                page.on("request", handle_request)

                # Navigate to the Spotify home page to trigger API calls
                logger.info("Navigating to Spotify home page")
                navigation_task = asyncio.create_task(
                    page.goto("https://open.spotify.com/", wait_until="networkidle")
                )

                # Wait for either navigation to complete or tokens to be found
                done, pending = await asyncio.wait(
                    [navigation_task, tokens_found.wait()],
                    return_when=asyncio.FIRST_COMPLETED,
                )

                # If tokens were found before navigation completed, cancel navigation
                if tokens_found.is_set():
                    if not navigation_task.done():
                        navigation_task.cancel()
                else:
                    # Wait for a moment to see if any API calls happen after navigation
                    await asyncio.sleep(2)

                # If we still don't have both tokens after initial page load
                if not (tokens["bearer"] and tokens["client"]):
                    # Start a timeout task - we'll wait at most 10 seconds for tokens
                    timeout_task = asyncio.create_task(asyncio.sleep(10))

                    # Wait for either tokens to be found or timeout
                    done, pending = await asyncio.wait(
                        [tokens_found.wait(), timeout_task],
                        return_when=asyncio.FIRST_COMPLETED,
                    )

                    # Cancel the pending task
                    for task in pending:
                        task.cancel()

                # Check if we found both tokens
                if not tokens["bearer"]:
                    raise HTTPException(
                        status_code=500, detail="Failed to obtain bearer token"
                    )

                if not tokens["client"]:
                    raise HTTPException(
                        status_code=500, detail="Failed to obtain client token"
                    )

                # Set expiry time (using 1 hour as default - tokens usually last longer)
                current_time = time.time()
                self.bearer_expiry = (
                    int(current_time * 1000) + 3600000
                )  # 1 hour in milliseconds
                self.token_expiry = current_time + 3600  # 1 hour in seconds

                # Save tokens to cache
                self._save_to_cache(tokens["bearer"], tokens["client"])

                logger.info("Successfully obtained both tokens")
                return tokens["bearer"], tokens["client"]

            finally:
                await browser.close()
                logger.info("Browser closed")

    def _save_to_cache(self, bearer_token, client_token):
        """Save tokens to cache file for later use."""
        try:
            # Create directory if it doesn't exist
            os.makedirs(os.path.dirname(self.cache_file), exist_ok=True)

            token_data = {
                "bearer_token": bearer_token,
                "client_token": client_token,
                "timestamp": time.time(),
                "expires_at": self.token_expiry,
            }

            with open(self.cache_file, "w") as f:
                json.dump(token_data, f, indent=2)

            logger.info(f"Tokens saved to {self.cache_file}")

        except Exception as e:
            logger.warning(f"Failed to save tokens to cache: {str(e)}")

    async def _try_load_from_cache(self):
        """Try to load tokens from cache file."""
        try:
            if not os.path.exists(self.cache_file):
                return False

            with open(self.cache_file, "r") as f:
                data = json.load(f)

            # Check if tokens are still valid
            if (
                "expires_at" in data and time.time() < data["expires_at"] - 300
            ):  # 5 min buffer
                self.bearer_token = data["bearer_token"]
                self.client_token = data["client_token"]
                self.bearer_expiry = data["expires_at"] * 1000  # Convert to ms
                self.token_expiry = data["expires_at"]

                logger.info("Loaded valid tokens from cache")
                return True

            logger.info("Cached tokens expired or invalid")
            return False

        except Exception as e:
            logger.warning(f"Error loading tokens from cache: {str(e)}")
            return False

    async def get_tokens(self) -> Tuple[str, str]:
        """
        Get valid client and bearer tokens, refreshing if necessary

        Returns:
            Tuple of (client_token, bearer_token)
        """
        # Use a lock to prevent multiple concurrent token refreshes
        async with self.lock:
            current_time = time.time()

            # Check if tokens are valid or need refreshing
            client_token_valid = (
                self.client_token and current_time < self.token_expiry - 300
            )  # 5 min buffer
            bearer_token_valid = (
                self.bearer_token and current_time * 1000 < self.bearer_expiry - 300000
            )  # 5 min buffer

            # If tokens aren't valid, try loading from cache first
            if not (client_token_valid and bearer_token_valid):
                cache_success = await self._try_load_from_cache()

                # Recheck after loading from cache
                client_token_valid = (
                    cache_success
                    and self.client_token
                    and current_time < self.token_expiry - 300
                )
                bearer_token_valid = (
                    cache_success
                    and self.bearer_token
                    and current_time * 1000 < self.bearer_expiry - 300000
                )

            # If still not valid, fetch new tokens
            if not (client_token_valid and bearer_token_valid):
                logger.info(
                    f"Refreshing tokens (current_time={current_time}, token_expiry={self.token_expiry})"
                )
                (
                    self.bearer_token,
                    self.client_token,
                ) = await self._fetch_tokens_with_playwright()

            return self.client_token, self.bearer_token
