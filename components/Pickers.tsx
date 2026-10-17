'use client'

import { GRADES, Grade, QuestionFormat, Topic } from '../lib/curriculum'
import { Language, useLanguage } from '../lib/i18n'

export const topicLabel = (topic: Topic, language: Language) => topic[language]

/** Generic segmented control; `columns` sets how many options sit on one row. */
export function Segmented<T extends string | number>({ label, value, options, onChange, columns }: {
  label: string
  value: T
  options: { value: T; label: string; ariaLabel?: string }[]
  onChange: (value: T) => void
  columns: number
}) {
  return (
    <fieldset>
      {label && <legend className="field-label">{label}</legend>}
      <div className="segmented" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {options.map(option => (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={value === option.value}
            aria-label={option.ariaLabel}
            className={`segment ${value === option.value ? 'segment-active' : ''}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

export function GradePicker({ value, onChange }: { value: Grade; onChange: (grade: Grade) => void }) {
  const { t } = useLanguage()
  return (
    <Segmented
      label={t('chooseGrade')}
      value={value}
      onChange={onChange}
      columns={6}
      options={GRADES.map(grade => ({ value: grade, label: String(grade), ariaLabel: t('gradeN', { n: grade }) }))}
    />
  )
}

export function FormatPicker({ value, onChange }: { value: QuestionFormat; onChange: (format: QuestionFormat) => void }) {
  const { t } = useLanguage()
  return (
    <Segmented
      label={t('questionFormat')}
      value={value}
      onChange={onChange}
      columns={2}
      options={[
        { value: 'numeric', label: t('formatNumeric') },
        { value: 'mcq', label: t('formatMcq') },
      ]}
    />
  )
}
