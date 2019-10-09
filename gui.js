importPackage(java.awt);
importPackage(Packages.javax.swing);

importClass(java.awt.image.BufferedImage);
importClass(java.lang.Thread);

load('board.js');
load('patternParsers.js');

function LifeGui () {
  this.speed = 100;
  this.running = false;
  this.pattern = null;

  this.size = 100;
  this.cellSize = 10;
  const fullSize = Math.floor(this.size * 1.1);
  this.board = new Board(fullSize, this.size);

  this.window = new JFrame('Rhino Life');
  this.window.setDefaultCloseOperation(WindowConstants.EXIT_ON_CLOSE);
  this.window.setSize(this.size * 11, this.size * 12.5);

  const panel = new JPanel();
  panel.setLayout(new BorderLayout());
  this.window.add(panel);

  const boardPanel = new JPanel();
  boardPanel.setBorder(BorderFactory.createTitledBorder('Board'));

  this.boardLabel = new JLabel();
  const boardClickBound = this.boardClick.bind(this);
  this.boardLabel.addMouseListener({ mouseClicked: boardClickBound });

  boardPanel.add(this.boardLabel);
  const scrollPane = new JScrollPane(boardPanel);
  panel.add(scrollPane);

  const buttonPanel = new JPanel();
  buttonPanel.setLayout(new FlowLayout());
  panel.add(buttonPanel, BorderLayout.PAGE_END);

  this.startOrStopButton = new JButton('Start');
  const startOrStopBound = this.startOrStop.bind(this);
  this.startOrStopButton.addActionListener({ actionPerformed: startOrStopBound });
  buttonPanel.add(this.startOrStopButton);

  const resetButton = new JButton('Reset');
  const resetBound = this.reset.bind(this);
  resetButton.addActionListener({ actionPerformed: resetBound });
  buttonPanel.add(resetButton);

  const loadButton = new JButton('Load Pattern');
  const loadPatternBound = this.loadPattern.bind(this);
  loadButton.addActionListener({ actionPerformed: loadPatternBound });
  buttonPanel.add(loadButton);

  const updateBound = this.update.bind(this);
  this.timer = new Timer(this.speed, { actionPerformed: updateBound });
}

LifeGui.prototype.showUI = function () {
  this.initializeBoard();
  this.updateBoardImage();
  this.window.setVisible(true);
};

LifeGui.prototype.initializeBoard = function () {
  this.board.toggle(1, 0);
  this.board.toggle(2, 1);
  this.board.toggle(2, 2);
  this.board.toggle(1, 2);
  this.board.toggle(0, 2);
};

LifeGui.prototype.updateBoardImage = function () {
  this.boardLabel.setIcon(new ImageIcon(this.getBoardImage()));
};

LifeGui.prototype.update = function () {
  this.board.generate();
  this.updateBoardImage();
};

LifeGui.prototype.startOrStop = function () {
  if (this.running) {
    this.timer.stop();
    this.startOrStopButton.setText('Start');
  } else {
    this.timer.start();
    this.startOrStopButton.setText('Stop');
  }
  this.running = !this.running;
};

LifeGui.prototype.reset = function () {
  this.board.clear();
  this.initializeBoard();
  this.updateBoardImage();
  if (this.running) {
    this.startOrStop();
  }
};

LifeGui.prototype.boardClick = function (event) {
  const pointClicked = event.getPoint();
  const x = Math.floor(pointClicked.x / this.cellSize);
  const y = Math.floor(pointClicked.y / this.cellSize);

  if (this.pattern) {
    try {
      this.board.copyBuffer(x, y, this.pattern);
    } catch (error) {
      JOptionPane.showMessageDialog(
        this.window,
        error.message,
        'Error',
        JOptionPane.ERROR_MESSAGE
      );
    }
    this.pattern = null;
  } else {
    this.board.toggle(x, y);
  }

  this.updateBoardImage();
};

LifeGui.prototype.loadPattern = function () {
  const patternText = this.showPatternDialog();
  if (patternText) {
    this.pattern = parsePlaintext(patternText);
  }
};

LifeGui.prototype.showPatternDialog = function () {
  const ta = new JTextArea(10, 30);
  const result = JOptionPane.showConfirmDialog(
    this.window,
    new JScrollPane(ta),
    'Enter Object pattern',
    JOptionPane.OK_CANCEL_OPTION
  );
  return result === JOptionPane.OK_OPTION ? '' + ta.getText() : null;
};

LifeGui.prototype.getBoardImage = function () {
  const smallImage = new BufferedImage(
    this.size, this.size,
    BufferedImage.TYPE_BYTE_GRAY
  );

  const black = Color.BLACK.getRGB();
  const white = Color.WHITE.getRGB();
  this.board.renderToBufferedImage(smallImage, black, white);

  const outputImage = new BufferedImage(
    this.size * this.cellSize,
    this.size * this.cellSize,
    BufferedImage.TYPE_BYTE_GRAY
  );

  const g2d = outputImage.createGraphics();
  g2d.drawImage(
    smallImage, 0, 0,
    this.size * this.cellSize,
    this.size * this.cellSize,
    null
  );
  this.drawGrid(g2d);
  g2d.dispose();

  return outputImage;
};

LifeGui.prototype.drawGrid = function (g2d) {
  g2d.setColor(Color.LIGHT_GRAY);
  g2d.setStroke(new BasicStroke(1));
  const fullSize = this.size * this.cellSize;
  for (let i = 0; i < fullSize; i += this.cellSize) {
    g2d.drawLine(0, i, fullSize, i);
    g2d.drawLine(i, 0, i, fullSize);
  }
};
