from .hospital import (
    HospitalCreateView,
    HospitalDeleteView,
    HospitalListView,
    HospitalRetrieveView,
    HospitalUpdateView,
)
from .service import (
    ServiceCreateView,
    ServiceDeleteView,
    ServiceListView,
    ServiceRetrieveView,
    ServiceUpdateView,
)

__all__ = [
    'HospitalCreateView',
    'HospitalListView',
    'HospitalRetrieveView',
    'HospitalUpdateView',
    'HospitalDeleteView',
    'ServiceCreateView',
    'ServiceListView',
    'ServiceRetrieveView',
    'ServiceUpdateView',
    'ServiceDeleteView',
]
