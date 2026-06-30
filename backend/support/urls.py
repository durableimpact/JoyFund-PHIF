from django.urls import path
from support.views import (
    SupportTicketListView,
    SupportTicketDetailView,
    SupportTicketCreateView,
    SupportTicketUpdateView,
    SupportTicketAssignView,
    SupportTicketStatusView,
    SupportTicketCloseView,
    SupportTicketEventsView,
    MyTicketsListView,
    TicketMessageListCreateView,
    TicketStatsView,
    TicketCategoriesView,
)

urlpatterns = [
    path("tickets/", SupportTicketListView.as_view(), name="ticket-list"),
    path("tickets/create/", SupportTicketCreateView.as_view(), name="ticket-create"),
    path("my-tickets/", MyTicketsListView.as_view(), name="my-tickets"),
    path("stats/", TicketStatsView.as_view(), name="ticket-stats"),
    path("categories/", TicketCategoriesView.as_view(), name="ticket-categories"),
    path("tickets/<uuid:pk>/", SupportTicketDetailView.as_view(), name="ticket-detail"),
    path("tickets/<uuid:pk>/update/", SupportTicketUpdateView.as_view(), name="ticket-update"),
    path("tickets/<uuid:pk>/assign/", SupportTicketAssignView.as_view(), name="ticket-assign"),
    path("tickets/<uuid:pk>/status/", SupportTicketStatusView.as_view(), name="ticket-status"),
    path("tickets/<uuid:pk>/close/", SupportTicketCloseView.as_view(), name="ticket-close"),
    path("tickets/<uuid:pk>/events/", SupportTicketEventsView.as_view(), name="ticket-events"),
    path("tickets/<uuid:pk>/messages/", TicketMessageListCreateView.as_view(), name="ticket-messages"),
]
