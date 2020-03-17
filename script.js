const pixelCanvas = $('#pixelCanvas');
const inputHeight = $('#inputHeight');
const inputWidth = $('#inputWidth');
let mines = []; // List of cell id's that represent mine locations
let rowCount = 0;
let columnCount = 0;
const winningMessage =
  '<div class="endgame-message winning-message">YOU WIN!</div><div class="endgame-sub">Why not try a bigger field?</div>';
const losingMessage =
  '<div class="endgame-message losing-message">GAME OVER</div><div class="endgame-sub">Click "New Game" to try again!</div>';

/**
 * Generates a blank grid from an HTML table.
 * @param {number} rows
 * @param {number} columns
 * @returns {string} Blank HTML table
 */
function makeGrid(rows, columns) {
  let grid = '';
  for (let x = 0; x < rows; x++) {
    grid += '<tr>';
    // Generate cell with ID to represent row/column location (e.g. "r1c3")
    for (let y = 0; y < columns; y++) {
      grid += `<td id="r${x}c${y}" bgcolor="lightgray" class="covered"></td>`;
    }
    grid += '</tr>';
  }
  return grid;
}

/**
 * Randomly generate locations for mines on a grid.
 * @param {number} rows
 * @param {number} columns
 * @returns {array} strings noting the location of mines
 */
function pickMines(rows, columns) {
  allSquares = [];
  for (let x = 0; x < rows; x++) {
    for (let y = 0; y < columns; y++) {
      allSquares.push(`r${x}c${y}`);
    }
  }
  totalMines = Math.floor((rows * columns) / 7);
  if (totalMines === 0) {
    totalMines = 1;
  } // Make sure there's at least one mine
  allSquares = shuffle(allSquares);
  mines = allSquares.slice(0, totalMines);
  console.log(`mines: ${mines}`);
  return mines;
}

/**
 * Takes a square location and returns true or false if it is a mine
 * @param {string} squareID - location of a square
 * @returns {boolean}
 */
function isMine(squareID) {
  return $.inArray(squareID, mines) >= 0;
}

/**
 * Removes an element from an array based on it's value.
 * @param {array} array
 * @param {string} element
 * @returns {array} array with the element removed
 */
function remove(array, element) {
  if ($.inArray(element, array) > -1) {
    const index = array.indexOf(element);
    array.splice(index, 1);
  }
  return array;
}

/**
 * Gives the coordinates of all the adjacent squares for a given square.
 * @param {string} squareID - location of a square
 * @returns {array}
 */
function getNeighbors(squareID) {
  // determine row and column from squareID on either side of 'c' in the string
  let divider = squareID.indexOf('c');
  let row = Number(squareID.slice(1, divider));
  let column = Number(squareID.slice(divider + 1));
  // Calculate coordinates for each neighbor
  let upleft = `r${row - 1}c${column - 1}`;
  let up = `r${row - 1}c${column}`;
  let upright = `r${row - 1}c${column + 1}`;
  let right = `r${row}c${column + 1}`;
  let downright = `r${row + 1}c${column + 1}`;
  let down = `r${row + 1}c${column}`;
  let downleft = `r${row + 1}c${column - 1}`;
  let left = `r${row}c${column - 1}`;
  let neighbors = [upleft, up, upright, right, downright, down, downleft, left];
  // Remove extra neighbors if square is on the edge of the grid
  if (row === 0) {
    neighbors = remove(neighbors, upleft);
    neighbors = remove(neighbors, up);
    neighbors = remove(neighbors, upright);
  }
  if (column === 0) {
    neighbors = remove(neighbors, upleft);
    neighbors = remove(neighbors, left);
    neighbors = remove(neighbors, downleft);
  }
  if (row === rowCount - 1) {
    neighbors = remove(neighbors, downleft);
    neighbors = remove(neighbors, down);
    neighbors = remove(neighbors, downright);
  }
  if (column === columnCount - 1) {
    neighbors = remove(neighbors, upright);
    neighbors = remove(neighbors, right);
    neighbors = remove(neighbors, downright);
  }
  return neighbors;
}

/**
 * Determine how many mines are in the adjacent squares.
 * @param {string} squareID - location of a square
 * @returns {number}
 */
function countSurroundingMines(squareID) {
  let neighbors = getNeighbors(squareID);
  let mineCount = 0;
  $.each(neighbors, function(i, val) {
    if (isMine(val)) {
      mineCount += 1;
    }
  });
  return mineCount;
}

/**
 * Exposes all bombs, disables all clickable objects, and shows "game over" message.
 */
function gameOver() {
  $('td').off('click');
  $('td').off('contextmenu');
  $.each(mines, function(i, val) {
    $(`#${val}`).attr('bgcolor', 'red');
  });
  $('#remainingText').replaceWith(losingMessage);
}

/**
 * @description shuffles an array (https://css-tricks.com/snippets/javascript/shuffle-array/)
 * @param {array} o - array to shuffle
 * @returns {array} shuffled array
 */
function shuffle(o) {
  for (
    var j, x, i = o.length;
    i;
    j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x
  );
  return o;
}

/**
 * If all mines are flagged, shows winning message and uncovers remaining squares.
 */
function checkWin() {
  let win = true;
  // is every mine flagged?
  $.each(mines, function(i, val) {
    if ($(`#${val}`).hasClass('flagged')) {
      return true;
    } else {
      win = false;
    }
  });
  if (win === true) {
    $('#remainingText').replaceWith(winningMessage);
    // uncover any square that is still covered
    $.each($('td'), function(i, val) {
      if (!$(this).hasClass('flagged') && $(this).hasClass('covered')) {
        var squareID = $(this).attr('id');
        uncover(squareID);
      }
    });
  }
}

/**
 * Uncovers a covered square when the player clicks on it.
 * @param {string} squareID - location of a square
 */
function uncover(squareID) {
  targetSquare = $(`#${squareID}`);
  // remove attributes of a covered square
  targetSquare.off('click');
  targetSquare.off('contextmenu');
  targetSquare.removeClass('covered');
  let neighborMineCount = countSurroundingMines(squareID);
  // game over if it's a mine
  if (isMine(squareID)) {
    gameOver();
    // auto-click neighbors if there are no neighbor mines
  } else if (neighborMineCount === 0) {
    var neighbors = getNeighbors(squareID);
    targetSquare.attr('bgcolor', '');
    $.each(neighbors, function(i, val) {
      if ($(`#${val}`).hasClass('covered')) {
        uncover(val);
      }
    });
    // insert the neighbor mine count in the square
  } else {
    targetSquare.attr('bgcolor', '');
    targetSquare.text(neighborMineCount);
  }
}

$(document).ready(function() {
  $('#sizePicker').submit(function(event) {
    event.preventDefault();
    // Remove any the endgame message and mines counter from the previous game
    $('.endgame-message').remove();
    $('.endgame-sub').remove();
    $('#remainingText').remove();
    // Make the field and generate a list of mine locations
    rowCount = inputHeight.val();
    columnCount = inputWidth.val();
    let grid = makeGrid(rowCount, columnCount);
    let mines = pickMines(rowCount, columnCount);
    let remainingFlags = mines.length;
    $(
      `<div id="remainingText"><b>Remaining Flags: </b><span id="remaining">${remainingFlags}</span></div>`
    ).insertAfter(pixelCanvas);
    pixelCanvas.html(grid);

    // uncover square on click if it's not flagged
    $('td').click(function() {
      if ($(this).hasClass('flagged')) {
        return false;
      } else {
        var squareID = $(this).attr('id');
        uncover(squareID);
      }
    });

    // Add or remove flag on right-click
    $('td.covered').contextmenu(function() {
      remainingNumber = $('#remaining');
      if ($(this).hasClass('flagged')) {
        $(this).removeClass('flagged');
        $(this).attr('bgcolor', 'lightgray');
        $(this).css('color', '');
        $(this).text('');
        remainingNumber.text(Number(remainingNumber.text()) + 1);
      } else {
        $(this).addClass('flagged');
        $(this).attr('bgcolor', 'lightgreen');
        $(this).css('color', 'darkgreen');
        $(this).text('⚑');
        remainingNumber.text(Number(remainingNumber.text()) - 1);
      }
      // check if all mines are flagged
      checkWin();
      // prevent right-click menu
      return false;
    });
  });
});
