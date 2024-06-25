import { expect, test } from '../fixtures'

test.describe('[logged out] home page', () => {
	test.beforeEach(async ({ homePage }) => {
		await homePage.goTo()
	})

	test('should display the home page', async ({ page, homePage }) => {
		await expect(page).toHaveTitle(/Nobu Stack/i)
		await expect(homePage.title).toBeVisible()
		await expect(homePage.loginButton).toBeVisible()
		await expect(homePage.signupButton).toBeVisible()
		await expect(homePage.descriptionText).toBeVisible()
		await expect(homePage.poweredBy).toBeVisible()
	})
})
