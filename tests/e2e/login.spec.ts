import { test, expect } from '@playwright/test';

const appUrl = 'http://localhost:5173';

test.describe('Login page', () => {
	test('renders login form fields and submit button', async ({ page }) => {
		await page.goto(appUrl);
		const loginForm = page.locator('form');

		await expect(page.getByRole('heading', { name: 'Welcome back!' })).toBeVisible();
		await expect(page.getByLabel('Email or Phone Number')).toBeVisible();
		await expect(page.getByLabel('Password')).toBeVisible();
		await expect(loginForm.getByRole('button', { name: 'Sign In' })).toBeVisible();
	});

	test('shows required validation errors when submitting empty form', async ({ page }) => {
		await page.goto(appUrl);
		const loginForm = page.locator('form');

		await loginForm.getByRole('button', { name: 'Sign In' }).click();

		await expect(page.getByText('Email is required')).toBeVisible();
		await expect(page.getByText('Password is required')).toBeVisible();
	});

	test('navigates to forgot password page', async ({ page }) => {
		await page.goto(appUrl);

		await page.getByRole('button', { name: 'Forgot Password?' }).click();

		await expect(page).toHaveURL(/\/forgot-password$/);
		await expect(page.getByRole('heading', { name: 'Forgot your password?' })).toBeVisible();
	});

	test('logs in with valid credentials', async ({ page }) => {

		await page.goto(appUrl);
		const loginForm = page.locator('form');

		await page.getByLabel('Email or Phone Number').fill("huy120904@gmail.com");
		await page.getByLabel('Password').fill("123123");
		await loginForm.getByRole('button', { name: 'Sign In' }).click();

		// Admin and Supplier accounts redirect to different dashboards.
		await expect(page).toHaveURL(/\/(admin|supplier)\/dashboard$/);
	});
});
