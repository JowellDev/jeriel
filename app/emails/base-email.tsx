import {
	Body,
	Container,
	Font,
	Head,
	Hr,
	Html,
	Img,
	Preview,
	Section,
	Tailwind,
	Text,
} from '@react-email/components'
import { type PropsWithChildren } from 'react'

const baseURL = process.env.BASE_URL ?? 'http://localhost:3000'

interface Props {
	title: string | string[]
	className?: string
}

export function BaseEmail({
	children,
	title,
	className,
}: Readonly<PropsWithChildren<Props>>) {
	return (
		<Tailwind>
			<Html lang="fr">
				<Preview>{title}</Preview>

				<Head>
					<Font
						fontFamily="Roboto"
						fallbackFontFamily="Verdana"
						webFont={{
							url: 'https://fonts.gstatic.com/s/poppins/v21/pxiGyp8kv8JHgFVrJJLufntAOvWDSHFF.woff2',
							format: 'woff2',
						}}
						fontWeight={400}
						fontStyle="normal"
					/>
				</Head>

				<Body className="bg-white mx-auto px-2 pt-4">
					<Container className="border border-solid border-zinc-300 rounded mx-auto max-w-[35rem] pt-8">
						<Section className="md:px-16 px-8">
							<Section>
								<Img
									src={`${baseURL}/images/green-logo-vh.png`}
									height={40}
									width="auto"
									alt="Logo vase d'honneur"
								/>
							</Section>

							<Hr className="border border-[#226C67] my-2" />

							<Section className={`md:py-16 md:px-8 px-4 ${className}`}>
								{children}
							</Section>
						</Section>

						<Hr />

						<Text className="text-base">
							Copyright © {new Date().getFullYear()}- Jeriel, Tous droits
							reservés.
						</Text>
					</Container>
				</Body>
			</Html>
		</Tailwind>
	)
}

BaseEmail.PreviewProps = {
	previewText: 'Base email template',
}
