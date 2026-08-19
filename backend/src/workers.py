"""Dramatiq worker entrypoint. Media actors are intentionally isolated from HTTP."""
import dramatiq
from dramatiq.brokers.redis import RedisBroker

from src.config import settings

dramatiq.set_broker(RedisBroker(url=settings.REDIS_URL))


@dramatiq.actor(queue_name="media", max_retries=3, min_backoff=30_000)
def health_job() -> None:
    """Smoke-test actor used by deployment health checks."""
    return None
