import type { Locator, Page } from '@playwright/test'

export class HomePage {
	public readonly title: Locator
	public readonly loginButton: Locator
	public readonly signupButton: Locator
	public readonly descriptionText: Locator
	public readonly poweredBy: Locator

	constructor(public readonly page: Page) {
		this.title = page.getByText(/nobu stack/i)
		this.loginButton = page.getByRole('link', { name: /sign up/i })
		this.signupButton = page.getByRole('link', { name: /log in/i })
		this.descriptionText = page.getByText(/check the readme\.md/i)
		this.poweredBy = page.getByText(/powered by/i)
	}

	async goTo() {
		await this.page.goto('/')
	}
}
