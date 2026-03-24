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
    front_national_id_image = serializers.URLField(allow_null=True, required=False)
    back_national_id_image = serializers.URLField(allow_null=True, required=False)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)


class ReceptionistProfileSerializer(serializers.Serializer):
    """Profile structure for RECEPTIONIST role."""
    id = serializers.UUIDField()
    national_id_number = serializers.CharField()
    front_national_id_image = serializers.URLField(allow_null=True, required=False)
    back_national_id_image = serializers.URLField(allow_null=True, required=False)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)


class SocialWorkerProfileSerializer(serializers.Serializer):
    """Profile structure for SOCIAL_WORKER role."""
    id = serializers.UUIDField()
    national_id_number = serializers.CharField()
    front_national_id_image = serializers.URLField(allow_null=True, required=False)
    back_national_id_image = serializers.URLField(allow_null=True, required=False)
    organization = serializers.CharField()
    region_assigned = serializers.CharField()
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)


class SystemAdminProfileSerializer(serializers.Serializer):
    """Profile structure for SYSTEM_ADMIN role."""
    id = serializers.UUIDField()


# ===============================================================================
# ROLE-SPECIFIC INFO SERIALIZERS (for the info endpoints)
# ===============================================================================

class DonorInfoSerializer(serializers.ModelSerializer):
    """Donor user info serializer - returns only donor-relevant fields."""
    profile = DonorProfileSerializer(source='donor', read_only=True, allow_null=True)

    class Meta:
        model = User
        fields = [
            'id', 'email',
            'first_name', 'last_name',
            'phone_number', 'perfered_language',
            'role', 'is_verified',
            'created_at', 'updated_at',
            'profile',
        ]
        read_only_fields = fields


class HospitalAdminInfoSerializer(serializers.ModelSerializer):
    """Hospital Admin user info serializer - returns admin + profile + hospital."""
    profile = HospitalAdminProfileSerializer(source='hospitaladmin', read_only=True, allow_null=True)
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

    def get_hospital(self, obj):
        """Get hospital object for HOSPITAL_ADMIN."""
        from hospitals.serializers import HospitalDetailSerializer
        
        try:
            hospital_admin = obj.hospitaladmin
            if hospital_admin.hospital:
                return HospitalDetailSerializer(hospital_admin.hospital).data
        except Exception:
            pass
        return None


class ReceptionistInfoSerializer(serializers.ModelSerializer):
    """Receptionist user info serializer - returns receptionist + profile + hospital."""
    profile = ReceptionistProfileSerializer(source='receptionist', read_only=True, allow_null=True)
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

    def get_hospital(self, obj):
        """Get hospital object for RECEPTIONIST."""
        from hospitals.serializers import HospitalDetailSerializer
        
        try:
            receptionist = obj.receptionist
            if receptionist.hospital:
                return HospitalDetailSerializer(receptionist.hospital).data
        except Exception:
            pass
        return None


class SocialWorkerInfoSerializer(serializers.ModelSerializer):
    """Social Worker user info serializer - returns social worker + profile."""
    profile = SocialWorkerProfileSerializer(source='socialworker', read_only=True, allow_null=True)

    class Meta:
        model = User
        fields = [
            'id', 'email',
            'first_name', 'last_name',
            'phone_number', 'perfered_language',
            'role', 'is_verified',
            'created_at', 'updated_at',
            'profile',
        ]
        read_only_fields = fields


class SystemAdminInfoSerializer(serializers.ModelSerializer):
    """System Admin user info serializer - returns system admin data."""
    profile = SystemAdminProfileSerializer(source='systemadmin', read_only=True, allow_null=True)

    class Meta:
        model = User
        fields = [
            'id', 'email',
            'first_name', 'last_name',
            'phone_number', 'perfered_language',
            'role', 'is_verified',
            'created_at', 'updated_at',
            'profile',
        ]
        read_only_fields = fields


# Legacy - keep for backward compatibility if needed
UserInfoSerializer = DonorInfoSerializer
