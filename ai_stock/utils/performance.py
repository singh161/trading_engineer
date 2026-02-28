"""
Performance utilities: Caching, parallel processing, progress tracking
"""
import asyncio
import logging
from typing import List, Dict, Callable, Any, Optional
from functools import wraps
from datetime import datetime, timedelta
import json
from pathlib import Path

logger = logging.getLogger(__name__)


class CacheManager:
    """Simple cache manager with TTL"""
    
    def __init__(self, cache_dir: Path, default_ttl: int = 3600):
        self.cache_dir = cache_dir
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.default_ttl = default_ttl
        self.memory_cache = {}
    
    def get(self, key: str) -> Optional[Any]:
        """Get from cache"""
        # Check memory cache first
        if key in self.memory_cache:
            data, expiry = self.memory_cache[key]
            if datetime.now() < expiry:
                return data
            else:
                del self.memory_cache[key]
        
        # Check file cache
        cache_file = self.cache_dir / f"{key}.json"
        if cache_file.exists():
            try:
                with open(cache_file, 'r') as f:
                    cached_data = json.load(f)
                    expiry = datetime.fromisoformat(cached_data['expiry'])
                    if datetime.now() < expiry:
                        return cached_data['data']
                    else:
                        cache_file.unlink()  # Expired, delete
            except Exception as e:
                logger.warning(f"Cache read error for {key}: {e}")
        
        return None
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None):
        """Set cache value"""
        ttl = ttl or self.default_ttl
        expiry = datetime.now() + timedelta(seconds=ttl)
        
        # Memory cache
        self.memory_cache[key] = (value, expiry)
        
        # File cache
        cache_file = self.cache_dir / f"{key}.json"
        try:
            with open(cache_file, 'w') as f:
                json.dump({
                    'data': value,
                    'expiry': expiry.isoformat()
                }, f, default=str)
        except Exception as e:
            logger.warning(f"Cache write error for {key}: {e}")
    
    def clear(self, key: Optional[str] = None):
        """Clear cache"""
        if key:
            self.memory_cache.pop(key, None)
            cache_file = self.cache_dir / f"{key}.json"
            if cache_file.exists():
                cache_file.unlink()
        else:
            self.memory_cache.clear()
            for cache_file in self.cache_dir.glob("*.json"):
                cache_file.unlink()


class ProgressTracker:
    """Track progress of long-running operations"""
    
    def __init__(self):
        self.progress = {}
    
    def update(self, task_id: str, current: int, total: int, message: str = ""):
        """Update progress"""
        percentage = (current / total * 100) if total > 0 else 0
        self.progress[task_id] = {
            'current': current,
            'total': total,
            'percentage': round(percentage, 1),
            'message': message,
            'timestamp': datetime.now().isoformat()
        }
    
    def get(self, task_id: str) -> Optional[Dict]:
        """Get progress"""
        return self.progress.get(task_id)
    
    def clear(self, task_id: str):
        """Clear progress"""
        self.progress.pop(task_id, None)


async def process_parallel(items: List[Any], func: Callable, max_concurrent: int = 5,
                          progress_callback: Optional[Callable] = None) -> List[Any]:
    """
    Process items in parallel with concurrency limit
    
    Args:
        items: List of items to process
        func: Async function to process each item
        max_concurrent: Maximum concurrent tasks
        progress_callback: Optional callback(current, total)
    
    Returns:
        List of results
    """
    semaphore = asyncio.Semaphore(max_concurrent)
    results = []
    
    async def process_with_semaphore(item):
        async with semaphore:
            try:
                result = await func(item)
                return result
            except Exception as e:
                logger.error(f"Error processing {item}: {e}")
                return None
    
    tasks = [process_with_semaphore(item) for item in items]
    
    for i, coro in enumerate(asyncio.as_completed(tasks)):
        result = await coro
        results.append(result)
        
        if progress_callback:
            progress_callback(i + 1, len(items))
    
    return results


def retry_on_failure(max_retries: int = 3, delay: float = 1.0, backoff: float = 2.0):
    """Decorator for retrying failed operations"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            last_exception = None
            current_delay = delay
            
            for attempt in range(max_retries):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    if attempt < max_retries - 1:
                        logger.warning(f"Attempt {attempt + 1} failed for {func.__name__}: {e}. Retrying in {current_delay}s...")
                        await asyncio.sleep(current_delay)
                        current_delay *= backoff
                    else:
                        logger.error(f"All {max_retries} attempts failed for {func.__name__}")
            
            raise last_exception
        return wrapper
    return decorator
