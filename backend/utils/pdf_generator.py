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
    
    # 1. Fetch assignments tied to this campaign
    # (Assuming generic reverse relationships, gracefully degrading if not fully mapped)
    assignments = []
    if hasattr(campaign, 'voucherassignment_set'):
        assignments = campaign.voucherassignment_set.all()
    elif hasattr(campaign, 'assignments'):
        assignments = campaign.assignments.all()
    
    donor_name = campaign.donor.user.get_full_name() if campaign.donor.user else "JoyFund Supporter"
    
    # 2. Render Template
    context = {
        'campaign': campaign,
        'donor_name': donor_name,
        'assignments': assignments,
        'date': now().strftime('%Y-%m-%d'),
    }
    
    html_string = render_to_string('certificates/impact_certificate.html', context)
    
    # 3. Create PDF byte stream via WeasyPrint
    pdf_bytes = HTML(string=html_string).write_pdf()
    
    # 4. Return standard Django ContentFile
    filename = f"impact_certificate_{campaign.id}.pdf"
    content_file = ContentFile(pdf_bytes, name=filename)
    
    return filename, content_file
