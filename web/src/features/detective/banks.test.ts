import { describe, expect, it } from 'vitest'
import { CONCEPTS, STORIES, type Mcq, type T } from './banks'

const texts = (m: Mcq): T[] => [m.prompt, m.explain, ...m.choices]

describe('detective question banks', () => {
  it('has enough questions to make every round different', () => {
    expect(CONCEPTS.length).toBeGreaterThanOrEqual(12)
    expect(STORIES.length).toBeGreaterThanOrEqual(6)
  })

  it('has unique ids', () => {
    const ids = [...CONCEPTS, ...STORIES].map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('gives every question 4 choices and text in both languages', () => {
    for (const q of [...CONCEPTS, ...STORIES]) {
      expect(q.choices, q.id).toHaveLength(4)
      for (const t of texts(q)) {
        expect(t.en.trim(), q.id).not.toBe('')
        expect(t.es.trim(), q.id).not.toBe('')
      }
    }
  })

  it('gives every story a title and a narrative in both languages', () => {
    for (const s of STORIES) {
      for (const t of [s.title, s.body]) { expect(t.en.length, s.id).toBeGreaterThan(10); expect(t.es.length, s.id).toBeGreaterThan(10) }
    }
  })
})
