import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement } from 'react'

const customerRender = (ui: ReactElement, options?: RenderOptions) =>
	render(ui, { ...options })

export * from '@testing-library/react'
export { customerRender as render }
