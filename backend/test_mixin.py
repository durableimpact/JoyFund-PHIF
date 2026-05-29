def _cached_action(self, action_func, request, *args, **kwargs):
    if not self.cache_group:
        return action_func(request, *args, **kwargs)
        
    path = request.path
    user_id = str(request.user.id) if request.user.is_authenticated else 'anon'
    query_string = request.query_params.urlencode() if hasattr(request, 'query_params') else request.GET.urlencode()
    
    from core.cache import make_cache_key, CacheGroup
    from django.core.cache import cache
    from rest_framework.response import Response
    
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
            cache.set(cache_key, {
                'data': response.data,
                'status': response.status_code
            }, timeout=getattr(self, 'cache_timeout', None))
            CacheGroup.add(self.cache_group, cache_key)
        except Exception:
            pass
            
    return response
