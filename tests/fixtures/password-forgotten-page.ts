import type { Locator, Page } from '@playwright/test'

export class PasswordForgottenPage {
	public readonly emailField: Locator
	public readonly submitButton: Locator

	constructor(public readonly page: Page) {
		this.emailField = this.page.getByRole('textbox', { name: /email address/i })
		this.submitButton = this.page.getByRole('button', {
			name: /send verification mail/i,
		})
	}

	async goTo() {
		await this.page.goto('/password-forgotten')
	}

	async goToVerify(email: string, otp: string) {
		await this.page.goto(`/password-forgotten/verify?email=${email}&otp=${otp}`)
	}

	async fillEmail(email: string) {
		await this.emailField.fill(email)
	}

	async submit() {
		await this.submitButton.click()
	}
}
