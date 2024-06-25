import {
	Body,
	Button,
	Container,
	Font,
	Head,
	Heading,
	Hr,
	Html,
	Preview,
	Section,
	Tailwind,
	Text,
} from '@react-email/components'

interface WelcomeEmailProps {
	username: string
}

export default function WelcomeEmail(props: Readonly<WelcomeEmailProps>) {
	const { username } = props

	return (
		<Html lang="en" data-theme="light">
			<Head>
				<Font
					fontFamily="Nunito Sans"
					fallbackFontFamily="Verdana"
					webFont={{
						url: 'https://fonts.gstatic.com/s/nunitosans/v15/pe0TMImSLYBIv1o4X1M8ce2xCx3yop4tQpF_MeTm0lfUVwoNnq4CLz0_upHZPYsZ51Q42ptCprt4R-tQKr51pE8.woff2',
						format: 'woff2',
					}}
				/>
			</Head>

			<Preview>Welcome to Nobu Stack</Preview>

			<Tailwind>
				<Body className="bg-white my-auto mx-auto px-2">
					<Container className="border border-zinc-200 border-solid  px-4 text-sm my-10 max-w-96 rounded">
						<Heading className="text-xl font-semibold text-center my-8">
							Nobu Stack
						</Heading>
						<Text>Hi {username},</Text>
						<Text>Welcome to Nobu Stack. We hope you will like it!</Text>
						<Section className="text-center my-8">
							<Button
								href="http://localhost:3000/login"
								className="bg-zinc-900 text-zinc-50 whitespace-nowrap rounded-md text-sm font-medium h-4 px-4 py-2"
							>
								Get started
							</Button>
						</Section>
						<Text>
							Best,
							<br />
							Nobu Team
						</Text>
						<Hr className="my-8" />
						<Text className="text-zinc-400 font-light text-center mb-8">
							All rights reserved. {new Date().getFullYear()}
						</Text>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	)
}
