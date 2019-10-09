function Board (size, visibleSize) {
  if (visibleSize && visibleSize > size) {
    throw new Error('visibleSize must be less than or equal to size');
  }

  this._size = size;
  this._visibleSize = visibleSize || size;
  this.clear();
}

Board.prototype._visibleArea = function _visibleArea () {
  const diff = this._size - this._visibleSize;
  const offset = Math.floor(diff / 2);
  const endIndex = offset + this._visibleSize;

  return this._board.slice(offset, endIndex).map(function (line) {
    return line.slice(offset, endIndex);
  });
};

Board.prototype.renderText = function () {
  return this._visibleArea().reduce(function (acc, cur) {
    return acc + cur.reduce(function (acc, cur) {
      return acc + (cur ? 'O' : 'X');
    }, '') + '\n';
  }, '');
};

Board.prototype.renderToBufferedImage = function (image, liveColor, deadColor) {
  return this._visibleArea().forEach(function (line, y) {
    return line.forEach(function (cell, x) {
      image.setRGB(x, y, cell ? liveColor : deadColor);
    });
  });
};

Board.prototype._isAlive = function (x, y) {
  return this._board[y][x];
};

Board.prototype._validateXY = function (x, y) {
  if (x > this._visibleSize - 1 || y > this._visibleSize - 1) {
    throw new RangeError('Index out of bounds');
  }
};

Board.prototype._adjustXY = function (num) {
  const diff = this._size - this._visibleSize;
  const offset = Math.floor(diff / 2);
  return num + offset;
};

Board.prototype.toggle = function (x, y) {
  this._validateXY(x, y);
  x = this._adjustXY(x);
  y = this._adjustXY(y);

  const isAlive = this._isAlive(x, y);
  this._board[y][x] = !isAlive;
};

Board.prototype.copyBuffer = function (x, y, buffer) {
  this._validateXY(x, y);
  x = this._adjustXY(x);
  y = this._adjustXY(y);

  const { width, height, pattern } = buffer;
  const end = y + height;
  this._validateXY(x + width, end);

  this._board = this._board.map(function (line, index) {
    if (index >= y && index < end) {
      Array.prototype.splice.apply(line, [x, width].concat(pattern[index - y]));
    }
    return line;
  });
};

Board.prototype._getNeighbors = function (x, y) {
  const yStart = y ? y - 1 : y;
  const xStart = x ? x - 1 : x;

  return this._board.slice(yStart, y + 2).map(function (line) {
    return line.slice(xStart, x + 2);
  });
};

Board.prototype._liveNeighbors = function (x, y) {
  const isAlive = this._isAlive(x, y);
  const neighbors = this._getNeighbors(x, y);

  const result = neighbors.reduce(function (acc, cur) {
    return acc + cur.reduce(function (acc, cur) {
      return acc + (cur ? 1 : 0);
    }, 0);
  }, 0);

  return isAlive ? result - 1 : result;
};

Board.prototype.generate = function () {
  this._board = this._board.map(function (line, y) {
    return line.map(function (cell, x) {
      const isAlive = this._isAlive(x, y);
      const liveNeighbors = this._liveNeighbors(x, y);

      const underpop = isAlive && liveNeighbors < 2;
      const overpop = isAlive && liveNeighbors > 3;
      const reprod = !isAlive && liveNeighbors === 3;

      return (underpop || overpop || reprod) ? !cell : cell;
    }, this);
  }, this);
};

Board.prototype.clear = function () {
  this._board = (new Array(this._size)).fill(null).map(function () {
    return (new Array(this._size)).fill(false);
  }, this);
};
