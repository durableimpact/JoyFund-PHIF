from django.core.management.base import BaseCommand
from django.contrib.gis.geos import Point
from accounts.models import User, Role
from accounts.models.system_admin import SystemAdmin
from accounts.models.hospital_admin import HospitalAdmin
from accounts.models.receptionist import Receptionist
from accounts.models.social_worker import SocialWorker
from accounts.models.donor import Donor
from hospitals.models import Hospital, PartnershipStatus

class Command(BaseCommand):
    help = 'Initializes the database with different types of users and a hospital.'

    def handle(self, *args, **kwargs):
        self.stdout.write('Starting initialization...')

        # 1. Create a Hospital
        hospital, created = Hospital.objects.get_or_create(
            email='info@generalhospital.com',
            defaults={
                'name': 'General Regional Hospital',
                'accreditation_number': 'ACC-123456',
                'licence_number': 'LIC-789012',
                'region': 'Littoral',
                'city': 'Douala',
                'address': '123 Health Ave',
                'gps_coordinates': Point(9.7090, 4.0511),
                'phone_number': '+237670000000',
                'partnership_status': PartnershipStatus.ACTIVE,
                'is_active': True,
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created Hospital: {hospital.name}'))
        else:
            self.stdout.write(f'Hospital already exists: {hospital.name}')

        # 2. Create System Admin
        sys_admin_user, created = User.objects.get_or_create(
            email='admin@example.com',
            defaults={
                'first_name': 'System',
                'last_name': 'Admin',
                'phone_number': '+237670000001',
                'role': Role.SYSTEM_ADMIN,
                'is_staff': True,
                'is_superuser': True,
                'is_active': True,
                'is_verified': True,
            }
        )
        if created:
            sys_admin_user.set_password('password123')
            sys_admin_user.save()
            sys_admin_profile = SystemAdmin.objects.create(user=sys_admin_user)
            self.stdout.write(self.style.SUCCESS(f'Created System Admin: {sys_admin_user.email}'))
        else:
            sys_admin_profile = SystemAdmin.objects.get(user=sys_admin_user)
            self.stdout.write(f'System Admin already exists: {sys_admin_user.email}')

        # 3. Create Hospital Admin
        hosp_admin_user, created = User.objects.get_or_create(
            email='hospital_admin@example.com',
            defaults={
                'first_name': 'Hospital',
                'last_name': 'Admin',
                'phone_number': '+237670000002',
                'role': Role.HOSPITAL_ADMIN,
                'is_active': True,
                'is_verified': True,
            }
        )
        if created:
            hosp_admin_user.set_password('password123')
            hosp_admin_user.save()
            hosp_admin_profile = HospitalAdmin.objects.create(
                user=hosp_admin_user,
                hospital=hospital,
                enrolled_by=sys_admin_profile,
                national_id='NID-12345'
            )
            self.stdout.write(self.style.SUCCESS(f'Created Hospital Admin: {hosp_admin_user.email} assigned to {hospital.name}'))
        else:
            hosp_admin_profile = HospitalAdmin.objects.get(user=hosp_admin_user)
            self.stdout.write(f'Hospital Admin already exists: {hosp_admin_user.email}')

        # 4. Create Receptionist
        receptionist_user, created = User.objects.get_or_create(
            email='receptionist@example.com',
            defaults={
                'first_name': 'Desk',
                'last_name': 'Receptionist',
                'phone_number': '+237670000003',
                'role': Role.RECEPTIONIST,
                'is_active': True,
                'is_verified': True,
            }
        )
        if created:
            receptionist_user.set_password('password123')
            receptionist_user.save()
            receptionist_profile = Receptionist.objects.create(
                user=receptionist_user,
                enrolled_by=hosp_admin_profile,
                hospital=hospital,
                national_id='NID-23456'
            )
            self.stdout.write(self.style.SUCCESS(f'Created Receptionist: {receptionist_user.email} assigned to {hospital.name}'))
        else:
            self.stdout.write(f'Receptionist already exists: {receptionist_user.email}')

        # 5. Create Social Worker
        social_worker_user, created = User.objects.get_or_create(
            email='social_worker@example.com',
            defaults={
                'first_name': 'Care',
                'last_name': 'Worker',
                'phone_number': '+237670000004',
                'role': Role.SOCIAL_WORKER,
                'is_active': True,
                'is_verified': True,
            }
        )
        if created:
            social_worker_user.set_password('password123')
            social_worker_user.save()
            social_worker_profile = SocialWorker.objects.create(
                user=social_worker_user,
                is_approved=True,
                organization='Red Cross Cameroon',
                region_assigned='Littoral',
                enrolled_by=sys_admin_profile,
                national_id='NID-34567'
            )
            self.stdout.write(self.style.SUCCESS(f'Created Social Worker: {social_worker_user.email}'))
        else:
            self.stdout.write(f'Social Worker already exists: {social_worker_user.email}')

        # 6. Create Donor
        donor_user, created = User.objects.get_or_create(
            email='donor@example.com',
            defaults={
                'first_name': 'Generous',
                'last_name': 'Donor',
                'phone_number': '+237670000005',
                'role': Role.DONOR,
                'is_active': True,
                'is_verified': True,
            }
        )
        if created:
            donor_user.set_password('password123')
            donor_user.save()
            donor_profile = Donor.objects.create(user=donor_user)
            self.stdout.write(self.style.SUCCESS(f'Created Donor: {donor_user.email}'))
        else:
            self.stdout.write(f'Donor already exists: {donor_user.email}')

        self.stdout.write(self.style.SUCCESS('Initialization complete! Test users all have password "password123".'))
