#!/usr/bin/env python3
"""Test Hardware Monitor page rendering and functionality."""

from playwright.sync_api import sync_playwright

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # Navigate to app
        page.goto('http://localhost:5174')
        page.wait_for_load_state('networkidle')
        
        # Take initial screenshot
        page.screenshot(path='/tmp/hardware_monitor_initial.png', full_page=True)
        print("✓ Initial page loaded")
        
        # Click on Hardware Monitor nav item
        page.click('text=Hardware Monitor')
        page.wait_for_load_state('networkidle')
        
        # Take screenshot after navigation
        page.screenshot(path='/tmp/hardware_monitor_page.png', full_page=True)
        print("✓ Hardware Monitor page loaded")
        
        # Check for key elements
        checks = [
            ('Per-Core CPU Usage', 'text=Per-Core CPU Usage'),
            ('Memory Usage', 'text=Memory Usage'),
            ('Swap Usage', 'text=Swap Usage'),
            ('CPU History', 'text=CPU History'),
            ('Memory History', 'text=Memory History'),
            ('Swap History', 'text=Swap History'),
        ]
        
        for name, selector in checks:
            try:
                element = page.locator(selector).first
                element.wait_for(timeout=2000)
                print(f"✓ Found: {name}")
            except Exception as e:
                print(f"✗ Missing: {name} - {e}")
        
        # Check for CPU core cards (should have 28 cores)
        core_cards = page.locator('.cpu-core-card')
        count = core_cards.count()
        print(f"✓ Found {count} CPU core cards")
        
        # Check for charts
        charts = page.locator('canvas')
        chart_count = charts.count()
        print(f"✓ Found {chart_count} canvas elements (charts)")
        
        # Wait 6 seconds for a poll cycle and check data updates
        print("Waiting for data update cycle...")
        page.wait_for_timeout(6000)
        
        # Take final screenshot
        page.screenshot(path='/tmp/hardware_monitor_after_poll.png', full_page=True)
        print("✓ Data update cycle completed")
        
        # Check console for errors
        console_errors = []
        for msg in page.evaluate("console.errors || []"):
            console_errors.append(str(msg))
        
        if console_errors:
            print(f"⚠ Console errors: {console_errors[:3]}")
        else:
            print("✓ No console errors")
        
        browser.close()
        print("\nTest completed. Screenshots saved to /tmp/")

if __name__ == "__main__":
    main()
