import type { BrowserContext, Locator, Page } from '@playwright/test'

export class SignInPage {
	public readonly emailField: Locator
	public readonly passwordField: Locator
	public readonly rememberMeCheckbox: Locator
	public readonly submitButton: Locator

	constructor(
		public readonly page: Page,
		public readonly context: BrowserContext,
	) {
		this.emailField = this.page.getByRole('textbox', { name: /email address/i })
		this.passwordField = this.page.getByRole('textbox', { name: /password/i })
		this.rememberMeCheckbox = this.page.getByRole('checkbox', {
			name: /remember me/i,
		})
		this.submitButton = this.page.getByRole('button', { name: /log in/i })
	}

	async goTo() {
		await this.page.goto('/login')
	}

	async fillInputs(email: string, password: string, rememberMe = false) {
		await this.emailField.fill(email)
		await this.passwordField.fill(password)
		if (rememberMe) await this.rememberMeCheckbox.check()
	}

	async submit() {
		await this.submitButton.click()
	}
}
