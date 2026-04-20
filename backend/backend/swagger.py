from drf_yasg.inspectors import SwaggerAutoSchema


class AppTagAutoSchema(SwaggerAutoSchema):
    TAG_LABELS = {
        'auth': 'Authentication',
        'accounts': 'Accounts',
        'anc': 'ANC Tracking',
        'beneficiaries': 'Beneficiaries',
        'campaigns': 'Campaigns',
        'disbursements': 'Disbursements',
        'hospitals': 'Hospitals',
        'notifications': 'Notifications',
        'payments': 'Payments',
        'vouchers': 'Vouchers',
        'admin': 'Admin',
    }

    @staticmethod
    def _tag_from_path(path: str) -> str:
        parts = [part for part in path.strip('/').split('/') if part]
        if not parts:
            return 'General'

        if parts[0] == 'api' and len(parts) > 1:
            key = parts[1]
        else:
            key = parts[0]

        return AppTagAutoSchema.TAG_LABELS.get(key, key.replace('-', ' ').title())

    def get_tags(self, operation_keys=None):
        tags = super().get_tags(operation_keys)
        if tags:
            return tags
        return [self._tag_from_path(self.path)]
