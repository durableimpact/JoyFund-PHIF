import logging
from weasyprint import HTML
from django.core.files.base import ContentFile
from django.template.loader import render_to_string
from django.utils.timezone import now

logger = logging.getLogger(__name__)


def create_impact_certificate(campaign):
    """
    Generates a PDF Impact Certificate outlining the specific "Chain of Life"
    for a JoyFund completed campaign.
    Returns: Name and ContentFile containing the generated PDF
    """
    logger.info(f"Generating PDF for {campaign.title}")
