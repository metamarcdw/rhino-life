/* jshint unused: false */
function parsePlaintext (patternText) {
  /* jshint unused: true */
  const lines = patternText.split('\n').filter(function (line) {
    return !line.startsWith('!');
  });
  while (!lines[lines.length - 1]) {
    lines.pop();
  }

  const height = lines.length;
  const width = lines.map(function (line) {
    return line.length;
  }).sort(function (length1, length2) {
    return length1 - length2;
  }).pop();

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
