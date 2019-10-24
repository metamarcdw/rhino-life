importPackage(java.awt);
importPackage(Packages.javax.swing);

importClass(java.awt.image.BufferedImage);
importClass(Packages.javax.swing.border.EmptyBorder);

importClass(java.lang.Thread);
importClass(java.net.URI);

load('board.js');
load('patternParsers.js');

function LifeGui () {
  this.running = false;
  this.pattern = null;
  const defaultSpeed = 500;
  const defaultZoom = 10;

  this.size = 50;
  this.cellSize = 10;
  const fullSize = Math.floor(this.size * 1.1);
  this.board = new Board(fullSize, this.size);

  this.window = new JFrame('Rhino Life');
  this.window.setDefaultCloseOperation(WindowConstants.EXIT_ON_CLOSE);
  this.window.setSize(this.size * 17, this.size * 13);

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
  buttonPanel.setBorder(new EmptyBorder(5, 5, 5, 100));
  buttonPanel.setLayout(new GridLayout(2, 4, 10, 5));
  panel.add(buttonPanel, BorderLayout.PAGE_END);

  const zoomLabel = new JLabel('Zoom', SwingConstants.RIGHT);
  buttonPanel.add(zoomLabel);

  const zoomSlider = new JSlider(JSlider.HORIZONTAL, 5, 20, defaultZoom);
  const updateZoomBound = this.updateZoom.bind(this);
  zoomSlider.addChangeListener({ stateChanged: updateZoomBound });
  buttonPanel.add(zoomSlider);

  this.startOrStopButton = new JButton('Start');
  const startOrStopBound = this.startOrStop.bind(this);
  this.startOrStopButton.addActionListener({ actionPerformed: startOrStopBound });
  buttonPanel.add(this.startOrStopButton);

  const loadButton = new JButton('Load Pattern');
  const loadPatternBound = this.loadPattern.bind(this);
  loadButton.addActionListener({ actionPerformed: loadPatternBound });
  buttonPanel.add(loadButton);

  const speedLabel = new JLabel('Speed', SwingConstants.RIGHT);
  buttonPanel.add(speedLabel);

  const speedSlider = new JSlider(JSlider.HORIZONTAL, 10, 1000, defaultSpeed);
  const updateSpeedBound = this.updateSpeed.bind(this);
  speedSlider.setInverted(true);
  speedSlider.setSnapToTicks(true);
  speedSlider.setMajorTickSpacing(100);
  speedSlider.addChangeListener({ stateChanged: updateSpeedBound });
  buttonPanel.add(speedSlider);

  const resetButton = new JButton('Reset');
  const resetBound = this.reset.bind(this);
  resetButton.addActionListener({ actionPerformed: resetBound });
  buttonPanel.add(resetButton);

  const updateBound = this.update.bind(this);
  this.timer = new Timer(defaultSpeed, { actionPerformed: updateBound });

  const sizePanel = new JPanel();
  const sizeLabel = new JLabel('Size');
  const sizeField = new JTextField(this.size, 5);
  const sizeButton = JButton('Go');
  sizePanel.add(sizeLabel);
  sizePanel.add(sizeField);
  sizePanel.add(sizeButton);
  buttonPanel.add(sizePanel);
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

LifeGui.prototype.updateZoom = function (event) {
  const source = event.getSource();
  if (source.getValueIsAdjusting()) {
    this.cellSize = source.getValue();
    this.updateBoardImage();
  }
};

LifeGui.prototype.updateSpeed = function (event) {
  const source = event.getSource();
  if (source.getValueIsAdjusting()) {
    this.timer.setDelay(source.getValue());
  }
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

LifeGui.prototype.showErrorMessage = function (error) {
  JOptionPane.showMessageDialog(
    this.window,
    error.message,
    'Error',
    JOptionPane.ERROR_MESSAGE
  );
};

LifeGui.prototype.boardClick = function (event) {
  const pointClicked = event.getPoint();
  const x = Math.floor((pointClicked.x - 2) / this.cellSize);
  const y = Math.floor((pointClicked.y - 1) / this.cellSize);

  if (this.pattern) {
    try {
      this.board.copyBuffer(x, y, this.pattern);
    } catch (error) {
      this.showErrorMessage(error);
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
    try {
      if (patternText.includes('.O')) {
        this.pattern = parsePlaintext(patternText);
      } else if (patternText.includes('$')) {
        this.pattern = parseRunLengthEncoding(patternText);
      } else {
        throw new Error('Unknown pattern encoding');
      }
    } catch (error) {
      this.showErrorMessage(error);
    }
  }
};

LifeGui.prototype.showPatternDialog = function () {
  const dialogPanel = new JPanel();
  dialogPanel.setLayout(new BoxLayout(dialogPanel, BoxLayout.Y_AXIS));

  const ta = new JTextArea(10, 30);
  dialogPanel.add(new JScrollPane(ta));

  const URL = 'https://www.conwaylife.com/wiki/Category:Patterns';
  const linkLabel = new JLabel('Find Patterns');
  linkLabel.setForeground(Color.BLUE);
  linkLabel.setCursor(Cursor.getPredefinedCursor(Cursor.HAND_CURSOR));
  linkLabel.addMouseListener({
    mouseClicked: function () {
      try {
        Desktop.getDesktop().browse(new URI(URL));
      } catch (error) {
        print(error);
        if (error.javaException) {
          error.javaException.printStackTrace();
        }
      }
    }
  });
  dialogPanel.add(linkLabel);

  const result = JOptionPane.showConfirmDialog(
    this.window,
    dialogPanel,
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

  for (var i = 0; i < fullSize; i += this.cellSize) {
    g2d.drawLine(0, i, fullSize, i);
    g2d.drawLine(i, 0, i, fullSize);
  }

  const lastPos = fullSize - 1;
  g2d.drawLine(0, lastPos, lastPos, lastPos);
  g2d.drawLine(lastPos, 0, lastPos, lastPos);
};
