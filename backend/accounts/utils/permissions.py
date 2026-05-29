from rest_framework.permissions import BasePermission

from accounts.models import Role


class IsSystemAdmin(BasePermission):
    """Allows access only to users with the SYSTEM_ADMIN role."""

    message = "Only System Admins can perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == Role.SYSTEM_ADMIN
        )


class IsHospitalAdmin(BasePermission):
    """Allows access only to users with the HOSPITAL_ADMIN role."""

    message = "Only Hospital Admins can perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == Role.HOSPITAL_ADMIN
        )


class IsOwnerOrSystemAdmin(BasePermission):
    """
    Object-level permission.
    Allows access to the profile owner or any SYSTEM_ADMIN.
    The profile object is expected to have a `.user` attribute.
    """

    message = "You do not have permission to access this resource."

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role == Role.SYSTEM_ADMIN:
            return True
        return obj.user == request.user


class IsHospitalStaff(BasePermission):
    """Allows access only to users with HOSPITAL_ADMIN or RECEPTIONIST roles."""

    message = "Only Hospital Staff can perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in (Role.HOSPITAL_ADMIN, Role.RECEPTIONIST)
        )


class IsAdminOrSocialWorker(BasePermission):
    """Allows access only to users with SYSTEM_ADMIN, HOSPITAL_ADMIN, or SOCIAL_WORKER roles."""

    message = "Only Admins or Social Workers can perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in (Role.SYSTEM_ADMIN, Role.HOSPITAL_ADMIN, Role.SOCIAL_WORKER)
        )


class IsOwnerOrHospitalAdmin(BasePermission):
    """
    Object-level permission.
    Allows access to the profile owner, the HospitalAdmin who enrolled them,
    or a SYSTEM_ADMIN.
    """

    message = "You do not have permission to access this resource."

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role == Role.SYSTEM_ADMIN:
            return True
        if request.user.role == Role.HOSPITAL_ADMIN:
            return True
        return obj.user == request.user

class IsSystemAdminOrHospitalAdmin(BasePermission):
    """
    Object-level permission.
    Allows access to the system admin, hospital admin, or the hospital admin who enrolled them.
    """

    message = "You do not have permission to access this resource."

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role == Role.SYSTEM_ADMIN:
            return True
        if request.user.role == Role.HOSPITAL_ADMIN:
            return True
        return obj.user == request.user