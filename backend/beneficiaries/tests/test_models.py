import pytest
from datetime import date, datetime, timedelta
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.utils import timezone
from beneficiaries.models import (
    Beneficiary, Gender, BeneficiaryCategory, UrgencyLevel, GeographicRemoteness,
    WaitingPoolEntry, WaitingPoolStatus
)
from accounts.models import SocialWorker

User = get_user_model()


@pytest.fixture
def pregnant_beneficiary(db, social_worker_profile):
    """Create a pregnant beneficiary for testing."""
    return Beneficiary.objects.create(
        full_name='Jane Smith',
        date_of_birth=date(1990, 5, 15),
        gender=Gender.FEMALE,
        category=BeneficiaryCategory.MATERNAL,
        urgency_level=UrgencyLevel.URGENT,
        geographic_remoteness=GeographicRemoteness.HIGH,
        phone='256701234567',
        email='jane@example.com',
        region='Western Region',
        city='Fort Portal',
        address='Plot 42, Main Street',
        national_id_number='CM1234567890',
        digital_health_id='BEN-PREG-0001',
        emergency_contact_name='John Smith',
        emergency_contact_phone='256702345678',
        emergency_contact_relationship='Spouse',
        expected_delivery_date=date.today() + timedelta(days=30),
        income_verified=True,
        enrolled_by=social_worker_profile
    )


@pytest.mark.django_db
@pytest.mark.model
class TestBeneficiaryModel:
    """Test Beneficiary model."""

    def test_create_beneficiary_with_valid_data(self, social_worker_profile):
        """Test creating beneficiary with valid data."""
        beneficiary = Beneficiary.objects.create(
            full_name='John Doe',
            date_of_birth=date(1985, 3, 20),
            gender=Gender.MALE,
            category=BeneficiaryCategory.ELDERLY,
            phone='256701234567',
            region='Central Region',
            city='Kampala',
            address='Plot 10, Namirembe Road',
            national_id_number='CM9876543210',
            emergency_contact_name='Jane Doe',
            emergency_contact_phone='256702345678',
            emergency_contact_relationship='Sister',
            enrolled_by=social_worker_profile
        )
        assert beneficiary.full_name == 'John Doe'
        assert beneficiary.gender == Gender.MALE
        assert beneficiary.date_of_birth == date(1985, 3, 20)

    def test_beneficiary_digital_health_id_auto_generated(self, social_worker_profile):
        """Test that digital_health_id is auto-generated."""
        beneficiary1 = Beneficiary.objects.create(
            full_name='First Beneficiary',
            date_of_birth=date(1990, 1, 1),
            phone='256701111111',
            region='Region1',
            city='City1',
            address='Address1',
            national_id_number='ID1111111111',
            emergency_contact_name='Contact1',
            emergency_contact_phone='256702222222',
            emergency_contact_relationship='Friend',
            enrolled_by=social_worker_profile
        )
        
        beneficiary2 = Beneficiary.objects.create(
            full_name='Second Beneficiary',
            date_of_birth=date(1991, 1, 1),
            phone='256703333333',
            region='Region2',
            city='City2',
            address='Address2',
            national_id_number='ID2222222222',
            emergency_contact_name='Contact2',
            emergency_contact_phone='256704444444',
            emergency_contact_relationship='Friend',
            enrolled_by=social_worker_profile
        )
        
        assert beneficiary1.digital_health_id.startswith('BEN-')
        assert beneficiary2.digital_health_id.startswith('BEN-')
        assert beneficiary1.digital_health_id != beneficiary2.digital_health_id

    def test_national_id_uniqueness(self, social_worker_profile):
        """Test that national_id_number must be unique."""
        Beneficiary.objects.create(
            full_name='First',
            date_of_birth=date(1990, 1, 1),
            phone='256701111111',
            region='Region1',
            city='City1',
            address='Address1',
            national_id_number='CM1111111111',
            emergency_contact_name='Contact1',
            emergency_contact_phone='256702222222',
            emergency_contact_relationship='Friend',
            enrolled_by=social_worker_profile
        )
        
        with pytest.raises(Exception):  # IntegrityError
            Beneficiary.objects.create(
                full_name='Second',
                date_of_birth=date(1991, 1, 1),
                phone='256703333333',
                region='Region2',
                city='City2',
                address='Address2',
                national_id_number='CM1111111111',  # Duplicate
                emergency_contact_name='Contact2',
                emergency_contact_phone='256704444444',
                emergency_contact_relationship='Friend',
                enrolled_by=social_worker_profile
            )

    def test_beneficiary_timestamps(self, pregnant_beneficiary):
        """Test that created_at and updated_at are set."""
        assert pregnant_beneficiary.created_at is not None
        assert pregnant_beneficiary.updated_at is not None
        assert pregnant_beneficiary.created_at <= timezone.now()

    def test_beneficiary_string_representation(self, pregnant_beneficiary):
        """Test __str__ method."""
        expected = f"{pregnant_beneficiary.full_name} ({pregnant_beneficiary.digital_health_id})"
        assert str(pregnant_beneficiary) == expected

    def test_beneficiary_is_active_by_default(self, social_worker_profile):
        """Test that is_active defaults to True."""
        beneficiary = Beneficiary.objects.create(
            full_name='Test',
            date_of_birth=date(1990, 1, 1),
            phone='256701234567',
            region='Region',
            city='City',
            address='Address',
            national_id_number='CMTEST123456',
            emergency_contact_name='Contact',
            emergency_contact_phone='256702345678',
            emergency_contact_relationship='Friend',
            enrolled_by=social_worker_profile
        )
        assert beneficiary.is_active is True

    def test_beneficiary_language_preference_default(self, social_worker_profile):
        """Test that language_preference defaults to 'fr'."""
        beneficiary = Beneficiary.objects.create(
            full_name='Test',
            date_of_birth=date(1990, 1, 1),
            phone='256701234567',
            region='Region',
            city='City',
            address='Address',
            national_id_number='CMTEST123456',
            emergency_contact_name='Contact',
            emergency_contact_phone='256702345678',
            emergency_contact_relationship='Friend',
            enrolled_by=social_worker_profile
        )
        assert beneficiary.language_preference == 'fr'

    def test_beneficiary_gender_choices(self, social_worker_profile):
        """Test that gender choices are properly enforced."""
        for idx, gender in enumerate([Gender.MALE, Gender.FEMALE, Gender.OTHER], 1):
            beneficiary = Beneficiary.objects.create(
                full_name=f'Beneficiary {gender}',
                date_of_birth=date(1990, 1, 1),
                gender=gender,
                phone=f'256701{gender[:3].lower()}',
                region='Region',
                city='City',
                address='Address',
                national_id_number=f'CM{gender}{123456789}',
                digital_health_id=f'BEN-GENDER-{idx:04d}',
                emergency_contact_name='Contact',
                emergency_contact_phone='256702345678',
                emergency_contact_relationship='Friend',
                enrolled_by=social_worker_profile
            )
            assert beneficiary.gender == gender

    def test_beneficiary_category_choices(self, social_worker_profile):
        """Test that category choices are properly enforced."""
        for idx, category in enumerate([BeneficiaryCategory.MATERNAL, BeneficiaryCategory.ELDERLY, BeneficiaryCategory.OTHER], 1):
            beneficiary = Beneficiary.objects.create(
                full_name=f'Beneficiary {category}',
                date_of_birth=date(1990, 1, 1),
                category=category,
                phone=f'256701{category[:3].lower()}',
                region='Region',
                city='City',
                address='Address',
                national_id_number=f'CM{category}{123456789}',
                digital_health_id=f'BEN-CATEG-{idx:04d}',
                emergency_contact_name='Contact',
                emergency_contact_phone='256702345678',
                emergency_contact_relationship='Friend',
                enrolled_by=social_worker_profile
            )
            assert beneficiary.category == category

    def test_beneficiary_urgency_level_choices(self, social_worker_profile):
        """Test urgency level choices."""
        for idx, urgency in enumerate([UrgencyLevel.ROUTINE, UrgencyLevel.URGENT, UrgencyLevel.CRITICAL], 1):
            beneficiary = Beneficiary.objects.create(
                full_name=f'Beneficiary {urgency}',
                date_of_birth=date(1990, 1, 1),
                urgency_level=urgency,
                phone=f'256701{urgency[:3].lower()}',
                region='Region',
                city='City',
                address='Address',
                national_id_number=f'CM{urgency}{123456789}',
                digital_health_id=f'BEN-URGENCY-{idx:04d}',
                emergency_contact_name='Contact',
                emergency_contact_phone='256702345678',
                emergency_contact_relationship='Friend',
                enrolled_by=social_worker_profile
            )
            assert beneficiary.urgency_level == urgency

    def test_beneficiary_email_optional(self, social_worker_profile):
        """Test that email is optional."""
        beneficiary = Beneficiary.objects.create(
            full_name='No Email',
            date_of_birth=date(1990, 1, 1),
            phone='256701234567',
            region='Region',
            city='City',
            address='Address',
            national_id_number='CMNO_EMAIL_1',
            emergency_contact_name='Contact',
            emergency_contact_phone='256702345678',
            emergency_contact_relationship='Friend',
            enrolled_by=social_worker_profile
        )
        assert beneficiary.email is None

    def test_beneficiary_income_verified_default(self, social_worker_profile):
        """Test that income_verified defaults to False."""
        beneficiary = Beneficiary.objects.create(
            full_name='Test',
            date_of_birth=date(1990, 1, 1),
            phone='256701234567',
            region='Region',
            city='City',
            address='Address',
            national_id_number='CMTEST_INC001',
            emergency_contact_name='Contact',
            emergency_contact_phone='256702345678',
            emergency_contact_relationship='Friend',
            enrolled_by=social_worker_profile
        )
        assert beneficiary.income_verified is False


@pytest.mark.django_db
@pytest.mark.model
class TestWaitingPoolEntryModel:
    """Test WaitingPoolEntry model."""

    def test_create_waiting_pool_entry(self, pregnant_beneficiary):
        """Test creating waiting pool entry."""
        entry = WaitingPoolEntry.objects.create(
            beneficiary=pregnant_beneficiary,
            status=WaitingPoolStatus.ACTIVE,
            medical_urgency_score=Decimal('60'),
            gestational_age_score=Decimal('90'),
            geographic_score=Decimal('100'),
            waiting_time_score=Decimal('0'),
            final_score=Decimal('82.5')
        )
        assert entry.beneficiary == pregnant_beneficiary
        assert entry.status == WaitingPoolStatus.ACTIVE
        assert entry.final_score == Decimal('82.5')

    def test_waiting_pool_entry_one_to_one_relationship(self, pregnant_beneficiary):
        """Test that each beneficiary can have only one waiting pool entry."""
        entry1 = WaitingPoolEntry.objects.create(
            beneficiary=pregnant_beneficiary,
            status=WaitingPoolStatus.ACTIVE,
            final_score=Decimal('50')
        )
        
        with pytest.raises(Exception):  # IntegrityError
            WaitingPoolEntry.objects.create(
                beneficiary=pregnant_beneficiary,
                status=WaitingPoolStatus.ACTIVE,
                final_score=Decimal('75')
            )

    def test_waiting_pool_status_choices(self, pregnant_beneficiary):
        """Test waiting pool status choices."""
        for status in [WaitingPoolStatus.ACTIVE, WaitingPoolStatus.MATCHED, 
                       WaitingPoolStatus.FUNDED, WaitingPoolStatus.REMOVED]:
            entry = WaitingPoolEntry.objects.create(
                beneficiary=pregnant_beneficiary,
                status=status,
                final_score=Decimal('50')
            )
            assert entry.status == status
            entry.delete()  # Clean up for next iteration

    def test_waiting_pool_entry_default_values(self, pregnant_beneficiary):
        """Test default values for score components."""
        entry = WaitingPoolEntry.objects.create(
            beneficiary=pregnant_beneficiary
        )
        assert entry.medical_urgency_score == Decimal('0')
        assert entry.gestational_age_score == Decimal('0')
        assert entry.geographic_score == Decimal('0')
        assert entry.waiting_time_score == Decimal('0')
        assert entry.final_score == Decimal('0')

    def test_waiting_pool_entry_timestamps(self, pregnant_beneficiary):
        """Test timestamps on waiting pool entry."""
        entry = WaitingPoolEntry.objects.create(
            beneficiary=pregnant_beneficiary
        )
        assert entry.created_at is not None
        assert entry.score_updated_at is not None

    def test_waiting_pool_entry_matched_at_timestamp(self, pregnant_beneficiary):
        """Test matched_at timestamp can be set."""
        entry = WaitingPoolEntry.objects.create(
            beneficiary=pregnant_beneficiary
        )
        assert entry.matched_at is None
        
        entry.matched_at = timezone.now()
        entry.save()
        assert entry.matched_at is not None

    def test_waiting_pool_entry_string_representation(self, pregnant_beneficiary):
        """Test __str__ method."""
        entry = WaitingPoolEntry.objects.create(
            beneficiary=pregnant_beneficiary,
            final_score=Decimal('85.50')
        )
        expected = f"{pregnant_beneficiary.digital_health_id} — Score: {entry.final_score}"
        assert str(entry) == expected

    def test_waiting_pool_entry_ordering(self, social_worker_profile):
        """Test that entries are ordered by final_score descending."""
        benef1 = Beneficiary.objects.create(
            full_name='Low Priority',
            date_of_birth=date(1990, 1, 1),
            phone='256701111111',
            region='Region', city='City', address='Address',
            national_id_number='CM_LOW_0001',
            emergency_contact_name='Contact', emergency_contact_phone='256702222222',
            emergency_contact_relationship='Friend', enrolled_by=social_worker_profile
        )
        benef2 = Beneficiary.objects.create(
            full_name='High Priority',
            date_of_birth=date(1990, 1, 1),
            phone='256703333333',
            region='Region', city='City', address='Address',
            national_id_number='CM_HIGH_0001',
            emergency_contact_name='Contact', emergency_contact_phone='256704444444',
            emergency_contact_relationship='Friend', enrolled_by=social_worker_profile
        )
        
        WaitingPoolEntry.objects.create(
            beneficiary=benef1,
            final_score=Decimal('30')
        )
        WaitingPoolEntry.objects.create(
            beneficiary=benef2,
            final_score=Decimal('95')
        )
        
        entries = list(WaitingPoolEntry.objects.all())
        assert entries[0].final_score == Decimal('95')
        assert entries[1].final_score == Decimal('30')

    def test_compute_scores_medical_urgency(self, pregnant_beneficiary):
        """Test score computation for medical urgency."""
        entry = WaitingPoolEntry.objects.create(
            beneficiary=pregnant_beneficiary
        )
        entry.compute_scores()
        
        # Urgent medical case should get 60 points
        assert entry.medical_urgency_score == Decimal('60')

    def test_compute_scores_critical_urgency(self, social_worker_profile):
        """Test score computation for critical medical urgency."""
        beneficiary = Beneficiary.objects.create(
            full_name='Critical Case',
            date_of_birth=date(1990, 1, 1),
            urgency_level=UrgencyLevel.CRITICAL,
            phone='256701234567',
            region='Region', city='City', address='Address',
            national_id_number='CM_CRITICAL',
            emergency_contact_name='Contact', emergency_contact_phone='256702345678',
            emergency_contact_relationship='Friend', enrolled_by=social_worker_profile
        )
        entry = WaitingPoolEntry.objects.create(beneficiary=beneficiary)
        entry.compute_scores()
        
        # Critical case should get 100 points
        assert entry.medical_urgency_score == Decimal('100')

    def test_compute_scores_geographic_remoteness(self, pregnant_beneficiary):
        """Test score computation for geographic remoteness."""
        entry = WaitingPoolEntry.objects.create(
            beneficiary=pregnant_beneficiary
        )
        entry.compute_scores()
        
        # High remoteness should get 100 points
        assert entry.geographic_score == Decimal('100')

    def test_compute_scores_gestational_age(self, pregnant_beneficiary):
        """Test score computation for gestational age."""
        entry = WaitingPoolEntry.objects.create(
            beneficiary=pregnant_beneficiary
        )
        entry.compute_scores()
        
        # 30 days until delivery should get 90 points
        assert entry.gestational_age_score == Decimal('90')

    def test_compute_scores_waiting_time(self, pregnant_beneficiary):
        """Test score computation for waiting time."""
        # Create entry with past date
        past_date = timezone.now() - timedelta(days=50)
        WaitingPoolEntry.objects.filter(beneficiary=pregnant_beneficiary).delete()
        entry = WaitingPoolEntry.objects.create(
            beneficiary=pregnant_beneficiary,
            created_at=past_date
        )
        entry.compute_scores()
        
        # 50 days * 0.7 = 35 points
        expected_score = Decimal('50') * Decimal('0.7')
        assert entry.waiting_time_score == expected_score
