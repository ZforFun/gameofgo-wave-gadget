function LOG(p) {
    if(typeof console != "undefined" && console.debug) {
        console.debug(p) ;
    }
}

// ----------------------------------------------------------
// ----- Class: Game ----------------------------------------
// ----------------------------------------------------------

function Game(div, themeUrl) {
    this.div = div ;
    this.state = 0 ; // 1->wave callback happened 2->board UI downloaded 
}

Game.prototype.changeTheme = function (themeUrl) {
    this.themeManager = new ThemeManager(this, themeUrl) ;
    this.themeManager.loadTheme() ;
}

Game.prototype.reset = function () {
    this.gameBoard = new GameBoard(this.boardSize) ;
}

Game.prototype.initializeAppearance = function(boardImageUrl, 
                                               blackStoneImageUrl, whiteStoneImageUrl,
                                               blackLastStoneImageUrl, whiteLastStoneImageUrl,
                                               blackDeadStoneImageUrl, whiteDeadStoneImageUrl,
                                               blackTerritoryImageUrl, whiteTerritoryImageUrl,
                                               koImageUrl, boardSize, boardGeometry, stoneGeometry) {
    if(this.boardSize && (this.boardSize != boardSize)) {
        // TODO: report error
        return ;
    }

    this.boardImageUrl = boardImageUrl ;

    this.blackStoneImageUrl     = blackStoneImageUrl ;
    this.whiteStoneImageUrl     = whiteStoneImageUrl ;
    this.blackLastStoneImageUrl = blackLastStoneImageUrl ;
    this.whiteLastStoneImageUrl = whiteLastStoneImageUrl ;
    this.blackDeadStoneImageUrl = blackDeadStoneImageUrl ;
    this.whiteDeadStoneImageUrl = whiteDeadStoneImageUrl ;
    this.blackTerritoryImageUrl = blackTerritoryImageUrl ;
    this.whiteTerritoryImageUrl = whiteTerritoryImageUrl ;
    this.koImageUrl             = koImageUrl ;

    this.boardSize = boardSize ;
    this.gameBoard = new GameBoard(this.boardSize) ;
    this.boardGeometry = boardGeometry ;
    this.stoneGeometry = stoneGeometry ;

    this.state |= 2 ;
}

Game.prototype.onThemeChange = function(boardImageUrl, 
                                        blackStoneImageUrl, whiteStoneImageUrl,
                                        blackLastStoneImageUrl, whiteLastStoneImageUrl,
                                        blackDeadStoneImageUrl, whiteDeadStoneImageUrl,
                                        blackTerritoryImageUrl, whiteTerritoryImageUrl,
                                        koImageUrl, boardSize, boardGeometry, stoneGeometry) {
    this.initializeAppearance(boardImageUrl,
                              blackStoneImageUrl, whiteStoneImageUrl,
                              blackLastStoneImageUrl, whiteLastStoneImageUrl,
                              blackDeadStoneImageUrl, whiteDeadStoneImageUrl,
                              blackTerritoryImageUrl, whiteTerritoryImageUrl,
			      koImageUrl, boardSize, boardGeometry, stoneGeometry) ;
    this.resetBoardUI() ;

    if(this.state == 3) {
        this.restoreStateFromWave();
        this.setWaitAnimation(false);
        this.renderBoard() ;
    }
}

Game.prototype.newSimpleGame = function() {
    // New game...
    this.gameMode = new SimpleGameMode() ;
    // ... the one who added the gadget plays black
    this.gameMode.setPlayerColor(wave.getHost().getId(), 1) ;
    // ... and all other players are white
    this.gameMode.setPlayerColor("*", 2) ;
    
    // Make sure the board is clear, and state is saved to the Wave...
    this.reset() ;
    this.saveStateToWave() ;
}

Game.prototype.newAllPlayersCanPlayGame = function() {
    this.gameMode = new SimpleGameMode() ;
    this.gameMode.setPlayerColor("*", "*") ;
    
    // Make sure the board is clear, and state is saved to the Wave...
    this.reset() ;
    this.saveStateToWave() ;
}

Game.prototype.resetBoardUI = function() {
    var i, j ;

    // Remove stones, and old background...
    if(this.div) {
        if(this.stoneImages && this.stoneImages.length>0) {
            for(i=0; i<this.stoneImages.length; i++) {
                this.div.removeChild(this.stoneImages[i]) ;
            }
        }
        if(this.boardImage) {
            this.div.removeChild(this.boardImage) ;
        }
        
        if(this.waitAnimationDiv) {
            this.div.removeChild(this.waitAnimationDiv) ;
            this.waitAnimationDiv = null ;
        }
    }
    
    // Save new div, add background
    this.boardImage = document.createElement("IMG") ;
    this.boardImage.onload = function() {
        if(typeof gadgets == 'undefined') { return ; }
        gadgets.window.adjustHeight();
    };
    this.boardImage.src = this.boardImageUrl ;
    this.registerOnClick() ;

    this.div.appendChild(this.boardImage) ;
    
    // Add stones
    this.stoneImages = new Array() ;

    for(i=0; i<this.boardSize; i++) {
        for(j=0; j<this.boardSize; j++) {
            var im = document.createElement("IMG") ;
            im.src = this.blackStoneImageUrl ;
            var x
            var y ;
            
            x = Math.round(this.boardGeometry.getXforIndex(i) - this.stoneGeometry.width/2) ;
            y = Math.round(this.boardGeometry.getYforIndex(j) - this.stoneGeometry.height/2) ;

            this.stoneImages[i*this.boardSize+j] = im ;
            this.div.appendChild(im) ;
            im.style.position = "absolute" ;
            im.style.visibility = "hidden" ;
            im.style.left = x+"px" ;
            im.style.top = y+"px" ;
        }
    }
}

Game.prototype.registerOnClick = function() {
    var self = this ;
    this.boardImage.onclick = function (event) {
        self.onClickOnBoard(event) ;
    }
}

Game.prototype.renderBoard = function() {
    var i, j ;
    for(i=0 ; i<this.boardSize; i++) {
        for(j=0; j<this.boardSize; j++) {
            var color = this.gameBoard.getField(i, j) ;
            var last  = this.gameBoard.isLast(i, j) ;
            var ko    = false ;
            if (this.gameBoard.ko.ko && this.gameBoard.ko.i == i && this.gameBoard.ko.j == j ) {
    	        ko = true;
	    }
            this.setStone(i, j, color, last, ko) ;
        }
    }
}

Game.prototype.setStone = function(i, j, color, last, ko) {
    var x, y ;
    var visibility ;
    var src ;
    var im = this.stoneImages[i*this.boardSize+j] ;

    if(color) {
        if(color == 1) {
            if (!last) {
              src = this.blackStoneImageUrl ;
            } else {
              src = this.blackLastStoneImageUrl ;
            }
        } else {
            if (!last) {
              src = this.whiteStoneImageUrl ;
            } else {
              src = this.whiteLastStoneImageUrl ;
            }
        }
        visibility = "visible" ;
    } else {
    	if (ko) {
            src = this.koImageUrl ;
	    visibility = "visible" ;
        } else {
	    visibility = "hidden" ;
        }
    }
    
    if(im.src != src) { im.src = src ; }
    if(im.style.visibility != visibility) { im.style.visibility = visibility ; }
}

Game.prototype.renderBoardAbstract_ = function() {
    if(this.isInWave()) {
        var saveSuccessful = this.saveStateToWave() ;
        if(saveSuccessful) {
            this.setWaitAnimation(true) ;
        }
    } else {
        this.renderBoard() ;
    }
}

Game.prototype.onClickOnBoard = function(event) {
    if(this.state != 3) return ;

    var x, y ;

    if(event.offsetX) {
        x = event.offsetX ;
    } else {
        x = event.pageX - this.div.offsetLeft ;
    }

    if(event.offsetY) {
        y = event.offsetY ;
    } else {
        y = event.pageY - this.div.offsetTop ;
    }

    var i, j ;

    i = this.boardGeometry.getIndexForX(x) ;
    j = this.boardGeometry.getIndexForY(y) ;

    if(i>=this.boardSize || j>=this.boardSize || i<0 || j<0) {
        return ;
    }

    if(!this.gameMode) return ;
    
    if(!this.gameMode.isParticipantTurn(wave.getViewer().getId(), this.gameBoard.nextPlayerColor))
        return ;
        
    this.gameBoard.makeMove(i, j, this.gameBoard.nextPlayerColor) ;
    this.renderBoardAbstract_();
}

Game.prototype.undo = function(trimLog) {
    this.gameBoard.undo(trimLog) ;
    this.renderBoardAbstract_();
}

Game.prototype.redo = function() {
    this.gameBoard.redo() ;
    this.renderBoardAbstract_();
}

Game.prototype.pass = function() {
    this.gameBoard.pass() ;
    this.renderBoardAbstract_();
}

Game.prototype.gotoStep = function(i) {
    this.gameBoard.gotoStep(i) ;
    this.renderBoardAbstract_();
}

Game.prototype.gotoFirstStep = function () {
    this.gotoStep(0) ;
}

Game.prototype.gotoLastStep = function () {
    this.gotoStep(this.gameBoard.getNumberOfTotalSteps()) ;
}

Game.prototype.exportToSGF = function() {
    var currDate = new Date();
    var year;
    var month;
    var day;
    var hour;
    var minute;
    var i;
    var strSGF = "(\n";

    year = currDate.getFullYear();
    if (currDate.getMonth()+1 < 10) month  = "0"+(currDate.getMonth()+1); else month  = (currDate.getMonth()+1);
    if (currDate.getDate()    < 10) day    = "0"+currDate.getDate();      else day    = currDate.getDate();
    if (currDate.getHours()   < 10) hour   = "0"+currDate.getHours();     else hour   = currDate.getHours();
    if (currDate.getMinutes() < 10) minute = "0"+currDate.getMinutes();   else minute = currDate.getMinutes();

/////////////////////////////////
//First Node with general infoes
    strSGF+=";GM[1]"; //Game = GO
    strSGF+="FF[4]"; //SGF 4.0
    strSGF+="RU[Japanese]"; //Japanese rules
    strSGF+="SZ["+this.boardSize+"]"; //Board size: 19x19
    strSGF+="PB[Black]"; //Black's name          //TODO: Getting name for black from Wave
    strSGF+="PW[White]"; //White's name          //TODO: Getting name for white from Wave
    strSGF+="DT["+year+"-"+month+"-"+day+"]"; //Date
    strSGF+="TM["+hour+minute+"]"; //Time

////////////////////////////////////
// Adding the moves from the gameLog
    for(i=0;i<this.gameBoard.gameLog.getLength();i++){
        var stone;
        strSGF+="\n;";
        stone = this.gameBoard.gameLog.getEntry(i);
        if (stone.color==1) strSGF+="B["; else strSGF+="W[";
        strSGF+=String.fromCharCode(97+stone.i);
        strSGF+=String.fromCharCode(97+stone.j);
        strSGF+="]";
    }

    strSGF += "\n)";
    return strSGF;
}

Game.prototype.importFromSGF = function(strSGF) {
    var parser = new SGFParser(strSGF,this);
    parser.parse();  
    this.renderBoardAbstract_();
}

Game.prototype.saveStateToWave = function() {
    if(typeof wave == 'undefined') return ;
    
    var delta = {} ;
    var change = false ;
    
    // Transmit board

    var s = new SimpleSerializer(this.gameBoard) ;
    var newBoard = s.serialize() ;
    var oldBoard = wave.getState().get('gameBoard') ;
    if(newBoard != oldBoard) {
        delta['gameBoard'] = newBoard ;
        change = true ;
    }
    
    if(this.gameMode) {
        var newGameMode = GameMode.serialize(this.gameMode) ;
        var oldGameMode = wave.getState().get('gameMode') ;
        if(newGameMode != oldGameMode) {
            delta['gameMode'] = newGameMode ;
            change = true ;
        }
    }

    if(change) {
        wave.getState().submitDelta(delta) ;
    }
    
    return change ;
}

Game.prototype.restoreStateFromWave = function() {
    if(!wave) return ;

    var gameBoard = wave.getState().get('gameBoard') ;
    if(gameBoard) {
        var p = new SimpleParser(gameBoard) ;
        this.gameBoard = p.construct() ;
    }
    
    var gameMode = wave.getState().get('gameMode') ;
    if(gameMode) {
        this.gameMode = GameMode.construct(gameMode) ;
    }
}

Game.prototype.setWaitAnimation = function(on) {
    if(!this.waitAnimationDiv) {
        this._createWaitAnimationDiv() ;
    }
    this._resizeWaitAnimationDiv() ;
    if(on) {
        this.waitAnimationDiv.style.visibility = "visible" ;
    }
    else {
        this.waitAnimationDiv.style.visibility = "hidden" ;
    }
}

Game.prototype._createWaitAnimationDiv = function () {
    if(!this.waitAnimationDiv) {
        this.waitAnimationDiv = document.createElement("DIV") ;
        var style = this.waitAnimationDiv.style ;
        with(this.waitAnimationDiv) {
            style.position = "absolute" ;
            style.left = "0px" ;
            style.top = "0px" ;
            style.zIndex = 9999 ;
            style.background = "rgba(128, 128, 128, 0.5)" ;
            style.verticalAlign =  "middle" ;
            style.textAlign = "center" ;
            style.display = "table" ;
        }
        this.div.appendChild(this.waitAnimationDiv) ;
        
        this.waitAnimationDiv.innerHTML = 
            '<div style="vertical-align: middle; horizontal-align: center; display: table-cell">' +
            '<font size="16" color="#FFFFFF">' +
            'Waiting for Response</font></div>' ;
    }
}

Game.prototype._resizeWaitAnimationDiv = function() {
    if(this.waitAnimationDiv) {
        if(this.boardImage && this.boardImage.width && this.boardImage.height) {
            this.waitAnimationDiv.style.width = this.boardImage.width + "px" ;
            this.waitAnimationDiv.style.height = this.boardImage.height + "px" ;
        }
    }
}

Game.prototype.isInWave = function() {
    return typeof wave != "undefined" ;
}

Game.prototype.onWaveStateChange = function() {
    this.state |= 1;

    if(this.state == 3) {
        this.restoreStateFromWave();
        this.setWaitAnimation(false);
        this.renderBoard() ;
    }
}

// ----------------------------------------------------------
// ----- Class: GameLog -------------------------------------
// ----------------------------------------------------------

function GameLogEntry(type, i, j, color) {
    this.type   = type ;
    this.i      = i ;
    this.j      = j ;
    this.color  = color ;
    // this.followup = null ;
}

GameLogEntry.restoreFromUnstructuredData = function(data) {
    var rv =
        new GameLogEntry(data.type, data.i, data.j, data.color) ;

    if(data.followup) {
        rv.followup = data.followup.slice(0) ;
    }
    return rv ;
}

GameLogEntry.TYPE_PUT = 1;
GameLogEntry.TYPE_REMOVE = 2;
GameLogEntry.TYPE_SET = 3;
GameLogEntry.TYPE_PASS = 4;

GameLogEntry.FOLLOWUPTYPE_REMOVE = 1;
GameLogEntry.FOLLOWUPTYPE_KO   = 2;


GameLogEntry.prototype.addFollowup = function(type, i, j) {
    if(!this.followup) {
        this.followup = new Array() ;
    }
    this.followup.push({'type':type, 'i':i, 'j':j}) ;
}

/*
GameLogEntry.prototype.getFollowupNumber = function() {
    if (!this.followup) {
        return 0;
    } else {
        return this.followup.length;
    }
}
*/

// ----------------------------------------------------------
// ----- Class: GameLog -------------------------------------
// ----------------------------------------------------------

function GameLog() {
    this.log = new Array() ;
    this.logLength = 0 ;
}

GameLog.restoreFromUnstructuredData = function(data) {
    var rv = new GameLog() ;
    rv.logLength = data.logLength ;
    
    for(var i=0; i<data.log.length; i++) {
        rv.log[i] = 
            GameLogEntry.restoreFromUnstructuredData(data.log[i]) ;
    }
    
    return rv ;
}

GameLog.prototype.addEntry = function(type, i, j, color) {
    if(this.logLength<this.log.length) {
        this.log.splice(this.logLength, this.log.length-this.logLength) ;
    }
    this.log.push(new GameLogEntry(type, i, j, color)) ;
    this.logLength++ ;
}

GameLog.prototype.addFollowup = function(type, i, j) {
    var last = this.lastEntry() ;
    if(last) {
        last.addFollowup(type, i, j) ;
    }
    
    return last ;
}

GameLog.prototype.gotoEntry = function(step) {
    if(step>this.log.length) {
        step = this.log.length ;
    }
    this.logLength = step ;
}

// trimLog specifies that the rest of the log should be thrown out (after the undo).
GameLog.prototype.undo = function(trimLog) {
    if(this.logLength) this.logLength-- ;
    if(trimLog) {
        this.log.splice(this.logLength, this.log.length-this.logLength) ;
    }
    return this.logLength ;
}

GameLog.prototype.redo = function() {
    if(this.logLength<this.log.length) this.logLength++ ;
    return this.logLength ;
}

GameLog.prototype.getEntry = function(index) {
    return this.log[index] ;
}

GameLog.prototype.lastEntry = function() {
    var rv = null ;
    if(this.logLength>0) {
        rv = this.log[this.logLength-1] ;
    }
    return rv ;
}

GameLog.prototype.clone = function() {
    var rv = new GameLog() ;

    if(this.log.length) {
        rv.log = this.log.slice(0) ;
        rv.logLength = this.logLength ;
    }

    return rv ;
}

GameLog.prototype.getLength = function() {
    return this.logLength ;
}

GameLog.prototype.getTotalLength = function() {
    return this.log.length ;
}

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

// ----------------------------------------------------------
// ----- Class: GameBoard -----------------------------------
// ----------------------------------------------------------

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

// TODO: Update after log update
GameBoard.restoreFromUnstructuredData = function(data) {
    var rv = new GameBoard(0) ;
    rv.board = data.board ;
    rv.boardSize = data.boardSize ;
    rv.gameLog = GameLog.restoreFromUnstructuredData(data.gameLog) ;
    rv.numberOfRemovedStones = data.numberOfRemovedStones ;
    rv.nextPlayerColor = data.nextPlayerColor ;

    return rv ;
}

GameBoard.prototype.serializeToString = function() {
    return this.toSource()
}

// Public:
// Called to perform a legal Go move.
// Writes log.
GameBoard.prototype.makeMove = function (x, y, color) {
    var moveResult = GameBoard.MOVE_OK;

    // Determine the other color and other color
    if(color == null) {
        color = this.nextPlayerColor ;
    }

    moveResult = this.tryToApplyStepToBoard(x, y, color);

    if(moveResult != GameBoard.MOVE_OK) {
        this.undo(/*trimLog=*/true) ;
        alert("Wrong move. Error code: "+moveResult+".\n(1:Alr.Occ; 2:Suicide; 3:Ko)");
        return moveResult ;
    }

    return moveResult ;
}

// Public:
// Called to unconditionally places a stone.
// Does not count removed stones
GameBoard.prototype.setStone = function(i, j, color, noLog) {
    //Resetting ko-state
    this.ko.ko = false ;

    this.board[i*this.boardSize+j] = color ;
    if(!noLog) {
        this.gameLog.addEntry(GameLogEntry.TYPE_SET, i, j, color) ;
    }
}

// Protected:
// Called to remove a stone as a followup action
// Counts removed stones
GameBoard.prototype.removeStone = function(i, j, noLog) {
    var color = this.board[i*this.boardSize+j] ;
    if(!color) {
        return false ;
    }

    this.board[i*this.boardSize+j]=null ;
    this.numberOfRemovedStones[color-1]++ ;
    if(!noLog) {
        this.gameLog.addFollowup(GameLogEntry.FOLLOWUPTYPE_REMOVE, i, j) ;
    }

    true ;
}

// Protected:
// Called to put a stone on tha board as part of a normal game step.
GameBoard.prototype.putStone = function(i, j, color, noLog) {
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

// Public:
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
        this.gameLog.addEntry(GameLog.TYPE_PASS, 0, 0, color) ;
    }
}

// Protected:
GameBoard.prototype.tryToApplyStepToBoard = function(x, y, color) {
    if(!this.putStone(x, y, color)) {
        return GameBoard.MOVE_ERROR_OCCUPIED ;
    }

    if (this.ko.ko && x==this.ko.i && y==this.ko.y) {
        return GameBoard.MOVE_ERROR_KO ;
    }	

    var otherColor = 1;
    if(color == 1) otherColor = 2 ;

    // Check if this move removes anything:
    var neighbours  = this.getNeighbours(x, y, otherColor) ;
    var moveResult = GameBoard.MOVE_ERROR_SUICIDE ;
    var numberOfRemovedStones = 0;

    while(!neighbours.isEmpty()) {
        var neighbour = neighbours.pop() ;

        if(neighbour.color != otherColor) continue ;

        var shape = new SortedSet(gameBoardStoneComparator) ;
        var lives = new SortedSet(gameBoardStoneComparator) ;

        this.walkShape(neighbour.x, neighbour.y, shape, lives) ;
        // There is a shape, and it has only one life (the one we are placing on)
        if(!shape.isEmpty() && lives.isEmpty()) {
            numberOfRemovedStones += shape.data.length;
            if (shape.data.length == 1 && numberOfRemovedStones == 1) {
	      this.ko.i = shape.data[0].x;
	      this.ko.j = shape.data[0].y;
	    }
            this.removeShape(shape) ;
            moveResult = GameBoard.MOVE_OK ;
        }
    }

    if(moveResult == GameBoard.MOVE_ERROR_SUICIDE) {
//Nothing was removed
        var shape = new SortedSet(gameBoardStoneComparator) ;
        var lives = new SortedSet(gameBoardStoneComparator) ;
        this.walkShape(x, y, shape, lives) ;
        if(!lives.isEmpty()>=1) {
            moveResult = GameBoard.MOVE_OK ;
        }
    } 

/*    
      else if (numberOfRemovedStones == 1) {
//Checking simple KO-rule
        var length = this.gameLog.getLength();
        if (length>1) {
            var lastLogEntry       = this.gameLog.getEntry(length-1);
            var lastButOneLogEntry = this.gameLog.getEntry(length-2);
            if (lastLogEntry.type == GameLogEntry.TYPE_PUT && lastButOneLogEntry.type == GameLogEntry.TYPE_PUT) {
                if (lastLogEntry.getFollowupNumber()==1 && lastButOneLogEntry.getFollowupNumber()==1) {
                    if (lastLogEntry.i == lastButOneLogEntry.followup[0].i && lastLogEntry.j == lastButOneLogEntry.followup[0].j) {
                        moveResult = GameBoard.MOVE_ERROR_KO ;
                    }
                }
            }
        }
    }
*/

//Determining the forbidden place once a Ko occured (checking the simple ko-rule)
    this.ko.ko = false;
    if (numberOfRemovedStones == 1) {
        var shape = new SortedSet(gameBoardStoneComparator) ;
        var lives = new SortedSet(gameBoardStoneComparator) ;
        this.walkShape(x, y, shape, lives) ;
        if (shape.data.length == 1 && lives.data.length == 1) {
            this.ko.ko = true;   //ko.x & ko.y is set already above in the while-loop
            this.gameLog.addFollowup(GameLogEntry.FOLLOWUPTYPE_KO, i, j) ;	    	
        }
    }	 

    return moveResult ;
}

// Protected:
GameBoard.prototype.getNeighbours = function(x, y) {
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

// Protected:
GameBoard.prototype.walkShape = function(x, y, shape, lives) {
    
    // Only proceed if something is at x, y
    var color = this.getField(x, y) ; 
    if(color) {
        var openPoints = new SortedSet(gameBoardStoneComparator) ;
        
        // seed the open points with the current point...
        openPoints.insert(new GameBoardStone(x, y, color)) ;
        
        // while there are open points, try to close them...
        while(!openPoints.isEmpty()) {
            var openPoint = openPoints.pop() ;
            var neighbours = this.getNeighbours(openPoint.x, openPoint.y) ;

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

// Protected:
GameBoard.prototype.removeShape = function (shape) {
    for(var i=0; i<shape.data.length; i++) {
        var stone = shape.data[i] ;
        this.removeStone(stone.x, stone.y) ;
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

GameBoard.prototype.applyLog = function (log, from) {
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
            this.putStone(s.i, s.j, s.color, true) ;
            for(var fi in s.followup) {
                var f = s.followup[fi] ;
                if (f.type == GameLogEntry.FOLLOWUPTYPE_REMOVE) {
                    this.removeStone(f.i, f.j, true) ;
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

GameBoard.prototype.undo = function(trimLog) {
    this.board = new Array() ;
    this.numberOfRemovedStones = new Array() ;
    this.nextPlayerColor = 1 ;
    this.gameLog.undo(trimLog) ;
    this.applyLog(this.gameLog) ;
}

GameBoard.prototype.redo = function() {
    var last = this.gameLog.getLength() ;
    this.gameLog.redo() ;
    this.applyLog(this.gameLog, last) ;
}

GameBoard.prototype.gotoStep = function(i) {
    if(i==this.gameLog.logLength) return ;
    if(i<this.gameLog.logLength) {
        this.board = new Array() ;
        this.numberOfRemovedStones = new Array() ;
        this.nextPlayerColor = 1 ;
        this.gameLog.gotoEntry(i) ;
        this.applyLog(this.gameLog) ;
    }
    else {
        var last = this.gameLog.getLength() ;
        this.gameLog.gotoEntry(i) ;
        this.applyLog(this.gameLog, last) ;
    }
}

GameBoard.prototype.getNumberOfTotalSteps = function() {
    return this.gameLog.getTotalLength() ;
}

GameBoard.prototype.getNumberOfCurrentStep = function() {
    return this.gameLog.getLength() ;
}

// ----------------------------------------------------------
// ----- Class: GameBoardGeometry ---------------------------
// ----------------------------------------------------------

function GameBoardGeometry(firstX, incX, firstY, incY) {
    this.firstX = firstX ;
    this.incX = incX ;
    this.firstY = firstY ;
    this.incY = incY ;
}

GameBoardGeometry.prototype.getXforIndex = function(i) {
    return i*this.incX+this.firstX ;
}

GameBoardGeometry.prototype.getYforIndex = function(j) {
    return j*this.incY+this.firstY ;
}

GameBoardGeometry.prototype.getIndexForX = function(x) {
    var rv = (x - this.firstX) + this.incX/2 ;
    return Math.floor(rv/this.incX) ;
}

GameBoardGeometry.prototype.getIndexForY = function(y) {
    var rv = (y - this.firstY) + this.incY/2 ;
    return Math.floor(rv/this.incY) ;
}

// ----------------------------------------------------------
// ----- Class: GameStoneGeometry ---------------------------
// ----------------------------------------------------------

function GameStoneGeometry(width, height) {
    this.width = width ;
    this.height = height ;
}

// ----------------------------------------------------------
// ----- Class: SordedSet -----------------------------------
// ----------------------------------------------------------

function SortedSet(cmp) {
    this.comparator = cmp ;
    this.data = new Array() ;
}

SortedSet.prototype.findPosition = function (e) {
    if(this.data.length==0) return 0 ;
    
    var low = 0 ;
    var high = this.data.length ;
    var middle = Math.floor((low+high)/2) ;
    
    while(low<high) {
        var cmp = this.comparator(e, this.data[middle]) ;
        if(cmp==0) return middle ;
        else if(cmp<0) high = middle ;
        else low = middle+1;
        middle = Math.floor((low+high)/2) ;
    }
    return high ;
}

SortedSet.prototype.contains = function(e) {
    if(this.data.length == 0) return false ;
    
    var value = this.data[this.findPosition(e)] ;
    return e && value && (this.comparator(value, e)==0) ;
}

SortedSet.prototype.insert = function(e) {
    var pos = this.findPosition(e) ;
    
    // Already in set...
    if(pos<this.data.length && this.comparator(this.data[pos], e)==0) {
        return ;
    }
    
    this.data.splice(pos, 0, e) ;
}

SortedSet.prototype.remove = function(e) {
    var pos = this.findPosition(e) ;
    
    if(this.data.length>0 && this.comparator(this.data[pos], e)==0) {
        this.data.splice(pos, 1) ;
    }
}

SortedSet.prototype.insertAllElements = function(sm) {
    for(var i=0; i<sm.data.length; i++) {
        this.insert(sm.data[i]) ;
    }
}

SortedSet.prototype.isEmpty = function() {
    return this.data.length == 0;
}

SortedSet.prototype.pop = function() {
    return this.data.pop() ;
}

// ----------------------------------------------------------
// ----- Class: ThemeManager --------------------------------
// ----------------------------------------------------------

function ThemeManager(game, url) {
    this.game = game ;
    this.url  = url ;
}

ThemeManager.prototype.loadTheme = function() {
    // alert("ThemeManager.loadTheme") ;

    var self = this ;
    var params = {} ;
    var callback = function(obj) {
        self.onThemeUrlFetched(obj) ;
    }
    
    var fileUrl = this.url + "theme.xml" ;
    params[gadgets.io.RequestParameters.CONTENT_TYPE] = gadgets.io.ContentType.DOM ;
    gadgets.io.makeRequest(fileUrl, callback, params) ;
    
    // alert("after makeRequest: " + fileUrl + params) ;
}

ThemeManager.prototype.onThemeUrlFetched = function(obj) {
    if(typeof console != "undefined") {
        console.debug("Theme Manager Fetch:") ;
        console.debug(obj) ;
    }

    this.boardGeometry          = null ;
    this.boardSize              = null ;
    this.stoneGeometry          = null ;

    this.boardImageUrl          = this.url ;
    this.blackStoneImageUrl     = this.url ;
    this.whiteStoneImageUrl     = this.url ;
    this.blackLastStoneImageUrl = this.url ;
    this.whiteLastStoneImageUrl = this.url ;
    this.blackDeadStoneImageUrl = this.url ;
    this.whiteDeadStoneImageUrl = this.url ;
    this.blackTerritoryImageUrl = this.url ;
    this.whiteTerritoryImageUrl = this.url ;
    this.koImageUrl             = this.url ;

    // Get root element
    var theme = obj.data.getElementsByTagName("theme").item(0) ;
    
    // Iterate top level (either board or stone)
    var themeItems = theme.childNodes ;
    for(var i=0; i<themeItems.length; i++) {
        var item = themeItems.item(i) ;

        if(item.nodeName == "board") {
            this.processBoardItem(item) ;
        }
        if(item.nodeName == "stone") {
            this.processStoneItem(item) ;
        }
    }

    this.game.onThemeChange(this.boardImageUrl,
                    this.blackStoneImageUrl,
                    this.whiteStoneImageUrl,
                    this.blackLastStoneImageUrl,
                    this.whiteLastStoneImageUrl,
                    this.blackDeadStoneImageUrl,
                    this.whiteDeadStoneImageUrl,
                    this.blackTerritoryImageUrl,
                    this.whiteTerritoryImageUrl,
                    this.koImageUrl,
                    this.boardSize, 
                    this.boardGeometry,
                    this.stoneGeometry) ;
}

ThemeManager.prototype.processBoardItem = function(board) {

    for(var i=0; i<board.childNodes.length; i++) {
        var item = board.childNodes.item(i) ;

        if(item.nodeName=="size") {
            this.boardSize = parseInt(item.firstChild.nodeValue) ;
        } else if(item.nodeName=="image") {
            this.processBoardImageItem(item) ;
        }
    }  
}

ThemeManager.prototype.processBoardImageItem = function(image) {
    var lo = 0 ;
    var to = 0 ;
    var vg = 1 ;
    var hg = 1 ;
    
    for(var i=0; i<image.childNodes.length; i++) {
        var item = image.childNodes.item(i) ;
        if(item.nodeName == "url") {
            this.boardImageUrl += item.firstChild.nodeValue ;
        }
        else if(item.nodeName == "leftOffset") {
            lo = parseInt(item.firstChild.nodeValue) ;        
        }
        else if(item.nodeName == "topOffset") {
            to = parseInt(item.firstChild.nodeValue) ;        
        }
        else if(item.nodeName == "verticalGap") {
            vg = parseInt(item.firstChild.nodeValue) ;        
        }
        else if(item.nodeName == "horizontalGap") {
            hg = parseInt(item.firstChild.nodeValue) ;        
        }
    }

    this.boardGeometry = new GameBoardGeometry(lo, hg, to, vg) ;
}

ThemeManager.prototype.processStoneItem = function(stone) {
    var w = 1;
    var h = 1;
    
    for(var i=0; i<stone.childNodes.length; i++) {
        var item = stone.childNodes.item(i) ;
        if(item.nodeName == "width") {
            w = parseInt(item.firstChild.nodeValue) ;
        } 
        else if(item.nodeName == "height") {
            h = parseInt(item.firstChild.nodeValue) ;
        }
        else if(item.nodeName == "url") {
            var typeAttribute = item.getAttribute("type") ;
            if(typeAttribute=="1") {
                this.blackStoneImageUrl += item.firstChild.nodeValue ;
            }
            if(typeAttribute=="1-last") {
                this.blackLastStoneImageUrl += item.firstChild.nodeValue ;
            }
            if(typeAttribute=="1-dead") {
                this.blackDeadStoneImageUrl += item.firstChild.nodeValue ;
            }
            if(typeAttribute=="1-terr") {
                this.blackTerritoryImageUrl += item.firstChild.nodeValue ;
            }
            else if(typeAttribute=="2"){
                this.whiteStoneImageUrl += item.firstChild.nodeValue ;
            }
            else if(typeAttribute=="2-last"){
                this.whiteLastStoneImageUrl += item.firstChild.nodeValue ;
            }
            else if(typeAttribute=="2-dead"){
                this.whiteDeadStoneImageUrl += item.firstChild.nodeValue ;
            }
            if(typeAttribute=="2-terr") {
                this.whiteTerritoryImageUrl += item.firstChild.nodeValue ;
            }
            if(typeAttribute=="ko") {
                this.koImageUrl += item.firstChild.nodeValue ;
            }
        }
    }
    
    this.stoneGeometry = new GameStoneGeometry(w, h) ;
}

// ----------------------------------------------------------
// ----- Class: DummyThemeManager ---------------------------
// ----------------------------------------------------------

function DummyThemeManager(game, url) {
    var prefix = "themes/basic-theme/" ;
    game.onThemeChange(prefix+"board.png",
                       prefix+"black.png",
                       prefix+"white.png",
                       prefix+"black-last.png",
                       prefix+"white-last.png",
                       19,
                       new GameBoardGeometry(20, 32, 20, 32),
                       new GameStoneGeometry(24, 24)) ;
}

// ----------------------------------------------------------
// ----- Class: SGFParser -----------------------------------
// ----------------------------------------------------------

function SGFParser(str, game) {
    this.str   = str;
    this.game  = game;
    this.propertyName  = "";
    this.propertyValue = "";
}

SGFParser.prototype.parse = function() {
    this.game.reset();
    if (!this.consumeWhiteSpaces()) {
        alert("Unexpected end of file");
        return;
    }
    if (this.str.charAt(0)!='('){
        alert("Non-expected character: '"+this.str.charAt(0)+"'. Expected: '('");
        return;
    }
    this.str = this.str.slice(1);

    while(this.parseProperty()){
        if (this.propertyName=="B"){
            if (this.propertyValue.length==0) {
                this.game.gameBoard.pass(1);
            } else if (this.propertyValue.length!=2) {
                alert("Non-expected property-value: '"+this.propertyValue+"'.");
                return;
            } else {
                var i=this.propertyValue.charCodeAt(0)-97;
                var j=this.propertyValue.charCodeAt(1)-97;
                if (i>19 || j>19 || i<0 || j<0) {
                    alert("Non-expected property-value: '"+this.propertyValue+"'.");
                    return;
                }
                this.game.gameBoard.makeMove(i,j,1);
            }
        } else if (this.propertyName=="W"){
            if (this.propertyValue.length==0) {
                this.game.gameBoard.pass(2);
            } else if (this.propertyValue.length!=2) {
                alert("Non-expected property-value: '"+this.propertyValue+"'.");
                return;
            } else {
                var i=this.propertyValue.charCodeAt(0)-97;
                var j=this.propertyValue.charCodeAt(1)-97;
                if (i>19 || j>19 || i<0 || j<0) {
                    alert("Non-expected property-value: '"+this.propertyValue+"'.");
                    return;
                }
                this.game.gameBoard.makeMove(i,j,2);
            }
        }
    }
}

SGFParser.prototype.parseProperty = function(){
    var ok = true;
    ok = this.consumeWhiteSpaces();
    while(ok){
        if (this.str.charAt(0)=='(') {
            this.str = this.str.slice(1);
        }
        else if (this.str.charAt(0)==';') {
            this.str = this.str.slice(1);
        }
        else if (this.str.charAt(0)==')') {
            ok = false;
            break;
        }
        else {
            ok = this.parsePropertyName();
            if (!ok) break;
            ok = this.consumeWhiteSpaces();
            if (!ok) break;
            ok = this.parsePropertyValue();
            break;
        }
        ok = this.consumeWhiteSpaces();
    }
    return ok;
}

SGFParser.prototype.parsePropertyName = function(){
    this.propertyName = "";
    while(this.str.length>0 && this.str.charAt(0)!='['){
        this.propertyName+=this.str.charAt(0);
        this.str = this.str.slice(1);
    }
    if (this.str.length==0) {
        return false;
    }
    else { //str[0]=='['
        this.str = this.str.slice(1);
        return true;
    }
}

SGFParser.prototype.parsePropertyValue = function(){
    this.propertyValue = "";
    while(this.str.length>0 && this.str.charAt(0)!=']'){
        this.propertyValue+=this.str.charAt(0);
        this.str = this.str.slice(1);
    }
    if (this.str.length==0) {
        return false;
    }
    else { //str[0]==']'
        this.str = this.str.slice(1);
        return true;
    }
}

SGFParser.prototype.consumeWhiteSpaces = function(){
    while (this.str.length>0 && 
        (this.str.charAt(0)==" " || this.str.charAt(0)=="\n" || this.str.charAt(0)=="\t")) {
        this.str = this.str.slice(1);
    }
    return this.str.length>0;
}


function serialize(_obj)
{
    if(_obj==null) return "";
   // Let Gecko browsers do this the easy way
    if (typeof _obj.toSource !== 'undefined' && typeof _obj.callee === 'undefined') {
        return _obj.toSource();
    }

    // Other browsers must do it the hard way
    switch (typeof _obj) {
        // numbers, booleans, and functions are trivial:
        // just return the object itself since its default .toString()
        // gives us exactly what we want
        case 'number':
        case 'boolean':
        case 'function':
            return _obj;
            break;

        // for JSON format, strings need to be wrapped in quotes
        case 'string':
            return '\'' + _obj + '\'';
            break;

        case 'object':
            var str;
            if (_obj.constructor === Array || typeof _obj.callee !== 'undefined') {
                str = '[';
                var i, len = _obj.length;
                for (i = 0; i < len-1; i++) { str += serialize(_obj[i]) + ','; }
                str += serialize(_obj[i]) + ']';
            }
            else {
                str = '{';
                var key;
                for (key in _obj) { str += key + ':' + serialize(_obj[key]) + ','; }
                str = str.replace(/\,$/, '') + '}';
            }
            return str;
            break;

        default:
            return 'UNKNOWN';
            break;
    }
}

function LogViewController(parent) {
    this.log = null ;
    this.div = null ;
    this.parent = parent ;
}

LogViewController.prototype.setLog = function(log) {
    this.log = log ;
}

LogViewController.prototype.resetUI = function() {
    if(this.div) {
        this.parent.removeChild(this.div) ;
    }
    
    this.div = document.createElement("DIV");
    var table = document.createElement("TABLE") ;
    var tbody = document.createElement("TBODY") ;
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
    
    var log = this.board_.gameLog.log ;
    var c ;
    var a, b ;
    for(var i=0; i<log.length; i++) {
        var entry = log[i] ;
        switch(entry.type) {
            case GameLogEntry.TYPE_PASS:
                c = '<' ;
                if(entry.color == 2) c = '>' ;
                l.log += c ;
                break ;
            case GameLogEntry.TYPE_PUT:
                c = '{' ;
                if(entry.color == 2) c = '}' ;
                l.log += c ;
                l.log += SimpleSerializer.indexToCode[entry.i] ;
                l.log += SimpleSerializer.indexToCode[entry.j] ;
                break ;
            case GameLogEntry.TYPE_REMOVE:
                c = '[' ;
                if(entry.color == 2) c = ']' ;
                l.log += c ;
                l.log += SimpleSerializer.indexToCode[entry.i] ;
                l.log += SimpleSerializer.indexToCode[entry.j] ;
                break ;
            case GameLogEntry.TYPE_SET:
                c = '(' ;
                if(entry.color == 2) c = ')' ;
                l.log += c ;
                l.log += SimpleSerializer.indexToCode[entry.i] ;
                l.log += SimpleSerializer.indexToCode[entry.j] ;
                break ;
        }
        
        if(entry.followup) {
            for(var j=0; j<entry.followup.length; j++) {
	    	l.log += SimpleSerializer.indexToCode[entry.followup[j].type];
                l.log += SimpleSerializer.indexToCode[entry.followup[j].i] ;
                l.log += SimpleSerializer.indexToCode[entry.followup[j].j] ;
            }
        }
    }
    
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
    var index = 0;
    var l = d.gameLog ;
    var c = l.log[index++] ;
    while(index<=l.log.length) {
        var i, j, color, type ;
        if(c == '<' || c == '>') {
            type = GameLogEntry.TYPE_PASS ;
            color = 1 ;
            if(c=='>') color = 2 ;
            c = l.log[index++] ;
        }
        else if(c == '{' || c == '}') {
            type = GameLogEntry.TYPE_PUT ;
            color = 1 ;
            if(c=='}') color = 2 ;
            c = l.log[index++] ;
            i = SimpleParser.codeToIndex[c] ;
            c = l.log[index++] ;
            j = SimpleParser.codeToIndex[c] ;
            c = l.log[index++] ;
        }
        else if(c == '[' || c == ']') {
            type = GameLogEntry.TYPE_REMOVE ;
            color = 1 ;
            if(c==']') color = 2 ;
            c = l.log[index++] ;
            i = SimpleParser.codeToIndex[c] ;
            c = l.log[index++] ;
            j = SimpleParser.codeToIndex[c] ;
            c = l.log[index++] ;
        }
        else if(c == '(' || c == ')') {
            type = GameLogEntry.TYPE_SET ;
            color = 1 ;
            if(c==')') color = 2 ;
            c = l.log[index++] ;
            i = SimpleParser.codeToIndex[c] ;
            c = l.log[index++] ;
            j = SimpleParser.codeToIndex[c] ;
            c = l.log[index++] ;
        }
        
        log.addEntry(type, i, j, color) ;
                
        while(index<=l.log.length &&
              c!='<' &&
              c!='>' &&
              c!='{' &&
              c!='}' &&
              c!='[' &&
              c!=']' &&
              c!='(' &&
              c!=')') {
   	    type = SimpleParser.codeToIndex[c] ;
            c = l.log[index++] ;
            i = SimpleParser.codeToIndex[c] ;
            c = l.log[index++] ;
            j = SimpleParser.codeToIndex[c] ;
            c = l.log[index++] ;
            
            log.addFollowup(type, i, j) ;
        }
    }
    
    log.logLength = l.logLength ;
    gameBoard.applyLog(log) ;
    gameBoard.nextPlayerColor = d.nextPlayerColor ;
    
    return gameBoard ;
}

function GameMode() {
}

GameMode.serialize = function(mode) {
    var gameModeData = {mode: mode.getMode(), data: mode.getData()};
    var str = wave.util.printJson(gameModeData) ;
    return str ;
}

GameMode.construct = function(str) {
    var gameModeData = eval('('+str+')') ;
    var gameMode = eval('new '+gameModeData.mode+'(gameModeData.data)') ;
    return gameMode ;
}

function SimpleGameMode(pmap) {
    pmap = pmap || {} ;
    var uidArr = pmap.uids || [] ;
    var colorArr = pmap.colors || [] ;
    
    this.participantMap_ = {} ;
    for(var i=0; i<uidArr.length; i++) {
        var uid = uidArr[i] ;
        var color = colorArr[i] ;
        this.participantMap_[uid] = color ;
    }
}

SimpleGameMode.prototype.getMode = function() {
    return "SimpleGameMode" ;
}

SimpleGameMode.prototype.getData = function() {
    var uidArr = [] ;
    var colorArr = [] ;
    for(var i in this.participantMap_) {
        uidArr.push(i) ;
        colorArr.push(this.participantMap_[i]) ;
    }
    return {uids: uidArr, colors: colorArr} ;
}

SimpleGameMode.prototype.setPlayerColor = function(participantId, color) {    
    if(!color) delete this.participantMap_[participantId] ;
    else this.participantMap_[participantId] = color ;
}

SimpleGameMode.prototype.getPlayerColor = function(participantId) {
    var color = this.participantMap_[participantId] ;
    if(color) {
        return color ;
    }
    return this.participantMap_["*"] ;
}

SimpleGameMode.prototype.isParticipantTurn = function(participantId, color) {
    var playerColor = this.getPlayerColor(participantId) ;
    if(playerColor == color) return true ;
    if(playerColor == "*") return true ;
    
    return false ;
}
