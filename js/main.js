//TODO
//1. Music volume (slider?)?
//2. Hard mode (minimax)
//3. Change options (maybe a toggle button)?
//4. Animate drawing?
//5. Medium mode - Guard against fork win - [1,2], [2,0], [2,2]

window.onload = main();

function main() {
  var tttb = new ticTacToeBoard();
  var canvas = document.getElementById('canvas');
  var newGameButton = document.getElementById('newGameButton');
  var optionsButton = document.getElementById('optionsButton');
  var optionsModal = document.getElementById('myModal');
  var modalCloseButton = document.getElementById('optionsClose');
  var gameOverModal = document.getElementById('gameOverModal');
  var gameOverText = document.getElementById('gameOverText');
  var gameOverClose = document.getElementById('gameOverClose');
  var gameOverNewGameButton = document.getElementById('gameOverNewGameButton');
  var gameOverQuitButton = document.getElementById('gameOverQuitButton');
  var optionsRadios = optionsModal.querySelectorAll('input[type=radio]');
  var gameMusic = document.getElementById('gameMusic');

  for (var i = 0, radiosLength = optionsRadios.length; i < radiosLength; i++) {
    optionsRadios[i].addEventListener('click',tttb.changeOptions);
  };

  gameOverClose.addEventListener('click', function() {
    gameOverModal.style.display = 'none';
  });

  optionsButton.addEventListener('click', tttb.showOptions);

  modalCloseButton.addEventListener('click', function() {
    optionsModal.style.display = 'none';
  });

  window.addEventListener('click', function(event) {
    if (event.target === optionsModal || event.target === gameOverModal) {
      optionsModal.style.display = 'none';
      gameOverModal.style.display = 'none';
    }
  });

  tttb.resetBoard();
  canvas.addEventListener('click',tttb.playerMove);
  window.addEventListener('resize', tttb.drawBoard);
  newGameButton.addEventListener('click',tttb.resetBoard);
  gameOverNewGameButton.addEventListener('click', function() {
    tttb.resetBoard();
    gameOverModal.style.display = 'none';
  });
  gameOverQuitButton.addEventListener('click', function() {
    gameOverModal.style.display = 'none';
  });
}

function ticTacToeBoard() {
  var canvas = document.getElementById('canvas');
  var context = canvas.getContext('2d');
  var squareSide, dist, playerIsX = true, playerFirst = true, playerTurn = true;
  var playerScoreDisplay = document.getElementById('playerScore');
  var computerScoreDisplay = document.getElementById('computerScore');
  var tieScoreDisplay = document.getElementById('tieScore');
  var optionsModal = document.getElementById('myModal');
  var gameOverModal = document.getElementById('gameOverModal');
  var gameOverText = document.getElementById('gameOverText');
  var gameMusic = document.getElementById('gameMusic');
  var playerScore = 0, computerScore = 0, tieScore = 0;
  var difficulty = 'medium', musicOn = true, squigglevision = true;
  var board = [
               [0, 0, 0],
               [0, 0, 0],
               [0, 0, 0]
              ];
  var self = this, winner;

  this.showOptions = function() {
    var radioStr = 'input[type=radio]';
    var playerTokenStr = radioStr + '[name=playerToken]';
    var firstPlayerStr = radioStr + '[name=firstPlayer]';
    var difficultyStr = radioStr + '[name=difficulty]';
    var musicStr = radioStr + '[name=music]';
    var squigglevisionStr = radioStr + '[name=squigglevision]';

    optionsModal.querySelector(playerTokenStr + '[value=' + (playerIsX ? 'X' : 'O') + ']').checked = true;
    optionsModal.querySelector(firstPlayerStr + '[value=' + (playerFirst ? 'Player' : 'Computer') + ']').checked = true;
    optionsModal.querySelector(difficultyStr + '[value=' + difficulty + ']').checked = true;
    optionsModal.querySelector(musicStr + '[value=' + (musicOn ? 'on' : 'off') + ']').checked = true;
    optionsModal.querySelector(squigglevisionStr + '[value=' + (squigglevision ? 'on' :' off') + ']').checked = true;

    optionsModal.style.display = 'block';
  }

  this.changeOptions = function() {
    if (this.name === 'playerToken') {
      if ((this.value === 'X' && !playerIsX) || (this.value === 'O' && playerIsX)) {
        playerIsX = !playerIsX;
        self.drawBoard();
      }
    }
    else if (this.name === 'firstPlayer') {
      if ((this.value === 'Player' && !playerFirst) || (this.value === 'Computer' && playerFirst)) playerFirst = !playerFirst;
    }
    else if (this.name === 'difficulty') {
      if (this.value !== difficulty) difficulty = this.value;
    }
    else if (this.name === 'music') {
      if ((this.value === 'off' && musicOn) || (this.value === 'on' && !musicOn)) {
        musicOn = !musicOn;
        if (musicOn) {
          gameMusic.currentTime = 0;
          gameMusic.play();
        }
        else gameMusic.pause();
      }
    }
    else if (this.name === 'squigglevision') {
      if ((this.value === 'off' && squigglevision) || (this.value === 'on' && !squigglevision)) {
        squigglevision = !squigglevision;
        var body = document.getElementsByTagName('body')[0];
        var bodyClasses = body.className;
        var re = new RegExp('\\bsquigglevision\\b');
        if (squigglevision && bodyClasses.match(re) === null) {
          body.className += ' squigglevision';
        }
        else if (!squigglevision && bodyClasses.match(re) !== null) {
          body.className = body.className.replace(re, '');
        }
      }
    }
  };

  this.drawBoard = function() {
    var windowWidth = window.innerWidth;
    var windowHeight = window.innerHeight;

    squareSide = Math.min(windowWidth, windowHeight) * .6;
    dist = squareSide / 3;
    var leftMargin = (windowWidth - squareSide) / 2;

    context.canvas.height = squareSide;
    context.canvas.width = squareSide;
    canvas.style.margin = '0 0 0 ' + leftMargin + 'px';

    context.beginPath();
    context.moveTo(dist, 0);
    context.lineTo(dist,squareSide);
    context.moveTo(dist * 2, 0);
    context.lineTo(dist * 2, squareSide);
    context.moveTo(0, dist);
    context.lineTo(squareSide,dist);
    context.moveTo(0, dist * 2);
    context.lineTo(squareSide, dist * 2);
    context.lineWidth = 7;
    context.stroke();

    for (var row = 0; row <= 2; row++) {
      for (var col = 0; col <= 2; col++) {
        if (board[row][col] !== 0) {
          drawToken((board[row][col] === 1 ? playerIsX : !playerIsX), row, col);
        }
      }
    }
  }

  var getMousePos = function(clck) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: clck.clientX - rect.left,
      y: clck.clientY - rect.top
    };
  };

  this.playerMove = function(clck) {
    if (playerTurn) {
      var coords = getMousePos(clck);
      var boardX = Math.floor(coords.x/dist);
      var boardY = Math.floor(coords.y/dist);
        if (board[boardY][boardX] === 0) {
          playerTurn = false;
          board[boardY][boardX] = 1;
          drawToken(playerIsX, boardY, boardX);
          if (winOrDraw() === -1) computerMove();
        }
      }
  }

  var drawToken = function(token, boardY, boardX) {
    if (token) {
      //draw X
      context.beginPath();
      context.moveTo(10 + dist * boardX , 10 + dist * boardY);
      context.lineTo(dist - 10 + dist * boardX, dist - 10 + dist * boardY);
      context.moveTo(dist - 10 + dist * boardX, 10 + dist * boardY);
      context.lineTo(10 + dist * boardX, dist - 10 + dist * boardY);
      context.stroke();
    }
    else {
      //draw O
      context.beginPath();
      context.arc(dist / 2 * (1 + 2 * boardX), dist / 2 * (1 + 2 * boardY), dist / 3, 0, 2 * Math.PI);
      context.stroke();
    }
  }

  var computerMove = function() {
    var boardX = undefined, boardY = undefined, testVals;

    if (difficulty === 'medium') {//Look for winning move. If no winning move, find a blocking move. If no blocking move, try to set up an inevitable win next turn. If no inevitable win, check for possible set up of inevitable win by the opponent. If no setup, take the middle square. If can't take the middle square, take a corner square. If can't take a corner square, take a random square.

      //search for a winning move
      //check rows -- if two of the values are the same, fill in the blank space
      for (var row = 0; row <= 2; row++) if (board[row].indexOf(0) !== -1 && board[row].filter(function(x) {return x === 2;}).length == 2) {
          boardX = row;
          boardY = board[row].indexOf(0);
      }

      if (boardX === undefined && boardY === undefined) {
        //check columns -- if two of the values are the same, fill in the blank space
        for (var col = 0; col <= 2; col++) {
          testVals = [board[0][col], board[1][col], board[2][col]];
          if (testVals.indexOf(0) !== -1 && testVals.filter(function(x) {return x === 2;}).length === 2) {
            boardX = testVals.indexOf(0);
            boardY = col;
          }
        }
      }

      if (boardX === undefined && boardY === undefined) {
        //check left diagonal -- if two values are the same, fill in the blank space
        testVals = [board[0][0], board[1][1], board[2][2]];

        if (testVals.indexOf(0) !== -1 && testVals.filter(function(x) {return x === 2;}).length === 2) {
          boardX = testVals.indexOf(0);
          boardY = boardX;
        }
      }

      if (boardX === undefined && boardY === undefined) {
        //check right diagonal -- if two values are the same, fill in the blank space
        testVals = [board[2][0], board[1][1], board[0][2]];

        if (testVals.indexOf(0) !== -1 && testVals.filter(function(x) {return x === 2;}).length === 2) {
          boardY = testVals.indexOf(0);
          boardX = boardY === 0 ? 2 : boardY === 2 ? 0 : 1;
        }
      }

      //look for a blocking move
      if (boardX === undefined && boardY === undefined) {
        //check rows -- if two of the values are the same, fill in the blank space
        for (var row = 0; row <=2; row++) {
          if (board[row].indexOf(0) !== -1 && board[row].filter(function(x) {return x === 1;}).length === 2) {
            boardX = row;
            boardY = board[row].indexOf(0);
          }
        }
      }

      if (boardX === undefined && boardY === undefined) {
        //check columns -- if two of the values are the same, fill in the blank space
        for (var col = 0; col <= 2; col++) {
          testVals = [board[0][col], board[1][col], board[2][col]];
          if (testVals.indexOf(0) !== -1 && testVals.filter(function(x) {return x === 1;}).length === 2) {
            boardX = testVals.indexOf(0);
            boardY = col;
          }
        }
      }

     if (boardX === undefined && boardY === undefined) {
        //check left diagonal -- if two values are the same, fill in the blank space
        testVals = [board[0][0], board[1][1], board[2][2]];

        if (testVals.indexOf(0) !== -1 && testVals.filter(function(x) {return x === 1;}).length === 2) {
          boardX = testVals.indexOf(0);
          boardY = boardX;
        }
     }

     if (boardX === undefined && boardY === undefined) {
        //check right diagonal -- if two values are the same, fill in the blank space
        testVals = [board[2][0], board[1][1], board[0][2]];

        if (testVals.indexOf(0) !== -1 && testVals.filter(function(x) {return x === 1;}).length === 2) {
          boardY = testVals.indexOf(0);
          boardX = boardY === 0 ? 2 : boardY === 2 ? 0 : 1;
        }
     }

      //logic for middle + corner -- place for two possible wins next turn if available
      if (boardX === undefined && boardY === undefined) {
        if (board[1][1] === 2) {
          if (board[0][0] === 2) {
            if (board[1][0] === 0 && board[1][2] === 0 && board[2][0] === 0) {
              boardX = 1;
              boardY = 0;
            }
            else if (board[0][1] === 0 && board[2][1] === 0 && board[0][2] === 0) {
              boardX = 0;
              boardY = 1;
            }
          }

          else if (board[2][0] === 2) {
            if (board[1][0] === 0 && board[1][2] === 0 && board[0][0] === 0) {
              boardX = 1;
              boardY = 0;
            }
            else if (board[2][1] === 0 && board[0][1] === 0 && board[2][2] === 0) {
              boardX = 2;
              boardY = 1;
            }
          }
          else if (board[2][2] === 2) {
            if (board[2][1] === 0 && board[0][1] === 0 && 2[0][0] === 0) {
              boardX = 2;
              boardY = 1;
            }
            else if (board[1][2] === 0 && board[1][0] === 0 && board[0][2] === 0) {
              boardX = 1;
              boardY = 2;
            }
          }
          else if (board[0][2] === 2) {
            if (board[0][1] === 0 && board[0][0] ===0 && board[2][1] === 0) {
              boardX = 0;
              boardY = 1;
            }

            if (board[1][2] === 0 && board[2][2] === 0 && board[1][0] === 0) {
              boardX = 1;
              boardY = 2;
            }
          }
        }
      }

      //block setup for inevitable win
      if (boardX === undefined && boardY === undefined) {//block possible setup for 2 possible wins by player
        if (board[2][1] === 1 && board[1][2] === 1 && board[2][2] === 0 && board[0][0] === 0 && board[0][2] === 0) {
          boardX = 2;
          boardY = 2;
        }

        else if (board[1][1] === 2 && ((board[0][0] === 1 && board[2][2] === 1 && ((board[1][0] === 0 && board[2][0] === 0 && board[2][1] === 0)||(board[0][1] === 0 && board[0][2] === 0 && board[1][2] === 0)))||(board[0][2] === 1 && board[2][0] === 1 && ((board[0][0] === 0 && board[0][1] === 0 && board[1][0] === 0)||(board[1][2] === 0 && board[2][2] === 0 && board[2][1] === 0))))) {//computer holds the center, player has two opposite corners and 3 adjacent consecutive edges are blank
          if (board[0][1] === 0) {
            boardX = 0;
            boardY = 1;
          }
          else if (board[1][2] === 0) {
            boardX = 1;
            boardY = 2;
          }
          else if (board[2][1] === 0) {
            boardX = 2;
            boardY = 1;
          }
          else if (board[1][0] === 0) {
            boardX = 1;
            boardY = 0;
          }
        }
        else if (board[1][1] === 2 && board[2][1] === 1 && ((board[0][0] === 1 && board[2][0] === 0 && board[1][0] === 0) || (board[0][2] === 1 && board[1][2] === 0 && board[2][2] === 0))) {
          if (board[1][0] === 0) {
            boardX = 1;
            boardY = 0;
          }
          else if (board[1][2] === 0) {
            boardX = 1;
            boardY = 2;
          }
        }
      }

      //no winning or blocking moves -- take the center square if it's available, or else a corner square if it's available
      if (boardX === undefined && boardY === undefined) {
        //take middle square if it's not taken
        if (board[1][1] === 0) {
          boardX = 1;
          boardY = 1;
        }
        //take a corner square if one is available
        else if (board[0][0] === 0) {
          boardX = 0;
          boardY = 0;
        }

        else if (board[0][2] === 0) {
          boardX = 0;
          boardY = 2;
        }

        else if (board[2][0] === 0) {
          boardX = 2;
          boardY = 0;
        }

        else if (board[2][2] === 0) {
          boardX = 2;
          boardY = 2;
        }
      }
    }

    if (difficulty === 'easy' || (boardX === undefined && boardY === undefined)) {
      //random move if easy mode or no other move calculated
      do {
        boardX = Math.floor(Math.random() * 3);
        boardY = Math.floor(Math.random() * 3);
      }
      while (board[boardX][boardY] !== 0);
    }

    board[boardX][boardY] = 2;
    drawToken(!playerIsX, boardX, boardY)
    if (winOrDraw() === -1) playerTurn = true;
  }

  var updateScore = function(category,reset) {
    switch (category) {
      case 1:
        playerScore = !reset ? playerScore + 1: 0;
        playerScoreDisplay.textContent = playerScore;
        break;

      case 2:
        computerScore = !reset ? computerScore + 1: 0;
        computerScoreDisplay.textContent = computerScore;
        break;

      case 0:
        tieScore = !reset ? tieScore + 1: 0;
        tieScoreDisplay.textContent = tieScore;
        break;
    }
  }

  var winOrDraw = function() { //return -1 to continue, 1 or 2 for player win, 0 for draw
    var winningPlayer;
    var winningText = function(winner) {return winner === 0 ? 'Draw!' : (winner === 1 ? 'Player' : 'Computer') + ' wins!'};
    //check rows
    for (var row = 0; row <= 2; row++) if (board[row][0] !== 0 && board[row][0] === board[row][1] && board[row][1] === board[row][2]) {
      winningPlayer = board[row][0];
      updateScore(winningPlayer);
      context.beginPath();
      context.moveTo(0, dist * (1 + row * 2) / 2);
      context.lineTo(squareSide, dist * (1 + row * 2) / 2);
      context.lineWidth = 3;
      context.stroke();
      gameOverText.textContent = winningText(winningPlayer);
      gameOverModal.style.display = 'block';
      //alert((winningPlayer === 1 ? 'Player' : 'Computer') + ' wins');
      winner = board[row][0];
      return board[row][0];
    }

    //check columns
    for (var col = 0; col <= 2; col++) if (board[0][col] !== 0 && board[0][col] === board[1][col] && board[1][col] === board[2][col]) {
      winningPlayer = board[0][col];
      updateScore(winningPlayer);

      context.beginPath();
      context.moveTo(dist * (1 + col * 2) / 2, 0); //1, 3, 5
      context.lineTo(dist * (1 + col * 2) / 2, squareSide); //1, 3, 5
      context.lineWidth = 3;
      context.stroke();
      gameOverText.textContent = winningText(winningPlayer);
      gameOverModal.style.display = 'block';
      //alert((winningPlayer === 1 ? 'Player' : 'Computer') + ' wins');
      winner = board[0][col];
      return board[0][col];
    }

    //test diagonals
    if (board[0][0] !== 0 && board[0][0] === board[1][1] && board[1][1] === board[2][2]) {
      winningPlayer = board[0][0];
      updateScore(winningPlayer);
      context.beginPath();
      context.moveTo(1, 1);
      context.lineTo(squareSide - 1, squareSide - 1);
      context.lineWidth = 3;
      context.stroke();
      gameOverText.textContent = winningText(winningPlayer);
      gameOverModal.style.display = 'block';
      //alert((winningPlayer === 1 ? 'Player' : 'Computer') + ' wins');
      winner = winningPlayer;
      return winningPlayer;
    }

    if (board[2][0] !== 0 && board[2][0] === board[1][1] && board [1][1] === board[0][2]) {
      winningPlayer = board[2][0];
      updateScore(winningPlayer);
      context.beginPath();
      context.moveTo(squareSide - 1, 1);
      context.lineTo(1, squareSide - 1);
      context.lineWidth = 3;
      context.stroke();

      gameOverText.textContent = winningText(winningPlayer);
      gameOverModal.style.display = 'block';
      //alert((winningPlayer === 1 ? 'Player' : 'Computer') + ' wins');
      winner = winningPlayer;
      return winningPlayer;
    }

    if (board.filter(function(x) {return x.indexOf(0) !== -1;}).length === 0) { //draw
      updateScore(0);
      gameOverText.textContent = winningText(0);
      gameOverModal.style.display = 'block';
      //alert('Tie!');
      winner = 0;
      return 0;
    }

    return -1;
  }

  this.resetBoard = function() {
    for (var row = 0; row <= 2; row ++) {
      for (var col = 0; col <= 2; col++) {
        board[row][col] = 0;
      }
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    this.drawBoard();
    if (winner === undefined) playerTurn = playerFirst;
    else if (winner === 1) playerTurn = true;
    else if (winner === 0) playerTurn = (Math.floor(Math.random() * 2) === 0);
    else playerTurn = false;
    winner = undefined;
    if (!playerTurn) computerMove();
  }.bind(this);;
}
