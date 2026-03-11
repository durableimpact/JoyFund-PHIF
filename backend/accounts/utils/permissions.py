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
