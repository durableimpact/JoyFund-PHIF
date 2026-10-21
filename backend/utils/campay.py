from typing import Dict, Optional, Union
from campay.sdk import Client as CamPayClient
import re


class CamPayManager:
    """
    A class to manage CamPay payment operations efficiently.
    """
    
    def __init__(self, app_username: str, app_password: str, environment: str = "DEV"):
        """
        Initialize the CamPay manager.
        
        Args:
            app_username (str): CamPay application username
            app_password (str): CamPay application password
            environment (str): Either 'DEV' for testing or 'PROD' for production
        """
        if environment not in ["DEV", "PROD"]:
            raise ValueError("Environment must be either 'DEV' or 'PROD'")

        self.environment = environment
        self.mock_mode = (environment == "DEV" and not app_username and not app_password)
        if self.mock_mode:
            self.client = None
        else:
            self.client = CamPayClient({
                "app_username": app_username,
                "app_password": app_password,
                "environment": environment
            })

    def validate_phone_number(self, phone: str) -> bool:
        """
        Validate Cameroon phone number format.
        
        Args:
            phone (str): Phone number to validate
            
        Returns:
            bool: True if valid, False otherwise
        """
        # Cameroon phone number pattern (237) followed by 9 digits
        pattern = r'^237\d{9}$'
        return bool(re.match(pattern, phone))

    def collect_payment(self, 
                       amount: Union[int, float, str],
                       phone: str,
                       description: str,
                       external_reference: str = "",
                       currency: str = "XAF",
                       wait_for_completion: bool = True) -> Dict:
        """
        Collect payment from a customer.
        
        Args:
            amount: Amount to collect
            phone: Customer's phone number (must include country code)
            description: Payment description
            external_reference: External reference for tracking
            currency: Currency code (default: XAF)
            wait_for_completion: Whether to wait for transaction completion
            
        Returns:
            Dict: Transaction response
        """
        if not self.validate_phone_number(phone):
            raise ValueError("Invalid phone number format. Must start with 237 followed by 9 digits")
            
        try:
            amount = str(float(amount))  # Validate and convert amount to string
        except ValueError:
            raise ValueError("Invalid amount provided")

        payment_data = {
            "amount": amount,
            "currency": currency,
            "from": phone,
            "description": description,
            "external_reference": external_reference
        }

        if self.mock_mode:
            return {
                "status": "SUCCESS",
                "message": "Mock payment collected successfully.",
                "reference": external_reference or "MOCK-REF"
            }

        if wait_for_completion:
            return self.client.collect(payment_data)
        return self.client.initCollect(payment_data)

    def create_payment_link(self,
                          amount: Union[int, float, str],
                          description: str,
                          external_reference: str,
                          redirect_url: str,
                          phone: Optional[str] = None,
                          first_name: str = "",
                          last_name: str = "",
                          email: str = "",
                          failure_redirect_url: str = "",
                          payment_options: str = "MOMO,CARD",
                          currency: str = "XAF") -> Dict:
        """
        Create a payment link for customer checkout.
        """
        if phone and not self.validate_phone_number(phone):
            raise ValueError("Invalid phone number format. Must start with 237 followed by 9 digits")

        try:
            amount = str(float(amount))
        except ValueError:
            raise ValueError("Invalid amount provided")

        def _clean_str(value):
            if value is None:
                return ""
            if isinstance(value, str):
                v = value.strip()
                if v.lower() in ("none", "null", "undefined"):
                    return ""
                return v
            try:
                v = str(value).strip()
                if v.lower() in ("none", "null", "undefined"):
                    return ""
                return v
            except Exception:
                return ""

        first_name_clean = _clean_str(first_name)
        last_name_clean = _clean_str(last_name)
        email_clean = _clean_str(email)

        # Validate email format if provided; if invalid, treat as empty to avoid CamPay rejecting
        if email_clean:
            email_pattern = r'^[^@\s]+@[^@\s]+\.[^@\s]+$'
            if not re.match(email_pattern, email_clean):
                email_clean = ""

        def _clean_str(value):
            if value is None:
                return ""
            if isinstance(value, str):
                v = value.strip()
                if v.lower() in ("none", "null", "undefined"):
                    return ""
                return v
            try:
                v = str(value).strip()
                if v.lower() in ("none", "null", "undefined"):
                    return ""
                return v
            except Exception:
                return ""

        first_name_clean = _clean_str(first_name)
        last_name_clean = _clean_str(last_name)
        email_clean = _clean_str(email)

        if email_clean:
            email_pattern = r'^[^@\s]+@[^@\s]+\.[^@\s]+$'
            if not re.match(email_pattern, email_clean):
                email_clean = ""

        if self.mock_mode:
            mock_url = redirect_url
            separator = '&' if '?' in mock_url else '?'
            return {
                "link": f"{mock_url}{separator}mock_payment=1&environment=DEV&reference={external_reference}"
            }

        try:
            # Call the CamPay API
            response = self.client.get_payment_link({
                "amount": amount,
                "currency": currency,
                "description": description,
                "external_reference": external_reference,
                "from": phone if phone else "",
                "first_name": first_name_clean,
                "last_name": last_name_clean,
                "email": email_clean,
                "redirect_url": redirect_url,
                "failure_redirect_url": failure_redirect_url,
                "payment_options": payment_options
            })
            
            # Check for error in response
            if isinstance(response, dict) and 'error_code' in response:
                raise Exception(response.get('message', 'Error creating payment link'))
                
            return response
            
        except Exception as e:
            print(f">>>>>>>>>>>>>>>>>>:  Getting payment link...")
            print(f">>>>>>>>>>>>>>>>>>:  {str(e)}")
            # Re-raise the exception to be handled by the caller
            raise

    def check_transaction_status(self, reference: str) -> Dict:
        """
        Check the status of a transaction.
        
        Args:
            reference (str): Transaction reference
            
        Returns:
            Dict: Transaction status response
        """
        return self.client.get_transaction_status({"reference": reference})

    def disburse_payment(self,
                        amount: Union[int, float, str],
                        phone: str,
                        description: str,
                        external_reference: str = "",
                        currency: str = "XAF") -> Dict:
        """
        Disburse payment to a recipient.
        
        Args:
            amount: Amount to disburse
            phone: Recipient's phone number
            description: Payment description
            external_reference: External reference for tracking
            currency: Currency code
            
        Returns:
            Dict: Disbursement response
        """
        if not self.validate_phone_number(phone):
            raise ValueError("Invalid phone number format. Must start with 237 followed by 9 digits")

        try:
            amount = str(float(amount))
        except ValueError:
            raise ValueError("Invalid amount provided")

        if self.mock_mode:
            return {
                "status": "SUCCESS",
                "message": "Mock disbursement completed successfully.",
                "reference": external_reference or "MOCK-DISBURSE-REF"
            }

        return self.client.disburse({
            "amount": amount,
            "currency": currency,
            "to": phone,
            "description": description,
            "external_reference": external_reference
        })

    def transfer_airtime(self,
                        amount: Union[int, float, str],
                        phone: str,
                        external_reference: str = "") -> Dict:
        """
        Transfer airtime to a phone number.
        
        Args:
            amount: Amount of airtime to transfer
            phone: Recipient's phone number
            external_reference: External reference for tracking
            
        Returns:
            Dict: Airtime transfer response
        """
        if not self.validate_phone_number(phone):
            raise ValueError("Invalid phone number format. Must start with 237 followed by 9 digits")

        try:
            amount = str(float(amount))
        except ValueError:
            raise ValueError("Invalid amount provided")

        return self.client.transfer_airtime({
            "amount": amount,
            "to": phone,
            "external_reference": external_reference
        })

    def get_balance(self) -> Dict:
        """
        Get the current balance of the application.
        
        Returns:
            Dict: Balance information
        """
        return self.client.get_balance()