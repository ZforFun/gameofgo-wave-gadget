// ----------------------------------------------------------
// ----- Class: Game ----------------------------------------
// ----------------------------------------------------------

function Game(div, themeUrl) {
    this.div = div ;
}

Game.prototype.changeTheme = function (themeUrl) {
    this.themeManager = new ThemeManager(this, themeUrl) ;
    this.themeManager.loadTheme() ;
}

Game.prototype.initializeAppearance = function(boardImageUrl, 
                                               blackStoneImageUrl, whiteStoneImageUrl,
                                               blackLastStoneImageUrl, whiteLastStoneImageUrl,
                                               boardSize, 
                                               boardGeometry, stoneGeometry) {
    if(this.boardSize != boardSize) {
       this.boardSize = boardSize ;
       this.gameBoard = new GameBoard(boardSize) ;
       this.gameLog   = new GameLog() ;
    }

    this.boardImageUrl = boardImageUrl ;

    this.blackStoneImageUrl = blackStoneImageUrl ;
    this.whiteStoneImageUrl = whiteStoneImageUrl ;
    this.blackLastStoneImageUrl = blackLastStoneImageUrl ;
    this.whiteLastStoneImageUrl = whiteLastStoneImageUrl ;

    this.boardSize = boardSize ;
    this.boardGeometry = boardGeometry ;
    this.stoneGeometry = stoneGeometry ;

}

Game.prototype.onThemeChange = function(boardImageUrl, 
                                        blackStoneImageUrl, whiteStoneImageUrl,
                                        blackLastStoneImageUrl, whiteLastStoneImageUrl,
                                        boardSize, 
                                        boardGeometry, stoneGeometry) {
    this.initializeAppearance(boardImageUrl,
                              blackStoneImageUrl, whiteStoneImageUrl,
                              blackLastStoneImageUrl, whiteLastStoneImageUrl,
                              boardSize,
                              boardGeometry, stoneGeometry) ;
    this.resetBoard() ;
    this.renderBoard() ;
}

Game.prototype.resetBoard = function() {
    var i, j ;

    // Remove stones, and old background...
    if(this.div && this.stoneImages && this.stoneImages.length>0) {
        for(i=0; i<this.stoneImages.length; i++) {
            this.div.removeChild(this.stoneImages[i]) ;
        }
        this.div.removeChild(this.boardImage) ;
    }
    
    // Save new div, add background
    this.boardImage = document.createElement("IMG") ;
    this.boardImage.onload = function() {
      gadgets.window.adjustHeight();
    };
    this.boardImage.src = this.boardImageUrl ;
    this.registerOnClick() ;

    this.div.appendChild(this.boardImage) ;
    
    // Add stones
    this.stoneImages = Array() ;

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
            this.setStone(i, j, color, last) ;
        }
    }
}

Game.prototype.setStone = function(i, j, color, last) {
    var x, y ;
    var visibility ;
    var im = this.stoneImages[i*this.boardSize+j] ;

    if(color) {
        if(color == 1) {
            if (!last) {
              im.src = this.blackStoneImageUrl ;
            } else {
              im.src = this.blackLastStoneImageUrl ;
            }
        } else {
            if (!last) {
              im.src = this.whiteStoneImageUrl ;
            } else {
              im.src = this.whiteLastStoneImageUrl ;
            }
        }
        visibility = "visible" ;
    } else {
        visibility = "hidden" ;
    }
    im.style.visibility = visibility ;
    
}

Game.prototype.onClickOnBoard = function(event) {
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
    
    if(i>=this.boardSize || j>=this.boardSize) {
        return ;
    }

    this.gameBoard.setMove(i, j) ;
    this.renderBoard() ;
}

Game.prototype.undo = function() {
    this.gameBoard.undo() ;
    this.renderBoard() ;
}

Game.prototype.redo = function() {
    this.gameBoard.redo() ;
    this.renderBoard() ;
}

Game.prototype.pass = function() {
    this.gameBoard.pass() ;
    this.renderBoard() ;
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
    stone = this.gameBoard.gameLog.getStep(i);
    if (stone.color==1) strSGF+="B["; else strSGF+="W[";
    strSGF+=String.fromCharCode(97+stone.x);
    strSGF+=String.fromCharCode(97+stone.y);
    strSGF+="]";
  }

  strSGF += "\n)";
  return strSGF;
}

Game.prototype.importFromSGF = function(strSGF) {
  var parser = new SGFParser(strSGF,this);
  parser.parse();
  this.renderBoard();
}

Game.prototype.saveStateToWave = function() {
    if(!wave) return ;
    
    var saved = this.gameBoard.toSource() ;
        
    wave.getState().submitDelta({'gameBoard': saved}) ;
}

Game.prototype.restoreStateFromWave = function() {
    if(!wave) return ;
    
    var saved = wave.getState().get('gameBoard') ;
    if(!saved) return ;

    var arr = null ;
    eval("arr = "+saved) ;
    
    this.gameBoard = GameBoard.restoreFromUnstructuredData(arr) ;
}

Game.prototype.restoreState


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
        rv.log[i] = new GameBoardStone(data.log[i].x, data.log[i].y, data.log[i].color) ;
    }
    
    return rv ;
}

GameLog.prototype.addStep = function(i, j, color) {
    this._addStep(new GameBoardStone(i, j, color)) ;
}

GameLog.prototype.pass = function() {
    var lastStep = this.lastStep() ;
    var color = 1 ;
    if(lastStep && lastStep.color == 1) {
        color = 2 ;
    }
    this._addStep(GameBoardStone.newPassStone(color)) ;
}

GameLog.prototype.undo = function() {
    var success = false ;
    if(this.logLength) {
        this.logLength -= 1 ;
        success = true ;
    }

    return success ;
}

GameLog.prototype.redo = function() {
    var rv = null ;
    if(this.logLength<this.log.length) {
        rv = this.getStep(this.logLength) ;
        this.logLength += 1 ;
    }

    return rv ;
}

GameLog.prototype._addStep = function(stone) {
    this.log.length = this.logLength ;
    this.log[this.logLength] = stone ;
    this.logLength = this.log.length ;
}

GameLog.prototype.getStep = function(index) {
    return this.log[index] ;
}

GameLog.prototype.lastStep = function() {
    var rv = null ;
    if(this.logLength>0) {
        rv = this.log[this.logLength-1] ;
    }
    return rv ;
}

GameLog.prototype.isLast = function(x, y){
  var lastStep = this.lastStep();
  if (!lastStep) {
    return false;
  } else {
    if (lastStep.x==x && lastStep.y==y) return true; else return false;
  }
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
}

GameBoard.restoreFromUnstructuredData = function(data) {
    var rv = new GameBoard(0) ;
    rv.board = data.board ;
    rv.boardSize = data.boardSize ;
    rv.gameLog = GameLog.restoreFromUnstructuredData(data.gameLog) ;

    return rv ;
}

GameBoard.prototype.serializeToString = function() {
    return this.toSource()
}

GameBoard.prototype.setMove = function (x, y, color) {
    var moveAllowed = false ;
    // Determine the other color and other color
    if(color == null) {
        color = 1 ;
        var lastLogStep = this.gameLog.lastStep() ;
        if(lastLogStep && lastLogStep.color == 1) {
            color = 2 ;
        }
    }

    moveAllowed = this.tryToApplyStepToBoard(x, y, color);

    if(moveAllowed)
        this.gameLog.addStep(x, y, color) ;

    return moveAllowed ;
}

GameBoard.prototype.tryToApplyStepToBoard = function(x, y, color) {
    var field = this.board[x*this.boardSize+y] ;

    // If field is occupied, this is an invalid move...
    if(field) return false ;
        
    var otherColor = 1;
    if(color == 1) otherColor = 2 ;
    
    // Check if this move removes anything:
    var neighbours  = this.getNeighbours(x, y, otherColor) ;
    var moveAllowed = false ;
    
    while(!neighbours.isEmpty()) {
        var neighbour = neighbours.pop() ;
        
        if(neighbour.color != otherColor) continue ;
        
        var shape = new SortedSet(gameBoardStoneComparator) ;
        var lives = new SortedSet(gameBoardStoneComparator) ;
            
        this.walkShape(neighbour.x, neighbour.y, shape, lives) ;
        // There is a shape, and it has only one life (the one we are placing on)
        if(shape.data.length > 0 && lives.data.length <=1) {
            this.removeShape(shape) ;
            moveAllowed = true ;
        }
    }
    
    this.board[x*this.boardSize+y] = color ;
    
    if(!moveAllowed) {
        var shape = new SortedSet(gameBoardStoneComparator) ;
        var lives = new SortedSet(gameBoardStoneComparator) ;
        this.walkShape(x, y, shape, lives) ;
        if(lives.data.length>=1) {
            moveAllowed = true ;
        }
    }

    if(!moveAllowed) {
        this.board[x*this.boardSize+y] = null ;
    }
    
    return moveAllowed ;
}

GameBoard.prototype.pass = function(color) {
//TODO: Using color in a similar way as in the method setMove
    this.gameLog.pass() ;
}

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

GameBoard.prototype.removeShape = function (shape) {
    for(var i=0; i<shape.data.length; i++) {
        var stone = shape.data[i] ;
        this.board[stone.x*this.boardSize+stone.y] = null ; 
    }
} 

GameBoard.prototype.getField = function (x, y) {
    return this.board[x*this.boardSize+y] ;
}

GameBoard.prototype.isLast = function (x, y) {
    return this.gameLog.isLast(x, y);
}

GameBoard.prototype.applyLog = function (log) {
    var len = log.getLength() ;
    var i ;

    for(i=0; i<len; i++) {
        var s = log.getStep(i) ;
        this.tryToApplyStepToBoard(s.x, s.y, s.color) ;
    }
    
    this.gameLog = log ;
}

GameBoard.prototype.reset = function() {
    this.board = new Array() ;
    this.gameLog = new GameLog() ;
}

GameBoard.prototype.undo = function() {
    var log = this.gameLog.clone() ;
    this.reset() ;
    log.undo() ;
    this.applyLog(log) ;
}

GameBoard.prototype.redo = function() {
    var redone = this.gameLog.redo() ;
    if(redone) {
        this.tryToApplyStepToBoard(redone.x, redone.y, redone.color) ;
    }
}

// ----------------------------------------------------------
// ----- Class: GameBoardGeometry ---------------------------
// ----------------------------------------------------------

function GameBoardGeometry(firstX, incX, firstY, incY) {
    this.firstX = firstX ;
    this.incX = incX ;
    this.firstY = firstY ;
    this.incY = incY ;

alert(""+this.firstX+","+this.firstY+"; "+this.incX+","+this.incY);    
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
    this.boardGeometry = null ;
    this.boardImageUrl = this.url ;
    this.blackStoneImageUrl = this.url ;
    this.whiteStoneImageUrl = this.url ;
    this.blackLastStoneImageUrl = this.url ;
    this.whiteLastStoneImageUrl = this.url ;
    this.boardSize = null ;
    this.stoneGeometry = null ;

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
            else if(typeAttribute=="2"){
                this.whiteStoneImageUrl += item.firstChild.nodeValue ;
            }
            else if(typeAttribute=="2-last"){
                this.whiteLastStoneImageUrl += item.firstChild.nodeValue ;
            }
        }
    }
    
    this.stoneGeometry = new GameStoneGeometry(w, h) ;
}

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

function SGFParser(str, game) {
    this.str   = str;
    this.game  = game;
    this.propertyName  = "";
    this.propertyValue = "";
}

SGFParser.prototype.parse = function() {
  this.game.resetBoard();
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
        this.game.gameBoard.setMove(i,j,1);
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
        this.game.gameBoard.setMove(i,j,2);
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
    } else if (this.str.charAt(0)==';') {
      this.str = this.str.slice(1);
    } else if (this.str.charAt(0)==')') {
      ok = false;
      break;
    } else {
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
  } else { //str[0]=='['
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
  } else { //str[0]==']'
    this.str = this.str.slice(1);
    return true;
  }
}

SGFParser.prototype.consumeWhiteSpaces = function(){
  while (this.str.length>0 && (this.str.charAt(0)==" " || this.str.charAt(0)=="\n" || this.str.charAt(0)=="\t")) {
    this.str = this.str.slice(1);
  }
  return this.str.length>0;
}

