"""
Tests for ANC tracking system.
"""
from django.test import TestCase, Client
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from datetime import timedelta

from beneficiaries.models import Beneficiary
from accounts.models import User
from .models import ANCEnrollment, ANCVisit, MissedAppointmentAlert, ANCCompletionCertificate

User = get_user_model()


class ANCEnrollmentModelTest(TestCase):
    """Test ANC Enrollment model."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            email='social@test.com',
            password='testpass123',
            user_type=User.UserType.SOCIAL_WORKER
        )
        
        self.beneficiary = Beneficiary.objects.create(
            full_name='Test Beneficiary',
            phone='+256700000000',
            digital_health_id='DHI123456',
        )
    
    def test_create_enrollment(self):
        """Test creating ANC enrollment."""
        enrollment = ANCEnrollment.objects.create(
            beneficiary=self.beneficiary,
            social_worker=self.user,
            gestational_age_at_enrollment=16,
            expected_delivery_date=timezone.now().date() + timedelta(days=140),
            status=ANCEnrollment.Status.ACTIVE,
        )
        
        self.assertEqual(enrollment.beneficiary, self.beneficiary)
        self.assertEqual(enrollment.status, ANCEnrollment.Status.ACTIVE)
        self.assertIsNotNone(enrollment.enrollment_date)
    
    def test_completion_percentage(self):
        """Test enrollment completion percentage calculation."""
        enrollment = ANCEnrollment.objects.create(
            beneficiary=self.beneficiary,
            social_worker=self.user,
            gestational_age_at_enrollment=16,
            expected_delivery_date=timezone.now().date() + timedelta(days=140),
        )
        
        # Create 4 visits
        for i in range(1, 5):
            ANCVisit.objects.create(
                enrollment=enrollment,
                visit_number=i,
                scheduled_date=timezone.now().date() + timedelta(weeks=i*2),
            )
        
        # Initially all visits are scheduled (0% completion)
        self.assertEqual(enrollment.completion_percentage, 0)
        
        # Mark 2 visits as completed
        visits = enrollment.visits.all()[:2]
        for visit in visits:
            visit.status = ANCVisit.Status.COMPLETED
            visit.save()
        
        # Refresh and check
        enrollment.refresh_from_db()
        self.assertEqual(enrollment.completion_percentage, 50)


class ANCVisitModelTest(TestCase):
    """Test ANC Visit model."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            email='social@test.com',
            password='testpass123',
            user_type=User.UserType.SOCIAL_WORKER
        )
        
        self.beneficiary = Beneficiary.objects.create(
            full_name='Test Beneficiary',
            phone='+256700000000',
            digital_health_id='DHI123456',
        )
        
        self.enrollment = ANCEnrollment.objects.create(
            beneficiary=self.beneficiary,
            social_worker=self.user,
            gestational_age_at_enrollment=16,
            expected_delivery_date=timezone.now().date() + timedelta(days=140),
        )
    
    def test_create_visit(self):
        """Test creating ANC visit."""
        visit = ANCVisit.objects.create(
            enrollment=self.enrollment,
            visit_number=1,
            scheduled_date=timezone.now().date() + timedelta(days=14),
        )
        
        self.assertEqual(visit.enrollment, self.enrollment)
        self.assertEqual(visit.status, ANCVisit.Status.SCHEDULED)
        self.assertEqual(visit.visit_number, 1)
    
    def test_visit_with_clinical_data(self):
        """Test visit with clinical data."""
        visit = ANCVisit.objects.create(
            enrollment=self.enrollment,
            visit_number=2,
            scheduled_date=timezone.now().date() + timedelta(days=42),
            status=ANCVisit.Status.COMPLETED,
            actual_date=timezone.now().date(),
            weight_kg=65.5,
            blood_pressure='120/80',
            hemoglobin_level=12.5,
            clinical_notes='Patient in good health',
        )
        
        self.assertEqual(visit.weight_kg, 65.5)
        self.assertEqual(visit.blood_pressure, '120/80')
        self.assertEqual(visit.hemoglobin_level, 12.5)
        self.assertFalse(visit.complications_noted)


class MissedAppointmentAlertTest(TestCase):
    """Test Missed Appointment Alert model."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            email='social@test.com',
            password='testpass123',
            user_type=User.UserType.SOCIAL_WORKER
        )
        
        self.beneficiary = Beneficiary.objects.create(
            full_name='Test Beneficiary',
            phone='+256700000000',
            digital_health_id='DHI123456',
        )
        
        self.enrollment = ANCEnrollment.objects.create(
            beneficiary=self.beneficiary,
            social_worker=self.user,
            gestational_age_at_enrollment=16,
            expected_delivery_date=timezone.now().date() + timedelta(days=140),
        )
        
        self.visit = ANCVisit.objects.create(
            enrollment=self.enrollment,
            visit_number=1,
            scheduled_date=timezone.now().date() - timedelta(days=7),
        )
    
    def test_create_alert(self):
        """Test creating missed appointment alert."""
        alert = MissedAppointmentAlert.objects.create(
            enrollment=self.enrollment,
            visit=self.visit,
            missed_date=self.visit.scheduled_date,
            status=MissedAppointmentAlert.AlertStatus.ACTIVE,
        )
        
        self.assertEqual(alert.enrollment, self.enrollment)
        self.assertEqual(alert.status, MissedAppointmentAlert.AlertStatus.ACTIVE)
        self.assertIsNotNone(alert.alert_sent_at)


class ANCEnrollmentAPITest(APITestCase):
    """Test ANC Enrollment API endpoints."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            email='social@test.com',
            password='testpass123',
            user_type=User.UserType.SOCIAL_WORKER
        )
        
        self.client.force_authenticate(user=self.user)
        
        self.beneficiary = Beneficiary.objects.create(
            full_name='Test Beneficiary',
            phone='+256700000000',
            digital_health_id='DHI123456',
        )
    
    def test_list_enrollments(self):
        """Test listing ANC enrollments."""
        # Create test enrollment
        ANCEnrollment.objects.create(
            beneficiary=self.beneficiary,
            social_worker=self.user,
            gestational_age_at_enrollment=16,
            expected_delivery_date=timezone.now().date() + timedelta(days=140),
        )
        
        response = self.client.get('/api/anc/enrollments/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data['results']), 0)
    
    def test_create_enrollment(self):
        """Test creating ANC enrollment via API."""
        data = {
            'beneficiary_id': self.beneficiary.id,
            'gestational_age_at_enrollment': 16,
            'expected_delivery_date': (timezone.now().date() + timedelta(days=140)).isoformat(),
            'high_risk': False,
        }
        
        response = self.client.post('/api/anc/enrollments/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ANCEnrollment.objects.count(), 1)
    
    def test_get_enrollment_progress(self):
        """Test getting enrollment progress."""
        enrollment = ANCEnrollment.objects.create(
            beneficiary=self.beneficiary,
            social_worker=self.user,
            gestational_age_at_enrollment=16,
            expected_delivery_date=timezone.now().date() + timedelta(days=140),
        )
        
        response = self.client.get(f'/api/anc/enrollments/{enrollment.id}/get_progress/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('completion_percentage', response.data)
        self.assertIn('visits', response.data)


class ANCVisitAPITest(APITestCase):
    """Test ANC Visit API endpoints."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            email='social@test.com',
            password='testpass123',
            user_type=User.UserType.SOCIAL_WORKER
        )
        
        self.client.force_authenticate(user=self.user)
        
        self.beneficiary = Beneficiary.objects.create(
            full_name='Test Beneficiary',
            phone='+256700000000',
            digital_health_id='DHI123456',
        )
        
        self.enrollment = ANCEnrollment.objects.create(
            beneficiary=self.beneficiary,
            social_worker=self.user,
            gestational_age_at_enrollment=16,
            expected_delivery_date=timezone.now().date() + timedelta(days=140),
        )
    
    def test_list_visits(self):
        """Test listing ANC visits."""
        # Create test visit
        ANCVisit.objects.create(
            enrollment=self.enrollment,
            visit_number=1,
            scheduled_date=timezone.now().date() + timedelta(days=14),
        )
        
        response = self.client.get('/api/anc/visits/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data['results']), 0)
    
    def test_mark_visit_completed(self):
        """Test marking visit as completed."""
        visit = ANCVisit.objects.create(
            enrollment=self.enrollment,
            visit_number=1,
            scheduled_date=timezone.now().date() + timedelta(days=14),
        )
        
        data = {
            'actual_date': timezone.now().date().isoformat(),
            'weight_kg': 65.5,
            'blood_pressure': '120/80',
            'hemoglobin_level': 12.5,
            'clinical_notes': 'Good health',
        }
        
        response = self.client.post(
            f'/api/anc/visits/{visit.id}/mark_completed/',
            data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        visit.refresh_from_db()
        self.assertEqual(visit.status, ANCVisit.Status.COMPLETED)
