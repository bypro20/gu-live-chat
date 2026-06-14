'use client'

import { useState } from 'react'

export interface BotStep {
  id?: string
  type: string
  message: string
  options?: Array<{ label: string; nextStepId?: string }>
  order: number
}

const STEP_ICONS: Record<string, string> = {
  MESSAGE: '💬',
  CHOICE: '🔘',
  COLLECT_EMAIL: '📧',
  COLLECT_NAME: '👤',
  ASSIGN_AGENT: '👥',
  END: '✅',
}

type FlowStepEditorProps = {
  steps: BotStep[]
  onChange: (steps: BotStep[]) => void
  labels: {
    flowSteps: string
    dragToReorder: string
    dropHere: string
    addStep: string
    messagePlaceholder: string
    transferPlaceholder: string
    promptPlaceholder: string
    optionText: string
    addOption: string
    stepTypes: Record<string, { label: string; description: string }>
  }
  onAddStep: (type: string) => void
}

export default function FlowStepEditor({
  steps,
  onChange,
  labels,
  onAddStep,
}: FlowStepEditorProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)

  const reorderSteps = (from: number, to: number) => {
    if (from === to) return
    const next = [...steps]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    onChange(next.map((s, i) => ({ ...s, order: i })))
  }

  const removeStep = (index: number) => {
    onChange(steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i })))
  }

  const updateStep = (index: number, field: string, value: string) => {
    const updated = [...steps]
    updated[index] = { ...updated[index], [field]: value }
    onChange(updated)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">{labels.flowSteps}</h3>
        <span className="text-xs text-muted-foreground">{labels.dragToReorder}</span>
      </div>

      <div className="relative pl-4 border-l-2 border-dashed border-primary/30 space-y-0">
        {steps.map((step, index) => (
          <div key={`${step.type}-${index}`} className="relative">
            {index > 0 && (
              <div className="absolute -left-4 top-0 w-4 h-6 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-primary/40" />
              </div>
            )}

            <div
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragEnd={() => {
                setDragIndex(null)
                setDropIndex(null)
              }}
              onDragOver={(e) => {
                e.preventDefault()
                setDropIndex(index)
              }}
              onDragLeave={() => setDropIndex(null)}
              onDrop={(e) => {
                e.preventDefault()
                if (dragIndex !== null) reorderSteps(dragIndex, index)
                setDragIndex(null)
                setDropIndex(null)
              }}
              className={`mb-3 rounded-xl border transition-all ${
                dropIndex === index && dragIndex !== null && dragIndex !== index
                  ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                  : 'border-border bg-muted'
              } ${dragIndex === index ? 'opacity-50' : ''}`}
            >
              <div className="flex items-start gap-3 p-4">
                <button
                  type="button"
                  className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0"
                  aria-label={labels.dragToReorder}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7 2a2 2 0 110 4 2 2 0 010-4zM7 8a2 2 0 110 4 2 2 0 010-4zM7 14a2 2 0 110 4 2 2 0 010-4zM13 2a2 2 0 110 4 2 2 0 010-4zM13 8a2 2 0 110 4 2 2 0 010-4zM13 14a2 2 0 110 4 2 2 0 010-4z" />
                  </svg>
                </button>

                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-sm font-bold text-primary shrink-0">
                  {index + 1}
                </div>

                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{STEP_ICONS[step.type]}</span>
                    <span className="text-sm font-medium text-foreground">
                      {labels.stepTypes[step.type]?.label}
                    </span>
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      — {labels.stepTypes[step.type]?.description}
                    </span>
                  </div>

                  {(step.type === 'MESSAGE' ||
                    step.type === 'COLLECT_EMAIL' ||
                    step.type === 'COLLECT_NAME' ||
                    step.type === 'ASSIGN_AGENT') && (
                    <input
                      type="text"
                      value={step.message}
                      onChange={(e) => updateStep(index, 'message', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                      placeholder={
                        step.type === 'MESSAGE'
                          ? labels.messagePlaceholder
                          : step.type === 'ASSIGN_AGENT'
                            ? labels.transferPlaceholder
                            : labels.promptPlaceholder
                      }
                    />
                  )}

                  {step.type === 'CHOICE' && (
                    <div className="space-y-2">
                      {step.options?.map((opt, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-2">
                          <div className="w-5 h-5 shrink-0 rounded-full border-2 border-primary flex items-center justify-center text-xs text-primary">
                            {String.fromCharCode(65 + optIndex)}
                          </div>
                          <input
                            type="text"
                            value={opt.label}
                            onChange={(e) => {
                              const updated = [...steps]
                              const options = [...(updated[index].options || [])]
                              options[optIndex] = { ...options[optIndex], label: e.target.value }
                              updated[index] = { ...updated[index], options }
                              onChange(updated)
                            }}
                            className="flex-1 min-w-0 px-3 py-1.5 rounded-lg border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                            placeholder={labels.optionText}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...steps]
                              const options = (updated[index].options || []).filter((_, i) => i !== optIndex)
                              updated[index] = { ...updated[index], options }
                              onChange(updated)
                            }}
                            className="text-destructive hover:opacity-80 text-sm shrink-0"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...steps]
                          const options = [...(updated[index].options || []), { label: '' }]
                          updated[index] = { ...updated[index], options }
                          onChange(updated)
                        }}
                        className="text-xs text-primary hover:underline"
                      >
                        {labels.addOption}
                      </button>
                    </div>
                  )}
                </div>

                {steps.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeStep(index)}
                    className="text-muted-foreground hover:text-destructive transition shrink-0"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {dragIndex !== null && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              if (dragIndex !== null) reorderSteps(dragIndex, steps.length - 1)
              setDragIndex(null)
              setDropIndex(null)
            }}
            className="mb-3 rounded-xl border-2 border-dashed border-primary/40 p-4 text-center text-xs text-muted-foreground"
          >
            {labels.dropHere}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.entries(labels.stepTypes).map(([type, info]) => (
          <button
            key={type}
            type="button"
            onClick={() => onAddStep(type)}
            className="px-3 py-2 bg-muted hover:bg-accent rounded-lg text-sm transition flex items-center gap-1.5 text-foreground"
          >
            <span>{STEP_ICONS[type]}</span>
            <span>{info.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
