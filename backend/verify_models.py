import os
import django
import uuid

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from users.models import User, Hospital
from campaigns.models import Campaign, Donation
from vouchers.models import Beneficiary, CareVoucher

def verify_models():
    print("--- Starting Verification ---")
    
    # 1. Create a User
    email = "testuser@example.com"
    phone = "237123456789"
    try:
        user = User.objects.create_user(email=email, phone_number=phone, password="testpassword", first_name="Test", last_name="User")
        print(f"User created: {user}")
    except Exception as e:
        print(f"Error creating user: {e}")
        return

    # 2. Create a Hospital
    hospital = Hospital.objects.create(name="St. Elizabeth Hospital", location="Bamenda", momo_number="237987654321")
    print(f"Hospital created: {hospital}")

    # 3. Create a Campaign
    campaign = Campaign.objects.create(
        creator=user,
        title="Junior's Graduation JoyFund",
        description="Help me sponsor 5 safe deliveries!",
        event_type="GRADUATION",
        goal_amount=250000
    )
    print(f"Campaign created: {campaign}")
    print(f"Initial progress: {campaign.progress_percentage}%")

    # 4. Create a Donation
    donation = Donation.objects.create(
        campaign=campaign,
        donor_name="Mama Solange",
        amount=50000,
        status="SUCCESS",
        message="Congrats Junior!"
    )
    print(f"Donation created: {donation}")
    
    # Manually update campaign amount (in real view, this would be in a transaction or signal)
    campaign.current_amount += donation.amount
    campaign.save()
    print(f"Updated progress: {campaign.progress_percentage}%")

    # 5. Create a Beneficiary
    beneficiary = Beneficiary.objects.create(
        full_name="Mama Beatrice",
        phone_number="237666777888",
        location="Douala",
        category="MATERNAL"
    )
    print(f"Beneficiary created: {beneficiary}")

    # 6. Create a CareVoucher
    voucher = CareVoucher.objects.create(
        beneficiary=beneficiary,
        hospital=hospital,
        service_description="Safe Delivery",
        value=50000,
        status="AVAILABLE"
    )
    print(f"CareVoucher created: {voucher}")
    print(f"Generated Voucher Code: {voucher.voucher_code}")

    print("--- Verification Complete ---")

if __name__ == "__main__":
    verify_models()
