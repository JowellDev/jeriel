import { installGlobals } from '@remix-run/node'
import '@testing-library/jest-dom/vitest'

installGlobals()

vi.mock('~/utils/db.server')
