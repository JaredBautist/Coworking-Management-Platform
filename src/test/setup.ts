import '@testing-library/jest-dom'
import { configureGlobal } from 'fast-check'

configureGlobal({ numRuns: 100 })
