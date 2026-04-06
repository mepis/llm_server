from playwright.sync_api import sync_playwright
import time

def test_app():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        
        # Track console errors
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('console', lambda msg: print(f"Console [{msg.type}]: {msg.text}"))
        
        print("=" * 60)
        print("TEST 1: Home Page")
        print("=" * 60)
        page.goto('http://127.0.0.1:5173')
        page.wait_for_load_state('networkidle')
        page.screenshot(path='home_page.png', full_page=True)
        print("✓ Home page loaded")
        print(f"Title: {page.title()}")
        
        print("\n" + "=" * 60)
        print("TEST 2: Login Page Navigation")
        print("=" * 60)
        page.goto('http://127.0.0.1:5173/login')
        page.wait_for_load_state('networkidle')
        page.screenshot(path='login_page.png', full_page=True)
        
        # Check for login elements
        if page.is_visible('h1', timeout=1000):
            heading = page.query_selector('h1')
            print(f"✓ Login heading found: {heading.inner_text()}")
        
        if page.is_visible('.btn-primary', timeout=1000):
            print("✓ Login button found")
        elif page.is_visible('.p-button', timeout=1000):
            print("✓ Login button found (PrimeVue)")
        else:
            print("✗ Login button not found")
        
        print("\n" + "=" * 60)
        print("TEST 3: Register Page Navigation")
        print("=" * 60)
        page.goto('http://127.0.0.1:5173/register')
        page.wait_for_load_state('networkidle')
        page.screenshot(path='register_page.png', full_page=True)
        
        # Check for register elements
        if page.is_visible('h1', timeout=1000):
            heading = page.query_selector('h1')
            print(f"✓ Register heading found: {heading.inner_text()}")
        
        print("\n" + "=" * 60)
        print("TEST 4: Check for JavaScript Errors")
        print("=" * 60)
        if errors:
            print(f"✗ Found {len(errors)} JavaScript errors:")
            for error in errors:
                print(f"  - {error}")
        else:
            print("✓ No JavaScript errors found")
        
        print("\n" + "=" * 60)
        print("TEST 5: Backend API Connectivity")
        print("=" * 60)
        try:
            response = page.goto('http://127.0.0.1:3000/health')
            print(f"✓ Backend health check: {response.status}")
        except Exception as e:
            print(f"✗ Backend health check failed: {e}")
        
        print("\n" + "=" * 60)
        print("SUMMARY")
        print("=" * 60)
        print(f"Total JavaScript errors: {len(errors)}")
        print("Screenshots saved: home_page.png, login_page.png, register_page.png")
        
        browser.close()

if __name__ == "__main__":
    test_app()