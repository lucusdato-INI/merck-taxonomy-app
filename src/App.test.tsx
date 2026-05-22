import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the app header', () => {
    render(<App />)
    expect(screen.getByText('CTT Traffic Sheet Generator')).toBeInTheDocument()
  })

  it('shows upload instructions', () => {
    render(<App />)
    expect(screen.getByText(/upload a blocking chart/i)).toBeInTheDocument()
  })
})
