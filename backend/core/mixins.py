import logging
from django.core.cache import cache
from rest_framework.response import Response
from core.cache import invalidate_group, make_cache_key, CacheGroup

logger = logging.getLogger(__name__)

class CacheInvalidationMixin:
    """
    Mixin for DRF ViewSets/APIViews to automatically cache list/retrieve and invalidate caches on modifications.
    Requires a `cache_group` attribute defined on the subclass.
    """
    cache_group = None

    def _invalidate_cache(self):
        """Helper to invalidate the cache group and log a debug message."""
        if self.cache_group:
            logger.debug(f"Invalidating cache group: {self.cache_group}")
            invalidate_group(self.cache_group)

    def _cached_action(self, action_func, request, *args, **kwargs):
        if not self.cache_group:
            return action_func(request, *args, **kwargs)
            
        path = request.path
        user_id = str(request.user.id) if request.user.is_authenticated else 'anon'
        
        if hasattr(request, 'query_params'):
            query_string = request.query_params.urlencode()
        else:
            query_string = request.GET.urlencode()
            
        cache_key = make_cache_key(
            self.cache_group,
            path=path,
            user_id=user_id,
            query=query_string,
            **kwargs
        )
        
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return Response(cached_data['data'], status=cached_data['status'])
            
        response = action_func(request, *args, **kwargs)
        
        if isinstance(response, Response) and response.status_code == 200:
            try:
                cache_data = {
                    'data': response.data,
                    'status': response.status_code,
                }
                timeout = getattr(self, 'cache_timeout', None)
                cache.set(cache_key, cache_data, timeout)
                CacheGroup.add(self.cache_group, cache_key)
            except Exception as e:
                logger.error(f"Cache set error: {str(e)}")
                
        return response

    def list(self, request, *args, **kwargs):
        if hasattr(super(), 'list'):
            return self._cached_action(super().list, request, *args, **kwargs)
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        if hasattr(super(), 'retrieve'):
            return self._cached_action(super().retrieve, request, *args, **kwargs)
        return super().retrieve(request, *args, **kwargs)

    def perform_create(self, serializer):
        if hasattr(super(), 'perform_create'):
            super().perform_create(serializer)
        self._invalidate_cache()

    def perform_update(self, serializer):
        if hasattr(super(), 'perform_update'):
            super().perform_update(serializer)
        self._invalidate_cache()

    def perform_destroy(self, instance):
        if hasattr(super(), 'perform_destroy'):
            super().perform_destroy(instance)
        self._invalidate_cache()
