/// <reference types="jest" />
/* eslint-env jest */
/**
 * @jest-environment node
 */
const { rawToPins, getInputSelector, isValidFirstBall, isValidSecondBall } = require('./scorer.js')

describe('rawToPins', () => {
  describe('basic pin conversions', () => {
    test('converts "-" (miss) to 0', () => {
      expect(rawToPins('-')).toBe(0)
    })

    test('converts "X" (strike) to 10', () => {
      expect(rawToPins('X')).toBe(10)
    })

    test('converts numeric strings correctly', () => {
      expect(rawToPins('5')).toBe(5)
      expect(rawToPins('0')).toBe(0)
      expect(rawToPins('10')).toBe(10)
    })

    test('returns null for empty string', () => {
      expect(rawToPins('')).toBeNull()
    })

    test('handles lowercase "x" as strike', () => {
      expect(rawToPins('x')).toBe(10)
    })

    test('trims whitespace', () => {
      expect(rawToPins('  5  ')).toBe(5)
      expect(rawToPins('  X  ')).toBe(10)
    })
  })

  describe('spare logic', () => {
    test('calculates spare correctly when previous ball was 3', () => {
      expect(rawToPins('/', '3')).toBe(7)
    })

    test('calculates spare correctly when previous ball was 0', () => {
      expect(rawToPins('/', '-')).toBe(10)
    })

    test('returns null for spare without previous ball value', () => {
      expect(rawToPins('/', null)).toBeNull()
    })

    test('returns null for spare when previous ball is invalid', () => {
      expect(rawToPins('/', '')).toBeNull()
    })
  })

  describe('invalid input', () => {
    test('returns null for non-numeric invalid input', () => {
      expect(rawToPins('abc')).toBeNull()
    })

    test('converts any numeric value (range validation is done elsewhere)', () => {
      expect(rawToPins('11')).toBe(11)
      expect(rawToPins('-5')).toBe(-5)
    })
  })
})

describe('getInputSelector', () => {
  test('creates correct selector for frame and ball combination', () => {
    expect(getInputSelector(1, 1)).toBe('input[id^="f1b1"]')
    expect(getInputSelector(5, 2)).toBe('input[id^="f5b2"]')
    expect(getInputSelector(10, 3)).toBe('input[id^="f10b3"]')
  })

  test('handles all frame numbers 1-10', () => {
    for (let frame = 1; frame <= 10; frame++) {
      for (let ball = 1; ball <= 3; ball++) {
        const selector = getInputSelector(frame, ball)
        expect(selector).toContain(`f${frame}b${ball}`)
      }
    }
  })
})

describe('isValidFirstBall', () => {
  describe('valid entries', () => {
    test('allows empty string (allows user to keep typing)', () => {
      expect(isValidFirstBall('')).toBe(true)
    })

    test('allows dash (miss)', () => {
      expect(isValidFirstBall('-')).toBe(true)
    })

    test('allows "X" (strike)', () => {
      expect(isValidFirstBall('X')).toBe(true)
      expect(isValidFirstBall('x')).toBe(true)
    })

    test('allows numeric values 0-10', () => {
      expect(isValidFirstBall('0')).toBe(true)
      expect(isValidFirstBall('5')).toBe(true)
      expect(isValidFirstBall('10')).toBe(true)
    })

    test('trims whitespace', () => {
      expect(isValidFirstBall('  5  ')).toBe(true)
      expect(isValidFirstBall('  X  ')).toBe(true)
    })
  })

  describe('invalid entries', () => {
    test('rejects spare "/" on first ball', () => {
      expect(isValidFirstBall('/')).toBe(false)
    })

    test('rejects numbers greater than 10', () => {
      expect(isValidFirstBall('11')).toBe(false)
      expect(isValidFirstBall('15')).toBe(false)
    })

    test('rejects negative numbers', () => {
      expect(isValidFirstBall('-5')).toBe(false)
    })

    test('rejects non-numeric values', () => {
      expect(isValidFirstBall('abc')).toBe(false)
      expect(isValidFirstBall('!@#')).toBe(false)
    })
  })
})

describe('isValidSecondBall', () => {
  describe('valid entries for frames 1-9', () => {
    test('allows empty string', () => {
      expect(isValidSecondBall('', '5', 1)).toBe(true)
    })

    test('allows dash (miss)', () => {
      expect(isValidSecondBall('-', '5', 1)).toBe(true)
    })

    test('allows spare when first ball value is present', () => {
      expect(isValidSecondBall('/', '5', 1)).toBe(true)
      expect(isValidSecondBall('/', '3', 5)).toBe(true)
    })

    test('allows numeric values that sum with first ball <= 10', () => {
      expect(isValidSecondBall('5', '3', 1)).toBe(true)
      expect(isValidSecondBall('0', '10', 1)).toBe(true)
      expect(isValidSecondBall('5', '-', 3)).toBe(true)
    })
  })

  describe('invalid entries for frames 1-9', () => {
    test('rejects spare "/" when first ball is empty', () => {
      expect(isValidSecondBall('/', '', 1)).toBe(false)
    })

    test('rejects spare "/" when first ball is strike', () => {
      expect(isValidSecondBall('/', 'X', 1)).toBe(false)
    })

    test('rejects "X" on second ball (except frame 10)', () => {
      expect(isValidSecondBall('X', '5', 1)).toBe(false)
      expect(isValidSecondBall('X', '3', 9)).toBe(false)
    })

    test('rejects when second ball sum exceeds 10', () => {
      expect(isValidSecondBall('6', '5', 1)).toBe(false)
      expect(isValidSecondBall('8', '3', 4)).toBe(false)
    })

    test('rejects negative numbers', () => {
      expect(isValidSecondBall('-5', '3', 1)).toBe(false)
    })

    test('rejects numbers greater than 10', () => {
      expect(isValidSecondBall('11', '0', 1)).toBe(false)
    })
  })

  describe('10th frame special rules', () => {
    test('allows "X" on second ball in 10th frame', () => {
      expect(isValidSecondBall('X', 'X', 10)).toBe(true)
      expect(isValidSecondBall('X', '5', 10)).toBe(true)
    })

    test('allows spare in 10th frame', () => {
      expect(isValidSecondBall('/', '5', 10)).toBe(true)
    })

    test('allows flexible combinations in 10th frame after strike', () => {
      expect(isValidSecondBall('5', 'X', 10)).toBe(true)
      expect(isValidSecondBall('X', 'X', 10)).toBe(true)
    })

    test('rejects second ball sum > 10 when first is not strike (10th frame)', () => {
      expect(isValidSecondBall('6', '5', 10)).toBe(false)
      expect(isValidSecondBall('8', '3', 10)).toBe(false)
    })
  })

  describe('whitespace handling', () => {
    test('trims whitespace from input', () => {
      expect(isValidSecondBall('  5  ', '  3  ', 1)).toBe(true)
      expect(isValidSecondBall('  /  ', '  5  ', 1)).toBe(true)
    })
  })
})
