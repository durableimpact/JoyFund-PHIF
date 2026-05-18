import pytest
from rest_framework import status
from rest_framework.test import APIClient
from beneficiaries.models import HealthIssue, HealthIssueEvent, HealthIssueStatus, Beneficiary
from django.urls import reverse

@pytest.fixture
def system_admin_profile(db, system_admin_user):
    """Override conftest's system_admin_profile to handle get_or_create gracefully."""
    from accounts.models import SystemAdmin
    admin_profile, created = SystemAdmin.objects.get_or_create(
        user=system_admin_user,
    )
    return admin_profile

@pytest.fixture
def social_worker_client(db, social_worker_profile):
    """Create a DRF APIClient authenticated as the social worker."""
    client = APIClient()
    client.force_authenticate(user=social_worker_profile.user)
    return client

@pytest.fixture
def admin_client(db, system_admin_user):
    """Create a DRF APIClient authenticated as the system admin."""
    client = APIClient()
    client.force_authenticate(user=system_admin_user)
    return client

@pytest.fixture
def beneficiary_instance(db, social_worker_profile):
    from datetime import date
    from beneficiaries.models import Beneficiary, Gender, BeneficiaryCategory
    return Beneficiary.objects.create(
        full_name='Jane Smith',
        date_of_birth=date(1990, 5, 15),
        gender=Gender.FEMALE,
        category=BeneficiaryCategory.MATERNAL,
        phone='256701234567',
        email='jane@example.com',
        region='Western Region',
        city='Fort Portal',
        address='Plot 42, Main Street',
        national_id_number='CM1234567890',
        emergency_contact_name='John Smith',
        emergency_contact_phone='256702345678',
        emergency_contact_relationship='Spouse',
        enrolled_by=social_worker_profile
    )

@pytest.fixture
def health_issue_instance(db, beneficiary_instance, social_worker_profile):
    return HealthIssue.objects.create(
        beneficiary=beneficiary_instance,
        social_worker=social_worker_profile,
        category="MATERNAL",
        severity="MEDIUM",
        status=HealthIssueStatus.REPORTED,
        description="Severe morning sickness"
    )

@pytest.mark.django_db
@pytest.mark.api
class TestHealthIssueEventTracking:

    def test_create_health_issue_tracks_event(self, social_worker_client, beneficiary_instance, social_worker_user):
        """Test that creating a health issue logs a REPORTED event."""
        url = reverse('beneficiaries:health-issue-list-create')
        data = {
            'beneficiary': str(beneficiary_instance.id),
            'category': 'MATERNAL',
            'severity': 'MEDIUM',
            'description': 'Frequent headaches and nausea',
        }
        
        response = social_worker_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        
        health_issue = HealthIssue.objects.get(id=response.data['id'])
        assert health_issue.status == HealthIssueStatus.REPORTED
        
        events = HealthIssueEvent.objects.filter(health_issue=health_issue)
        assert events.count() == 1
        event = events.first()
        assert event.status == HealthIssueStatus.REPORTED
        assert event.changed_by == social_worker_user
        assert "reported" in event.notes.lower()

    def test_update_health_issue_status_tracks_event(self, admin_client, health_issue_instance, system_admin_user):
        """Test that updating status via PUT/PATCH logs an event."""
        url = reverse('beneficiaries:health-issue-detail', kwargs={'id': health_issue_instance.id})
        data = {
            'status': 'WAITING',
        }
        
        response = admin_client.patch(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        
        health_issue_instance.refresh_from_db()
        assert health_issue_instance.status == HealthIssueStatus.WAITING
        
        events = HealthIssueEvent.objects.filter(health_issue=health_issue_instance)
        assert events.count() == 1
        event = events.first()
        assert event.status == HealthIssueStatus.WAITING
        assert event.changed_by == system_admin_user
        assert "status updated from REPORTED to WAITING" in event.notes

    def test_verify_health_issue_tracks_event(self, admin_client, health_issue_instance, system_admin_user):
        """Test that verifying a health issue logs a VALIDATED event."""
        url = reverse('beneficiaries:health-issue-verify', kwargs={'id': health_issue_instance.id})
        
        response = admin_client.post(url, format='json')
        assert response.status_code == status.HTTP_200_OK
        
        health_issue_instance.refresh_from_db()
        assert health_issue_instance.status == HealthIssueStatus.VALIDATED
        assert health_issue_instance.validated_by == system_admin_user.systemadmin
        
        events = HealthIssueEvent.objects.filter(health_issue=health_issue_instance)
        assert events.count() == 1
        event = events.first()
        assert event.status == HealthIssueStatus.VALIDATED
        assert event.changed_by == system_admin_user
        assert "verified and validated" in event.notes.lower()

    def test_reject_health_issue_tracks_event(self, admin_client, health_issue_instance, system_admin_user):
        """Test that rejecting a health issue logs a REJECTED event."""
        url = reverse('beneficiaries:health-issue-reject', kwargs={'id': health_issue_instance.id})
        data = {
            'rejection_reason': 'Patient has insurance coverage elsewhere.',
        }
        
        response = admin_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        
        health_issue_instance.refresh_from_db()
        assert health_issue_instance.status == HealthIssueStatus.REJECTED
        assert health_issue_instance.rejection_reason == data['rejection_reason']
        assert health_issue_instance.validated_by == system_admin_user.systemadmin
        
        events = HealthIssueEvent.objects.filter(health_issue=health_issue_instance)
        assert events.count() == 1
        event = events.first()
        assert event.status == HealthIssueStatus.REJECTED
        assert event.changed_by == system_admin_user
        assert "rejected" in event.notes.lower()
        assert data['rejection_reason'] in event.notes

    def test_legacy_status_action_validate_tracks_event(self, admin_client, health_issue_instance, system_admin_user):
        """Test that validating via legacy action endpoint logs an event."""
        url = reverse('beneficiaries:health-issue-status-action', kwargs={'id': health_issue_instance.id, 'action': 'validate'})
        
        response = admin_client.post(url, format='json')
        assert response.status_code == status.HTTP_200_OK
        
        health_issue_instance.refresh_from_db()
        assert health_issue_instance.status == HealthIssueStatus.VALIDATED
        
        events = HealthIssueEvent.objects.filter(health_issue=health_issue_instance)
        assert events.count() == 1
        event = events.first()
        assert event.status == HealthIssueStatus.VALIDATED
        assert event.changed_by == system_admin_user
        assert "validated" in event.notes.lower()

    def test_legacy_status_action_reject_tracks_event(self, admin_client, health_issue_instance, system_admin_user):
        """Test that rejecting via legacy action endpoint logs an event."""
        url = reverse('beneficiaries:health-issue-status-action', kwargs={'id': health_issue_instance.id, 'action': 'reject'})
        
        response = admin_client.post(url, format='json')
        assert response.status_code == status.HTTP_200_OK
        
        health_issue_instance.refresh_from_db()
        assert health_issue_instance.status == HealthIssueStatus.REJECTED
        
        events = HealthIssueEvent.objects.filter(health_issue=health_issue_instance)
        assert events.count() == 1
        event = events.first()
        assert event.status == HealthIssueStatus.REJECTED
        assert event.changed_by == system_admin_user
        assert "rejected" in event.notes.lower()
