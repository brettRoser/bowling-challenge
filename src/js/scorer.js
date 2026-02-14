$(document).ready(function () {
  updatePlayerCountForScorecardEvent()
  // ensure the initial table inputs receive unique IDs/names
  normalizeScorecardIds()
  identifyScoreChangeEvent()
})

function updatePlayerCountForScorecardEvent () {
  $('#bowlers').change(function () {
    const $scorecard = $('#scorecard')
    const numberOfBowlers = parseInt($('#bowlers').val(), 10)
    const currentGameCount = $scorecard.find('table').length

    if (currentGameCount <= numberOfBowlers) {
      addGamesToScorecard(numberOfBowlers, currentGameCount, $scorecard)
    } else {
      removeGamesFromScorecard(numberOfBowlers, $scorecard)
    }
  })
}

function addGamesToScorecard (numberOfBowlers, currentGameCount, $scorecard) {
  const $initialGame = $scorecard.find('table').first()
  for (let i = currentGameCount; i < numberOfBowlers; i++) {
    const $initialGameClone = $initialGame.clone(true, true)
    // clear inputs and ensure none are disabled from cloned state
    $initialGameClone.find('input').val('').prop('disabled', false)
    // clear any frame/total labels that were cloned
    $initialGameClone.find('td.frameScore label, td.lastFrameScore label, td[rowspan="2"].center label').text('')
    $initialGameClone.removeClass('game1').addClass('game' + (i + 1))
    $scorecard.append($initialGameClone)
  }

  // After adding/removing tables, normalize IDs and names so each input is unique per player
  normalizeScorecardIds()
}

function normalizeScorecardIds () {
  const tables = $('#scorecard').find('table')
  tables.each(function (tableIndex) {
    const playerIndex = tableIndex + 1
    $(this).attr('data-player', playerIndex)
    $(this).find('input').each(function () {
      const $input = $(this)
      const oldId = $input.attr('id') || ''
      const oldName = $input.attr('name') || ''

      // compute a base id by stripping any existing _p\d+ suffix
      const baseId = oldId.replace(/_p\d+$/, '') || oldName.replace(/_p\d+$/, '')
      const newId = baseId ? baseId + '_p' + playerIndex : ''
      if (newId) $input.attr('id', newId)

      const baseName = oldName.replace(/_p\d+$/, '') || oldId.replace(/_p\d+$/, '')
      const newName = baseName ? baseName + '_p' + playerIndex : ''
      if (newName) $input.attr('name', newName)
    })
  })
}

function removeGamesFromScorecard (numberOfBowlers, $scorecard) {
  const $tables = $scorecard.find('table')
  for (let i = $tables.length; i > numberOfBowlers; i--) {
    $tables.eq(i - 1).remove()
  }
  normalizeScorecardIds()
}

function identifyScoreChangeEvent () {
  // delegated binding so newly added tables are covered
  $(document).on('input', '#scorecard .scores', function () {
    const game = $(this).closest('table')
    const playerIndex = +game.attr('data-player') || game.index() + 1
    console.log('changed game is', game[0].className, 'player', playerIndex)
  })
}

// Helper function to build input selector by frame and ball number
function getInputSelector (frame, ball) {
  return 'input[id^="f' + frame + 'b' + ball + '"]'
}

// Helper function to convert raw input string to pins value
function rawToPins (raw, prevRaw = null) {
  const val = (raw || '').toString().trim()
  if (val === '') return null
  if (val === '-') return 0
  if (val.toUpperCase() === 'X') return 10
  if (val === '/') {
    if (prevRaw === null) return null
    const prev = rawToPins(prevRaw, null)
    if (prev === null) return null
    return Math.max(0, 10 - prev)
  }
  const n = parseInt(val, 10)
  return Number.isFinite(n) ? n : null
}

// Compute scores for a given player table
function computeScoresForTable ($table) {
  let cumulative = 0

  function getBallPins (frame, ball) {
    const $input = $table.find(getInputSelector(frame, ball))
    if (!$input.length) return null
    const raw = ($input.val() || '').toString().trim()
    if (raw === '') return null
    if (raw === '-') return 0
    if (raw.toUpperCase() === 'X') return 10
    if (raw === '/') {
      // spare -> needs previous ball value: for ball 2 it's ball 1, for ball 3 it's ball 2
      const prevBall = (ball === 2) ? 1 : (ball === 3 ? 2 : 1)
      const prev = getBallPins(frame, prevBall)
      if (prev === null) return null
      return Math.max(0, 10 - prev)
    }
    const n = parseInt(raw, 10)
    return Number.isFinite(n) ? n : null
  }

  function getNextThrows (frame, count) {
    const throws = []
    for (let f = frame + 1; f <= 10 && throws.length < count; f++) {
      const b1 = getBallPins(f, 1)
      if (b1 !== null) throws.push(b1)
      const b2 = getBallPins(f, 2)
      if (b2 !== null) throws.push(b2)
      if (f === 10) {
        const b3 = getBallPins(10, 3)
        if (b3 !== null) throws.push(b3)
      }
    }
    return throws.slice(0, count)
  }

  // iterate frames 1..10 and compute frame scores when possible
  for (let frame = 1; frame <= 10; frame++) {
    const b1 = getBallPins(frame, 1)
    const b2 = getBallPins(frame, 2)
    const $scoreCell = $table.find('td').filter(function () {
      return $(this).hasClass(frame === 10 ? 'lastFrameScore' : 'frameScore')
    }).eq(frame - 1)

    let frameTotal = null

    // strike
    if (b1 === 10 && frame < 10) {
      const next = getNextThrows(frame, 2)
      if (next.length === 2) frameTotal = 10 + next[0] + next[1]
    } else if (frame < 10) {
      // spare
      if (b1 !== null && b2 !== null && (b1 + b2 === 10 || ($table.find(getInputSelector(frame, 2)).val() === '/'))) {
        const next = getNextThrows(frame, 1)
        if (next.length === 1) frameTotal = 10 + next[0]
      } else if (b1 !== null && b2 !== null) {
        // open frame
        frameTotal = b1 + b2
      }
    } else {
      // 10th frame
      const b3 = getBallPins(10, 3)
      if (b1 !== null && b2 !== null) {
        if (b1 === 10) {
          // strike first ball: need b2 and b3 to be present
          if (b2 !== null && b3 !== null) frameTotal = b1 + b2 + b3
        } else if (b1 + b2 === 10) {
          // spare: need b3
          if (b3 !== null) frameTotal = b1 + b2 + b3
        } else {
          // open frame
          frameTotal = b1 + b2
        }
      }
    }

    if (frameTotal !== null) {
      cumulative += frameTotal
      // show cumulative score up to this frame
      $scoreCell.find('label').text(cumulative)
    } else {
      $scoreCell.find('label').text('')
    }
  }

  // update total score (last td with rowspan)
  const $totalLabel = $table.find('td[rowspan="2"].center').find('label')
  $totalLabel.text(cumulative || '')
}

// Hook input/blur to compute scores and disable second ball on strike
$(document).on('input blur', '#scorecard .scores', function (e) {
  const $input = $(this)
  const $table = $input.closest('table')
  const id = ($input.attr('id') || '')
  const m = id.match(/^f(\d+)b(\d+)/)
  if (m) {
    const frame = parseInt(m[1], 10)
    const ball = parseInt(m[2], 10)
    const val = ($input.val() || '').toString().trim()

    // validate first-ball inputs: '/' is invalid, numbers must be 0-10, 'X' is allowed
    if (ball === 1) {
      const valid = isValidFirstBall(val)
      if (!valid) {
        $input.css('border', '2px solid #c00')
        $input.attr('title', "Invalid first-ball entry. Use digits, '-', or 'X'.")
      } else {
        $input.css('border', '')
        $input.removeAttr('title')
      }
    }

    // validate second-ball input: highlight when first+second > 10 for frames < 10
    if (ball === 2) {
      const firstRaw = ($table.find(getInputSelector(frame, 1)).val() || '').toString().trim()
      const valid2 = isValidSecondBall(val, firstRaw, frame)
      if (!valid2) {
        $input.css('border', '2px solid #c00')
        $input.attr('title', 'Invalid second-ball entry; total for frame cannot exceed 10.')
      } else {
        $input.css('border', '')
        $input.removeAttr('title')
      }
    }

    // special handling for 10th frame: control enabling of 2nd/3rd balls
    if (frame === 10) {
      const $b1 = $table.find(getInputSelector(10, 1))
      const $b2 = $table.find(getInputSelector(10, 2))
      const $b3 = $table.find(getInputSelector(10, 3))
      const v1 = ($b1.val() || '').toString().trim()
      const v2 = ($b2.val() || '').toString().trim()

      if (ball === 1) {
        // after entering first ball in 10th: if strike enable b2 and b3, else enable b2 and disable b3
        if (val.toUpperCase() === 'X' || val === '10') {
          $b2.prop('disabled', false)
          $b3.prop('disabled', false)
        } else {
          $b2.prop('disabled', false)
          $b3.val('').prop('disabled', true)
        }
      }

      if (ball === 2) {
        const firstPins = rawToPins(v1)
        const secondPins = rawToPins(v2, v1)

        if (v1.toUpperCase() === 'X' || v1 === '10') {
          // first was strike -> second can be anything; enable third only when second is present
          if (v2 !== '') {
            $b3.prop('disabled', false)
          } else {
            $b3.val('').prop('disabled', true)
          }
        } else {
          // if first+second is spare, enable third; otherwise disable third
          const isSpare = (v2 === '/') || (firstPins !== null && secondPins !== null && firstPins + secondPins === 10)
          if (isSpare) {
            $b3.prop('disabled', false)
          } else {
            $b3.val('').prop('disabled', true)
          }
        }
      }
    }

    // if first ball is a strike in frames 1-9, disable second ball
    if (ball === 1 && frame < 10) {
      const $second = $table.find(getInputSelector(frame, 2))
      if (val.toUpperCase() === 'X' || val === '10') {
        $second.val('').prop('disabled', true)
      } else {
        $second.prop('disabled', false)
      }
    }

    // auto-tab to next enabled input on entry (input event)
    if (e.type === 'input') {
      const rawVal = val
      if (rawVal !== '') {
        const $enabled = $table.find('input.scores:enabled')
        const idx = $enabled.index($input)
        if (idx >= 0 && idx < $enabled.length - 1) {
          $enabled.eq(idx + 1).focus().select()
        }
      }
    }
  }

  computeScoresForTable($table)
})

function isValidFirstBall (raw) {
  const val = (raw || '').toString().trim()
  if (val === '') return true // allow empty while typing
  if (val === '-') return true
  if (val.toUpperCase() === 'X') return true
  // '/' is invalid as a first ball
  if (val === '/') return false
  const n = parseInt(val, 10)
  if (!Number.isFinite(n)) return false
  if (n < 0 || n > 10) return false
  return true
}

function isValidSecondBall (raw, firstRaw, frame) {
  const val = (raw || '').toString().trim()
  const first = (firstRaw || '').toString().trim()
  if (val === '') return true
  if (val === '-') return true
  // allow '/' on second ball (spare) when first exists
  if (val === '/') return first !== '' && first.toUpperCase() !== 'X'
  if (val.toUpperCase() === 'X') {
    // only allow X on second ball in 10th frame
    return frame === 10
  }
  const n = parseInt(val, 10)
  if (!Number.isFinite(n)) return false
  if (n < 0 || n > 10) return false

  // if first is present and not a strike, ensure sum <= 10 for frames < 10
  if (frame < 10) {
    if (first === '') return true
    if (first.toUpperCase() === 'X') return false
    const fnum = first === '-' ? 0 : (first === '/' ? null : parseInt(first, 10))
    if (fnum === null || !Number.isFinite(fnum)) return true
    return fnum + n <= 10
  }

  // 10th frame: many combos allowed; if first not strike then enforce sum<=10 unless spare
  if (frame === 10) {
    if (first.toUpperCase() === 'X' || first === '10') return true
    const fnum = first === '-' ? 0 : parseInt(first, 10)
    if (!Number.isFinite(fnum)) return true
    return fnum + n <= 10
  }

  return true
}

function clearScorecard () {
  if (window.confirm('Are you sure you want to clear the scorecard?')) {
    const $scorecard = $('#scorecard')
    // clear inputs and re-enable any disabled inputs (second ball after strike)
    $scorecard.find('input').val('').prop('disabled', false)
    // clear cumulative/frame labels and total labels
    $scorecard.find('td.frameScore label, td.lastFrameScore label, td[rowspan="2"].center label').text('')
  }
}
