from rest_framework import serializers

from accounts.models import Role, User


class UserReadSerializer(serializers.ModelSerializer):
    """Read-only user representation embedded inside profile detail serializers."""

    class Meta:
        model = User
        fields = [
            'id', 'email',
            'first_name', 'last_name',
            'phone_number', 'perfered_language',
            'role', 'is_verified',
            'created_at', 'updated_at',
        ]
        read_only_fields = fields


class DonorProfileSerializer(serializers.Serializer):
    """Profile structure for DONOR role."""
    id = serializers.UUIDField()


class HospitalAdminProfileSerializer(serializers.Serializer):
    """Profile structure for HOSPITAL_ADMIN role."""
    id = serializers.UUIDField()
    national_id_number = serializers.CharField()
    front_national_id_image = serializers.URLField(allow_null=True)
    back_national_id_image = serializers.URLField(allow_null=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)


class ReceptionistProfileSerializer(serializers.Serializer):
    """Profile structure for RECEPTIONIST role."""
    id = serializers.UUIDField()
    national_id_number = serializers.CharField()
    front_national_id_image = serializers.URLField(allow_null=True)
    back_national_id_image = serializers.URLField(allow_null=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)


class SocialWorkerProfileSerializer(serializers.Serializer):
    """Profile structure for SOCIAL_WORKER role."""
    id = serializers.UUIDField()
    national_id_number = serializers.CharField()
    front_national_id_image = serializers.URLField(allow_null=True)
    back_national_id_image = serializers.URLField(allow_null=True)
    organization = serializers.CharField()
    region_assigned = serializers.CharField()
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)


class SystemAdminProfileSerializer(serializers.Serializer):
    """Profile structure for SYSTEM_ADMIN role."""
    id = serializers.UUIDField()


class UserInfoSerializer(serializers.ModelSerializer):
    """
    Comprehensive user info serializer that returns full user + profile data based on role.
    
    HOSPITAL_ADMIN & RECEPTIONIST: Returns user + profile + hospital
    DONOR, SOCIAL_WORKER, SYSTEM_ADMIN: Returns user + profile
    
    Response structure is clearly defined by nested serializers so frontend knows exactly what to expect.
    """
    profile = serializers.SerializerMethodField(read_only=True)
    hospital = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email',
            'first_name', 'last_name',
            'phone_number', 'perfered_language',
            'role', 'is_verified',
            'created_at', 'updated_at',
            'profile', 'hospital',
        ]
        read_only_fields = fields

    def get_profile(self, obj):
        """Get the profile object based on user role with full structure."""
        from accounts.models import Donor, HospitalAdmin, Receptionist, SocialWorker, SystemAdmin
        
        role = obj.role

        if role == Role.DONOR:
            try:
                donor = obj.donor
                return DonorProfileSerializer(donor).data
            except Donor.DoesNotExist:
                return None
                
        elif role == Role.HOSPITAL_ADMIN:
            try:
                hospital_admin = obj.hospitaladmin
                return HospitalAdminProfileSerializer(hospital_admin).data
            except HospitalAdmin.DoesNotExist:
                return None
                
        elif role == Role.RECEPTIONIST:
            try:
                receptionist = obj.receptionist
                return ReceptionistProfileSerializer(receptionist).data
            except Receptionist.DoesNotExist:
                return None
                
        elif role == Role.SOCIAL_WORKER:
            try:
                social_worker = obj.socialworker
                return SocialWorkerProfileSerializer(social_worker).data
            except SocialWorker.DoesNotExist:
                return None
                
        elif role == Role.SYSTEM_ADMIN:
            try:
                system_admin = obj.systemadmin
                return SystemAdminProfileSerializer(system_admin).data
            except SystemAdmin.DoesNotExist:
                return None

        return None

    def get_hospital(self, obj):
        """Get hospital object for HOSPITAL_ADMIN and RECEPTIONIST roles."""
        from hospitals.serializers import HospitalDetailSerializer
        from accounts.models import HospitalAdmin, Receptionist

        role = obj.role
        hospital = None

        if role == Role.HOSPITAL_ADMIN:
            try:
                hospital_admin = obj.hospitaladmin
                hospital = hospital_admin.hospital
            except HospitalAdmin.DoesNotExist:
                pass
                
        elif role == Role.RECEPTIONIST:
            try:
                receptionist = obj.receptionist
                hospital = receptionist.hospital
            except Receptionist.DoesNotExist:
                pass

        if hospital:
            return HospitalDetailSerializer(hospital).data
        return None
