import logging
from io import BytesIO
from weasyprint import HTML
from django.core.files.base import ContentFile
from django.template.loader import render_to_string
from django.utils.timezone import now
from campaigns.models.campaign import Campaign
import qrcode
import base64

logger = logging.getLogger(__name__)


def generate_qr_code(campaign: Campaign) -> str:
    """
    Generate a QR code for the campaign and return as base64 encoded image.
    The QR code links to the campaign detail page using its slug.
    """
    try:
        # Create QR code that links to the campaign using slug
        campaign_url = f"https://joyfund.app/campaigns/{campaign.slug}"
        
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=8,
            border=2,
        )
        qr.add_data(campaign_url)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        img_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        return f"data:image/png;base64,{img_base64}"
    except Exception as e:
        logger.error(f"Failed to generate QR code: {str(e)}")
        return None


def create_impact_certificate(campaign:Campaign):
    """
    Generates a PDF Impact Certificate outlining the specific "Chain of Life"
    for a JoyFund completed campaign.
    
    Certificate includes:
    - Campaign title and description
    - Goal amount and total raised
    - Donor's name (clearly displayed)
    - List of donors
    - QR code linking to campaign
    - Impact statement
    - Certificate validity and generation date
    - Signature section
    
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
        
        # Get donor information - build full name from first_name and last_name
        if campaign.donor and campaign.donor.user:
            first_name = getattr(campaign.donor.user, 'first_name', '')
            last_name = getattr(campaign.donor.user, 'last_name', '')
            donor_name = f"{first_name} {last_name}".strip()
            if not donor_name:
                donor_name = getattr(campaign.donor.user, 'username', 'Anonymous')
        else:
            donor_name = "Anonymous"
        
        # Generate QR code
        qr_code_image = generate_qr_code(campaign)
        
        # Prepare context for HTML template
        context = {
            'campaign': campaign,
            'donor_name': donor_name,
            'total_raised': campaign.total_net_raised,
            'goal_amount': campaign.goal_amount,
            'progress_percentage': campaign.progress_percentage,
            'total_donors': total_donors,
            'generation_date': now().strftime('%B %d, %Y'),
            'donors': donations,
            'qr_code_image': qr_code_image,
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
