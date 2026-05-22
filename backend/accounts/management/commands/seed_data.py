"""
Management command to seed the database with realistic test data.

Usage:
    python manage.py seed_data                           # Seeds all data + OAuth app
    python manage.py seed_data --users                   # Seeds only users
    python manage.py seed_data --hospitals               # Seeds only hospitals
    python manage.py seed_data --beneficiaries           # Seeds only beneficiaries
    python manage.py seed_data --campaigns               # Seeds only campaigns
    python manage.py seed_data --full                    # Full realistic flow
    python manage.py seed_data --clear                   # Clear all seeded data first
    python manage.py seed_data --oauth-app               # Seeds only the OAuth application
"""

from django.core.management.base import BaseCommand, CommandError
from django.contrib.gis.geos import Point
from django.db import transaction
from django.utils import timezone
from decimal import Decimal
import random
import uuid
from datetime import datetime, timedelta

from accounts.models import User, Role
from accounts.models.system_admin import SystemAdmin
from accounts.models.hospital_admin import HospitalAdmin
from accounts.models.receptionist import Receptionist
from accounts.models.social_worker import SocialWorker
from accounts.models.donor import Donor
from hospitals.models import Hospital, PartnershipStatus, Services, MedicalClaim, ClaimItem, MedicalClaimProof, ClaimStatus, VerificationStatus, DocumentType
from beneficiaries.models import Beneficiary, HealthIssue
from campaigns.models import Campaign, Donation, Payment, CampaignTransaction
from vouchers.models import Voucher, VoucherFunding
from payments.models import Transaction


class Command(BaseCommand):
    help = 'Seed the database with realistic test data for development.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--users',
            action='store_true',
            help='Seed only users',
        )
        parser.add_argument(
            '--hospitals',
            action='store_true',
            help='Seed only hospitals',
        )
        parser.add_argument(
            '--beneficiaries',
            action='store_true',
            help='Seed only beneficiaries',
        )
        parser.add_argument(
            '--campaigns',
            action='store_true',
            help='Seed only campaigns and donations',
        )
        parser.add_argument(
            '--full',
            action='store_true',
            help='Seed complete realistic flow (users → hospitals → beneficiaries → campaigns → vouchers)',
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear all seeded data before seeding',
        )
        parser.add_argument(
            '--oauth-app',
            action='store_true',
            help='Seed only the Django OAuth application',
        )

    def handle(self, *args, **options):
        # Handle oauth-app only mode
        if options['oauth_app']:
            self.seed_oauth_app()
            return

        # Clear OUTSIDE atomic transaction so TRUNCATE works properly
        if options['clear']:
            self.clear_seeded_data()

        # Determine what to seed
        seed_users = options['users'] or options['full'] or not any(
            options[key] for key in ['users', 'hospitals', 'beneficiaries', 'campaigns', 'full', 'oauth_app']
        )
        seed_hospitals = options['hospitals'] or options['full'] or not any(
            options[key] for key in ['users', 'hospitals', 'beneficiaries', 'campaigns', 'full', 'oauth_app']
        )
        seed_beneficiaries = options['beneficiaries'] or options['full']
        seed_campaigns = options['campaigns'] or options['full']

        # Always ensure oauth app exists on default/full runs
        self.seed_oauth_app()

        try:
            # Wrap seeding in atomic transaction
            with transaction.atomic():
                self._do_seeding(seed_users, seed_hospitals, seed_beneficiaries, seed_campaigns)
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'CommandError: Error during seeding: {e}'))
            raise

    def _do_seeding(self, seed_users, seed_hospitals, seed_beneficiaries, seed_campaigns):
        try:
            if seed_users:
                self.seed_users()

            if seed_hospitals:
                self.seed_hospitals()

            if seed_beneficiaries:
                self.seed_beneficiaries()

            if seed_campaigns:
                self.seed_campaigns()

            self.stdout.write(self.style.SUCCESS('✓ Data seeding completed successfully!'))

        except Exception as e:
            raise CommandError(f'Error during seeding: {str(e)}')

    def seed_users(self):
        """Create test users with different roles."""
        self.stdout.write('Seeding users...')

        # System Admin
        sys_admin_user, created = User.objects.get_or_create(
            email='admin@joyfund.com',
            defaults={
                'first_name': 'Joy',
                'last_name': 'Fund',
                'phone_number': '+237650537465',
                'role': Role.SYSTEM_ADMIN,
                'is_staff': True,
                'is_superuser': True,
                'is_active': True,
                'is_verified': True,
            },
        )
        if created:
            sys_admin_user.set_password('password')
            sys_admin_user.save()
            SystemAdmin.objects.get_or_create(user=sys_admin_user)
            self.stdout.write(f'  ✓ Created System Admin: {sys_admin_user.email}')
        else:
            self.stdout.write(f'  • System Admin already exists: {sys_admin_user.email}')

        sys_admin = SystemAdmin.objects.get(user=sys_admin_user)

        # Donors
        donors_data = [
            {'email': 'donor1@example.com', 'first_name': 'John', 'last_name': 'Doe'},
            {'email': 'donor2@example.com', 'first_name': 'Jane', 'last_name': 'Smith'},
            {'email': 'donor3@example.com', 'first_name': 'Michael', 'last_name': 'Johnson'},
            {'email': 'donor4@example.com', 'first_name': 'Sarah', 'last_name': 'Williams'},
        ]

        for donor_data in donors_data:
            user, created = User.objects.get_or_create(
                email=donor_data['email'],
                defaults={
                    'first_name': donor_data['first_name'],
                    'last_name': donor_data['last_name'],
                    'phone_number': f'+237{random.randint(600000000, 699999999)}',
                    'role': Role.DONOR,
                    'is_active': True,
                    'is_verified': True,
                },
            )
            if created:
                user.set_password('password')
                user.save()
                Donor.objects.get_or_create(user=user)
                self.stdout.write(f'  ✓ Created Donor: {user.email}')

        # Social Workers
        social_workers_data = [
            {'email': 'socialworker1@example.com', 'first_name': 'Care', 'last_name': 'Worker'},
            {'email': 'socialworker2@example.com', 'first_name': 'David', 'last_name': 'Brown'},
        ]

        for sw_data in social_workers_data:
            user, created = User.objects.get_or_create(
                email=sw_data['email'],
                defaults={
                    'first_name': sw_data['first_name'],
                    'last_name': sw_data['last_name'],
                    'phone_number': f'+237{random.randint(600000000, 699999999)}',
                    'role': Role.SOCIAL_WORKER,
                    'is_active': True,
                    'is_verified': True,
                },
            )
            if created:
                user.set_password('password')
                user.save()
                SocialWorker.objects.get_or_create(
                    user=user,
                    defaults={
                        'is_approved': True,
                        'organization': 'Red Cross Cameroon',
                        'region_assigned': random.choice(['Littoral', 'North', 'South', 'East']),
                        'enrolled_by': sys_admin,
                    },
                )
                self.stdout.write(f'  ✓ Created Social Worker: {user.email}')

    def seed_hospitals(self):
        """Create test hospitals with services."""
        self.stdout.write('Seeding hospitals...')

        sys_admin = SystemAdmin.objects.first()
        if not sys_admin:
            raise CommandError('System admin must exist. Run seed_data --users first.')

        hospitals_data = [
            {
                'name': 'General Regional Hospital',
                'email': 'info@generalhospital.com',
                'accreditation_number': 'ACC-123456',
                'licence_number': 'LIC-789012',
                'region': 'Littoral',
                'city': 'Douala',
                'address': '123 Health Ave',
                'gps_coordinates': Point(9.7090, 4.0511),
                'phone_number': '+237670000000',
            },
            {
                'name': 'Central Hospital',
                'email': 'info@centralhospital.com',
                'accreditation_number': 'ACC-123457',
                'licence_number': 'LIC-789013',
                'region': 'Centre',
                'city': 'Yaoundé',
                'address': '456 Medical Blvd',
                'gps_coordinates': Point(3.8667, 11.5167),
                'phone_number': '+237670000001',
            },
            {
                'name': 'Northern Health Centre',
                'email': 'info@northernhc.com',
                'accreditation_number': 'ACC-123458',
                'licence_number': 'LIC-789014',
                'region': 'North',
                'city': 'Garoua',
                'address': '789 Care Street',
                'gps_coordinates': Point(9.3077, 8.8891),
                'phone_number': '+237670000002',
            },
        ]

        services = [
            'General Medicine',
            'Surgery',
            'Orthopedics',
            'Cardiology',
            'Pediatrics',
            'Obstetrics & Gynecology',
            'Dermatology',
            'Laboratory',
        ]

        for hospital_data in hospitals_data:
            hospital, created = Hospital.objects.get_or_create(
                email=hospital_data['email'],
                defaults={
                    'name': hospital_data['name'],
                    'accreditation_number': hospital_data['accreditation_number'],
                    'licence_number': hospital_data['licence_number'],
                    'region': hospital_data['region'],
                    'city': hospital_data['city'],
                    'address': hospital_data['address'],
                    'gps_coordinates': hospital_data['gps_coordinates'],
                    'phone_number': hospital_data['phone_number'],
                    'partnership_status': PartnershipStatus.ACTIVE,
                    'is_active': True,
                },
            )
            if created:
                self.stdout.write(f'  ✓ Created Hospital: {hospital.name}')

                # Add services to hospital
                for service_name in random.sample(services, k=random.randint(4, 6)):
                    Services.objects.get_or_create(
                        hospital=hospital,
                        name=service_name,
                        defaults={
                            'price': Decimal(random.randint(5000, 50000)),
                            'description': f'{service_name} service at {hospital.name}',
                        },
                    )
                self.stdout.write(f'    ✓ Added services to {hospital.name}')
            else:
                self.stdout.write(f'  • Hospital already exists: {hospital.name}')

            # Create Hospital Admin if not exists
            hosp_admin_user, user_created = User.objects.get_or_create(
                email=f'admin-{hospital.id}@joyfund.com',
                defaults={
                    'first_name': f'{hospital.name} Admin',
                    'last_name': 'Account',
                    'phone_number': f'+237{random.randint(600000000, 699999999)}',
                    'role': Role.HOSPITAL_ADMIN,
                    'is_active': True,
                    'is_verified': True,
                },
            )
            if user_created:
                hosp_admin_user.set_password('password')
                hosp_admin_user.save()

            hosp_admin, admin_created = HospitalAdmin.objects.get_or_create(
                user=hosp_admin_user,
                defaults={
                    'hospital': hospital,
                    'enrolled_by': sys_admin,
                },
            )
            if admin_created:
                self.stdout.write(f'    ✓ Created Hospital Admin for {hospital.name}')

            # Create Receptionist if not exists
            receptionist_user, user_created = User.objects.get_or_create(
                email=f'receptionist-{hospital.id}@joyfund.com',
                defaults={
                    'first_name': 'Receptionist',
                    'last_name': hospital.name.split()[0],
                    'phone_number': f'+237{random.randint(600000000, 699999999)}',
                    'role': Role.RECEPTIONIST,
                    'is_active': True,
                    'is_verified': True,
                },
            )
            if user_created:
                receptionist_user.set_password('password')
                receptionist_user.save()

            receptionist, receptionist_created = Receptionist.objects.get_or_create(
                user=receptionist_user,
                defaults={
                    'hospital': hospital,
                    'enrolled_by': hosp_admin,
                },
            )
            if receptionist_created:
                self.stdout.write(f'    ✓ Created Receptionist for {hospital.name}')

    def seed_beneficiaries(self):
        """Create test beneficiaries and health issues."""
        self.stdout.write('Seeding beneficiaries and health issues...')

        social_workers = SocialWorker.objects.all()
        if not social_workers.exists():
            raise CommandError('Social workers must exist. Run seed_data --users first.')

        hospitals = Hospital.objects.all()
        if not hospitals.exists():
            raise CommandError('Hospitals must exist. Run seed_data --hospitals first.')

        health_issues = [
            'MATERNAL',
            'ELDERLY',
            'EMERGENCY',
            'CHRONIC',
            'OTHER',
        ]

        health_descriptions = [
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

        beneficiary_names = [
            ('Mary', 'Nkongoh'),
            ('Amara', 'Samba'),
            ('Christine', 'Zam'),
            ('Patricia', 'Ebina'),
            ('Grace', 'Mfouamba'),
            ('Rose', 'Tanyi'),
            ('Fatima', 'Ahmed'),
            ('Beatrice', 'Fru'),
        ]

        for sw in social_workers:
            for first_name, last_name in random.sample(beneficiary_names, k=random.randint(3, 5)):
                full_name = f'{first_name} {last_name}'
                phone = f'+237{random.randint(600000000, 699999999)}'
                
                beneficiary, created = Beneficiary.objects.get_or_create(
                    phone=phone,
                    defaults={
                        'full_name': full_name,
                        'enrolled_by': sw,
                        'date_of_birth': (datetime.now() - timedelta(days=random.randint(365 * 18, 365 * 80))).date(),
                        'gender': random.choice(['MALE', 'FEMALE']),
                        'region': sw.region_assigned,
                        'city': random.choice(['Douala', 'Yaoundé', 'Garoua', 'Limbe', 'Buea']),
                        'address': f'{random.randint(1, 999)} Main Street',
                        'national_id_number': f'NID-{random.randint(100000, 999999)}',
                        'emergency_contact_name': 'Emergency Contact',
                        'emergency_contact_phone': f'+237{random.randint(600000000, 699999999)}',
                        'emergency_contact_relationship': 'Family',
                    },
                )
                if created:
                    self.stdout.write(f'  ✓ Created Beneficiary: {beneficiary.full_name}')

                    # Create health issues
                    for category in random.sample(health_issues, k=random.randint(1, 2)):
                        description = random.choice(health_descriptions)
                        health_issue, created = HealthIssue.objects.get_or_create(
                            beneficiary=beneficiary,
                            category=category,
                            defaults={
                                'social_worker': sw,
                                'description': description,
                                'severity': random.choice(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
                            },
                        )
                        if created:
                            self.stdout.write(f'    ✓ Created Health Issue: {description}')

    def seed_campaigns(self):
        """Create test campaigns, donations, and vouchers."""
        self.stdout.write('Seeding campaigns, donations, and vouchers...')

        donors = Donor.objects.all()
        if not donors.exists():
            raise CommandError('Donors must exist. Run seed_data --users first.')

        beneficiaries = Beneficiary.objects.all()
        if not beneficiaries.exists():
            raise CommandError('Beneficiaries must exist. Run seed_data --beneficiaries first.')

        hospitals = Hospital.objects.all()
        sys_admin = SystemAdmin.objects.first()

        campaign_titles = [
            'Help Amara Recover from Malaria',
            'Support Mary\'s Surgery',
            'Grace Needs Urgent Care',
            'Patricia\'s Medical Fund',
            'Rose\'s Health Recovery',
        ]

        for title in campaign_titles:
            donor = random.choice(donors)
            goal_amount = Decimal(random.randint(100000, 500000))  # XAF

            campaign, created = Campaign.objects.get_or_create(
                title=title,
                donor=donor,
                defaults={
                    'description': f'Medical campaign to help those in need',
                    'goal_amount': goal_amount,
                    'current_amount': Decimal(0),
                    'total_disbursed': Decimal(0),
                    'currently_allocated': Decimal(0),
                    'status': Campaign.CampaignStatus.ACTIVE,
                    'event_type': random.choice([c[0] for c in Campaign.EventType.choices]),
                    'end_date': timezone.now() + timedelta(days=random.randint(30, 90)),
                },
            )

            if created:
                self.stdout.write(f'  ✓ Created Campaign: {campaign.title}')

                # Create donations
                num_donations = random.randint(3, 8)
                for i in range(num_donations):
                    donation_donor = random.choice(donors)
                    donation_amount = Decimal(random.randint(10000, 100000))
                    
                    # Create payment first
                    payment = Payment.objects.create(
                        payment_method=random.choice(['MTN', 'ORANGE']),
                        amount=donation_amount,
                        app_amount=donation_amount * Decimal('0.95'),  # After aggregator fee
                        aggregator_fee=donation_amount * Decimal('0.05'),
                        payment_status='SUCCESS',
                        phone_number=f'+237{random.randint(100000000, 999999999)}',
                    )

                    # Create donation directly (signals handle campaign.current_amount and CampaignTransaction)
                    donation = Donation.objects.create(
                        campaign=campaign,
                        donor=donation_donor,
                        payment=payment,
                        amount=donation_amount,
                        status='SUCCESS',
                        platform_fee_amount=donation_amount * Decimal('0.05'),
                        net_amount=donation_amount * Decimal('0.95'),
                    )

                    # Refresh campaign from DB to get updated current_amount from signals
                    campaign.refresh_from_db()
                    
                    self.stdout.write(
                        f'    ✓ Created Donation: {donation_donor.user.email} → {donation_amount} XAF'
                    )

                # Create vouchers for beneficiaries
                selected_beneficiaries = random.sample(list(beneficiaries), k=min(3, len(beneficiaries)))
                for beneficiary in selected_beneficiaries:
                    health_issues = list(beneficiary.health_issues.all())
                    if not health_issues:
                        continue
                    
                    health_issue = random.choice(health_issues)
                    hospital = random.choice(hospitals)
                    voucher_amount = Decimal(random.randint(50000, 200000))
                    
                    # Ensure campaign has enough funds for this voucher
                    available = campaign.current_amount - campaign.total_disbursed - campaign.currently_allocated
                    if available < voucher_amount:
                        voucher_amount = available * Decimal('0.8')
                        if voucher_amount < 5000: continue

                    voucher_code = f"VCH-{uuid.uuid4().hex[:8].upper()}"
                    
                    voucher = Voucher.objects.create(
                        voucher_code=voucher_code,
                        beneficiary=beneficiary,
                        health_issue=health_issue,
                        hospital=hospital,
                        status=Voucher.Status.ACTIVE,
                        expiry_date=timezone.now().date() + timedelta(days=30),
                    )

                    self.stdout.write(f'    ✓ Created Voucher: {voucher.voucher_code}')
                    
                    # Create Funding Record
                    voucher_funding = VoucherFunding.objects.create(
                        voucher=voucher,
                        campaign=campaign,
                        committed_amount=voucher_amount,
                        utilized_amount=Decimal('0'),
                        refund_amount=Decimal('0'),
                        status=VoucherFunding.FundingStatus.COMMITTED,
                    )
                    
                    # Update Campaign - Manual update as in vouchers/services.py
                    campaign.currently_allocated += voucher_amount
                    campaign.save(update_fields=['currently_allocated'])

                    # Log Transaction
                    CampaignTransaction.objects.create(
                        campaign=campaign,
                        voucher_funding=voucher_funding,
                        transaction_type=CampaignTransaction.TransactionType.VOUCHER_ALLOCATED,
                        amount=voucher_amount,
                        description=f"Allocated {voucher_amount:.2f} XAF to voucher {voucher.voucher_code} for health issue #{health_issue.id}",
                    )
                    
                    self.stdout.write(f'      ✓ Funded Voucher: {voucher_amount} XAF')

                    # Randomly settle some vouchers (50% chance)
                    if random.random() > 0.5:
                        settle_amount = voucher_amount * Decimal(str(random.uniform(0.7, 1.0)))
                        settle_amount = settle_amount.quantize(Decimal('0.01'))
                        
                        # Create Medical Claim
                        receptionist = Receptionist.objects.filter(hospital=hospital).first()
                        medical_claim = MedicalClaim.objects.create(
                            voucher=voucher,
                            hospital=hospital,
                            service_description="Seeded medical services",
                            total_cost=settle_amount,
                            claim_status=ClaimStatus.APPROVED,
                            submitted_by=receptionist,
                            reviewed_by=sys_admin,
                            reviewed_at=timezone.now(),
                            service_completed_at=timezone.now(),
                        )
                        
                        # Add Claim Item
                        ClaimItem.objects.create(
                            medical_claim=medical_claim,
                            name="General Treatment",
                            amount=settle_amount
                        )
                        
                        # Add Proof
                        MedicalClaimProof.objects.create(
                            medical_claim=medical_claim,
                            document_type=DocumentType.BILL,
                            verification_status=VerificationStatus.VERIFIED,
                            uploaded_by=receptionist,
                            verified_by=sys_admin,
                            verified_at=timezone.now(),
                        )
                        
                        # Settle logic - replicate vouchers/services.py
                        refund_amount = voucher_amount - settle_amount
                        
                        voucher_funding.utilized_amount = settle_amount
                        voucher_funding.refund_amount = refund_amount
                        voucher_funding.utilized_at = timezone.now()
                        voucher_funding.status = VoucherFunding.FundingStatus.UTILIZED
                        voucher_funding.save()
                        
                        campaign.currently_allocated -= voucher_amount
                        campaign.total_disbursed += settle_amount
                        campaign.save(update_fields=['currently_allocated', 'total_disbursed'])
                        
                        # Log settlement transaction
                        CampaignTransaction.objects.create(
                            campaign=campaign,
                            voucher_funding=voucher_funding,
                            transaction_type=CampaignTransaction.TransactionType.HOSPITAL_SETTLED,
                            amount=settle_amount,
                            description=f"Funds settled: {settle_amount:.2f} XAF to {hospital.name} for voucher {voucher.voucher_code}",
                        )
                        
                        if refund_amount > 0:
                            CampaignTransaction.objects.create(
                                campaign=campaign,
                                voucher_funding=voucher_funding,
                                transaction_type=CampaignTransaction.TransactionType.SURPLUS_REFUND,
                                amount=refund_amount,
                                description=f"Refunded {refund_amount:.2f} XAF surplus from voucher {voucher.voucher_code}",
                            )

                        voucher.status = Voucher.Status.USED
                        voucher.save()
                        self.stdout.write(f'      ✓ Settled Voucher: {settle_amount} XAF used, {refund_amount} refunded')

        self.stdout.write(self.style.SUCCESS('✓ Campaigns, donations, and vouchers seeded successfully'))

    def seed_oauth_app(self):
        """Create the Django OAuth Toolkit application if it doesn't exist."""
        from oauth2_provider.models import Application

        client_id = 'xPqWEK4yb6UuPYGXnIauJRIExSRXFj1yBuNkxP3K'
        client_secret = 'dsQ7RlWgr9ySTdkhI56uICEa00A8uzANznfLc1QR0JMWG02PkximuSVEuZsS5PkmdFwPTOpyhOjFQjWrICxs1Vr0D3SIYhsQ09IgfhI9o0PtKkOvvt0RRb75fSkpEuTs'

        app, created = Application.objects.get_or_create(
            client_id=client_id,
            defaults={
                'user': None,
                'client_type': Application.CLIENT_CONFIDENTIAL,
                'authorization_grant_type': Application.GRANT_PASSWORD,
                'name': 'JoyFund Password Grant App',
                'hash_client_secret': False,
                'skip_authorization': True,
            },
        )

        if created:
            app.client_secret = client_secret
            app.save(update_fields=['client_secret'])
            self.stdout.write(self.style.SUCCESS(f'  ✓ Created OAuth App: {app.name}'))
        else:
            self.stdout.write(f'  • OAuth App already exists: {app.name}')

    def clear_seeded_data(self):
        """Clear test data."""
        self.stdout.write('Clearing seeded data...')

        # Delete in correct order (respect foreign keys)
        VoucherFunding.objects.all().delete()
        Voucher.objects.all().delete()
        Donation.objects.all().delete()
        Campaign.objects.all().delete()
        HealthIssue.objects.all().delete()
        
        # Truncate beneficiaries table to reset ID sequence completely
        # This is necessary because digital_health_id is manually generated
        from django.db import connections
        try:
            with connections['default'].cursor() as cursor:
                # Disable foreign key checks temporarily
                cursor.execute('SET CONSTRAINTS ALL DEFERRED;')
                self.stdout.write('  • Executing TRUNCATE TABLE...')
                cursor.execute('TRUNCATE TABLE beneficiaries_beneficiary RESTART IDENTITY CASCADE;')
                self.stdout.write('  • TRUNCATE completed')
                cursor.execute('SET CONSTRAINTS ALL IMMEDIATE;')
                # Verify deletion
                cursor.execute('SELECT COUNT(*) FROM beneficiaries_beneficiary;')
                count = cursor.fetchone()[0]
                self.stdout.write(f'  • Verified: {count} beneficiaries remaining')
        except Exception as e:
            self.stdout.write(f'  ! TRUNCATE failed: {e}, falling back to delete')
            # Fallback to regular delete if TRUNCATE doesn't work
            Beneficiary.objects.all().delete()
        
        # Delete test users (cascades delete their associated Receptionist and HospitalAdmin records)
        # Delete hospital staff first
        User.objects.filter(email__contains='receptionist-').delete()
        User.objects.filter(email__contains='admin-').delete()
        
        # Delete test donors and social workers
        User.objects.filter(email__contains='example').delete()
        User.objects.filter(email__contains='socialworker').delete()
        User.objects.filter(email__contains='donor').delete()

        self.stdout.write(self.style.SUCCESS('✓ Seeded data cleared'))

    def _reset_beneficiary_sequence(self):
        """Legacy method - no longer needed with TRUNCATE."""
        pass
