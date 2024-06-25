import type { Locator, Page } from '@playwright/test'

export class PasswordResetPage {
	public readonly passwordField: Locator
	public readonly passwordConfirmField: Locator
	public readonly submitButton: Locator

	constructor(public readonly page: Page) {
		this.passwordField = this.page.getByLabel(/^New password$/, { exact: true })
		this.passwordConfirmField = this.page.getByLabel(/Confirm new password/)
		this.submitButton = this.page.getByRole('button', {
			name: /reset password/i,
		})
	}

	async goTo() {
		await this.page.goto('/password-forgotten')
	}

	async fillFields(password: string, confirmPassword: string) {
		await this.passwordField.fill(password)
		await this.passwordConfirmField.fill(confirmPassword)
	}

	async submit() {
		await this.submitButton.click()
	}
}
