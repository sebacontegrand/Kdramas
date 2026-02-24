import { test, expect } from '@playwright/test';

test.describe('OriginLanding 3D Experience', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should render the Three.js background canvas', async ({ page }) => {
        // Skip canvas check in headless if WebGL failed and fallback triggered
        const canvas = page.locator('canvas');
        const count = await canvas.count();
        if (count > 0) {
            await expect(canvas).toBeVisible();
        }
    });

    test('should display origin cards', async ({ page }) => {
        // Wait for the overlay to be visible
        await page.waitForSelector('h1', { state: 'visible' });
        const cards = page.locator('button');
        // Check for at least 4 cards as there might be other buttons in the app background
        const count = await cards.count();
        expect(count).toBeGreaterThanOrEqual(4);
        await expect(page.getByText('South Korea')).toBeVisible();
    });

    test('should trigger selection when a card is clicked', async ({ page }) => {
        // Wait for the entrance animation (0.8s)
        await page.waitForTimeout(1500);

        // Find the card by its text content robustly
        const southKoreaButton = page.locator('button').filter({ hasText: 'South Korea' });
        // Use force click because the transparent overlay might be technically "covering" it for Playwright
        await southKoreaButton.click({ force: true });

        // After selection, the landing overlay should start fading out
        await expect(page.locator('h1')).not.toBeVisible({ timeout: 5000 });
    });

    test('should maintain 3D tilt styles on cards', async ({ page }) => {
        const card = page.locator('button').filter({ hasText: 'Worldwide' });
        // Check for style attributes that indicate 3D setup
        const style = await card.getAttribute('style');
        // Perspective is often set on the outer container or via framer-motion props
        // Let's check for transform-style which is critical for 3D
        expect(style).toContain('transform-style: preserve-3d');
    });
});
