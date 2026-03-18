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
        
        Args:
            amount: Amount to collect
            description: Payment description
            external_reference: External reference for tracking (must be a valid UUID)
            redirect_url: Success redirect URL
            phone: Optional phone number
            first_name: Customer's first name
            last_name: Customer's last name
            email: Customer's email
            failure_redirect_url: Failure redirect URL
            payment_options: Available payment options
            currency: Currency code
            
        Returns:
            Dict: Payment link response
            
        Raises:
            ValueError: For invalid phone number or amount
            Exception: For CamPay API errors
        """
        if phone and not self.validate_phone_number(phone):
            raise ValueError("Invalid phone number format. Must start with 237 followed by 9 digits")

        try:
            amount = str(float(amount))
        except ValueError:
            raise ValueError("Invalid amount provided")
            
        try:
            # Call the CamPay API
            response = self.client.get_payment_link({
                "amount": amount,
                "currency": currency,
                "description": description,
                "external_reference": external_reference,
                "from": phone if phone else "",
                "first_name": first_name,
                "last_name": last_name,
                "email": email,
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