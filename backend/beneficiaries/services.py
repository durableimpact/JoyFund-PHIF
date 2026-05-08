from typing import Literal
from beneficiaries.models.health_issue import HealthIssue, HealthIssueStatus
from django.db import transaction

HealthIssueStatusType = Literal[
    'REPORTED',
    'VALIDATED',
    'WAITING',
    'ASSIGNED',
    'IN_TREATMENT',
    'RESOLVED',
    'REJECTED'
]

@transaction.atomic
def update_health_issue_status(
    health_issue_id: int,
    new_status: HealthIssueStatusType
) -> HealthIssue:
    """
    Update the status of a health issue.
    
    Args:
        health_issue_id: ID of the HealthIssue to update
        new_status: New status value from HealthIssueStatus choices
        
    Returns:
        Updated HealthIssue instance
        
    Raises:
        HealthIssue.DoesNotExist: If health issue with given ID doesn't exist
        ValueError: If new_status is not a valid HealthIssueStatus choice
    """
    try:
        health_issue = HealthIssue.objects.select_for_update().get(id=health_issue_id)
    except HealthIssue.DoesNotExist:
        raise HealthIssue.DoesNotExist(f"HealthIssue with id {health_issue_id} does not exist")

    # Validate that new_status is a valid choice
    valid_statuses = [choice[0] for choice in HealthIssueStatus.choices]
    if new_status not in valid_statuses:
        raise ValueError(f"Invalid status '{new_status}'. Must be one of: {valid_statuses}")

    health_issue.status = new_status
    health_issue.save()
    
    return health_issue

