from storages.backends.s3boto3 import S3Boto3Storage
import boto3
from django.conf import settings
import logging
from logs.services import LogService

logger = logging.getLogger(__name__)

class MediaStorage(S3Boto3Storage):
    location = 'media'
    default_acl = 'public-read'  # Changed to public-read as per settings.py AWS_DEFAULT_ACL
    file_overwrite = False
    custom_domain = False
    
    def _save(self, name, content):
        """
        Override _save to catch and log errors during upload to Backblaze B2.
        """
        try:
            return super()._save(name, content)
        except Exception as e:
            # Log the error with full context
            LogService.log_error(e, extra={
                'storage_action': 'save',
                'file_name': name,
                'bucket_name': self.bucket_name or getattr(settings, 'AWS_STORAGE_BUCKET_NAME', 'unknown'),
                'endpoint': getattr(settings, 'AWS_S3_ENDPOINT_URL', 'unknown')
            })
            raise e

    def url(self, name, parameters=None, expire=3600):
        """
        Generate a URL for the file. 
        If it's private, it generates a presigned URL.
        """
        # If AWS_QUERYSTRING_AUTH is False (from settings), we might want simple URLs
        if not getattr(settings, 'AWS_QUERYSTRING_AUTH', True):
            return super().url(name, parameters, expire)
            
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
            logger.error(f"Error generating presigned URL: {str(e)}")
            # Fallback to default behavior
            return super().url(name, parameters, expire)

class StaticStorage(S3Boto3Storage):
    location = 'static'
    default_acl = 'public-read'
