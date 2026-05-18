import logging
from io import BytesIO
from weasyprint import HTML
from django.core.files.base import ContentFile
from django.template.loader import render_to_string
from django.utils.timezone import now

logger = logging.getLogger(__name__)


def create_impact_certificate(campaign):
    """
    Generates a PDF Impact Certificate outlining the specific "Chain of Life"
    for a JoyFund completed campaign.
    
    Certificate includes:
    - Campaign title and description
    - Goal amount and total raised
    - List of donors
    - Impact statement
    - Certificate validity and generation date
    
    Args:
        campaign: Campaign instance that has reached its goal
        
    Returns:
        tuple: (filename, ContentFile) or (None, None) if generation fails
    """
    try:
        logger.info(f"Generating PDF certificate for campaign: {campaign.title}")
        
        # Get all successful donations and donors
        donations = campaign.donations.filter(status='SUCCESS').select_related('donor__user')
        total_donors = donations.values('donor').distinct().count()
        
        # Prepare context for HTML template
        context = {
            'campaign': campaign,
            'total_raised': campaign.total_net_raised,
            'goal_amount': campaign.goal_amount,
            'progress_percentage': campaign.progress_percentage,
            'total_donors': total_donors,
            'generation_date': now().strftime('%B %d, %Y'),
            'donors': donations,
        }
        
        # Render HTML template
        html_string = render_to_string(
            'campaigns/impact_certificate.html',
            context
        )
        
        # Generate PDF from HTML
        pdf_buffer = BytesIO()
        HTML(string=html_string).write_pdf(pdf_buffer)
        pdf_buffer.seek(0)
        
        # Create filename
        filename = f"certificate_{campaign.id}.pdf"
        
        # Create ContentFile
        pdf_file = ContentFile(pdf_buffer.getvalue(), name=filename)
        
        logger.info(f"✓ PDF certificate generated successfully for {campaign.title}")
        return filename, pdf_file
        
    except Exception as e:
        logger.error(f"✗ Failed to generate PDF certificate for {campaign.title}: {str(e)}", exc_info=True)
        return None, None
