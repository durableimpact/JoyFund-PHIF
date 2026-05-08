from locust import HttpUser, task, between
from random import randint
import json

class JoyFundUser(HttpUser):
    """Simulates typical JoyFund API user behavior"""
    
    wait_time = between(1, 3)  # Wait 1-3 seconds between requests
    
    def on_start(self):
        """Login or get auth token"""
        # Adjust based on your actual authentication
        self.token = None
        try:
            # For public endpoints, no auth needed
            pass
        except:
            pass
    
    @task(5)
    def get_beneficiaries(self):
        """List beneficiaries - most common read operation"""
        self.client.get("/api/beneficiaries/?page=1", 
                       headers={"Authorization": f"Bearer {self.token}"} if self.token else {})
    
    @task(4)
    def get_campaigns(self):
        """List campaigns"""
        self.client.get("/api/campaigns/?page=1",
                       headers={"Authorization": f"Bearer {self.token}"} if self.token else {})
    
    @task(3)
    def search_beneficiary(self):
        """Search specific beneficiary"""
        beneficiary_id = randint(1, 1000)
        self.client.get(f"/api/beneficiaries/{beneficiary_id}/",
                       headers={"Authorization": f"Bearer {self.token}"} if self.token else {})
    
    @task(2)
    def get_hospitals(self):
        """List hospitals"""
        self.client.get("/api/hospitals/?page=1",
                       headers={"Authorization": f"Bearer {self.token}"} if self.token else {})
    
    @task(1)
    def health_check(self):
        """Health check endpoint - lightweight"""
        self.client.get("/health/", name="/health/")


class QuickLoadUser(HttpUser):
    """Simulates burst scenario - minimal thinking time"""
    
    wait_time = between(0.1, 0.5)  # Rapid requests
    
    @task
    def rapid_requests(self):
        """Rapid simple requests"""
        self.client.get("/api/beneficiaries/?page=1")
