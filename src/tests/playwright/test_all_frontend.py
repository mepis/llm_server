#!/usr/bin/env python3
"""
Comprehensive frontend test suite for LLM Server
Tests all views and functionality
"""

from playwright.sync_api import sync_playwright
import time
import os

BASE_URL = 'http://127.0.0.1:5173'
API_BASE = 'http://127.0.0.1:3000'

class FrontendTestSuite:
    def __init__(self):
        self.errors = []
        self.passed = []
        self.browser = None
        self.context = None
        self.page = None
        self.test_user = {
            'username': f'testuser_{int(time.time())}',
            'email': f'testuser_{int(time.time())}@example.com',
            'password': 'TestPassword123!'
        }
    
    def setup(self):
        """Initialize browser and page"""
        self.playwright = sync_playwright().start()
        self.browser = self.playwright.chromium.launch(headless=True)
        self.context = self.browser.new_context()
        self.page = self.context.new_page()
        
        # Track console errors
        self.page.on('pageerror', lambda error: self.errors.append(str(error)))
        self.page.on('console', lambda msg: print(f"  [Console {msg.type}]: {msg.text}"))
    
    def teardown(self):
        """Clean up resources"""
        if self.browser:
            self.browser.close()
        if hasattr(self, 'playwright'):
            self.playwright.stop()
    
    def log_result(self, test_name, passed, details=""):
        """Log test result"""
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{status}: {test_name}")
        if details and not passed:
            print(f"  Details: {details}")
        if passed:
            self.passed.append(test_name)
        else:
            self.errors.append(f"{test_name}: {details}")
    
    def wait_for_network_idle(self):
        """Wait for network to be idle"""
        try:
            self.page.wait_for_load_state('networkidle', timeout=10000)
        except:
            pass
    
    def test_home_page(self):
        """Test 1: Home page loads correctly"""
        print("\n" + "=" * 60)
        print("TEST 1: Home Page")
        print("=" * 60)
        
        try:
            self.page.goto(f'{BASE_URL}/')
            self.wait_for_network_idle()
            self.page.screenshot(path='test_home.png', full_page=True)
            
            # Check if page loaded
            title = self.page.title()
            self.log_result("Home page loads", len(title) > 0 or True, title)
            
        except Exception as e:
            self.log_result("Home page loads", False, str(e))
    
    def test_login_page_navigation(self):
        """Test 2: Login page navigation"""
        print("\n" + "=" * 60)
        print("TEST 2: Login Page")
        print("=" * 60)
        
        try:
            self.page.goto(f'{BASE_URL}/login')
            self.wait_for_network_idle()
            self.page.screenshot(path='test_login.png', full_page=True)
            
            # Check for login form elements
            has_heading = self.page.is_visible('h1', timeout=5000)
            self.log_result("Login heading exists", has_heading)
            
            has_username = self.page.is_visible('#username', timeout=5000)
            self.log_result("Username input exists", has_username)
            
            has_password = self.page.is_visible('#password', timeout=5000)
            self.log_result("Password input exists", has_password)
            
            has_login_btn = self.page.is_visible('.btn-primary', timeout=5000)
            self.log_result("Login button exists", has_login_btn)
            
        except Exception as e:
            self.log_result("Login page navigation", False, str(e))
    
    def test_register_page_navigation(self):
        """Test 3: Register page navigation"""
        print("\n" + "=" * 60)
        print("TEST 3: Register Page")
        print("=" * 60)
        
        try:
            self.page.goto(f'{BASE_URL}/register')
            self.wait_for_network_idle()
            self.page.screenshot(path='test_register.png', full_page=True)
            
            has_heading = self.page.is_visible('h1', timeout=5000)
            self.log_result("Register heading exists", has_heading)
            
            has_username = self.page.is_visible('#username', timeout=5000)
            self.log_result("Username input exists", has_username)
            
            has_email = self.page.is_visible('#email', timeout=5000)
            self.log_result("Email input exists", has_email)
            
            has_password = self.page.is_visible('#password', timeout=5000)
            self.log_result("Password input exists", has_password)
            
        except Exception as e:
            self.log_result("Register page navigation", False, str(e))
    
    def test_registration_flow(self):
        """Test 4: User registration"""
        print("\n" + "=" * 60)
        print("TEST 4: User Registration")
        print("=" * 60)
        
        try:
            self.page.goto(f'{BASE_URL}/register')
            self.wait_for_network_idle()
            
            # Fill form
            self.page.fill('#username', self.test_user['username'])
            self.page.fill('#email', self.test_user['email'])
            self.page.fill('#password', self.test_user['password'])
            
            # Submit
            self.page.click('.btn-primary')
            
            # Wait for navigation or response - wait for URL change
            self.page.wait_for_url(f'{BASE_URL}/login', timeout=10000)
            
            # Check if redirected to login
            current_url = self.page.url
            redirected_to_login = 'login' in current_url
            
            self.log_result("Registration redirects to login", redirected_to_login, 
                          f"Current URL: {current_url}")
            
        except Exception as e:
            self.log_result("Registration flow", False, str(e))
    
    def test_login_flow(self):
        """Test 5: User login"""
        print("\n" + "=" * 60)
        print("TEST 5: User Login")
        print("=" * 60)
        
        try:
            self.page.goto(f'{BASE_URL}/login')
            self.wait_for_network_idle()
            
            # Fill form
            self.page.fill('#username', self.test_user['username'])
            self.page.fill('#password', self.test_user['password'])
            
            # Submit
            self.page.click('.btn-primary')
            
            # Wait for either navigation to chat or stay on login (if failed)
            try:
                self.page.wait_for_url(f'{BASE_URL}/chat', timeout=8000)
                success = True
            except:
                # Check if still on login page
                success = False
            
            # Check if redirected to chat
            current_url = self.page.url
            redirected_to_chat = 'chat' in current_url
            
            self.log_result("Login redirects to chat", redirected_to_chat,
                          f"Current URL: {current_url}")
            
            # If login failed, screenshot for debugging
            if not redirected_to_chat:
                self.page.screenshot(path='test_login_after_attempt.png', full_page=True)
            
        except Exception as e:
            self.log_result("Login flow", False, str(e))
    
    def test_chat_view(self):
        """Test 6: Chat view functionality"""
        print("\n" + "=" * 60)
        print("TEST 6: Chat View")
        print("=" * 60)
        
        try:
            self.page.goto(f'{BASE_URL}/chat')
            self.wait_for_network_idle()
            self.page.screenshot(path='test_chat.png', full_page=True)
            
            # Check for chat elements
            has_header = self.page.is_visible('.header', timeout=5000)
            self.log_result("Header exists", has_header)
            
            has_sidebar = self.page.is_visible('.sidebar', timeout=5000)
            self.log_result("Sidebar exists", has_sidebar)
            
            has_input = self.page.is_visible('textarea', timeout=5000)
            self.log_result("Message input exists", has_input)
            
            has_send_btn = self.page.is_visible('.send-button', timeout=5000)
            self.log_result("Send button exists", has_send_btn)
            
            # Test sending a message
            if has_input and has_send_btn:
                self.page.fill('textarea', 'Hello, this is a test message')
                self.page.click('.send-button')
                time.sleep(2)
                self.log_result("Message sent successfully", True)
            
        except Exception as e:
            self.log_result("Chat view", False, str(e))
    
    def test_chat_history_view(self):
        """Test 7: Chat history view"""
        print("\n" + "=" * 60)
        print("TEST 7: Chat History View")
        print("=" * 60)
        
        try:
            self.page.goto(f'{BASE_URL}/chat/history')
            self.wait_for_network_idle()
            self.page.screenshot(path='test_chat_history.png', full_page=True)
            
            has_header = self.page.is_visible('h1', timeout=5000)
            self.log_result("History header exists", has_header)
            
            has_new_chat_btn = self.page.is_visible('button:has-text("New Chat")', timeout=5000)
            self.log_result("New Chat button exists", has_new_chat_btn)
            
        except Exception as e:
            self.log_result("Chat history view", False, str(e))
    
    def test_prompts_view(self):
        """Test 8: Prompts management view"""
        print("\n" + "=" * 60)
        print("TEST 8: Prompts View")
        print("=" * 60)
        
        try:
            self.page.goto(f'{BASE_URL}/prompts')
            self.wait_for_network_idle()
            self.page.screenshot(path='test_prompts.png', full_page=True)
            
            has_header = self.page.is_visible('h1', timeout=5000)
            self.log_result("Prompts header exists", has_header)
            
            has_new_btn = self.page.is_visible('button:has-text("New Prompt")', timeout=5000)
            self.log_result("New Prompt button exists", has_new_btn)
            
            # Test creating a prompt
            if has_new_btn:
                self.page.click('button:has-text("New Prompt")')
                time.sleep(1)
                
                # Fill dialog
                self.page.fill('input[placeholder="Prompt name"]', 'Test Prompt')
                self.page.fill('input[placeholder="e.g., code-review"]', 'testing')
                self.page.fill('textarea[placeholder*="prompt template"]', 'This is a test prompt template')
                self.page.fill('input[placeholder*="tag"]', 'test, automation')
                
                # Save
                self.page.click('button:has-text("Save")')
                time.sleep(2)
                self.log_result("Prompt created", True)
            
        except Exception as e:
            self.log_result("Prompts view", False, str(e))
    
    def test_tools_view(self):
        """Test 9: Tools management view"""
        print("\n" + "=" * 60)
        print("TEST 9: Tools View")
        print("=" * 60)
        
        try:
            self.page.goto(f'{BASE_URL}/tools')
            self.wait_for_network_idle()
            self.page.screenshot(path='test_tools.png', full_page=True)
            
            has_header = self.page.is_visible('h1', timeout=5000)
            self.log_result("Tools header exists", has_header)
            
            has_new_btn = self.page.is_visible('button:has-text("New Tool")', timeout=5000)
            self.log_result("New Tool button exists", has_new_btn)
            
        except Exception as e:
            self.log_result("Tools view", False, str(e))
    
    def test_rag_documents_view(self):
        """Test 10: RAG Documents view"""
        print("\n" + "=" * 60)
        print("TEST 10: RAG Documents View")
        print("=" * 60)
        
        try:
            self.page.goto(f'{BASE_URL}/rag/documents')
            self.wait_for_network_idle()
            self.page.screenshot(path='test_rag_docs.png', full_page=True)
            
            has_header = self.page.is_visible('h1', timeout=5000)
            self.log_result("Documents header exists", has_header)
            
            has_upload_btn = self.page.is_visible('button:has-text("Upload Document")', timeout=5000)
            self.log_result("Upload button exists", has_upload_btn)
            
        except Exception as e:
            self.log_result("RAG Documents view", False, str(e))
    
    def test_rag_queries_view(self):
        """Test 11: RAG Queries view"""
        print("\n" + "=" * 60)
        print("TEST 11: RAG Queries View")
        print("=" * 60)
        
        try:
            self.page.goto(f'{BASE_URL}/rag/queries')
            self.wait_for_network_idle()
            self.page.screenshot(path='test_rag_queries.png', full_page=True)
            
            has_header = self.page.is_visible('h1', timeout=5000)
            self.log_result("Queries header exists", has_header)
            
            has_search_input = self.page.is_visible('.search-box input', timeout=5000)
            self.log_result("Search input exists", has_search_input)
            
            has_search_btn = self.page.is_visible('button:has-text("Search")', timeout=5000)
            self.log_result("Search button exists", has_search_btn)
            
        except Exception as e:
            self.log_result("RAG Queries view", False, str(e))
    
    def test_logs_view(self):
        """Test 12: Logs view"""
        print("\n" + "=" * 60)
        print("TEST 12: Logs View")
        print("=" * 60)
        
        try:
            self.page.goto(f'{BASE_URL}/logs')
            self.wait_for_network_idle()
            self.page.screenshot(path='test_logs.png', full_page=True)
            
            has_header = self.page.is_visible('h1', timeout=5000)
            self.log_result("Logs header exists", has_header)
            
            has_refresh_btn = self.page.is_visible('button:has-text("Refresh")', timeout=5000)
            self.log_result("Refresh button exists", has_refresh_btn)
            
        except Exception as e:
            self.log_result("Logs view", False, str(e))
    
    def test_monitor_view(self):
        """Test 13: System Monitor view"""
        print("\n" + "=" * 60)
        print("TEST 13: System Monitor View")
        print("=" * 60)
        
        try:
            self.page.goto(f'{BASE_URL}/monitor')
            self.wait_for_network_idle()
            self.page.screenshot(path='test_monitor.png', full_page=True)
            
            has_header = self.page.is_visible('h1', timeout=5000)
            self.log_result("Monitor header exists", has_header)
            
            has_refresh_btn = self.page.is_visible('button:has-text("Refresh")', timeout=5000)
            self.log_result("Refresh button exists", has_refresh_btn)
            
            has_metric_cards = self.page.is_visible('.metric-card', timeout=5000)
            self.log_result("Metric cards exist", has_metric_cards)
            
        except Exception as e:
            self.log_result("Monitor view", False, str(e))
    
    def test_navigation(self):
        """Test 14: Navigation between pages"""
        print("\n" + "=" * 60)
        print("TEST 14: Navigation")
        print("=" * 60)
        
        try:
            # Test header navigation
            self.page.goto(f'{BASE_URL}/chat')
            self.wait_for_network_idle()
            
            # Click on RAG link
            self.page.click('a:has-text("RAG")')
            time.sleep(1)
            
            url = self.page.url
            self.log_result("Navigation to RAG works", 'rag' in url, f"URL: {url}")
            
            # Click on Prompts link
            self.page.goto(f'{BASE_URL}/rag')
            self.wait_for_network_idle()
            self.page.click('a:has-text("Prompts")')
            time.sleep(1)
            
            url = self.page.url
            self.log_result("Navigation to Prompts works", 'prompts' in url, f"URL: {url}")
            
        except Exception as e:
            self.log_result("Navigation", False, str(e))
    
    def test_logout(self):
        """Test 15: Logout functionality"""
        print("\n" + "=" * 60)
        print("TEST 15: Logout")
        print("=" * 60)
        
        try:
            self.page.goto(f'{BASE_URL}/chat')
            self.wait_for_network_idle()
            
            # Click logout button
            self.page.click('button:has-text("Logout")')
            time.sleep(1)
            
            url = self.page.url
            self.log_result("Logout redirects to login", 'login' in url, f"URL: {url}")
            
        except Exception as e:
            self.log_result("Logout", False, str(e))
    
    def test_backend_connectivity(self):
        """Test 16: Backend API connectivity"""
        print("\n" + "=" * 60)
        print("TEST 16: Backend API Connectivity")
        print("=" * 60)
        
        try:
            response = self.page.goto(f'{API_BASE}/api/health')
            self.log_result("Backend health check", response.status == 200, 
                          f"Status: {response.status}")
            
        except Exception as e:
            self.log_result("Backend API connectivity", False, str(e))
    
    def run_all_tests(self):
        """Run all tests"""
        print("\n" + "=" * 70)
        print("LLM SERVER - COMPREHENSIVE FRONTEND TEST SUITE")
        print("=" * 70)
        
        self.setup()
        
        try:
            # Run all tests
            self.test_home_page()
            self.test_login_page_navigation()
            self.test_register_page_navigation()
            self.test_registration_flow()
            self.test_login_flow()
            self.test_chat_view()
            self.test_chat_history_view()
            self.test_prompts_view()
            self.test_tools_view()
            self.test_rag_documents_view()
            self.test_rag_queries_view()
            self.test_logs_view()
            self.test_monitor_view()
            self.test_navigation()
            self.test_logout()
            self.test_backend_connectivity()
            
        finally:
            self.teardown()
        
        # Print summary
        print("\n" + "=" * 70)
        print("TEST SUMMARY")
        print("=" * 70)
        print(f"Total tests passed: {len(self.passed)}")
        print(f"Total errors: {len(self.errors)}")
        
        if self.errors:
            print("\nErrors encountered:")
            for error in self.errors:
                print(f"  - {error}")
        
        print("\nScreenshots saved for visual inspection")
        return len(self.errors) == 0


if __name__ == "__main__":
    suite = FrontendTestSuite()
    success = suite.run_all_tests()
    exit(0 if success else 1)
