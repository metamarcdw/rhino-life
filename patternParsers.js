/* exported parsePlaintext, parseRunLengthEncoding */

function parsePlaintext (patternText) {
  const lineEnding = patternText.includes('\r') ? '\r\n' : '\n';
  const lines = patternText.trim().split(lineEnding).filter(function (line) {
    return !line.startsWith('!');
  });

  lines.forEach(function (line) {
    if (!/^(\.|O)*$/.test(line)) {
      throw new Error('Unknown character');
    }
  });

  const height = lines.length;
  const width = lines.slice().sort(function (line1, line2) {
    return line1.length - line2.length;
  }).pop().length;

  const pattern = lines.map(function (line) {
    return (new Array(width)).fill(false).map(function (_cell, index) {
      return line[index] === 'O';
    });
  });

  return {
    width: width,
    height: height,
    pattern: pattern
  };
}

function parseRunLengthEncoding (patternText) {
  const lineEnding = patternText.includes('\r') ? '\r\n' : '\n';
  const lines = patternText.trim().split(lineEnding).filter(function (line) {
    return !line.startsWith('#');
  });

  const metadata = lines.shift().split(', ');
  const width = parseInt(metadata[0].split('x = ')[1]);
  const height = parseInt(metadata[1].split('y = ')[1]);
  // const rule = metadata[2].split('rule = ')[1]; Maybe use eventually
  const encoded = lines.join('');

  if (encoded.indexOf('!') !== encoded.length - 1) {
    throw new Error('Malformed RLE pattern');
  }

  function addChunk(bool, str, array) {
    const length = str ? parseInt(str) : 1;
    array.push((new Array(length)).fill(bool));
  }

  function addEmptyRows(length, array) {
    (new Array(length)).fill(null).forEach(function () {
      array.push((new Array(width)).fill(false));
    });
  }

  function addRow (rowChunks, array, isLast) {
    var row = rowChunks.reduce(function (acc, cur) {
      return acc.concat(cur);
    }, []);
    if (row.length !== width) {
      if (isLast) {
        const difference = width - row.length;
        row = row.concat((new Array(difference)).fill(false));
      } else {
        throw new Error('Malformed RLE pattern');
      }
    }
    array.push(row);
  }

  var numberStr = '';
  var chunks = [];
  const pattern = [];

  encoded.split('').forEach(function (char) {
    if (/\s/.test(char)) {
      return;
    } else if (/\d/.test(char)) {
      numberStr += char;
    } else if (char === 'b') {
      addChunk(false, numberStr, chunks);
      numberStr = '';
    } else if (char === 'o') {
      addChunk(true, numberStr, chunks);
      numberStr = '';
    } else if (char === '$') {
      addRow(chunks, pattern);
      chunks = [];

      if (numberStr) {
        addEmptyRows(parseInt(numberStr) - 1, pattern);
        numberStr = '';
      }
    } else if (char === '!') {
      addRow(chunks, pattern, true);
    } else {
      throw new Error('Unknown character');
    }
  });

  if (pattern.length !== height) {
    throw new Error('Malformed RLE pattern');
  }

  return {
    width: width,
    height: height,
    pattern: pattern
  };
}
