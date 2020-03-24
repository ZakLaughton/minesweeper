const pixelCanvas = document.getElementById('pixelCanvas');
const inputHeight = document.getElementById('inputHeight');
const inputWidth = document.getElementById('inputWidth');
let MINE_LOCATIONS_ARRAY = []; // List of cell id's that represent mine locations
let rowCount = 0;
let columnCount = 0;
const winningMessage =
  '<div class="endgame-message winning-message">YOU WIN!</div><div class="endgame-sub">Why not try a bigger field?</div>';
const losingMessage =
  '<div class="endgame-message losing-message">GAME OVER</div><div class="endgame-sub">Click "New Game" to try again!</div>';

function makeBlankHTMLTableGrid(numberOfRows, numberOfColumns) {
  let blankHTMLTableGrid = new DocumentFragment();
  for (let rowNumber = 0; rowNumber < numberOfRows; rowNumber++) {
    const newRow = makeRow(rowNumber, numberOfColumns);
    blankHTMLTableGrid.appendChild(newRow);
  }

  return blankHTMLTableGrid;

  function makeRow(rowNumber, numberOfColumns) {
    let newRow = document.createElement('tr');
    for (let columnNumber = 0; columnNumber < numberOfColumns; columnNumber++) {
      const cellId = `r${rowNumber}c${columnNumber}`;
      const newCell = makeCell(cellId);
      newRow.appendChild(newCell);
    }
    return newRow;
  }

  function makeCell(cellId) {
    const newCell = document.createElement('td');
    newCell.id = cellId;
    newCell.bgColor = 'lightgray';
    newCell.className = 'covered';
    return newCell;
  }
}

function generateMineLocations(numberOfRows, numberOfColumns) {
  const allCellIdsForGrid = generateCellIds();
  const numberOfMines = getNumberOfMinesForFieldSize(numberOfRows * numberOfColumns);
  const shuffledCellIdsForGrid = shuffleArray(allCellIdsForGrid);
  const mineLocationsArray = shuffledCellIdsForGrid.slice(0, numberOfMines);
  return mineLocationsArray;

  function getNumberOfMinesForFieldSize(numberOfCells) {
    const totalMines = Math.floor(numberOfCells / 7);
    if (totalMines === 0) totalMines = 1;
    return totalMines;
  }

  // TODO: Combine with square ID generation in HTML table grid generation
  function generateCellIds() {
    cellIds = [];
    for (let x = 0; x < numberOfRows; x++) {
      for (let y = 0; y < numberOfColumns; y++) {
        cellIds.push(`r${x}c${y}`);
      }
    }
    return cellIds;
  }
}

function isSquareMine(squareLocation) {
  return MINE_LOCATIONS_ARRAY.includes(squareLocation);
}

function removeElementFromStringArray(array, string) {
  const newArray = array;
  if (newArray.includes(string)) {
    const index = newArray.indexOf(string);
    newArray.splice(index, 1);
  }
  return newArray;
}

function getNeighborCoordinates(squareLocation) {
  // determine row and column from squareLocation on either side of 'c' in the string
  let divider = squareLocation.indexOf('c');
  let row = Number(squareLocation.slice(1, divider));
  let column = Number(squareLocation.slice(divider + 1));
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
    neighbors = removeElementFromStringArray(neighbors, upleft);
    neighbors = removeElementFromStringArray(neighbors, up);
    neighbors = removeElementFromStringArray(neighbors, upright);
  }
  if (column === 0) {
    neighbors = removeElementFromStringArray(neighbors, upleft);
    neighbors = removeElementFromStringArray(neighbors, left);
    neighbors = removeElementFromStringArray(neighbors, downleft);
  }
  if (row === rowCount - 1) {
    neighbors = removeElementFromStringArray(neighbors, downleft);
    neighbors = removeElementFromStringArray(neighbors, down);
    neighbors = removeElementFromStringArray(neighbors, downright);
  }
  if (column === columnCount - 1) {
    neighbors = removeElementFromStringArray(neighbors, upright);
    neighbors = removeElementFromStringArray(neighbors, right);
    neighbors = removeElementFromStringArray(neighbors, downright);
  }
  return neighbors;
}

function countSurroundingMines(squareLocation) {
  let neighbors = getNeighborCoordinates(squareLocation);
  let mineCount = 0;
  neighbors.forEach(function(val) {
    if (isSquareMine(val)) {
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
  MINE_LOCATIONS_ARRAY.forEach(function(val) {
    $(`#${val}`).attr('bgcolor', 'red');
  });
  $('#remainingText').replaceWith(losingMessage);
}

function shuffleArray(arrayToShuffle) {
  for (
    var j, x, i = arrayToShuffle.length;
    i;
    j = parseInt(Math.random() * i),
      x = arrayToShuffle[--i],
      arrayToShuffle[i] = arrayToShuffle[j],
      arrayToShuffle[j] = x
  );
  return arrayToShuffle;
}

/**
 * If all mines are flagged, shows winning message and uncovers remaining squares.
 */
function checkWin() {
  let win = true;
  // is every mine flagged?
  MINE_LOCATIONS_ARRAY.forEach(function(val) {
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
        var squareLocation = $(this).attr('id');
        Square(squareLocation);
      }
    });
  }
}

function Square(squareLocation) {
  targetSquare = $(`#${squareLocation}`);
  // remove attributes of a covered square
  targetSquare.off('click');
  targetSquare.off('contextmenu');
  targetSquare.removeClass('covered');
  let neighborMineCount = countSurroundingMines(squareLocation);
  // game over if it's a mine
  if (isSquareMine(squareLocation)) {
    gameOver();
    // auto-click neighbors if there are no neighbor mines
  } else if (neighborMineCount === 0) {
    var neighbors = getNeighborCoordinates(squareLocation);
    targetSquare.attr('bgcolor', '');
    neighbors.forEach(function(val) {
      if ($(`#${val}`).hasClass('covered')) {
        Square(val);
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
    rowCount = inputHeight.value;
    columnCount = inputWidth.value;
    let grid = makeBlankHTMLTableGrid(rowCount, columnCount);
    MINE_LOCATIONS_ARRAY = generateMineLocations(rowCount, columnCount);
    let remainingFlags = MINE_LOCATIONS_ARRAY.length;
    pixelCanvas.insertAdjacentHTML(
      'afterend',
      `<div id="remainingText"><b>Remaining Flags: </b><span id="remaining">${remainingFlags}</span></div>`
    );
    while (pixelCanvas.firstChild) {
      pixelCanvas.firstChild.remove();
    }
    pixelCanvas.appendChild(grid);

    // uncover square on click if it's not flagged
    $('td').click(function() {
      if ($(this).hasClass('flagged')) {
        return false;
      } else {
        var squareLocation = $(this).attr('id');
        Square(squareLocation);
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
