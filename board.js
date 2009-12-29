// ----------------------------------------------------------
// ----- Class: GameBoardStone ------------------------------
// ----------------------------------------------------------

function GameBoardStone(x, y, color) {
    this.x = x ;
    this.y = y ;
    this.color = color ;
}

GameBoardStone.newPassStone = function(color) {
    return new GameBoardStone(-1, -1, color) ;
}

GameBoardStone.prototype.isPass = function() {
    return this.x == -1 && this.y == -1 ;
}

function gameBoardStoneComparator(o1, o2) {
    if(o1.x<o2.x) return -1 ;
    if(o1.x>o2.x) return  1 ;
    if(o1.y<o2.y) return -1 ;
    if(o1.y>o2.y) return  1 ;

    return 0 ;
}

// -----------------------------------------------------------------------------
// ----- Class: GameBoard ------------------------------------------------------
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// ----- Class: GameBoard ------------------------------------------------------
// ----- Constructor      ------------------------------------------------------
function GameBoard(boardSize) {
    this.board = new Array() ;
    this.boardSize = boardSize ;
    this.gameLog = new GameLog() ;
    this.numberOfRemovedStones=[];
    this.nextPlayerColor = 1;
    this.ko = {ko:false, i:0, j:0};
}

//Constants
GameBoard.MOVE_OK             = 0 ;
GameBoard.MOVE_ERROR_OCCUPIED = 1 ;
GameBoard.MOVE_ERROR_SUICIDE  = 2 ;
GameBoard.MOVE_ERROR_KO       = 3 ;

// -----------------------------------------------------------------------------
// ----- Class: GameBoard ------------------------------------------------------
// ----- Public Methods   ------------------------------------------------------

// Called to perform a legal Go move. Writes log.
GameBoard.prototype.makeMove = function (x, y, color) {
    var moveResult = GameBoard.MOVE_OK;

    // Determine the other color and other color
    if(color == null) {
        color = this.nextPlayerColor ;
    }

    moveResult = this._tryToApplyStepToBoard(x, y, color);

    if(moveResult != GameBoard.MOVE_OK) {
        this.undo(/*trimLog=*/true) ;
        MessageManager.getInstance().createDismissibleMessage("Wrong move. Error code: "+moveResult+".\n(1:Alr.Occ; 2:Suicide; 3:Ko)");
        return moveResult ;
    }

    return moveResult ;
}

// Called to unconditionally places a stone. Does not count removed stones.
GameBoard.prototype.setStone = function(i, j, color, noLog) {
    //Resetting ko-state
    this.ko.ko = false ;

    this.board[i*this.boardSize+j] = color ;
    if(!noLog) {
        this.gameLog.addEntry(GameLogEntry.TYPE_SET, i, j, color) ;
    }
}

// Called to mark that the user has passed.
GameBoard.prototype.pass = function(color, noLog) {
    //Resetting ko-state
    this.ko.ko = false ;

    if(!color) {
        color = this.nextPlayerColor ;
    }

    this.nextPlayerColor = 1 ;
    if(color==1) {
        this.nextPlayerColor = 2 ;
    }

    if(!noLog) {
        this.gameLog.addEntry(GameLogEntry.TYPE_PASS, 0, 0, color) ;
    }
}

GameBoard.prototype.getField = function (x, y) {
    return this.board[x*this.boardSize+y] ;
}

GameBoard.prototype.isLast = function (i, j) {
    var last = this.gameLog.lastEntry() ;
    return last &&
           (last.type == GameLogEntry.TYPE_PUT ||
            last.type == GameLogEntry.TYPE_SET) &&
           last.i == i && last.j == j ;
}

GameBoard.prototype.getNumberOfRemovedStones = function(color) {
    return this.numberOfRemovedStones[color-1] ;
}

GameBoard.prototype.undo = function(trimLog) {
    this.board = new Array() ;
    this.numberOfRemovedStones = new Array() ;
    this.nextPlayerColor = 1 ;
    this.gameLog.undo(trimLog) ;
    this._applyLog(this.gameLog) ;
}

GameBoard.prototype.redo = function() {
    var last = this.gameLog.getLength() ;
    this.gameLog.redo() ;
    this._applyLog(this.gameLog, last) ;
}

GameBoard.prototype.gotoStep = function(i) {
    if(i==this.gameLog.logLength) return ;
    if(i<this.gameLog.logLength) {
        this.board = new Array() ;
        this.numberOfRemovedStones = new Array() ;
        this.nextPlayerColor = 1 ;
        this.gameLog.gotoEntry(i) ;
        this._applyLog(this.gameLog) ;
    }
    else {
        var last = this.gameLog.getLength() ;
        this.gameLog.gotoEntry(i) ;
        this._applyLog(this.gameLog, last) ;
    }
}

GameBoard.prototype.getNumberOfTotalSteps = function() {
    return this.gameLog.getTotalLength() ;
}

GameBoard.prototype.getNumberOfCurrentStep = function() {
    return this.gameLog.getLength() ;
}

// -----------------------------------------------------------------------------
// ----- Class: GameBoard ------------------------------------------------------
// ----- Private Methods   ------------------------------------------------------

// Called to remove a stone as a followup action. Counts removed stones.
GameBoard.prototype._removeStone = function(i, j, noLog) {
    var color = this.board[i*this.boardSize+j] ;
    if(!color) {
        return false ;
    }

    this.board[i*this.boardSize+j]=null ;
    this.numberOfRemovedStones[color-1]++ ;
    if(!noLog) {
        this.gameLog.addFollowup(GameLogEntry.FOLLOWUPTYPE_REMOVE, i, j) ;
    }

    return true ;
}

// Called to put a stone on tha board as part of a normal game step.
GameBoard.prototype._putStone = function(i, j, color, noLog) {
    var fieldColor = this.board[i*this.boardSize+j] ; 
    if(fieldColor) {
        return false ;
    }
    
    this.board[i*this.boardSize+j] = color ;
    this.nextPlayerColor = 1 ;
    if(color==1) {
        this.nextPlayerColor = 2 ;
    }

    
    if(!noLog) {
        this.gameLog.addEntry(GameLogEntry.TYPE_PUT, i, j, color) ;
    }
    
    return true ;
}

GameBoard.prototype._tryToApplyStepToBoard = function(x, y, color) {
    if(!this._putStone(x, y, color)) {
        return GameBoard.MOVE_ERROR_OCCUPIED ;
    }
    
    if (this.ko.ko && x==this.ko.i && y==this.ko.y) {
        return GameBoard.MOVE_ERROR_KO ;
    } 

    var otherColor = 1;
    if(color == 1) otherColor = 2 ;

    // Check if this move removes anything:
    var neighbours  = this._getNeighbours(x, y, otherColor) ;
    var moveResult = GameBoard.MOVE_ERROR_SUICIDE ;
    var numberOfRemovedStones = 0;

    while(!neighbours.isEmpty()) {
        var neighbour = neighbours.pop() ;

        if(neighbour.color != otherColor) continue ;

        var shape = new SortedSet(gameBoardStoneComparator) ;
        var lives = new SortedSet(gameBoardStoneComparator) ;

        this._walkShape(neighbour.x, neighbour.y, shape, lives) ;
        // There is a shape, and it has only one life (the one we are placing on)
        if(!shape.isEmpty() && lives.isEmpty()) {
            numberOfRemovedStones += shape.data.length;
            if (shape.data.length == 1 && numberOfRemovedStones == 1) {
                this.ko.i = shape.data[0].x;
                this.ko.j = shape.data[0].y;
            }
            this._removeShape(shape) ;
            moveResult = GameBoard.MOVE_OK ;
        }
    }

    if(moveResult == GameBoard.MOVE_ERROR_SUICIDE) {
//Nothing was removed
        var shape = new SortedSet(gameBoardStoneComparator) ;
        var lives = new SortedSet(gameBoardStoneComparator) ;
        this._walkShape(x, y, shape, lives) ;
        if(!lives.isEmpty()>=1) {
            moveResult = GameBoard.MOVE_OK ;
        }
    } 

//Determining the forbidden place once a Ko occured (checking the simple ko-rule)
    this.ko.ko = false;
    if (numberOfRemovedStones == 1) {
        var shape = new SortedSet(gameBoardStoneComparator) ;
        var lives = new SortedSet(gameBoardStoneComparator) ;
        this._walkShape(x, y, shape, lives) ;
        if (shape.data.length == 1 && lives.data.length == 1) {
            this.ko.ko = true;   //ko.x & ko.y is set already above in the while-loop
            this.gameLog.addFollowup(GameLogEntry.FOLLOWUPTYPE_KO, this.ko.i, this.ko.j) ;             
        }
    }   

    return moveResult ;
}

GameBoard.prototype._getNeighbours = function(x, y) {
    var rv = new SortedSet(gameBoardStoneComparator) ;

    var xx = x-1
    var yy = y ;
    var color = this.getField(xx, yy);
    
    if(xx>=0)        
        rv.insert(new GameBoardStone(xx, yy, color)) ;

    var xx = x+1
    var yy = y ;
    var color = this.getField(xx, yy);
    
    if(xx<this.boardSize)        
        rv.insert(new GameBoardStone(xx, yy, color)) ;

    var xx = x
    var yy = y-1 ;
    var color = this.getField(xx, yy);
    
    if(yy>=0)        
        rv.insert(new GameBoardStone(xx, yy, color)) ;

    var xx = x
    var yy = y+1 ;
    var color = this.getField(xx, yy);
    
    if(yy<this.boardSize)        
        rv.insert(new GameBoardStone(xx, yy, color)) ;
        
    return rv ;
}

GameBoard.prototype._walkShape = function(x, y, shape, lives) {

    // Only proceed if something is at x, y
    var color = this.getField(x, y) ; 
    if(color) {
        var openPoints = new SortedSet(gameBoardStoneComparator) ;
        
        // seed the open points with the current point...
        openPoints.insert(new GameBoardStone(x, y, color)) ;
        
        // while there are open points, try to close them...
        while(!openPoints.isEmpty()) {
            var openPoint = openPoints.pop() ;
            var neighbours = this._getNeighbours(openPoint.x, openPoint.y) ;

            while(!neighbours.isEmpty()) {
                var neighbour = neighbours.pop() ;
                
                if(neighbour.color == color && !shape.contains(neighbour)) {
                    openPoints.insert(neighbour) ;
                }
                
                if(!neighbour.color && !lives.contains(neighbour)) {
                    lives.insert(neighbour) ;
                }
            }
            
            shape.insert(openPoint) ;
        }
    }
    
    return shape ;
}

GameBoard.prototype._removeShape = function (shape) {
    for(var i=0; i<shape.data.length; i++) {
        var stone = shape.data[i] ;
        this._removeStone(stone.x, stone.y) ;
    }
} 

GameBoard.prototype._applyLog = function (log, from) {
    var len = log.getLength() ;
    var i ;

    if(!from) from = 0 ;
    for(i=from; i<len; i++) {
        var s = log.getEntry(i) ;
        this.ko.ko = false;

        if(s.type == GameLogEntry.TYPE_PASS) {
            this.pass(s.color, true) ;
        }
        else if(s.type == GameLogEntry.TYPE_SET) {
            this.setStone(s.i, s.j, s.color, true) ; 
        }
        else if(s.type == GameLogEntry.TYPE_PUT) {
            this._putStone(s.i, s.j, s.color, true) ;
            for(var fi in s.followup) {
                var f = s.followup[fi] ;
                if (f.type == GameLogEntry.FOLLOWUPTYPE_REMOVE) {
                    this._removeStone(f.i, f.j, true) ;
                } else if (f.type == GameLogEntry.FOLLOWUPTYPE_KO) {
                    this.ko.i = f.i;
                    this.ko.j = f.j;
                    this.ko.ko = true;
                }
            }
        }
    }
    
    this.gameLog = log ;
}

// ----------------------------------------------------------
// ----- Class: SimpleSerializer ----------------------------
// ----------------------------------------------------------

function SimpleSerializer(board) {
    this.board_ = board ;
}

SimpleSerializer.indexToCode = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 
                                'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 
                                'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't',
                                'u', 'v', 'w', 'x', 'y', 'z'] ;

SimpleSerializer.prototype.serialize = function() {
    var d = {} ;
    var l = {} ;

    d.boardSize = this.board_.boardSize ;
    d.nextPlayerColor = this.board_.nextPlayerColor ;
    d.gameLog = l ;

    l.log = "" ;
    l.logLength = this.board_.gameLog.logLength ;
    l.log = this.board_.gameLog.serialize();

    var rv = wave.util.printJson(d) ;

    return rv ;
}

// ----------------------------------------------------------
// ----- Class: SimpleParser --------------------------------
// ----------------------------------------------------------

function SimpleParser(data) {
    this.data_ = data ;
}

SimpleParser.codeToIndex = {'0':0,  '1':1,  '2':2,  '3':3,  '4':4,
                            '5':5,  '6':6,  '7':7,  '8':8,  '9':9,
                            'a':10, 'b':11, 'c':12, 'd':13, 'e':14,
                            'f':15, 'g':16, 'h':17, 'i':18, 'j':19,
                            'k':20, 'l':21, 'm':22, 'n':23, 'o':24,
                            'p':25, 'q':26, 'r':27, 's':28, 't':29,
                            'u':30, 'v':31, 'w':32, 'x':33, 'y':34,
                            'z':35} ;

SimpleParser.prototype.construct = function() {
    var d = eval( '('+this.data_+')' );
    var gameBoard = new GameBoard(d.boardSize) ;

    var log = new GameLog() ;
    log.deSerialize(d.gameLog);

    gameBoard._applyLog(log) ;
    gameBoard.nextPlayerColor = d.nextPlayerColor ;
    
    return gameBoard ;
}