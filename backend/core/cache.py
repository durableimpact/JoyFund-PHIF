import hashlib
from functools import wraps
from django.core.cache import cache
from rest_framework.response import Response

def make_cache_key(prefix, *args, **kwargs):
    """
    Builds a consistent, namespaced cache key based on the provided arguments and keyword arguments.
    Format: {prefix}:{hash_of_args_and_kwargs}
    """
    key_parts = [str(arg) for arg in args]
    key_parts.extend([f"{k}={v}" for k, v in sorted(kwargs.items())])
    key_str = '|'.join(key_parts)
    key_hash = hashlib.md5(key_str.encode()).hexdigest()
    return f"{prefix}:{key_hash}"


class CacheGroup:
    """
    Tracks cache keys registered under a named group so they can be invalidated together.
    We maintain a set of keys in the cache itself.
    """
    @classmethod
    def _group_key(cls, group):
        return f"cache_group_keys:{group}"

    @classmethod
    def add(cls, group, key):
        """Adds a cache key to the specified group."""
        group_key = cls._group_key(group)
        keys = cache.get(group_key, set())
        keys.add(key)
        # Store with no timeout, so it only expires if evicted
        cache.set(group_key, keys, timeout=None)

    @classmethod
    def get_keys(cls, group):
        """Returns all keys registered under the group."""
        return cache.get(cls._group_key(group), set())

    @classmethod
    def clear(cls, group):
        """Clears the group's tracking record."""
        cache.delete(cls._group_key(group))


def invalidate_group(group):
    """
    Deletes all individual cache keys associated with the group and clears the group tracking.
    """
    keys = CacheGroup.get_keys(group)
    if keys:
        cache.delete_many(keys)
    CacheGroup.clear(group)


def cache_response(group, timeout=None):
    """
    Decorator to cache DRF ViewSet/APIView responses.
    - Checks cache before hitting DB
    - Caches successful GET responses
    - Registers the key under the given group
    """
    def decorator(func):
        @wraps(func)
        def wrapper(self, request, *args, **kwargs):
            # 1. Build cache key based on request params
            path = request.path
            user_id = str(request.user.id) if request.user.is_authenticated else 'anon'
            
            # Query params handling
            if hasattr(request, 'query_params'):
                query_string = request.query_params.urlencode()
            else:
                query_string = request.GET.urlencode()
                
            # Create a unique key for this request
            cache_key = make_cache_key(
                group, 
                path=path, 
                user_id=user_id, 
                query=query_string, 
                **kwargs
            )
            
            # 2. Check cache
            cached_data = cache.get(cache_key)
            if cached_data is not None:
                return Response(cached_data['data'], status=cached_data['status'])
                
            # 3. Call actual view
            response = func(self, request, *args, **kwargs)
            
            # 4. Cache successful responses
            if isinstance(response, Response) and response.status_code == 200:
                try:
                    cache_data = {
                        'data': response.data,
                        'status': response.status_code,
                    }
                    # Set cache
                    cache.set(cache_key, cache_data, timeout)
                    # Register key to group
                    CacheGroup.add(group, cache_key)
                except Exception:
                    pass
                    
            return response
        return wrapper
    return decorator
