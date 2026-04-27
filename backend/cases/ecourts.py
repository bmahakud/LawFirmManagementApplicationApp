"""
E-Courts India API Integration Service
"""
import requests
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class ECourtService:
    """Service class for E-Courts India API integration"""
    
    def __init__(self):
        self.api_key = settings.ECOURTS_API_KEY
        self.base_url = settings.ECOURTS_BASE_URL
    
    def _make_request(self, endpoint, payload):
        """
        Make API request to E-Courts
        
        Args:
            endpoint: API endpoint path
            payload: Request payload
        
        Returns:
            dict: API response
        """
        url = f"{self.base_url}/{endpoint}"
        
        headers = {
            'Authorization': self.api_key,
            'Content-Type': 'application/json'
        }
        
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            return {'success': True, 'data': response.json()}
        except requests.exceptions.Timeout:
            logger.error(f"E-Courts API timeout for {endpoint}")
            return {'success': False, 'error': 'Request timeout. Please try again.'}
        except requests.exceptions.RequestException as e:
            logger.error(f"E-Courts API error for {endpoint}: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    # ==================== DISTRICT COURT APIs ====================
    
    def get_district_court_case_by_cnr(self, cnr_number):
        """
        Get district court case details by CNR number
        
        Args:
            cnr_number: CNR number (e.g., "DLST020314162024")
        
        Returns:
            dict: Case details
        """
        payload = {"cnr": cnr_number}
        return self._make_request("district-court/case", payload)
    
    def search_district_court_by_party(self, name, stage="BOTH", year=None, 
                                       district_id=None, complex_id=None):
        """
        Search district court cases by party name
        
        Args:
            name: Party name (e.g., "Gaurav")
            stage: "BOTH", "PENDING", or "DISPOSED"
            year: Year (e.g., "2024")
            district_id: District ID (optional)
            complex_id: Complex ID (optional)
        
        Returns:
            dict: List of cases
        """
        payload = {
            "name": name,
            "stage": stage
        }
        
        if year:
            payload['year'] = year
        if district_id:
            payload['districtId'] = district_id
        if complex_id:
            payload['complexId'] = complex_id
        
        return self._make_request("district-court/search/party", payload)
    
    def search_district_court_by_advocate_name(self, name, stage="BOTH", 
                                               district_id=None, complex_id=None):
        """
        Search district court cases by advocate name
        
        Args:
            name: Advocate name (e.g., "PRATEEK")
            stage: "BOTH", "PENDING", or "DISPOSED"
            district_id: District ID (optional)
            complex_id: Complex ID (optional)
        
        Returns:
            dict: List of cases
        """
        payload = {
            "name": name,
            "stage": stage
        }
        
        if district_id:
            payload['districtId'] = district_id
        if complex_id:
            payload['complexId'] = complex_id
        
        return self._make_request("district-court/search/advocate-name", payload)
    
    def search_district_court_by_filing_number(self, filing_number, filing_year, 
                                               district_id, complex_id=None):
        """
        Search district court case by filing number
        
        Args:
            filing_number: Filing number (e.g., "581")
            filing_year: Filing year (e.g., "2024")
            district_id: District ID (required)
            complex_id: Complex ID (optional)
        
        Returns:
            dict: Case details
        """
        payload = {
            "filingNumber": filing_number,
            "filingYear": filing_year,
            "districtId": district_id
        }
        
        if complex_id:
            payload['complexId'] = complex_id
        
        return self._make_request("district-court/search/filing-number", payload)
    
    def search_district_court_by_advocate_number(self, state, number, year, 
                                                 stage="BOTH", district_id=None, 
                                                 complex_id=None):
        """
        Search district court cases by advocate registration number
        
        Args:
            state: State code (e.g., "D" for Delhi)
            number: Advocate registration number (e.g., "1709")
            year: Registration year (e.g., "2014")
            stage: "BOTH", "PENDING", or "DISPOSED"
            district_id: District ID (optional)
            complex_id: Complex ID (optional)
        
        Returns:
            dict: List of cases
        """
        payload = {
            "advocate": {
                "state": state,
                "number": number,
                "year": year
            },
            "stage": stage
        }
        
        if district_id:
            payload['districtId'] = district_id
        if complex_id:
            payload['complexId'] = complex_id
        
        return self._make_request("district-court/search/advocate-number", payload)
    
    def get_district_court_cause_list(self, date, case_type, court_id):
        """
        Get district court cause list (daily hearing list)
        
        Args:
            date: Date in format "DD-MM-YYYY" (e.g., "20-02-2024")
            case_type: "CRIMINAL" or "CIVIL"
            court_id: Court ID (e.g., "ff886fdc")
        
        Returns:
            dict: Cause list
        """
        payload = {
            "date": date,
            "type": case_type,
            "courtId": court_id
        }
        
        return self._make_request("district-court/cause-list", payload)
    
    # ==================== HIGH COURT APIs ====================
    
    def get_high_court_case_by_cnr(self, cnr_number):
        """
        Get high court case details by CNR number
        
        Args:
            cnr_number: CNR number (e.g., "DLHC010003082023")
        
        Returns:
            dict: Case details
        """
        payload = {"cnr": cnr_number}
        return self._make_request("high-court/case", payload)
    
    # ==================== TRIBUNAL APIs ====================
    
    def get_tribunal_case_by_number(self, bench_id, type_id, case_number, case_year):
        """
        Get Central Administrative Tribunal case by case number
        
        Args:
            bench_id: Bench ID (e.g., "ad573668")
            type_id: Type ID (e.g., "6b86b273")
            case_number: Case number (e.g., "442")
            case_year: Case year (e.g., "2024")
        
        Returns:
            dict: Case details
        """
        payload = {
            "benchId": bench_id,
            "typeId": type_id,
            "caseNumber": case_number,
            "caseYear": case_year
        }
        
        return self._make_request("central-administrative-tribunal/case-number", payload)
    
    # ==================== HELPER METHODS ====================
    
    def parse_case_data(self, ecourt_response):
        """
        Parse E-Courts API response and convert to our case model format
        
        Args:
            ecourt_response: Response from E-Courts API
        
        Returns:
            dict: Parsed case data ready for Case model
        """
        if not ecourt_response.get('success'):
            return None
        
        data = ecourt_response.get('data', {})
        
        # Extract relevant fields from E-Courts response
        # Note: Adjust field names based on actual API response structure
        parsed_data = {
            'case_number': data.get('caseNumber') or data.get('case_number'),
            'cnr_number': data.get('cnr') or data.get('cnrNumber'),
            'case_type': data.get('caseType') or data.get('case_type'),
            'filing_date': data.get('filingDate') or data.get('filing_date'),
            'court_name': data.get('courtName') or data.get('court_name'),
            'court_no': data.get('courtNumber') or data.get('court_no'),
            'judge_name': data.get('judgeName') or data.get('judge_name'),
            'petitioner_name': data.get('petitioner') or data.get('petitionerName'),
            'respondent_name': data.get('respondent') or data.get('respondentName'),
            'next_hearing_date': data.get('nextHearingDate') or data.get('next_hearing_date'),
            'case_status': data.get('status') or data.get('caseStatus'),
            'district': data.get('district'),
            'state': data.get('state'),
        }
        
        return parsed_data
    
    def get_case_by_cnr(self, cnr_number, court_type='district-court'):
        """
        Generic method to get case by CNR for any court type
        
        Args:
            cnr_number: CNR number
            court_type: 'district-court', 'high-court', etc.
        
        Returns:
            dict: Case details
        """
        if court_type == 'high-court':
            return self.get_high_court_case_by_cnr(cnr_number)
        else:
            return self.get_district_court_case_by_cnr(cnr_number)
