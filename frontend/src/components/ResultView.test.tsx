import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { INPUT } from '../test/fixtures'
import { ResultView, riskFactors, type ResultData } from './ResultView'

const base: ResultData = {
  category: 'lower',
  probability: null,
  inputs: INPUT,
  threshold: 0.07,
  modelVersion: '0.1.0',
  saved: false,
}
const show = (over: Partial<ResultData> = {}) =>
  render(
    <MemoryRouter>
      <ResultView data={{ ...base, ...over }} />
    </MemoryRouter>,
  )

describe('result view', () => {
  it('never reassures on a low result and always carries the safety content', () => {
    show({ category: 'lower' })
    expect(screen.getByText(/not a statement that you are safe/i)).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(/call your local emergency number/i)
    expect(screen.getByText(/not a diagnosis and cannot diagnose or rule out a stroke/i)).toBeInTheDocument()
    expect(screen.getByText(/qualified healthcare professional/i)).toBeInTheDocument()
    expect(screen.getByText(/does not mean your risk is low/i)).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/you are safe(?! or)|no risk|nothing to worry|all clear/i)
  })

  it('hides the percentage unless the evaluated calibration supports it', () => {
    const { unmount } = show({ probability: null })
    expect(screen.queryByText(/approximate model output/i)).not.toBeInTheDocument()
    unmount()
    show({ probability: 0.123 })
    expect(screen.getByText(/approximate model output/i)).toHaveTextContent('12%')
  })

  it('shows a calm band, not a gauge, with the position labelled', () => {
    show({ category: 'higher' })
    expect(screen.getByRole('img', { name: /higher than typical in the training data/i })).toBeInTheDocument()
  })

  it('summarises the inputs with units', () => {
    show()
    expect(screen.getByText('67 years')).toBeInTheDocument()
    expect(screen.getByText('228.7 mg/dL')).toBeInTheDocument()
    expect(screen.getByText('36.6 kg/m²')).toBeInTheDocument()
  })
})

describe('riskFactors', () => {
  it('flags only commonly discussed factors from the inputs', () => {
    const texts = riskFactors(INPUT)
      .map((f) => f.text)
      .join(' | ')
    expect(texts).toMatch(/heart disease/i)
    expect(texts).toMatch(/65 and over/)
    expect(texts).toMatch(/BMI is 30 or higher/)
    expect(texts).toMatch(/126 mg\/dL or higher/)
    expect(texts).toMatch(/smoked in the past/)
    expect(texts).not.toMatch(/high blood pressure/i)
  })
  it('returns an empty list for a young person with no listed factors', () => {
    expect(
      riskFactors({
        ...INPUT,
        age: 30,
        heart_disease: 0,
        bmi: 22,
        avg_glucose_level: 90,
        smoking_status: 'never smoked',
      }),
    ).toEqual([])
  })
})
