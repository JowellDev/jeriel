import { Button, Heading, Section, Text } from '@react-email/components'
import { BaseEmail } from '~/emails/base-email'

export function PasswordForgottenEmail({
	link,
}: Readonly<{
	link: string
}>) {
	const title = 'Réinitialisation de mot de passe'

	return (
		<BaseEmail title={title}>
			<>
				<Heading className="text-xl text-blue-700">{title}</Heading>

				<Text className="text-zinc-600">
					Veuillez cliquer sur le bouton ci-dessous pour confirmer votre demande
					de réinitialisation de mot de passe.
				</Text>

				<Section className="text-center">
					<Button
						href={link}
						className="bg-blue-700 whitespace-nowrap rounded text-xs h-4 px-4 py-2 text-white tracking-wider"
					>
						Confirmer
					</Button>
				</Section>

				<Text className="text-zinc-600">
					NB: Lien de réinitialisation valable pendant 10 minutes.
				</Text>

				<Text className="pt-4 text-zinc-500">
					Si vous n&apos;avez pas fait cette demande, veuillez simplement
					ignorer cet email ou nous contacter.
				</Text>
			</>
		</BaseEmail>
	)
}

PasswordForgottenEmail.PreviewProps = {
	link: 'https://example.com/reset-password?otp=123456',
}
