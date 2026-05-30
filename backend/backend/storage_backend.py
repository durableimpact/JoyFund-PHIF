from storages.backends.s3boto3 import S3Boto3Storage
import boto3
from django.conf import settings

class MediaStorage(S3Boto3Storage):
    location = 'media'
    default_acl = 'private'
    file_overwrite = False
    custom_domain = False
    
    def url(self, name, parameters=None, expire=3600):
        """
        Generate a presigned URL for the file that expires in 1 hour
        """
        try:
            s3_client = boto3.client(
                's3',
                endpoint_url=settings.AWS_S3_ENDPOINT_URL,
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_S3_REGION_NAME
            )
            
            url = s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': settings.AWS_STORAGE_BUCKET_NAME,
                    'Key': self._normalize_name(self._clean_name(name)),
                },
                ExpiresIn=expire
            )
            return url
        except Exception as e:
            print(f"Error generating URL: {str(e)}")
            return None

# from storages.backends.s3boto3 import S3Boto3Storage

# class MediaStorage(S3Boto3Storage):
#     location = 'media'
#     default_acl = 'private'
#     file_overwrite = False
#     custom_domain = False

# from storages.backends.s3boto3 import S3Boto3Storage
# from django.conf import settings

# class StaticStorage(S3Boto3Storage):
#     location = 'static'
#     default_acl = 'public-read'

# class PublicMediaStorage(S3Boto3Storage):
#     location = 'media'
#     default_acl = 'public-read'
#     file_overwrite = False

# class PrivateMediaStorage(S3Boto3Storage):
#     location = settings.AWS_PRIVATE_MEDIA_LOCATION
#     bucket_name = settings.AWS_PRIVATE_BUCKET_NAME
#     default_acl = 'private'
#     file_overwrite = False
#     custom_domain = False


# class B2Storage(S3Boto3Storage):
#     location = 'media'
#     file_overwrite = False
#     default_acl = 'private'
    
#     def get_default_settings(self):
#         defaults = super().get_default_settings()
#         defaults['AWS_S3_SIGNATURE_VERSION'] = 's3v4'
#         defaults['AWS_S3_CHECKSUM_ALGORITHM'] = None
#         return defaults