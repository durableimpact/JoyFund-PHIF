"""
Management command to seed the database with realistic test data.

Usage:
    python manage.py seed_data                           # Seeds users + hospitals + OAuth app (default)
    python manage.py seed_data --users                   # Seeds only users
    python manage.py seed_data --hospitals               # Seeds only hospitals
    python manage.py seed_data --beneficiaries           # Seeds only beneficiaries + health issues
    python manage.py seed_data --campaigns               # Seeds only campaigns + donations + vouchers
    python manage.py seed_data --payments                # Seeds payment infrastructure + transactions
    python manage.py seed_data --notifications           # Seeds notifications for all users
    python manage.py seed_data --logs                    # Seeds activity logs, request logs, error logs
    python manage.py seed_data --full                    # Full realistic flow (everything)
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
import traceback
from datetime import datetime, timedelta

from accounts.models import (
    User, Role, SystemAdmin, HospitalAdmin, Receptionist,
    SocialWorker, Donor,
)
from hospitals.models import (
    Hospital, PartnershipStatus, Services, MedicalClaim, ClaimItem,
    MedicalClaimProof, ClaimStatus, VerificationStatus, DocumentType,
    VoucherTopUpRequest, VoucherTopUpRequestStatus,
)
from beneficiaries.models import Beneficiary, BeneficiaryDocument, HealthIssue, HealthIssueEvent
from campaigns.models import (
    Campaign, Donation, Payment, CampaignTransaction,
)
from vouchers.models import (
    Voucher, VoucherFunding, VoucherNotification,
)
from payments.models import (
    EscrowAccount, FeeAccount, FeePolicy, PaymentGateway,
    Transaction, FeeSplit, Disbursement,
)
from notifications.models import Notification, NotificationType
from logs.models import ActivityLog, RequestLog, ErrorLog


# ---------------------------------------------------------------------------
# Shared data pools
# ---------------------------------------------------------------------------

CAMEROONIAN_NAMES = [
    ('Mary', 'Nkongoh'), ('Amara', 'Samba'), ('Christine', 'Zam'),
    ('Patricia', 'Ebina'), ('Grace', 'Mfouamba'), ('Rose', 'Tanyi'),
    ('Fatima', 'Ahmed'), ('Beatrice', 'Fru'), ('Cecilia', 'Ngwa'),
    ('Honorine', 'Bih'), ('Scholastique', 'Njoh'), ('Brenda', 'Teku'),
    ('Joseph', 'Manga'), ('Paul', 'Nkemdirim'), ('Emmanuel', 'Fon'),
    ('Pierre', 'Njoya'), ('Antoine', 'Mbarga'), ('Samuel', 'Atanga'),
    ('Jean', 'Kouam'), ('Michel', 'Tagne'),
]

HEALTH_DESCRIPTIONS = [
    'Malaria', 'Typhoid Fever', 'High Blood Pressure', 'Diabetes',
    'Respiratory Infection', 'Gastroenteritis', 'Severe Anemia',
    'Broken Bone', 'Pneumonia', 'Severe Dehydration',
    'Pre-eclampsia', 'Obstetric Hemorrhage', 'Gestational Diabetes',
    'Chronic Asthma', 'Tuberculosis', 'HIV/AIDS complications',
    'Meningitis', 'Hepatitis B', 'Sickle Cell Crisis', 'Appendicitis',
]

CITIES_BY_REGION = {
    'Littoral': ['Douala', 'Limbe', 'Buea', 'Kumba'],
    'Centre': ['Yaoundé', ' Bertoua', 'Ebolowa'],
    'North': ['Garoua', 'Maroua', 'Ngaoundéré'],
    'Far North': ['Kousseri', 'Mora', 'Mokolo'],
    'South': ['Ebolowa', 'Kribi', 'Lolodorf'],
    'West': ['Bafoussam', 'Dschang', 'Bangante'],
    'North-West': ['Bamenda', 'Nkambe', 'Wum'],
    'South-West': ['Buea', 'Limbe', 'Tiko'],
    'East': ['Bertoua', 'Batouri', 'Yokadouma'],
    'Adamawa': ['Ngaoundéré', 'Tignère', 'Meiganga'],
    'Adamaoua': ['Ngaoundéré', 'Tignère', 'Meiganga'],
}

HOSPITAL_SERVICES = {
    'GENERAL': 'General Consultation',
    'MATERNITY': 'Maternity / Obstetrics',
    'PEDIATRIC': 'Pediatric Care',
    'LAB': 'Laboratory Services',
    'IMAGING': 'Imaging (X-ray, Scan)',
    'PHARMACY': 'Pharmacy / Medication',
    'SURGERY': 'Surgical Services',
    'EMERGENCY': 'Emergency Care',
    'CHRONIC': 'Chronic Disease Management',
    'VACCINATION': 'Vaccination',
    'DENTAL': 'Dental Care',
}


class Command(BaseCommand):
    help = 'Seed the database with realistic test data for development and demos.'

    def add_arguments(self, parser):
        parser.add_argument('--users', action='store_true', help='Seed only users')
        parser.add_argument('--hospitals', action='store_true', help='Seed only hospitals + staff')
        parser.add_argument('--beneficiaries', action='store_true', help='Seed only beneficiaries + health issues')
        parser.add_argument('--campaigns', action='store_true', help='Seed only campaigns + donations + vouchers')
        parser.add_argument('--payments', action='store_true', help='Seed payment infrastructure + transactions + disbursements')
        parser.add_argument('--notifications', action='store_true', help='Seed in-app notifications')
        parser.add_argument('--logs', action='store_true', help='Seed activity, request, and error logs')
        parser.add_argument('--full', action='store_true', help='Full seed: everything in dependency order')
        parser.add_argument('--clear', action='store_true', help='Clear all seeded data before seeding')
        parser.add_argument('--oauth-app', action='store_true', help='Seed only the Django OAuth application')

    def handle(self, *args, **options):
        if options['oauth_app']:
            self.seed_oauth_app()
            return

        if options['clear']:
            self.clear_seeded_data()

        # Determine what to seed — default = users + hospitals + oauth
        all_flags = ['users', 'hospitals', 'beneficiaries', 'campaigns', 'payments', 'notifications', 'logs', 'full', 'oauth_app']
        any_explicit = any(options[f] for f in all_flags if f != 'full' and f != 'oauth_app')

        seed_users = options['users'] or options['full'] or (not any_explicit)
        seed_hospitals = options['hospitals'] or options['full'] or (not any_explicit)
        seed_beneficiaries = options['beneficiaries'] or options['full']
        seed_campaigns = options['campaigns'] or options['full']
        seed_payments = options['payments'] or options['full']
        seed_notifications = options['notifications'] or options['full']
        seed_logs = options['logs'] or options['full']

        # Always ensure oauth app exists
        self.seed_oauth_app()

        # Always ensure payment infrastructure exists
        self.seed_payment_infrastructure()

        try:
            with transaction.atomic():
                if seed_users:
                    self.seed_users()

                if seed_hospitals:
                    self.seed_hospitals()

                if seed_beneficiaries:
                    self.seed_beneficiaries()

                if seed_campaigns:
                    self.seed_campaigns()

                if seed_payments:
                    self.seed_transactions_and_disbursements()

                if seed_notifications:
                    self.seed_notifications()

                if seed_logs:
                    self.seed_logs()

            self.stdout.write(self.style.SUCCESS('\n✓ All data seeded successfully!'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'CommandError: Error during seeding: {e}'))
            self.stdout.write(traceback.format_exc())
            raise

    # -----------------------------------------------------------------------
    # 1. OAuth Application
    # -----------------------------------------------------------------------
    def seed_oauth_app(self):
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
        app.client_secret = client_secret
        app.hash_client_secret = False
        app.skip_authorization = True
        app.authorization_grant_type = Application.GRANT_PASSWORD
        app.client_type = Application.CLIENT_CONFIDENTIAL
        app.save()

        label = 'Created' if created else 'Updated/Verified'
        self.stdout.write(self.style.SUCCESS(f'  ✓ {label} OAuth App: {app.name}'))

    # -----------------------------------------------------------------------
    # 2. Payment Infrastructure
    # -----------------------------------------------------------------------
    def seed_payment_infrastructure(self):
        self.stdout.write('Seeding payment infrastructure...')

        # Fee Policy — standard 5% platform + 95% escrow
        policy, created = FeePolicy.objects.get_or_create(
            name='Standard Platform Fee',
            defaults={
                'description': 'Standard fee split: 5% platform operations, 95% escrow for beneficiary care.',
                'platform_fee_percentage': Decimal('5.00'),
                'escrow_fee_percentage': Decimal('95.00'),
                'is_active': True,
            },
        )
        if created:
            self.stdout.write('  ✓ Created FeePolicy: Standard Platform Fee (5% / 95%)')

        # Payment Gateways
        for gw_name, gw_desc in [
            ('MTN Mobile Money', 'MTN MoMo payment gateway for Cameroon'),
            ('Orange Money', 'Orange Money payment gateway for Cameroon'),
        ]:
            gw, created = PaymentGateway.objects.get_or_create(
                name=gw_name,
                defaults={'description': gw_desc, 'is_active': True},
            )
            if created:
                self.stdout.write(f'  ✓ Created PaymentGateway: {gw_name}')

        # Singleton accounts
        escrow = EscrowAccount.get_instance()
        if escrow.balance == 0:
            escrow.balance = Decimal('2500000.00')
            escrow.save(update_fields=['balance'])
        fee_account = FeeAccount.get_instance()
        if fee_account.balance == 0:
            fee_account.balance = Decimal('450000.00')
            fee_account.save(update_fields=['balance'])
        self.stdout.write(f'  ✓ EscrowAccount balance: {escrow.balance} XAF')
        self.stdout.write(f'  ✓ FeeAccount balance: {fee_account.balance} XAF')

    # -----------------------------------------------------------------------
    # 3. Users
    # -----------------------------------------------------------------------
    def seed_users(self):
        self.stdout.write('\nSeeding users...')

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
        for d in donors_data:
            user, created = User.objects.get_or_create(
                email=d['email'],
                defaults={
                    'first_name': d['first_name'],
                    'last_name': d['last_name'],
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
        sw_data = [
            {'email': 'socialworker1@example.com', 'first_name': 'Care', 'last_name': 'Worker',
             'org': 'Red Cross Cameroon', 'region': 'Littoral'},
            {'email': 'socialworker2@example.com', 'first_name': 'David', 'last_name': 'Brown',
             'org': 'Médecins Sans Frontières', 'region': 'North'},
            {'email': 'socialworker3@example.com', 'first_name': 'Esther', 'last_name': 'Ngala',
             'org': 'Catholic Relief Services', 'region': 'Far North'},
            {'email': 'socialworker4@example.com', 'first_name': ' Samuel', 'last_name': 'Kange',
             'org': 'Plan International', 'region': 'Centre'},
        ]
        for sw in sw_data:
            user, created = User.objects.get_or_create(
                email=sw['email'],
                defaults={
                    'first_name': sw['first_name'],
                    'last_name': sw['last_name'],
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
                        'organization': sw['org'],
                        'region_assigned': sw['region'],
                        'enrolled_by': sys_admin,
                    },
                )
                self.stdout.write(f'  ✓ Created Social Worker: {user.email}')

    # -----------------------------------------------------------------------
    # 4. Hospitals + Services + Staff
    # -----------------------------------------------------------------------
    def seed_hospitals(self):
        self.stdout.write('\nSeeding hospitals...')

        sys_admin = SystemAdmin.objects.first()
        if not sys_admin:
            raise CommandError('System admin must exist. Run --users first.')

        hospitals_data = [
            {
                'name': 'General Regional Hospital',
                'email': 'info@generalhospital.com',
                'accreditation_number': 'ACC-123456',
                'licence_number': 'LIC-789012',
                'region': 'Littoral', 'city': 'Douala',
                'address': '123 Health Ave, Douala',
                'gps_coordinates': Point(9.7090, 4.0511),
                'phone_number': '+237670000000',
                'momo_number': '+237670000010', 'momo_name': 'General Hospital MoMo',
                'bank_account_number': '1234567890', 'bank_account_name': 'General Regional Hospital',
                'bank_name': 'BEAC', 'bank_branch': 'Douala Main',
            },
            {
                'name': 'Central Hospital Yaoundé',
                'email': 'info@centralhospital.com',
                'accreditation_number': 'ACC-123457',
                'licence_number': 'LIC-789013',
                'region': 'Centre', 'city': 'Yaoundé',
                'address': '456 Medical Blvd, Yaoundé',
                'gps_coordinates': Point(11.5167, 3.8667),
                'phone_number': '+237670000001',
                'momo_number': '+237670000011', 'momo_name': 'Central Hospital MoMo',
                'orange_number': '+237670000012', 'orange_name': 'Central Hospital Orange',
            },
            {
                'name': 'Northern Health Centre',
                'email': 'info@northernhc.com',
                'accreditation_number': 'ACC-123458',
                'licence_number': 'LIC-789014',
                'region': 'North', 'city': 'Garoua',
                'address': '789 Care Street, Garoua',
                'gps_coordinates': Point(9.3017, 8.8971),
                'phone_number': '+237670000002',
                'momo_number': '+237670000013', 'momo_name': 'Northern HC MoMo',
            },
            {
                'name': 'Bamenda Regional Hospital',
                'email': 'info@bamendahospital.com',
                'accreditation_number': 'ACC-123459',
                'licence_number': 'LIC-789015',
                'region': 'North-West', 'city': 'Bamenda',
                'address': '12 Hospital Road, Bamenda',
                'gps_coordinates': Point(10.1591, 5.9631),
                'phone_number': '+237670000003',
                'bank_account_number': '9876543210', 'bank_account_name': 'Bamenda Regional Hospital',
                'bank_name': 'Commercial Bank', 'bank_branch': 'Bamenda',
            },
            {
                'name': 'Kribi General Hospital',
                'email': 'info@kribihospital.com',
                'accreditation_number': 'ACC-123460',
                'licence_number': 'LIC-789016',
                'region': 'South', 'city': 'Kribi',
                'address': '5 Beach Road, Kribi',
                'gps_coordinates': Point(9.9085, 2.9416),
                'phone_number': '+237670000004',
            },
        ]

        for h_data in hospitals_data:
            hospital, created = Hospital.objects.get_or_create(
                email=h_data['email'],
                defaults={
                    'name': h_data['name'],
                    'accreditation_number': h_data['accreditation_number'],
                    'licence_number': h_data['licence_number'],
                    'region': h_data['region'],
                    'city': h_data['city'],
                    'address': h_data['address'],
                    'gps_coordinates': h_data['gps_coordinates'],
                    'phone_number': h_data['phone_number'],
                    'momo_number': h_data.get('momo_number'),
                    'momo_name': h_data.get('momo_name'),
                    'orange_number': h_data.get('orange_number'),
                    'orange_name': h_data.get('orange_name'),
                    'bank_account_number': h_data.get('bank_account_number'),
                    'bank_account_name': h_data.get('bank_account_name'),
                    'bank_name': h_data.get('bank_name'),
                    'bank_branch': h_data.get('bank_branch'),
                    'partnership_status': PartnershipStatus.ACTIVE,
                    'is_active': True,
                },
            )
            if created:
                self.stdout.write(f'  ✓ Created Hospital: {hospital.name}')

                # Add services
                svc_keys = random.sample(list(HOSPITAL_SERVICES.keys()), k=random.randint(5, 9))
                for key in svc_keys:
                    Services.objects.get_or_create(
                        hospital=hospital,
                        name=HOSPITAL_SERVICES[key],
                        defaults={
                            'category': key,
                            'price': Decimal(random.randint(2000, 80000)),
                            'description': f'{HOSPITAL_SERVICES[key]} at {hospital.name}',
                            'is_available': random.random() > 0.1,
                        },
                    )
                self.stdout.write(f'    ✓ Added {len(svc_keys)} services to {hospital.name}')
            else:
                self.stdout.write(f'  • Hospital already exists: {hospital.name}')

            # Hospital Admin
            hosp_admin_user, uc = User.objects.get_or_create(
                email=f'admin-{hospital.id}@joyfund.com',
                defaults={
                    'first_name': f'{hospital.name.split()[0]}',
                    'last_name': 'Hospital Admin',
                    'phone_number': f'+237{random.randint(600000000, 699999999)}',
                    'role': Role.HOSPITAL_ADMIN,
                    'is_active': True, 'is_verified': True,
                },
            )
            if uc:
                hosp_admin_user.set_password('password')
                hosp_admin_user.save()

            hosp_admin, hac = HospitalAdmin.objects.get_or_create(
                user=hosp_admin_user,
                defaults={'hospital': hospital, 'enrolled_by': sys_admin},
            )
            if hac:
                self.stdout.write(f'    ✓ Created Hospital Admin for {hospital.name}')

            # Receptionist
            rec_user, rc = User.objects.get_or_create(
                email=f'receptionist-{hospital.id}@joyfund.com',
                defaults={
                    'first_name': 'Receptionist',
                    'last_name': hospital.name.split()[0],
                    'phone_number': f'+237{random.randint(600000000, 699999999)}',
                    'role': Role.RECEPTIONIST,
                    'is_active': True, 'is_verified': True,
                },
            )
            if rc:
                rec_user.set_password('password')
                rec_user.save()

            Receptionist.objects.get_or_create(
                user=rec_user,
                defaults={'hospital': hospital, 'enrolled_by': hosp_admin},
            )

    # -----------------------------------------------------------------------
    # 5. Beneficiaries + Health Issues
    # -----------------------------------------------------------------------
    def seed_beneficiaries(self):
        self.stdout.write('\nSeeding beneficiaries and health issues...')

        social_workers = list(SocialWorker.objects.all())
        if not social_workers:
            raise CommandError('Social workers must exist. Run --users first.')

        sys_admin = SystemAdmin.objects.first()

        regions = list(CITIES_BY_REGION.keys())
        used_phones = set(Beneficiary.objects.values_list('phone', flat=True))
        used_nids = set(Beneficiary.objects.values_list('national_id_number', flat=True))

        beneficiary_pool = list(CAMEROONIAN_NAMES)
        random.shuffle(beneficiary_pool)
        idx = 0

        categories = ['MATERNAL', 'ELDERLY', 'OTHER']
        severities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
        issue_statuses = ['REPORTED', 'VALIDATED', 'WAITING', 'ASSIGNED', 'IN_TREATMENT', 'RESOLVED', 'REJECTED']

        for sw in social_workers:
            # Each social worker enrolls 5-8 beneficiaries
            num_beneficiaries = random.randint(5, 8)
            for _ in range(num_beneficiaries):
                if idx >= len(beneficiary_pool):
                    break

                first, last = beneficiary_pool[idx]
                idx += 1
                full_name = f'{first} {last}'

                # Ensure unique phone
                while True:
                    phone = f'+237{random.randint(600000000, 699999999)}'
                    if phone not in used_phones:
                        used_phones.add(phone)
                        break

                # Ensure unique national ID
                while True:
                    nid = f'NID-{random.randint(100000, 999999)}'
                    if nid not in used_nids:
                        used_nids.add(nid)
                        break

                region = random.choice(regions)
                city = random.choice(CITIES_BY_REGION.get(region, ['Douala']))
                is_maternal = random.random() < 0.4
                category = 'MATERNAL' if is_maternal else random.choice(categories)

                beneficiary, created = Beneficiary.objects.get_or_create(
                    phone=phone,
                    defaults={
                        'full_name': full_name,
                        'date_of_birth': (datetime.now() - timedelta(days=random.randint(365*18, 365*80))).date(),
                        'gender': random.choice(['MALE', 'FEMALE']),
                        'category': category,
                        'number_of_previous_births': random.randint(0, 6) if is_maternal else None,
                        'is_verified': random.random() > 0.3,
                        'region': region,
                        'city': city,
                        'address': f'{random.randint(1, 500)} {random.choice(["Rue", "Avenue", "Street", "Road"])} {random.choice(["Central", "Nkomo", "Bastos", "Essos", "Mimboman"])}',
                        'national_id_number': nid,
                        'emergency_contact_name': f'{random.choice(["Pierre", "Jean", "Paul", "Marie", "Françoise"])} {random.choice(["Ndi", "Fotso", "Atangana", "Essomba", "Mbarga"])}',
                        'emergency_contact_phone': f'+237{random.randint(600000000, 699999999)}',
                        'emergency_contact_relationship': random.choice(['Spouse', 'Parent', 'Sibling', 'Child', 'Relative']),
                        'enrolled_by': sw,
                        'is_active': True,
                    },
                )

                if created:
                    self.stdout.write(f'  ✓ Created Beneficiary: {beneficiary.full_name} ({beneficiary.digital_health_id})')

                    # Create 1-3 health issues per beneficiary
                    num_issues = random.randint(1, 3)
                    for _ in range(num_issues):
                        hi_status = random.choice(issue_statuses)
                        hi = HealthIssue.objects.create(
                            beneficiary=beneficiary,
                            social_worker=sw,
                            category=random.choice(['MATERNAL', 'ELDERLY', 'EMERGENCY', 'CHRONIC', 'INFECTIOUS', 'OTHER']),
                            severity=random.choice(severities),
                            status=hi_status,
                            description=random.choice(HEALTH_DESCRIPTIONS),
                            validated_by=sys_admin if hi_status in ['VALIDATED', 'ASSIGNED', 'IN_TREATMENT', 'RESOLVED'] else None,
                            rejection_reason='Insufficient documentation' if hi_status == 'REJECTED' else None,
                        )

                        # Create health issue event
                        HealthIssueEvent.objects.create(
                            health_issue=hi,
                            status=hi_status,
                            changed_by=sw.user if sw else None,
                            notes=f'Health issue reported with status: {hi_status}',
                        )

                    # Sometimes create a beneficiary document
                    if random.random() > 0.5:
                        BeneficiaryDocument.objects.create(
                            beneficiary=beneficiary,
                            description=random.choice([
                                'National ID Card - Front',
                                'National ID Card - Back',
                                'Medical Referral Letter',
                                'Previous Medical Records',
                                'Proof of Address',
                            ]),
                        )

        self.stdout.write(f'  ✓ Total beneficiaries: {Beneficiary.objects.count()}')

    # -----------------------------------------------------------------------
    # 6. Campaigns + Donations + Vouchers
    # -----------------------------------------------------------------------
    def seed_campaigns(self):
        self.stdout.write('\nSeeding campaigns, donations, and vouchers...')

        donors = list(Donor.objects.all())
        if not donors:
            raise CommandError('Donors must exist. Run --users first.')

        beneficiaries = list(Beneficiary.objects.all())
        if not beneficiaries:
            raise CommandError('Beneficiaries must exist. Run --beneficiaries first.')

        hospitals = list(Hospital.objects.all())
        sys_admin = SystemAdmin.objects.first()
        policy = FeePolicy.objects.filter(is_active=True).first()

        # Create campaigns in different states for demo variety
        campaign_configs = [
            {
                'title': 'Help Amara Recover from Malaria',
                'desc': 'Amara, a young mother from Douala, has been battling severe malaria. Your donation covers her treatment and medication.',
                'event_type': 'MEMORIAL',
                'status': 'ACTIVE',
                'goal': Decimal('350000'),
                'end_days': 45,
                'donations_range': (6, 12),
                'donation_range': (15000, 120000),
                'num_vouchers': 4,
                'settle_rate': 0.6,
            },
            {
                'title': 'Support Mary\'s Surgery',
                'desc': 'Mary needs an urgent appendectomy. Help us cover her surgical costs and post-operative care.',
                'event_type': 'BIRTHDAY',
                'status': 'ACTIVE',
                'goal': Decimal('500000'),
                'end_days': 60,
                'donations_range': (8, 15),
                'donation_range': (20000, 150000),
                'num_vouchers': 5,
                'settle_rate': 0.5,
            },
            {
                'title': 'Grace Needs Urgent Maternal Care',
                'desc': 'Grace is expecting complications in her pregnancy. Funds will cover prenatal care, delivery, and neonatal support.',
                'event_type': 'WEDDING',
                'status': 'ACTIVE',
                'goal': Decimal('400000'),
                'end_days': 30,
                'donations_range': (5, 10),
                'donation_range': (10000, 100000),
                'num_vouchers': 3,
                'settle_rate': 0.7,
            },
            {
                'title': 'Patricia\'s Diabetes Management Fund',
                'desc': 'Patricia has been diagnosed with Type 2 Diabetes. Help fund her ongoing treatment and insulin supply.',
                'event_type': 'PROMOTION',
                'status': 'ACTIVE',
                'goal': Decimal('250000'),
                'end_days': 90,
                'donations_range': (4, 8),
                'donation_range': (10000, 80000),
                'num_vouchers': 3,
                'settle_rate': 0.4,
            },
            {
                'title': 'Children\'s Vaccination Drive',
                'desc': 'Annual vaccination campaign for under-5 children in Northern Cameroon. Every child deserves immunity.',
                'event_type': 'GRADUATION',
                'status': 'ACTIVE',
                'goal': Decimal('750000'),
                'end_days': 60,
                'donations_range': (10, 20),
                'donation_range': (5000, 60000),
                'num_vouchers': 6,
                'settle_rate': 0.3,
            },
            {
                'title': 'Elderly Care Initiative — Bafoussam',
                'desc': 'Providing medical checkups and medication for 20 elderly patients in Bafoussam.',
                'event_type': 'MEMORIAL',
                'status': 'FUNDED',
                'goal': Decimal('200000'),
                'end_days': -10,  # already ended
                'donations_range': (8, 12),
                'donation_range': (15000, 50000),
                'num_vouchers': 4,
                'settle_rate': 0.8,
            },
            {
                'title': 'Emergency Fund — Flood Victims',
                'desc': 'Emergency medical relief for families displaced by flooding in the Far North region.',
                'event_type': 'BIRTHDAY',
                'status': 'CLOSED',
                'goal': Decimal('600000'),
                'end_days': -30,
                'donations_range': (10, 15),
                'donation_range': (20000, 100000),
                'num_vouchers': 5,
                'settle_rate': 0.9,
            },
            {
                'title': 'Vision Screening Campaign',
                'desc': 'Pilot campaign to provide eye exams and corrective lenses to rural school children.',
                'event_type': 'GRADUATION',
                'status': 'DRAFT',
                'goal': Decimal('150000'),
                'end_days': 45,
                'donations_range': (0, 0),
                'donation_range': (0, 0),
                'num_vouchers': 0,
                'settle_rate': 0,
            },
        ]

        for cfg in campaign_configs:
            donor = random.choice(donors)
            start = timezone.now() - timedelta(days=random.randint(5, 60)) if cfg['end_days'] > 0 else timezone.now() - timedelta(days=abs(cfg['end_days']) + 60)

            campaign, created = Campaign.objects.get_or_create(
                title=cfg['title'],
                defaults={
                    'donor': donor,
                    'description': cfg['desc'],
                    'goal_amount': cfg['goal'],
                    'status': cfg['status'],
                    'event_type': cfg['event_type'],
                    'end_date': timezone.now() + timedelta(days=cfg['end_days']),
                    'is_public': True,
                    'is_active': cfg['status'] not in ['DRAFT', 'CANCELLED'],
                },
            )

            if not created:
                self.stdout.write(f'  • Campaign already exists: {campaign.title}')
                continue

            self.stdout.write(f'  ✓ Created Campaign: {campaign.title} [{cfg["status"]}]')

            # Create donations
            num_donations = random.randint(*cfg['donations_range']) if cfg['donations_range'][1] > 0 else 0
            for _ in range(num_donations):
                donation_donor = random.choice(donors)
                donation_amount = Decimal(random.randint(*cfg['donation_range']))

                app_amount = donation_amount - (donation_amount * Decimal('0.025')).quantize(Decimal('0.01'))
                payment = Payment.objects.create(
                    payment_method=random.choice(['MTN', 'ORANGE']),
                    amount=donation_amount,
                    app_amount=app_amount,
                    phone_number=f'+237{random.randint(100000000, 999999999)}',
                    payment_status='SUCCESS',
                )

                platform_fee = (app_amount * (policy.platform_fee_percentage if policy else Decimal('5')) / Decimal('100')).quantize(Decimal('0.01'))

                Donation.objects.create(
                    campaign=campaign,
                    donor=donation_donor,
                    payment=payment,
                    amount=donation_amount,
                    status='SUCCESS',
                    platform_fee_amount=platform_fee,
                    net_amount=app_amount - platform_fee,
                    donor_name=donation_donor.user.get_full_name if random.random() > 0.2 else 'Anonymous',
                    is_anonymous=random.random() < 0.2,
                    message=random.choice([
                        'Get well soon!', 'Praying for your recovery!', 'Stay strong!',
                        'God bless you!', '', 'Wishing you the best!',
                    ]) or None,
                )
                campaign.refresh_from_db()

            # Create vouchers (skip for DRAFT campaigns)
            if cfg['num_vouchers'] > 0:
                selected = random.sample(beneficiaries, k=min(cfg['num_vouchers'], len(beneficiaries)))
                for beneficiary in selected:
                    hi_list = list(beneficiary.health_issues.all())
                    if not hi_list:
                        continue

                    health_issue = random.choice(hi_list)
                    hospital = random.choice(hospitals)
                    voucher_amount = Decimal(random.randint(50000, 200000))

                    available = campaign.current_amount - campaign.total_disbursed - campaign.currently_allocated
                    if available < voucher_amount:
                        voucher_amount = max(Decimal('5000'), (available * Decimal('0.8')).quantize(Decimal('0.01')))
                    if voucher_amount < Decimal('5000'):
                        continue

                    # Determine voucher status for demo variety
                    v_status = random.choices(
                        ['ACTIVE', 'USED', 'EXPIRED', 'AVAILABLE', 'PENDING_CONFIRMATION'],
                        weights=[30, 35, 10, 15, 10],
                        k=1
                    )[0]

                    voucher = Voucher.objects.create(
                        beneficiary=beneficiary,
                        health_issue=health_issue,
                        hospital=hospital,
                        status=v_status,
                        language_preference=random.choice(['fr', 'en', 'local']),
                    )

                    if v_status == 'ACTIVE':
                        voucher.expiry_date = timezone.now().date() + timedelta(days=random.randint(5, 25))
                        voucher.save(update_fields=['expiry_date'])
                    elif v_status == 'USED':
                        voucher.expiry_date = timezone.now().date() + timedelta(days=15)
                        voucher.redeemed_at = timezone.now() - timedelta(days=random.randint(1, 10))
                        voucher.save(update_fields=['expiry_date', 'redeemed_at'])
                    elif v_status == 'EXPIRED':
                        voucher.expiry_date = timezone.now().date() - timedelta(days=random.randint(1, 30))
                        voucher.expired_at = timezone.now() - timedelta(days=random.randint(1, 30))
                        voucher.save(update_fields=['expiry_date', 'expired_at'])
                    elif v_status == 'PENDING_CONFIRMATION':
                        voucher.expiry_date = timezone.now().date() + timedelta(days=10)
                        voucher.patient_confirmation_pin = ''.join(random.choices('0123456789', k=4))
                        voucher.save(update_fields=['expiry_date', 'patient_confirmation_pin'])

                    self.stdout.write(f'    ✓ Created Voucher: {voucher.voucher_code} [{v_status}]')

                    # Voucher funding
                    vf_status = 'UTILIZED' if v_status in ['USED'] else 'COMMITTED'
                    utilized = voucher_amount * Decimal(str(random.uniform(0.7, 1.0))).quantize(Decimal('0.01')) if vf_status == 'UTILIZED' else Decimal('0')
                    refund = (voucher_amount - utilized) if vf_status == 'UTILIZED' else Decimal('0')

                    vf = VoucherFunding.objects.create(
                        voucher=voucher,
                        campaign=campaign,
                        committed_amount=voucher_amount,
                        utilized_amount=utilized,
                        refund_amount=refund,
                        status=vf_status,
                        utilized_at=timezone.now() if vf_status == 'UTILIZED' else None,
                    )

                    campaign.currently_allocated += voucher_amount
                    campaign.save(update_fields=['currently_allocated'])

                    CampaignTransaction.objects.create(
                        campaign=campaign,
                        voucher_funding=vf,
                        transaction_type='VOUCHER_ALLOCATED',
                        amount=voucher_amount,
                        description=f'Allocated {voucher_amount} XAF to voucher {voucher.voucher_code}',
                    )

                    # Voucher notification
                    VoucherNotification.objects.create(
                        voucher=voucher,
                        campaign=campaign,
                        donor=donor,
                        moment='VOUCHER_ISSUED',
                        message=f'Voucher {voucher.voucher_code} issued to {beneficiary.full_name} for {health_issue.description}.',
                    )

                    # Medical claim for USED vouchers
                    if v_status == 'USED':
                        receptionist = Receptionist.objects.filter(hospital=hospital).first()
                        settle_amount = utilized

                        claim = MedicalClaim.objects.create(
                            voucher=voucher,
                            hospital=hospital,
                            service_description=f'Treatment for {health_issue.description}',
                            total_cost=settle_amount,
                            claim_status='APPROVED',
                            submitted_by=receptionist,
                            reviewed_by=sys_admin,
                            reviewed_at=timezone.now(),
                            service_completed_at=timezone.now() - timedelta(hours=random.randint(1, 48)),
                        )

                        # Claim items
                        services = hospital.services.all()
                        if services:
                            svc = random.choice(list(services))
                            ClaimItem.objects.create(
                                medical_claim=claim,
                                name=svc.name,
                                amount=settle_amount,
                            )

                        ClaimItem.objects.create(
                            medical_claim=claim,
                            name='Consultation Fee',
                            amount=Decimal(random.randint(2000, 5000)),
                        )

                        ClaimItem.objects.create(
                            medical_claim=claim,
                            name='Medication',
                            amount=Decimal(random.randint(3000, 15000)),
                        )

                        # Claim proof
                        MedicalClaimProof.objects.create(
                            medical_claim=claim,
                            document_type=random.choice(['BILL', 'PRESCRIPTION', 'DISCHARGE']),
                            verification_status='VERIFIED',
                            uploaded_by=receptionist,
                            verified_by=sys_admin,
                            verified_at=timezone.now(),
                        )

                        # Update campaign totals
                        campaign.currently_allocated -= voucher_amount
                        campaign.total_disbursed += settle_amount
                        campaign.save(update_fields=['currently_allocated', 'total_disbursed'])

                        CampaignTransaction.objects.create(
                            campaign=campaign,
                            voucher_funding=vf,
                            transaction_type='HOSPITAL_SETTLED',
                            amount=settle_amount,
                            description=f'Settled {settle_amount} XAF to {hospital.name} for voucher {voucher.voucher_code}',
                        )

                        if refund > 0:
                            CampaignTransaction.objects.create(
                                campaign=campaign,
                                voucher_funding=vf,
                                transaction_type='SURPLUS_REFUND',
                                amount=refund,
                                description=f'Refunded {refund} XAF surplus from voucher {voucher.voucher_code}',
                            )

                        VoucherNotification.objects.create(
                            voucher=voucher,
                            campaign=campaign,
                            donor=donor,
                            moment='VOUCHER_REDEEMED',
                            message=f'Voucher {voucher.voucher_code} successfully redeemed at {hospital.name}. Treatment cost: {settle_amount} XAF.',
                        )

                    # Voucher expired notification
                    elif v_status == 'EXPIRED':
                        CampaignTransaction.objects.create(
                            campaign=campaign,
                            voucher_funding=vf,
                            transaction_type='VOUCHER_EXPIRED_RETURN',
                            amount=voucher_amount,
                            description=f'Expired voucher {voucher.voucher_code}: {voucher_amount} XAF returned to campaign.',
                        )

                        campaign.currently_allocated -= voucher_amount
                        campaign.save(update_fields=['currently_allocated'])

                        VoucherNotification.objects.create(
                            voucher=voucher,
                            campaign=campaign,
                            donor=donor,
                            moment='VOUCHER_EXPIRED',
                            message=f'Voucher {voucher.voucher_code} has expired without being redeemed. Funds returned to campaign.',
                        )

        self.stdout.write(f'  ✓ Total campaigns: {Campaign.objects.count()}')
        self.stdout.write(f'  ✓ Total donations: {Donation.objects.count()}')
        self.stdout.write(f'  ✓ Total vouchers: {Voucher.objects.count()}')

    # -----------------------------------------------------------------------
    # 7. Transactions + Disbursements
    # -----------------------------------------------------------------------
    def seed_transactions_and_disbursements(self):
        self.stdout.write('\nSeeding transactions and disbursements...')

        escrow = EscrowAccount.get_instance()
        fee_account = FeeAccount.get_instance()
        gateways = list(PaymentGateway.objects.all())
        policy = FeePolicy.objects.filter(is_active=True).first()
        sys_admin = SystemAdmin.objects.first()

        if not gateways:
            self.stdout.write('  ! No payment gateways found. Skipping.')
            return

        # Create transaction records for existing successful donations
        donations = Donation.objects.filter(status='SUCCESS').select_related('payment', 'campaign', 'donor')
        gw_tn_counter = 1000

        for donation in donations:
            gateway = random.choice(gateways)

            # Donation IN transaction
            txn, created = Transaction.objects.get_or_create(
                donation=donation,
                type='DONATION',
                defaults={
                    'direction': 'IN',
                    'amount': donation.payment.app_amount,
                    'currency': 'XAF',
                    'gateway': gateway,
                    'gateway_transaction_id': f'GW-{gw_tn_counter:06d}',
                    'status': 'SUCCESSFUL',
                    'destination': escrow,
                    'metadata': {
                        'payment_method': donation.payment.payment_method,
                        'donor_email': donation.donor.user.email if donation.donor else None,
                        'campaign_title': donation.campaign.title,
                    },
                },
            )
            if created:
                gw_tn_counter += 1

                # Create FeeSplit
                if policy:
                    gross = donation.amount
                    escrow_amt = (gross * policy.escrow_fee_percentage / Decimal('100')).quantize(Decimal('0.01'))
                    platform_amt = (gross * policy.platform_fee_percentage / Decimal('100')).quantize(Decimal('0.01'))

                    FeeSplit.objects.get_or_create(
                        transaction=txn,
                        defaults={
                            'fee_policy': policy,
                            'gross_amount': gross,
                            'escrow_amount': escrow_amt,
                            'platform_amount': platform_amt,
                        },
                    )

                    # Platform fee OUT transaction
                    Transaction.objects.get_or_create(
                        type='PLATFORM_FEE',
                        gateway_transaction_id=f'GW-{gw_tn_counter:06d}',
                        defaults={
                            'direction': 'OUT',
                            'amount': platform_amt,
                            'currency': 'XAF',
                            'status': 'SUCCESSFUL',
                            'source': escrow,
                            'destination': fee_account,
                            'metadata': {'description': f'Platform fee from donation {donation.id}'},
                        },
                    )
                    gw_tn_counter += 1

        self.stdout.write(f'  ✓ Created {Transaction.objects.count()} payment transactions')
        self.stdout.write(f'  ✓ Created {FeeSplit.objects.count()} fee splits')

        # Disbursements for USED vouchers
        used_vouchers = Voucher.objects.filter(status='USED').select_related('hospital', 'beneficiary')
        for voucher in used_vouchers:
            claim = MedicalClaim.objects.filter(voucher=voucher, claim_status='APPROVED').first()
            if not claim:
                continue

            existing = Disbursement.objects.filter(voucher=voucher).exists()
            if existing:
                continue

            gateway = random.choice(gateways)
            hosp = voucher.hospital

            disbursement = Disbursement.objects.create(
                hospital=hosp,
                amount=claim.total_cost,
                currency='XAF',
                payment_method=random.choice(['MOMO', 'BANK_TRANSFER']),
                recipient_phone=hosp.momo_number or hosp.phone_number,
                recipient_account=hosp.bank_account_number,
                status='COMPLETED',
                external_reference=f'DISB-{uuid.uuid4().hex[:10].upper()}',
                voucher=voucher,
                gateway_transaction_id=f'DISP-{gw_tn_counter:06d}',
                notes=f'Disbursement for voucher {voucher.voucher_code} — {claim.service_description}',
                disbursed_at=timezone.now() - timedelta(days=random.randint(0, 5)),
                created_by=hosp.admins.first().user if hosp.admins.exists() else None,
            )
            gw_tn_counter += 1

            # Create a unique OUT transaction for this disbursement
            out_txn = Transaction.objects.create(
                type='DISBURSEMENT',
                direction='OUT',
                amount=claim.total_cost,
                currency='XAF',
                gateway=gateway,
                gateway_transaction_id=f'DISP-TXN-{gw_tn_counter:06d}',
                status='SUCCESSFUL',
                source=escrow,
                metadata={
                    'hospital': hosp.name,
                    'voucher_code': voucher.voucher_code,
                },
            )
            gw_tn_counter += 1

            disbursement.transaction = out_txn
            disbursement.save(update_fields=['transaction'])

        self.stdout.write(f'  ✓ Created {Disbursement.objects.count()} disbursements')

    # -----------------------------------------------------------------------
    # 8. Notifications
    # -----------------------------------------------------------------------
    def seed_notifications(self):
        self.stdout.write('\nSeeding notifications...')

        users = list(User.objects.all())
        if not users:
            return

        notif_templates = [
            {'type': 'WELCOME', 'title': 'Welcome to JoyFund!', 'message': 'Thank you for joining JoyFund. Together we can make healthcare accessible to all.'},
            {'type': 'SYSTEM', 'title': 'System Maintenance Notice', 'message': 'Scheduled maintenance on Sunday 2:00 AM - 4:00 AM WAT. Services may be briefly unavailable.'},
            {'type': 'ANNOUNCEMENT', 'title': 'New Hospital Partner', 'message': 'We are excited to welcome Kribi General Hospital to our network of partner healthcare facilities.'},
            {'type': 'CAMPAIGN_UPDATE', 'title': 'Campaign Milestone Reached', 'message': 'Great news! A campaign you support has reached 50% of its funding goal.'},
            {'type': 'CAMPAIGN_UPDATE', 'title': 'Campaign Goal Achieved', 'message': 'Congratulations! A campaign has reached its full funding goal. Impact certificates are being generated.'},
            {'type': 'DONATION_RECEIVED', 'title': 'Donation Received', 'message': 'A new donation of 50,000 XAF has been received for a campaign. Thank you!'},
            {'type': 'DONATION_SENT', 'title': 'Donation Confirmed', 'message': 'Your donation of 25,000 XAF has been successfully processed. You are making a difference!'},
            {'type': 'BENEFICIARY_UPDATE', 'title': 'Beneficiary Status Updated', 'message': 'A beneficiary in your care has been verified and their health issue has been validated.'},
            {'type': 'PAYMENT_NOTIFICATION', 'title': 'Payment Processed', 'message': 'A disbursement of 120,000 XAF has been completed to General Regional Hospital.'},
            {'type': 'VERIFICATION_STATUS', 'title': 'Verification Complete', 'message': 'Your account has been verified. You now have full access to all JoyFund features.'},
            {'type': 'ALERT', 'title': 'Urgent: Voucher Expiring Soon', 'message': 'A voucher issued for a beneficiary will expire in 3 days. Please ensure it is used.'},
            {'type': 'ALERT', 'title': 'Claim Pending Review', 'message': 'A new medical claim has been submitted and is awaiting admin review.'},
        ]

        created_count = 0
        for user in users:
            # Give each user 3-6 notifications
            num = random.randint(3, 6)
            templates = random.sample(notif_templates, k=min(num, len(notif_templates)))
            for tmpl in templates:
                Notification.objects.create(
                    user=user,
                    title=tmpl['title'],
                    message=tmpl['message'],
                    notification_type=tmpl['type'],
                    is_read=random.random() > 0.4,
                    action_url=random.choice([None, 'https://joyfund.app/campaigns', 'https://joyfund.app/beneficiaries']),
                )
                created_count += 1

        self.stdout.write(f'  ✓ Created {created_count} notifications')

    # -----------------------------------------------------------------------
    # 9. Logs (Activity, Request, Error)
    # -----------------------------------------------------------------------
    def seed_logs(self):
        self.stdout.write('\nSeeding activity, request, and error logs...')

        users = list(User.objects.all())
        if not users:
            return

        # --- Activity Logs ---
        activity_templates = [
            {'action': 'user.login', 'portal': 'DONOR_PORTAL', 'desc': 'User logged in successfully', 'level': 'INFO', 'source': 'API'},
            {'action': 'user.login', 'portal': 'HOSPITAL_ADMIN_PORTAL', 'desc': 'Hospital admin logged in', 'level': 'INFO', 'source': 'API'},
            {'action': 'user.login', 'portal': 'SYSTEM_ADMIN_PORTAL', 'desc': 'System admin logged in', 'level': 'INFO', 'source': 'API'},
            {'action': 'campaign.created', 'portal': 'DONOR_PORTAL', 'desc': 'New campaign created', 'level': 'INFO', 'source': 'SERVICE'},
            {'action': 'campaign.updated', 'portal': 'DONOR_PORTAL', 'desc': 'Campaign details updated', 'level': 'INFO', 'source': 'API'},
            {'action': 'donation.created', 'portal': 'DONOR_PORTAL', 'desc': 'New donation processed', 'level': 'INFO', 'source': 'SERVICE'},
            {'action': 'donation.received', 'portal': 'DONOR_PORTAL', 'desc': 'Donation successfully received', 'level': 'INFO', 'source': 'SIGNAL'},
            {'action': 'voucher.issued', 'portal': 'SOCIAL_WORKER_PORTAL', 'desc': 'New voucher issued to beneficiary', 'level': 'INFO', 'source': 'SERVICE'},
            {'action': 'voucher.redeemed', 'portal': 'RECEPTIONIST_PORTAL', 'desc': 'Voucher redeemed at hospital', 'level': 'INFO', 'source': 'API'},
            {'action': 'claim.submitted', 'portal': 'RECEPTIONIST_PORTAL', 'desc': 'Medical claim submitted for review', 'level': 'INFO', 'source': 'API'},
            {'action': 'claim.approved', 'portal': 'SYSTEM_ADMIN_PORTAL', 'desc': 'Medical claim approved by admin', 'level': 'INFO', 'source': 'SERVICE'},
            {'action': 'claim.rejected', 'portal': 'SYSTEM_ADMIN_PORTAL', 'desc': 'Medical claim rejected', 'level': 'WARNING', 'source': 'SERVICE'},
            {'action': 'beneficiary.enrolled', 'portal': 'SOCIAL_WORKER_PORTAL', 'desc': 'New beneficiary enrolled', 'level': 'INFO', 'source': 'API'},
            {'action': 'beneficiary.verified', 'portal': 'SYSTEM_ADMIN_PORTAL', 'desc': 'Beneficiary identity verified', 'level': 'INFO', 'source': 'SERVICE'},
            {'action': 'hospital.registered', 'portal': 'SYSTEM_ADMIN_PORTAL', 'desc': 'New hospital partner registered', 'level': 'INFO', 'source': 'API'},
            {'action': 'hospital.approved', 'portal': 'SYSTEM_ADMIN_PORTAL', 'desc': 'Hospital partnership approved', 'level': 'INFO', 'source': 'SERVICE'},
            {'action': 'disbursement.completed', 'portal': 'HOSPITAL_ADMIN_PORTAL', 'desc': 'Disbursement to hospital completed', 'level': 'INFO', 'source': 'SERVICE'},
            {'action': 'disbursement.failed', 'portal': 'HOSPITAL_ADMIN_PORTAL', 'desc': 'Disbursement failed — insufficient funds', 'level': 'ERROR', 'source': 'SERVICE'},
            {'action': 'payment.received', 'portal': 'DONOR_PORTAL', 'desc': 'Payment received from donor', 'level': 'INFO', 'source': 'WEBHOOK'},
            {'action': 'payment.failed', 'portal': 'DONOR_PORTAL', 'desc': 'Payment processing failed', 'level': 'ERROR', 'source': 'WEBHOOK'},
            {'action': 'health_issue.reported', 'portal': 'SOCIAL_WORKER_PORTAL', 'desc': 'Health issue reported for beneficiary', 'level': 'INFO', 'source': 'API'},
            {'action': 'health_issue.validated', 'portal': 'SYSTEM_ADMIN_PORTAL', 'desc': 'Health issue validated by admin', 'level': 'INFO', 'source': 'SERVICE'},
            {'action': 'health_issue.rejected', 'portal': 'SYSTEM_ADMIN_PORTAL', 'desc': 'Health issue rejected — insufficient evidence', 'level': 'WARNING', 'source': 'SERVICE'},
            {'action': 'user.logout', 'portal': 'DONOR_PORTAL', 'desc': 'User logged out', 'level': 'INFO', 'source': 'API'},
            {'action': 'profile.updated', 'portal': 'DONOR_PORTAL', 'desc': 'User profile updated', 'level': 'INFO', 'source': 'API'},
            {'action': 'notification.sent', 'portal': None, 'desc': 'Push notification sent to user device', 'level': 'INFO', 'source': 'CELERY_TASK'},
            {'action': 'certificate.generated', 'portal': 'SYSTEM_ADMIN_PORTAL', 'desc': 'Impact certificate generated for completed campaign', 'level': 'INFO', 'source': 'CELERY_TASK'},
        ]

        act_count = 0
        for _ in range(50):
            tmpl = random.choice(activity_templates)
            user = random.choice(users)
            ActivityLog.objects.create(
                user=user,
                actor_label=user.email,
                action=tmpl['action'],
                portal=tmpl['portal'],
                source=tmpl['source'],
                level=tmpl['level'],
                target_type=random.choice(['Campaign', 'Donation', 'Voucher', 'Beneficiary', 'Hospital', 'MedicalClaim', None]),
                target_id=str(uuid.uuid4())[:8],
                target_label=random.choice(['Test Campaign', 'Test Donation', 'Test Voucher', None]),
                description=tmpl['desc'],
                metadata={'ip': f'192.168.1.{random.randint(1, 254)}'},
                ip_address=f'192.168.1.{random.randint(1, 254)}',
                user_agent=random.choice([
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/125.0',
                    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0) Safari/605.1.15',
                    'Mozilla/5.0 (Linux; Android 14) Chrome/125.0 Mobile',
                    'JoyFund-Flutter/1.0',
                ]),
            )
            act_count += 1

        self.stdout.write(f'  ✓ Created {act_count} activity logs')

        # --- Request Logs ---
        api_paths = [
            ('POST', '/api/v1/auth/login/', 'user.login'),
            ('GET', '/api/v1/campaigns/', 'list_campaigns'),
            ('GET', '/api/v1/campaigns/{id}/', 'get_campaign'),
            ('POST', '/api/v1/campaigns/', 'create_campaign'),
            ('POST', '/api/v1/donations/', 'create_donation'),
            ('GET', '/api/v1/beneficiaries/', 'list_beneficiaries'),
            ('POST', '/api/v1/beneficiaries/', 'create_beneficiary'),
            ('GET', '/api/v1/hospitals/', 'list_hospitals'),
            ('GET', '/api/v1/vouchers/', 'list_vouchers'),
            ('POST', '/api/v1/vouchers/redeem/', 'redeem_voucher'),
            ('GET', '/api/v1/medical-claims/', 'list_claims'),
            ('POST', '/api/v1/medical-claims/', 'create_claim'),
            ('PATCH', '/api/v1/medical-claims/{id}/', 'update_claim'),
            ('GET', '/api/v1/notifications/', 'list_notifications'),
            ('PATCH', '/api/v1/notifications/{id}/read/', 'mark_notification_read'),
            ('GET', '/api/v1/transactions/', 'list_transactions'),
            ('GET', '/api/v1/disbursements/', 'list_disbursements'),
        ]

        req_count = 0
        for _ in range(40):
            method, path, action = random.choice(api_paths)
            user = random.choice(users)
            RequestLog.objects.create(
                request_id=str(uuid.uuid4()),
                user=user,
                source='API',
                method=method,
                path=path,
                view_name=action,
                action=action.replace('_', ' ').title(),
                status_code=random.choice([200, 201, 204, 400, 401, 403, 404, 500]),
                response_time_ms=random.randint(15, 2500),
                ip_address=f'192.168.1.{random.randint(1, 254)}',
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/125.0',
            )
            req_count += 1

        self.stdout.write(f'  ✓ Created {req_count} request logs')

        # --- Error Logs ---
        error_templates = [
            {'type': 'ValidationError', 'msg': 'Invalid phone number format. Expected +237XXXXXXXXX.', 'path': '/api/v1/beneficiaries/'},
            {'type': 'PermissionDenied', 'msg': 'User does not have permission to perform this action.', 'path': '/api/v1/admin/settings/'},
            {'type': 'DatabaseError', 'msg': 'Connection to database timed out after 30 seconds.', 'path': '/api/v1/campaigns/'},
            {'type': 'PaymentGatewayError', 'msg': 'MTN MoMo API returned error: INSUFFICIENT_BALANCE.', 'path': '/api/v1/donations/'},
            {'type': 'ObjectDoesNotExist', 'msg': 'Voucher with code ABC123 not found.', 'path': '/api/v1/vouchers/redeem/'},
            {'type': 'ValueError', 'msg': 'Invalid voucher amount: must be greater than 0.', 'path': '/api/v1/vouchers/'},
            {'type': 'TimeoutError', 'msg': 'Payment gateway response timeout after 60 seconds.', 'path': '/api/v1/donations/'},
            {'type': 'FileNotFoundError', 'msg': 'Certificate template file not found at /templates/certificate.html.', 'path': '/api/v1/certificates/generate/'},
        ]

        err_count = 0
        for _ in range(8):
            tmpl = random.choice(error_templates)
            user = random.choice(users)
            ErrorLog.objects.create(
                request_id=str(uuid.uuid4()),
                user=user,
                source=random.choice(['API', 'SERVICE', 'CELERY_TASK', 'WEBHOOK']),
                error_type=tmpl['type'],
                error_message=tmpl['msg'],
                path=tmpl['path'],
                extra={'severity': random.choice(['low', 'medium', 'high'])},
            )
            err_count += 1

        self.stdout.write(f'  ✓ Created {err_count} error logs')

    # -----------------------------------------------------------------------
    # Clear
    # -----------------------------------------------------------------------
    def clear_seeded_data(self):
        self.stdout.write(self.style.WARNING('\nClearing all seeded data...'))

        from logs.models import ErrorLog, RequestLog, ActivityLog
        from notifications.models import Notification
        from payments.models import Disbursement, Transaction, FeeSplit, PaymentGateway, FeePolicy
        from payments.models import EscrowAccount, FeeAccount
        from hospitals.models import Hospital, Services, MedicalClaim, ClaimItem, MedicalClaimProof, VoucherTopUpRequest
        from campaigns.models import Campaign, Donation, Payment, CampaignTransaction
        from vouchers.models import Voucher, VoucherFunding, VoucherNotification
        from beneficiaries.models import Beneficiary, HealthIssue, BeneficiaryDocument, HealthIssueEvent

        # Delete in dependency order
        steps = [
            ('Error logs', ErrorLog),
            ('Request logs', RequestLog),
            ('Activity logs', ActivityLog),
            ('Notifications', Notification),
            ('Disbursements', Disbursement),
            ('Fee splits', FeeSplit),
            ('Transactions', Transaction),
            ('Webhook events', PaymentGateway),
            ('Payment gateways', PaymentGateway),
            ('Fee policies', FeePolicy),
            ('Top-up requests', VoucherTopUpRequest),
            ('Claim proofs', MedicalClaimProof),
            ('Claim items', ClaimItem),
            ('Medical claims', MedicalClaim),
            ('Voucher notifications', VoucherNotification),
            ('Voucher funding', VoucherFunding),
            ('Vouchers', Voucher),
            ('Campaign transactions', CampaignTransaction),
            ('Donations', Donation),
            ('Payments', Payment),
            ('Campaigns', Campaign),
            ('Health issue events', HealthIssueEvent),
            ('Health issues', HealthIssue),
            ('Beneficiary documents', BeneficiaryDocument),
        ]

        for label, model in steps:
            count = model.objects.count()
            if count > 0:
                model.objects.all().delete()
                self.stdout.write(f'  • Deleted {count} {label}')

        # Truncate beneficiaries to reset sequences
        from django.db import connections
        try:
            with connections['default'].cursor() as cursor:
                cursor.execute('SET CONSTRAINTS ALL DEFERRED;')
                cursor.execute('TRUNCATE TABLE beneficiaries_beneficiary RESTART IDENTITY CASCADE;')
                cursor.execute('SET CONSTRAINTS ALL IMMEDIATE;')
                self.stdout.write('  • Truncated beneficiaries table')
        except Exception:
            Beneficiary.objects.all().delete()
            self.stdout.write('  • Deleted all beneficiaries (fallback)')

        # Delete services and hospitals
        Services.objects.all().delete()
        Hospital.objects.all().delete()
        self.stdout.write('  • Deleted hospitals and services')

        # Delete hospital staff users (these cascade to HospitalAdmin/Receptionist)
        User.objects.filter(email__contains='receptionist-').delete()
        User.objects.filter(email__contains='admin-').delete()
        User.objects.filter(email__contains='example').delete()
        User.objects.filter(email__contains='socialworker').delete()
        User.objects.filter(email__contains='donor').delete()
        User.objects.filter(email='admin@joyfund.com').delete()
        self.stdout.write('  • Deleted test users')

        # Delete singleton accounts
        try:
            EscrowAccount.objects.all().delete()
        except Exception:
            pass
        try:
            FeeAccount.objects.all().delete()
        except Exception:
            pass
        self.stdout.write('  • Deleted singleton accounts')

        self.stdout.write(self.style.SUCCESS('✓ All seeded data cleared'))
