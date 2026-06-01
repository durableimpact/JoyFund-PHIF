from __future__ import annotations

from django.contrib.gis.geos import Point
from accounts.models import User, Role
from accounts.models.system_admin import SystemAdmin
from accounts.models.hospital_admin import HospitalAdmin
from accounts.models.receptionist import Receptionist
from accounts.models.social_worker import SocialWorker
from accounts.models.donor import Donor
from hospitals.models import Hospital, PartnershipStatus


def ensure_seed_users() -> None:
    """Create the default seeded users and hospital if they do not exist."""

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
        },
    )
    if created:
        print(f'Created Hospital: {hospital.name}')
    else:
        print(f'Hospital already exists: {hospital.name}')

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
        sys_admin_user.set_password('JoyThreatAdmin')
        sys_admin_user.save()
        SystemAdmin.objects.get_or_create(user=sys_admin_user)
        print(f'Created System Admin: {sys_admin_user.email}')
    else:
        print(f'System Admin already exists: {sys_admin_user.email}')

    hosp_admin_user, created = User.objects.get_or_create(
        email='hospital_admin@joyfund.com',
        defaults={
            'first_name': 'Hospital',
            'last_name': 'Admin',
            'phone_number': '+237650537466',
            'role': Role.HOSPITAL_ADMIN,
            'is_active': True,
            'is_verified': True,
        },
    )
    if created:
        hosp_admin_user.set_password('JoyHospAdmin')
        hosp_admin_user.save()
    HospitalAdmin.objects.get_or_create(
        user=hosp_admin_user,
        defaults={
            'hospital': hospital,
            'enrolled_by': SystemAdmin.objects.get(user=sys_admin_user),
            'national_id_number': 'NID-12345',
            'front_national_id_image': '',
            'back_national_id_image': '',
        },
    )
    if created:
        print(f'Created Hospital Admin: {hosp_admin_user.email}')
    else:
        print(f'Hospital Admin already exists: {hosp_admin_user.email}')

    receptionist_user, created = User.objects.get_or_create(
        email='receptionist@joyfund.com',
        defaults={
            'first_name': 'Desk',
            'last_name': 'Receptionist',
            'phone_number': '+237650537467',
            'role': Role.RECEPTIONIST,
            'is_active': True,
            'is_verified': True,
        },
    )
    if created:
        receptionist_user.set_password('JoyReceptionist')
        receptionist_user.save()
    Receptionist.objects.get_or_create(
        user=receptionist_user,
        defaults={
            'hospital': hospital,
            'enrolled_by': HospitalAdmin.objects.get(user=hosp_admin_user),
            'national_id_number': 'NID-23456',
            'front_national_id_image': '',
            'back_national_id_image': '',
        },
    )
    if created:
        print(f'Created Receptionist: {receptionist_user.email}')
    else:
        print(f'Receptionist already exists: {receptionist_user.email}')

    social_worker_user, created = User.objects.get_or_create(
        email='social_worker@joyfund.com',
        defaults={
            'first_name': 'Care',
            'last_name': 'Worker',
            'phone_number': '+237650537468',
            'role': Role.SOCIAL_WORKER,
            'is_active': True,
            'is_verified': True,
        },
    )
    if created:
        social_worker_user.set_password('password')
        social_worker_user.save()
    SocialWorker.objects.get_or_create(
        user=social_worker_user,
        defaults={
            'is_approved': True,
            'organization': 'Red Cross Cameroon',
            'region_assigned': 'Littoral',
            'enrolled_by': SystemAdmin.objects.get(user=sys_admin_user),
            'national_id_number': 'NID-34567',
            'front_national_id_image': '',
            'back_national_id_image': '',
        },
    )
    if created:
        print(f'Created Social Worker: {social_worker_user.email}')
    else:
        print(f'Social Worker already exists: {social_worker_user.email}')

    donor_user, created = User.objects.get_or_create(
        email='donor@joyfund.com',
        defaults={
            'first_name': 'Generous',
            'last_name': 'Donor',
            'phone_number': '+237650537469',
            'role': Role.DONOR,
            'is_active': True,
            'is_verified': True,
        },
    )
    if created:
        donor_user.set_password('password')
        donor_user.save()
    Donor.objects.get_or_create(user=donor_user)
    if created:
        print(f'Created Donor: {donor_user.email}')
    else:
        print(f'Donor already exists: {donor_user.email}')

    print('Seed user initialization complete.')
