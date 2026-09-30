import pytest


@pytest.fixture
def anyio_backend():
    """Keep the test matrix deterministic without requiring the optional Trio runtime."""
    return "asyncio"
