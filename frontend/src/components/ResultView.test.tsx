import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { describeValue, formatPercent, riskLevel } from '../lib/format'
import { EXPLAIN_ROUTE, INPUT } from '../test/fixtures'
import { mockFetch } from '../test/mockApi'
import { ResultView, riskFactors, type ResultData } from './ResultView'

const base: ResultData = {
  category: 'lower',
  probability: null,
  inputs: INPUT,
  threshold: 0.0674,
  modelVersion: '0.1.0',
  saved: false,
}
const show = (over: Partial<ResultData> = {}) => {
  mockFetch({ 'POST /predictions/explain': EXPLAIN_ROUTE })
  return render(
    <MemoryRouter>
      <ResultView data={{ ...base, ...over }} />
    </MemoryRouter>,
  )
}

describe('verdict', () => {
  it('says "Higher stroke risk" with the percentage and the threshold it is judged against', async () => {
    show({ category: 'higher', probability: 0.131 })
    expect(screen.getByRole('heading', { level: 1, name: 'Higher stroke risk' })).toBeInTheDocument()
    expect(screen.getByText(/estimated stroke risk:/i)).toHaveTextContent('13%')
    expect(
      screen.getByText(
        (_, el) => el?.tagName === 'P' && /treats 6\.7% or more as higher risk/i.test(el.textContent ?? ''),
      ),
    ).toBeInTheDocument()
    expect(screen.getByText(/at or above that level/i)).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Result: Higher stroke risk' })).toBeInTheDocument()
    await screen.findByText(/pushing your estimate up/i)
  })

  it('says "Lower stroke risk" for both the lower and moderate internal bands', async () => {
    for (const category of ['lower', 'moderate'] as const) {
      const { unmount } = show({ category, probability: 0.031 })
      expect(screen.getByRole('heading', { level: 1, name: 'Lower stroke risk' })).toBeInTheDocument()
      expect(screen.getByText(/estimated stroke risk:/i)).toHaveTextContent('3.1%')
      expect(screen.getByText(/below that level/i)).toBeInTheDocument()
      await screen.findByText(/pushing your estimate up/i)
      unmount()
    }
  })

  it('never reassures on a lower result and always carries the safety content', async () => {
    show({ category: 'lower', probability: 0.01 })
    expect(screen.getByText(/lower does not mean no risk/i)).toBeInTheDocument()
    expect(screen.getByRole('alert', { name: '' })).toHaveTextContent(/call your local emergency number/i)
    expect(screen.getByText(/not a diagnosis and cannot diagnose or rule out a stroke/i)).toBeInTheDocument()
    expect(screen.getByText(/qualified healthcare professional/i)).toBeInTheDocument()
    expect(screen.getByText(/does not mean your risk is low/i)).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/you are safe|no risk at all|nothing to worry|all clear/i)
    await screen.findByText(/pushing your estimate up/i)
  })

  it('omits the percentage when the evaluated calibration does not support it, but still gives a verdict', async () => {
    show({ category: 'higher', probability: null })
    expect(screen.getByRole('heading', { level: 1, name: 'Higher stroke risk' })).toBeInTheDocument()
    expect(screen.queryByText(/estimated stroke risk:/i)).not.toBeInTheDocument()
    await screen.findByText(/pushing your estimate up/i)
  })

  it('shows no model-quality material to the user', async () => {
    show({ category: 'higher', probability: 0.131 })
    await screen.findByText(/pushing your estimate up/i)
    expect(document.body.textContent).not.toMatch(
      /ROC|AUC|precision|recall|confusion matrix|calibration|training data \(/i,
    )
  })
})

describe('what is driving the result', () => {
  it('lists the answers that push the estimate up, with their values and size', async () => {
    show({ category: 'higher', probability: 0.131 })
    const heading = await screen.findByRole('heading', { name: /pushing your estimate up/i })
    const list = heading.nextElementSibling as HTMLElement
    const items = within(list)
      .getAllByRole('listitem')
      .map((li) => li.textContent)
    expect(items[0]).toMatch(/age.*67 years.*\+11\.2 points/i) // largest driver first
    expect(items[1]).toMatch(/average glucose.*229 mg\/dL.*\+5\.2 points/i)
    expect(items.join(' ')).toMatch(/heart disease.*yes.*\+1\.0 points/i)
  })

  it('warns that a factor shown as lowering the estimate is not protective', async () => {
    show({ category: 'higher', probability: 0.131 })
    const heading = await screen.findByRole('heading', { name: /pushing your estimate down/i })
    expect(within(heading.nextElementSibling as HTMLElement).getByRole('listitem')).toHaveTextContent(
      /bmi.*-0\.6 points/i,
    )
    expect(screen.getByText(/do not read it as protective/i)).toBeInTheDocument()
  })

  it('names the answers with little or no effect', async () => {
    show({ category: 'higher', probability: 0.131 })
    const note = await screen.findByText(/little or no effect/i)
    expect(note.parentElement).toHaveTextContent(/gender, ever married, work type, residence type/i)
  })

  it('explains the comparison and its limits in plain words', async () => {
    show()
    await screen.findByText(/pushing your estimate up/i)
    expect(screen.getByText(/compared with a typical person/i)).toBeInTheDocument()
    expect(screen.getByText(/do not add up exactly/i)).toBeInTheDocument()
  })

  it('degrades gracefully when the breakdown cannot be loaded', async () => {
    mockFetch({
      'POST /predictions/explain': {
        status: 503,
        body: {
          error: {
            code: 'reference_unavailable',
            message: 'Explanations need one extra file. Run: python -m ml.summarize',
            details: null,
          },
        },
      },
    })
    render(
      <MemoryRouter>
        <ResultView data={{ ...base, category: 'higher', probability: 0.131 }} />
      </MemoryRouter>,
    )
    expect(await screen.findByText(/python -m ml\.summarize/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Higher stroke risk' })).toBeInTheDocument() // the verdict still shows
  })

  it('summarises the inputs with units', async () => {
    show()
    expect(screen.getByText('67 years')).toBeInTheDocument()
    expect(screen.getByText('228.7 mg/dL')).toBeInTheDocument()
    expect(screen.getByText('36.6 kg/m²')).toBeInTheDocument()
    await screen.findByText(/pushing your estimate up/i)
  })
})

describe('wording helpers', () => {
  it('formatPercent never turns a small risk into a misleading 0%', () => {
    expect(formatPercent(0.0004)).toBe('under 0.1%')
    expect(formatPercent(0.0042)).toBe('0.4%')
    expect(formatPercent(0.0674)).toBe('6.7%')
    expect(formatPercent(0.131)).toBe('13%')
    expect(formatPercent(0.4)).toBe('40%')
  })
  it('riskLevel maps the three internal bands onto two user-facing levels', () => {
    expect(riskLevel('higher')).toBe('higher')
    expect(riskLevel('moderate')).toBe('lower')
    expect(riskLevel('lower')).toBe('lower')
  })
  it('describeValue adds units and readable labels', () => {
    expect(describeValue('age', 67)).toBe('67 years')
    expect(describeValue('hypertension', 1)).toBe('Yes')
    expect(describeValue('smoking_status', 'formerly smoked')).toBe('Formerly smoked')
    expect(describeValue('bmi', 36.64)).toBe('36.6 kg/m²')
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
