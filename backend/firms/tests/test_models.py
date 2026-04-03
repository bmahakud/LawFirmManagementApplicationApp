from django.test import TestCase
from firms.models import Firm


class FirmModelTest(TestCase):
    """Test Firm model"""
    
    def test_create_firm(self):
        """Test creating a firm"""
        firm = Firm.objects.create(
            firm_name="Test Law Firm",
            firm_code="TLF001",
            city="Mumbai",
            state="Maharashtra",
            country="India",
            phone_number="+912225551234",
            email="info@testlaw.com"
        )
        self.assertEqual(firm.firm_name, "Test Law Firm")
        self.assertEqual(firm.subscription_type, "trial")
        self.assertTrue(firm.is_active)
    
    def test_firm_str_representation(self):
        """Test firm string representation"""
        firm = Firm.objects.create(
            firm_name="Test Law Firm",
            firm_code="TLF001",
            city="Mumbai",
            state="Maharashtra",
            country="India",
            phone_number="+912225551234",
            email="info@testlaw.com"
        )
        self.assertEqual(str(firm), "Test Law Firm")
    
    def test_firm_unique_name(self):
        """Test firm name uniqueness"""
        Firm.objects.create(
            firm_name="Test Law Firm",
            firm_code="TLF001",
            city="Mumbai",
            state="Maharashtra",
            country="India",
            phone_number="+912225551234",
            email="info@testlaw.com"
        )
        
        with self.assertRaises(Exception):
            Firm.objects.create(
                firm_name="Test Law Firm",
                firm_code="TLF002",
                city="Delhi",
                state="Delhi",
                country="India",
                phone_number="+911125551234",
                email="info2@testlaw.com"
            )
    
    def test_firm_unique_code(self):
        """Test firm code uniqueness"""
        Firm.objects.create(
            firm_name="Test Law Firm",
            firm_code="TLF001",
            city="Mumbai",
            state="Maharashtra",
            country="India",
            phone_number="+912225551234",
            email="info@testlaw.com"
        )
        
        with self.assertRaises(Exception):
            Firm.objects.create(
                firm_name="Another Law Firm",
                firm_code="TLF001",
                city="Delhi",
                state="Delhi",
                country="India",
                phone_number="+911125551234",
                email="info2@testlaw.com"
            )
    
    def test_firm_default_country(self):
        """Test firm default country"""
        firm = Firm.objects.create(
            firm_name="Test Law Firm",
            firm_code="TLF001",
            city="Mumbai",
            state="Maharashtra",
            phone_number="+912225551234",
            email="info@testlaw.com"
        )
        self.assertEqual(firm.country, "India")
