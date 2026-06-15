"""
Seeding utilities for populating test data across the application.

This module provides reusable factories and helper functions for creating
test data in a consistent way.
"""

from decimal import Decimal
from datetime import datetime, timedelta
import random
from typing import Optional, Dict, Any, List

from django.contrib.gis.geos import Point
from django.utils import timezone

from accounts.models import User, Role
from accounts.models.system_admin import SystemAdmin
from accounts.models.hospital_admin import HospitalAdmin
from accounts.models.receptionist import Receptionist
from accounts.models.social_worker import SocialWorker
from accounts.models.donor import Donor
from hospitals.models import Hospital, PartnershipStatus, Services
from beneficiaries.models import Beneficiary, HealthIssue
from campaigns.models import Campaign, Donation
from vouchers.models import Voucher, VoucherFunding


class UserFactory:
    """Factory for creating users with specific roles."""

    @staticmethod
    def create_user(
        email: str,
        first_name: str = 'Test',
        last_name: str = 'User',
        role: str = Role.DONOR,
        password: str = 'password',
        is_verified: bool = True,
        is_active: bool = True,
        phone_number: Optional[str] = None,
        **kwargs,
    ) -> tuple[User, bool]:
        """
        Create or get a user with the specified parameters.
        
        Returns:
            Tuple of (User, created) where created is True if user was newly created.
        """
        if not phone_number:
            phone_number = f'+237{random.randint(600000000, 699999999)}'

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'first_name': first_name,
                'last_name': last_name,
                'phone_number': phone_number,
                'role': role,
                'is_active': is_active,
                'is_verified': is_verified,
                **kwargs,
            },
        )

        if created:
            user.set_password(password)
            user.save()

        return user, created

    @staticmethod
    def create_donor(email: str, first_name: str = 'Donor', last_name: str = 'Test') -> tuple[Donor, bool]:
        """Create or get a donor user."""
        user, created = UserFactory.create_user(
            email=email,
            first_name=first_name,
            last_name=last_name,
            role=Role.DONOR,
        )
        donor, donor_created = Donor.objects.get_or_create(user=user)
        return donor, created or donor_created

    @staticmethod
    def create_social_worker(
        email: str,
        first_name: str = 'Social',
        last_name: str = 'Worker',
        region: str = 'Littoral',
        system_admin: Optional[SystemAdmin] = None,
    ) -> tuple[SocialWorker, bool]:
        """Create or get a social worker user."""
        if not system_admin:
            system_admin = SystemAdmin.objects.first()
            if not system_admin:
                raise ValueError('System admin must exist or be provided')

        user, created = UserFactory.create_user(
            email=email,
            first_name=first_name,
            last_name=last_name,
            role=Role.SOCIAL_WORKER,
        )

        sw, sw_created = SocialWorker.objects.get_or_create(
            user=user,
            defaults={
                'is_approved': True,
                'organization': 'Red Cross Cameroon',
                'region_assigned': region,
                'enrolled_by': system_admin,
            },
        )
        return sw, created or sw_created

    @staticmethod
    def create_hospital_admin(
        hospital: Hospital,
        email: str,
        system_admin: Optional[SystemAdmin] = None,
    ) -> tuple[HospitalAdmin, bool]:
        """Create or get a hospital admin user."""
        if not system_admin:
            system_admin = SystemAdmin.objects.first()
            if not system_admin:
                raise ValueError('System admin must exist or be provided')

        user, created = UserFactory.create_user(
            email=email,
            first_name=f'{hospital.name}',
            last_name='Admin',
            role=Role.HOSPITAL_ADMIN,
        )

        hosp_admin, admin_created = HospitalAdmin.objects.get_or_create(
            user=user,
            hospital=hospital,
            defaults={'enrolled_by': system_admin},
        )
        return hosp_admin, created or admin_created

    @staticmethod
    def create_receptionist(
        hospital: Hospital,
        email: str,
        hospital_admin: Optional[HospitalAdmin] = None,
    ) -> tuple[Receptionist, bool]:
        """Create or get a receptionist user."""
        if not hospital_admin:
            hospital_admin = HospitalAdmin.objects.filter(hospital=hospital).first()
            if not hospital_admin:
                raise ValueError('Hospital admin must exist or be provided')

        user, created = UserFactory.create_user(
            email=email,
            first_name='Receptionist',
            last_name=hospital.name.split()[0],
            role=Role.RECEPTIONIST,
        )

        receptionist, rec_created = Receptionist.objects.get_or_create(
            user=user,
            hospital=hospital,
            defaults={'enrolled_by': hospital_admin},
        )
        return receptionist, created or rec_created


class HospitalFactory:
    """Factory for creating hospitals with services."""

    @staticmethod
    def create_hospital(
        name: str,
        email: str,
        region: str,
        city: str,
        coordinates: Optional[Point] = None,
        services: Optional[List[str]] = None,
        **kwargs,
    ) -> tuple[Hospital, bool]:
        """
        Create or get a hospital with optional services.
        
        Returns:
            Tuple of (Hospital, created) where created is True if hospital was newly created.
        """
        if not coordinates:
            # Random coordinates in Cameroon
            coordinates = Point(
                random.uniform(8.0, 16.0),
                random.uniform(1.0, 13.0),
            )

        hospital, created = Hospital.objects.get_or_create(
            email=email,
            defaults={
                'name': name,
                'region': region,
                'city': city,
                'address': f'{random.randint(100, 999)} {city} Street',
                'gps_coordinates': coordinates,
                'phone_number': f'+237{random.randint(600000000, 699999999)}',
                'partnership_status': PartnershipStatus.ACTIVE,
                'is_active': True,
                'accreditation_number': f'ACC-{random.randint(100000, 999999)}',
                'licence_number': f'LIC-{random.randint(100000, 999999)}',
                **kwargs,
            },
        )

        if created and services:
            for service_name in services:
                Services.objects.get_or_create(
                    hospital=hospital,
                    name=service_name,
                    defaults={
                        'price': Decimal(random.randint(5000, 50000)),
                        'description': f'{service_name} at {hospital.name}',
                    },
                )

        return hospital, created


class BeneficiaryFactory:
    """Factory for creating beneficiaries and health issues."""

    @staticmethod
    def create_beneficiary(
        full_name: str,
        social_worker: SocialWorker,
        phone: Optional[str] = None,
        date_of_birth: Optional[datetime] = None,
        **kwargs,
    ) -> tuple[Beneficiary, bool]:
        """Create or get a beneficiary."""
        if not phone:
            phone = f'+237{random.randint(600000000, 699999999)}'

        if not date_of_birth:
            # Random age between 18-80
            date_of_birth = timezone.now().date() - timedelta(days=random.randint(365 * 18, 365 * 80))

        beneficiary, created = Beneficiary.objects.get_or_create(
            phone=phone,
            defaults={
                'full_name': full_name,
                'enrolled_by': social_worker,
                'date_of_birth': date_of_birth,
                'gender': random.choice(['MALE', 'FEMALE']),
                'region': social_worker.region_assigned or 'Littoral',
                'city': random.choice(['Douala', 'Yaoundé', 'Garoua', 'Limbe', 'Buea']),
                'address': f'{random.randint(1, 999)} Main Street',
                'national_id_number': f'NID-{random.randint(100000, 999999)}',
                'emergency_contact_name': 'Emergency Contact',
                'emergency_contact_phone': f'+237{random.randint(600000000, 699999999)}',
                'emergency_contact_relationship': 'Family',
                **kwargs,
            },
        )
        return beneficiary, created

    @staticmethod
    def create_health_issue(
        beneficiary: Beneficiary,
        issue: str,
        social_worker: SocialWorker,
        description: Optional[str] = None,
    ) -> tuple[HealthIssue, bool]:
        """Create or get a health issue for a beneficiary."""
        if not description:
            description = f'{issue} diagnosis for {beneficiary.first_name}'

        health_issue, created = HealthIssue.objects.get_or_create(
            beneficiary=beneficiary,
            issue=issue,
            defaults={
                'enrolled_by': social_worker,
                'description': description,
            },
        )
        return health_issue, created


class CampaignFactory:
    """Factory for creating campaigns, donations, and vouchers."""

    @staticmethod
    def create_campaign(
        title: str,
        donor: Donor,
        beneficiary: Beneficiary,
        goal_amount: Decimal = Decimal(200000),
        description: Optional[str] = None,
        **kwargs,
    ) -> tuple[Campaign, bool]:
        """Create or get a campaign."""
        if not description:
            description = f'Medical campaign to support {beneficiary.first_name}\'s treatment'

        campaign, created = Campaign.objects.get_or_create(
            title=title,
            beneficiary=beneficiary,
            defaults={
                'donor': donor,
                'description': description,
                'goal_amount': goal_amount,
                'current_amount': Decimal(0),
                'status': Campaign.CampaignStatus.ACTIVE,
                'media': [],
                **kwargs,
            },
        )
        return campaign, created

    @staticmethod
    def create_donation(
        campaign: Campaign,
        donor: Donor,
        amount: Decimal = Decimal(50000),
    ) -> tuple[Donation, bool]:
        """Create or get a donation."""
        from payments.models import FeePolicy
        policy = FeePolicy.objects.filter(is_active=True).first()
        platform_pct = policy.platform_fee_percentage if policy else Decimal('5.00')
        escrow_pct = policy.escrow_fee_percentage if policy else Decimal('95.00')
        platform_fee = (amount * platform_pct / Decimal('100')).quantize(Decimal('0.01'))
        net_amount = (amount * escrow_pct / Decimal('100')).quantize(Decimal('0.01'))

        donation, created = Donation.objects.get_or_create(
            campaign=campaign,
            donor=donor,
            amount=amount,
            defaults={
                'status': 'SUCCESS',
                'platform_fee_amount': platform_fee,
                'net_amount': net_amount,
            },
        )

        if created:
            # Update campaign current amount
            campaign.current_amount += net_amount
            campaign.save()

        return donation, created

    @staticmethod
    def create_voucher(
        beneficiary: Beneficiary,
        health_issue: HealthIssue,
        hospital: Hospital,
    ) -> tuple[Voucher, bool]:
        """Create or get a voucher."""
        voucher, created = Voucher.objects.get_or_create(
            beneficiary=beneficiary,
            health_issue=health_issue,
            hospital=hospital,
            defaults={
                'status': Voucher.Status.AVAILABLE,
            },
        )
        return voucher, created

    @staticmethod
    def fund_voucher(
        voucher: Voucher,
        campaign: Campaign,
        committed_amount: Decimal = Decimal(100000),
    ) -> tuple[VoucherFunding, bool]:
        """Link a voucher to campaign funding."""
        voucher_funding, created = VoucherFunding.objects.get_or_create(
            voucher=voucher,
            campaign=campaign,
            defaults={
                'committed_amount': committed_amount,
                'utilized_amount': Decimal(0),
                'refund_amount': Decimal(0),
            },
        )
        return voucher_funding, created


# Predefined data for convenience
DEFAULT_SERVICES = [
    'General Medicine',
    'Surgery',
    'Orthopedics',
    'Cardiology',
    'Pediatrics',
    'Obstetrics & Gynecology',
    'Dermatology',
    'Laboratory',
    'X-Ray & Imaging',
    'Emergency',
]

DEFAULT_HEALTH_ISSUES = [
    'Malaria',
    'Typhoid Fever',
    'High Blood Pressure',
    'Diabetes',
    'Respiratory Infection',
    'Gastroenteritis',
    'Severe Anemia',
    'Broken Bone',
    'Pneumonia',
    'Severe Dehydration',
]

DEFAULT_BENEFICIARY_NAMES = [
    ('Mary', 'Nkongoh'),
    ('Amara', 'Samba'),
    ('Christine', 'Zam'),
    ('Patricia', 'Ebina'),
    ('Grace', 'Mfouamba'),
    ('Rose', 'Tanyi'),
    ('Fatima', 'Ahmed'),
    ('Beatrice', 'Fru'),
    ('Miriam', 'Njie'),
    ('Uchenna', 'Okoro'),
]

DEFAULT_DONOR_NAMES = [
    ('John', 'Doe'),
    ('Jane', 'Smith'),
    ('Michael', 'Johnson'),
    ('Sarah', 'Williams'),
    ('David', 'Brown'),
    ('Emma', 'Davis'),
]
