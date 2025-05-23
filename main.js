var $columns = $('.col');
var $winningColumns = $('.c2,.c3');
var $rings;
var $c1 = $('.c1');
var $c2 = $('.c2');
var $c3 = $('.c3');
var $moves = $('.moves');
var $reset = $('#reset');
var $levelButton = $('#levelButton');
var $visualizeButton = $('#visualizeButton');
var $slider = $('#speedSlider');
var $stepsList = $('#stepsList');
var isVisualizing = false;
var isPaused = false;
var visualizeSpeed = 700;
var visualizeTimer = null;

var game = {
  rings: 4,
  moves: 0,
  active: false,
  originCol: {},
  targetCol: {},
  moverId: 0,
  targetId: 0,
  over: true,
  visualizeMoves: [],
  currentMoveIndex: 0,
  optimalMoveCount: 0,
  steps: [],
  
  registerEvents: function() {
    $columns.on('click', function(){
      if (!game.over && !isVisualizing){
        game.click($(this));
      }
    });

    $columns.mouseenter(function(){
      if (!game.over && !isVisualizing && !game.active) {
        $(this).children('.ring').eq(0).addClass('hover');
      }
    });

    $columns.mouseleave(function(){
      $(this).children('.ring').eq(0).removeClass('hover');
    });

    $levelButton.on('click', function() {
      game.displayLevelSelector();
      clearSteps(); 
    });

    $visualizeButton.on('click', function() {
      if (game.over) {
        game.reset();
      }

      if (!isVisualizing) {
        isVisualizing = true;
        isPaused = false;
        game.currentMoveIndex = 0;
        game.moves = 0;
        $moves.html('MOVES: ' + game.moves);
        game.visualizeMoves = [];
        game.optimalMoveCount = Math.pow(2, game.rings) - 1; 
        game.calculateMoves(game.rings, 0, 2, 1);

        $(this).text('PAUSE');
        game.executeVisualization();

        toggleSlider(true);
      } else if (isPaused) {
        isPaused = false;
        $(this).text('PAUSE');
        game.executeVisualization();
      } else {
        isPaused = true;
        $(this).text('RESUME');
        if (visualizeTimer) {
          clearTimeout(visualizeTimer);
          visualizeTimer = null;
        }
      }
    });

    $slider.on('input', function() {
      visualizeSpeed = $(this).val();
    });

    $reset.on('click', function() {
      if (isVisualizing) {
        isVisualizing = false;
        isPaused = false;
        $visualizeButton.text('VISUALIZE');
        
        if (visualizeTimer) {
          clearTimeout(visualizeTimer);
          visualizeTimer = null;
        }

        toggleSlider(false);
      }
      if ($(this).text() === 'PICK LVL') {
        game.reset();
        resetSteps(); 
      }
      if ($(this).text() === 'RESET') {
        game.reset(); 
        resetSteps(); 
      }
      if ($(this).text() === 'START') {
        game.reset(); 
        resetSteps(); 
      } else {
        game.displayLevelSelector();
      }
    });

    $c2.on('click', '.arrow', function(){
      game.selectLevel($(this));
    });
  },

  click: function(clicked) {
    var clickedRing = clicked.children('.ring').eq(0);

    if (!this.active) {
      if (clickedRing.length === 0) return;

      this.originCol = clicked;
      clickedRing.addClass('active');
      this.moverId = parseInt(clickedRing.attr('id'));
      this.active = true;
    } else {
      if (this.checkMove(clicked)) {
        this.moveRing(clicked);
        this.softReset();
        this.incrementCounter();
        this.checkWin();
      } else {
        if (this.originCol.attr('class') !== clicked.attr('class')) {
          this.rumble();
        }
        this.softReset();
      }
    }
  },

  checkMove: function(target) {
    this.targetCol = target;

    var targetRing = target.children('.ring').eq(0);
    this.targetId = targetRing.length > 0 ? parseInt(targetRing.attr('id')) : Infinity;

    if (this.originCol.attr('class') === this.targetCol.attr('class')) {
      return false;
    } else if (this.moverId < this.targetId) {
      return true;
    } else {
      return false;
    }
  },

  rumble: function() {
    $('.active').addClass('rumble');
    setTimeout(function() {
      $('.active').removeClass('rumble');
    }, 250);
  },

  moveRing: function(destination) {
    $('.active').prependTo(destination);
  },

  incrementCounter: function() {
    this.moves++;
    $moves.html('MOVES: ' + this.moves);
  },

  softReset: function() {
    this.active = false;
    $('.ring').removeClass('active hover');
  },

  checkWin: function() {
    if (isVisualizing) return;
    
    $winningColumns.each(function() {
      if ($(this).children('.ring').length === game.rings) {
        game.gameOver();
        return false;
      }
    });
  },

  gameOver: function() {
    if (!isVisualizing) {
      this.over = true;
      isVisualizing = false;
      isPaused = false;

      var perfect = Math.pow(2, this.rings) - 1;

      $('.c2').prepend("<div class='gameOver report'></div>");
      $('.c2').prepend("<div class='gameOver big'>YOU WIN!</div>");
      $('.report').html("<p>Your Score: " + this.moves + "</p><p>Perfect: " + perfect + "</p>");

      $visualizeButton.text('VISUALIZE');
      $visualizeButton.hide();
      $levelButton.show();
      $reset.text('START AGAIN');
    }
  },

  reset: function() {
    isVisualizing = false;
    isPaused = false;
    
    if (visualizeTimer) {
      clearTimeout(visualizeTimer);
      visualizeTimer = null;
    }

    $columns.children().remove();
    this.generateRings(this.rings);

    this.over = false;
    this.active = false;
    this.moves = 0;
    this.moverId = 0;
    this.targetId = 0;
    this.targetCol = {};
    this.originCol = {};
    this.currentMoveIndex = 0;
    this.visualizeMoves = [];
    this.optimalMoveCount = Math.pow(2, this.rings) - 1;

    $moves.html('MOVES: ' + this.moves);
    $reset.text('RESET');
    $visualizeButton.text('VISUALIZE');
    $visualizeButton.show();
    $levelButton.show();
    $('.level-select').remove();
    $('.gameOver').remove();

    $visualizeButton.show();
    toggleSlider(false);  
    resetSteps();  
  },

  selectLevel: function(arrow) {
    var $level = $('.level');
    if (arrow.hasClass('left')) {
      if (this.rings > 3) {
        this.rings--;
      }
    } else if (this.rings < 15) {
      this.rings++;
    }
    $level.html(this.rings);
    this.generateRings(this.rings);
  },

  displayLevelSelector: function() {
    $reset.text('START');
    $levelButton.hide();
    $visualizeButton.show();
    $visualizeButton.text('VISUALIZE');

    this.over = true;
    isVisualizing = false;
    isPaused = false;
    
    if (visualizeTimer) {
      clearTimeout(visualizeTimer);
      visualizeTimer = null;
    }

    var $levelSelect = $("<div class='level-select'><p>How tall?</p><div class='level-select-box'><p class='arrow left'>&lt;</p><span class='level'>4</span><p class='arrow right'>&gt;</p></div></div>");
    $columns.children().remove();
    $c2.append($levelSelect);
    $('.level').html(this.rings);

    this.generateRings(this.rings);
  },

  generateRings: function(n) {
    $c1.children().remove();

    var multiplier = 1/n;

    for (var i = 1; i <= n; i++) {
      var width = (100 - (n-i)*multiplier*100) + '%';
      var $ring = $('<div class="ring"></div>');
      $ring.attr('id', i);
      $ring.css('width', width);
      $c1.append($ring);
    }

    $rings = $('.ring');
    var standardHeight = Math.max(15, 50/n);
    $rings.height(standardHeight);
  },

  calculateMoves: function(n, source, target, auxiliary) {
    if (n > 0) {
      this.calculateMoves(n-1, source, auxiliary, target);
      this.visualizeMoves.push({
        from: source, 
        to: target
      });
      this.calculateMoves(n-1, auxiliary, target, source);
    }
  },

  executeVisualization: function() {
    if (visualizeTimer) {
      clearTimeout(visualizeTimer);
      visualizeTimer = null;
    }
    
    if (!isVisualizing || isPaused || game.over) {
      return;
    }

    if (game.currentMoveIndex >= game.visualizeMoves.length) {
      isVisualizing = false;
      $visualizeButton.hide();  
      $levelButton.show();
      $reset.text('RESET');
      isVisualizing = false;

      toggleSlider(false);
      return;
    }

    var move = game.visualizeMoves[game.currentMoveIndex];
    var sourceCol, targetCol;

    switch(move.from) {
      case 0: sourceCol = $c1; break;
      case 1: sourceCol = $c2; break;
      case 2: sourceCol = $c3; break;
    }

    switch(move.to) {
      case 0: targetCol = $c1; break;
      case 1: targetCol = $c2; break;
      case 2: targetCol = $c3; break;
    }

    var $ringToMove = sourceCol.children('.ring').first();
    $ringToMove.addClass('active');

    visualizeTimer = setTimeout(function() {
      $ringToMove.prependTo(targetCol);
      $ringToMove.removeClass('active');
      game.incrementCounter();

      game.updateStepsList('Move disk from column ' + move.from + ' to column ' + move.to);
      game.currentMoveIndex++;
      
      visualizeTimer = setTimeout(function() {
        game.executeVisualization();
      }, visualizeSpeed / 2);
    }, visualizeSpeed / 2);
  },

  updateStepsList: function(step) {
    const stepItem = $('<li>').text(step);
    $stepsList.append(stepItem);
  }
};

function resetSteps() {
  $stepsList.empty(); 
}

function toggleSlider(visible) {
  if (visible) {
    $slider.show();
  } else {
    $slider.hide();
  }
}

game.registerEvents();
game.displayLevelSelector();
