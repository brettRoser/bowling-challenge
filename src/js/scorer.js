$('document').ready(function () {
  updatePlayerCountForScorecardEvent()
  identifyScoreChangeEvent()
})

function updatePlayerCountForScorecardEvent () {
  $('#bowlers').change(function () {
    const scorecard = document.getElementById('scorecard')
    const numberOfBowlers = document.getElementById('bowlers').value
    const currentGameCount = scorecard.getElementsByTagName('table').length

    if (currentGameCount <= numberOfBowlers) {
      addGamesToScorecard(numberOfBowlers, currentGameCount, scorecard)
    } else {
      removeGamesFromScorecard(numberOfBowlers, currentGameCount)
    }
  })
}

function addGamesToScorecard (numberOfBowlers, currentGameCount, scorecard) {
  const initialGame = document.getElementsByTagName('table')[0]
  for (let i = currentGameCount; i < numberOfBowlers; i++) {
    const initialGameClone = $(initialGame).clone(true, true)
    $(initialGameClone).find('input').val('')
    $(initialGameClone).removeClass('game1').addClass('game' + (i + 1))

    $(scorecard).append(initialGameClone)
  }
}

function removeGamesFromScorecard (numberOfBowlers, currentGameCount) {
  for (let i = currentGameCount; i > numberOfBowlers; i--) {
    document.getElementsByTagName('table')[i - 1].remove()
  }
}

function identifyScoreChangeEvent () {
  $('#scorecard .scores').on('input', function () {
    const game = $(this).parents('table')
    console.log('changed game is', game[0].className)
  })
}

function clearScorecard () {
  const scorecard = document.getElementById('scorecard')
  $(scorecard).find('input').val('')
}
