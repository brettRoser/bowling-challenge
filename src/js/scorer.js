$('document').ready(function () {
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
})

function addGamesToScorecard (numberOfBowlers, currentGameCount, scorecard) {
  for (let i = currentGameCount; i < numberOfBowlers; i++) {
    const initialGame = document.getElementsByTagName('table')[0]

    const initialGameClone = initialGame.cloneNode(true)
    $(initialGameClone).find('input').val('')
    scorecard.appendChild(initialGameClone)
  }
}

function removeGamesFromScorecard (numberOfBowlers, currentGameCount) {
  for (let i = currentGameCount; i > numberOfBowlers; i--) {
    document.getElementsByTagName('table')[i - 1].remove()
  }
}
