import hashlib
from functools import wraps
from django.core.cache import cache
from rest_framework.response import Response


def cache_response(timeout=5 * 60, key_func=None, key_prefix=None):
    """
    Decorator to cache view responses based on request parameters.
    
    Automatically generates cache keys that include:
    - Request path
    - HTTP method
    - Authenticated user ID
    - Query parameters (filters, search, pagination, ordering)
    - Lookup kwargs (e.g., id, pk)
    
    Args:
        timeout: Cache timeout in seconds (default: 5 minutes)
        key_func: Optional callable to generate custom cache key.
                 Signature: key_func(request, *args, **kwargs) -> str
        key_prefix: Optional human-readable prefix for the cache key.
                   When provided, the key becomes 'view_cache:{prefix}:{hash}'.
                   This allows @invalidate_cache to delete all keys with that prefix
                   using Redis pattern matching.
    
    Example:
        @cache_response(timeout=10 * 60)
        def get(self, request, *args, **kwargs):
            return super().get(request, *args, **kwargs)
    
    With key_prefix (recommended for list views):
        @cache_response(timeout=5 * 60, key_prefix='donor_list')
        def get(self, request, *args, **kwargs):
            return super().get(request, *args, **kwargs)
    """
    def decorator(func):
        @wraps(func)
        def wrapper(self, request, *args, **kwargs):
            # Generate cache key
            if key_func:
                cache_key = key_func(request, *args, **kwargs)
            else:
                hash_key = _generate_cache_key(request, *args, **kwargs)
                if key_prefix:
                    cache_key = f"view_cache:{key_prefix}:{hash_key}"
                else:
                    cache_key = hash_key
            
            # Try to get from cache
            cached_data = cache.get(cache_key)
            if cached_data is not None:
                return Response(cached_data['data'], status=cached_data['status'])
            
            # Call the actual view
            response = func(self, request, *args, **kwargs)
            
            # Cache the response data only if it's successful
            if isinstance(response, Response) and response.status_code == 200:
                try:
                    cache_data = {
                        'data': response.data,
                        'status': response.status_code,
                    }
                    cache.set(cache_key, cache_data, timeout)
                except Exception:
                    pass
            
            return response
        
        return wrapper
    return decorator


def invalidate_cache(*prefixes):
    """
    Decorator to invalidate cached responses by key prefix after a view execution.
    Uses Redis pattern matching (delete_pattern) to remove all cache entries
    whose keys start with 'view_cache:{prefix}:*'.
    
    Args:
        *prefixes: Variable number of cache key prefixes to invalidate.
                   These must match the key_prefix passed to @cache_response.
    
    Example:
        @invalidate_cache('donor_list')
        def post(self, request, *args, **kwargs):
            return super().post(request, *args, **kwargs)
    """
    def decorator(func):
        @wraps(func)
        def wrapper(self, request, *args, **kwargs):
            response = func(self, request, *args, **kwargs)
            
            for prefix in prefixes:
                pattern = f"view_cache:{prefix}:*"
                try:
                    cache.delete_pattern(pattern)
                except AttributeError:
                    # Fallback: delete the exact prefix key (no wildcard match)
                    cache.delete(f"view_cache:{prefix}")
            
            return response
        
        return wrapper
    return decorator


def _generate_cache_key(request, *args, **kwargs):
    """
    Generate a unique cache key based on request characteristics.
    Includes path, method, user, query params, and lookup kwargs.
    
    Examples:
        GET /api/accounts/donors/?search=john&ordering=-created_at
        -> view_cache:hash_of_all_components
        
        GET /api/accounts/donors/123/
        -> view_cache:hash_of_path_method_user_id=123
    """
    # Build key components
    path = request.path
    method = request.method
    user_id = str(request.user.id) if request.user.is_authenticated else 'anon'
    
    # Include query parameters (filters, search, pagination, ordering)
    # Handle both Django request.GET and DRF request.query_params
    if hasattr(request, 'query_params'):
        query_string = request.query_params.urlencode() if request.query_params else ''
    else:
        query_string = request.GET.urlencode() if request.GET else ''
    
    # Include lookup kwargs (e.g., id, pk)
    lookup_parts = [f"{k}={v}" for k, v in sorted(kwargs.items())]
    lookup_string = '&'.join(lookup_parts) if lookup_parts else ''
    
    # Combine all components
    key_parts = [path, method, f"user={user_id}", query_string, lookup_string]
    key_str = '|'.join(p for p in key_parts if p)
    
    # Hash to keep key length reasonable (max 250 chars for Redis)
    key_hash = hashlib.md5(key_str.encode()).hexdigest()
    
    return f"view_cache:{key_hash}"


def make_cache_key(view_name, *parts):
    """
    Simple helper to generate consistent cache keys for manual caching.
    
    Args:
        view_name: Name of the view (e.g., 'donor_list', 'social_worker_detail')
        *parts: Additional key components (e.g., IDs, filters)
    
    Returns:
        str: Cache key in format 'view_name:part1:part2:...'
    
    Examples:
        make_cache_key('donor_list')
        make_cache_key('donor_detail', donor_id)
        make_cache_key('donor_by_email', email)
    """
    key_parts = [view_name] + [str(p) for p in parts]
    return ':'.join(key_parts)
