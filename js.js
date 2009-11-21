// ----------------------------------------------------------
// ----- Class: Game ----------------------------------------
// ----------------------------------------------------------

function Game(boardImageUrl, blackStoneImageUrl, whiteStoneImageUrl, boardSize, boardGeometry) {
    this.boardImageUrl = boardImageUrl ;
    this.boardImage = document.createElement("IMG") ;
    this.boardImage.src = this.boardImageUrl ;
    
    this.blackStoneImageUrl = blackStoneImageUrl ;
    this.whiteStoneImageUrl = whiteStoneImageUrl ;
    
    this.boardSize = boardSize ;
    this.boardGeometry = boardGeometry ;
    
    this.gameBoard = new GameBoard(boardSize) ;
    this.gameLog   = new GameLog() ;
}

Game.prototype.resetBoard = function(div) {
    var i, j ;
    
    // Remove stones, and old background...
    if(this.div && this.stoneImages && this.stoneImages.length>0) {
        for(i=0; i<this.stoneImages.length; i++) {
            this.div.removeChild(this.stoneImages[i]) ;
        }
        this.div.removeChild(this.boardImage) ;
    }
    
    // Save new div, add background
    this.div = div ;
    div.appendChild(this.boardImage) ;
    
    // Add stones
    this.stoneImages = Array() ;

    for(i=0; i<this.boardSize; i++) {
        for(j=0; j<this.boardSize; j++) {
            var im = document.createElement("IMG") ;
            im.src = this.blackStoneImageUrl ;
            var x, y ;
            x = Math.round(this.boardGeometry.getXforIndex(i) - im.width/2) ;
            y = Math.round(this.boardGeometry.getYforIndex(j) - im.height/2) ;
            
            this.stoneImages[i*this.boardSize+j] = im ;
            div.appendChild(im) ;
            im.style.position = "absolute" ;
            im.style.visibility = "hidden" ;
            im.style.left = x+"px" ;
            im.style.top = y+"px" ;
            
            // console.debug("Adding: "+i+", "+j+" -> "+im.style.left+", "+im.style.top) ;
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

            this.setStone(i, j, color) ;
        }
    }
}

Game.prototype.setStone = function(i, j, color) {
    var x, y ;
    var visibility ;
    var im = this.stoneImages[i*this.boardSize+j] ;
    
    if(color) {
        if(color == 1) {
            im.src = this.blackStoneImageUrl ;
        } else {
            im.src = this.whiteStoneImageUrl ;
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
        return
    }

    this.gameBoard.setMove(i, j) ;
    this.renderBoard() ;
}

Game.prototype.undo = function() {
	this.gameBoard.undo() ;
	this.renderBoard() ;
}

// ----------------------------------------------------------
// ----- Class: GameLog -------------------------------------
// ----------------------------------------------------------

function GameLog() {
    this.log = new Array() ;
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
	this.log.pop() ;
}

GameLog.prototype._addStep = function(stone) {
	this.log[this.log.length] = stone ;
}

GameLog.prototype.getStep = function(index) {
    return this.log[index] ;
}

GameLog.prototype.lastStep = function() {
    var rv = null ;
    if(this.log.length>0) {
        rv = this.log[this.log.length-1] ;
    }
    return rv ;
}

GameLog.prototype.clone = function() {
    var rv = new GameLog() ;
	
    if(this.log.length) {
        rv.log = this.log.slice(0) ;
    }
    
    return rv ;
}

GameLog.prototype.getLength = function() {
    return this.log.length ;
}

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

GameBoard.prototype.setMove = function (x, y, color) {
    var field = this.board[x*this.boardSize+y] ;

    // If field is occupied, this is an invalid move...
    if(field) return false ;
    
    // Determine the other color and other color
    if(color == null) {
        color = 1 ;
        var lastLogStep = this.gameLog.lastStep() ;
        if(lastLogStep && lastLogStep.color == 1) {
            color = 2 ;
        }
    }
    
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
    } else {
        this.gameLog.addStep(x, y, color) ;
    }
    
    return moveAllowed ;
}

GameBoard.prototype.pass = function() {
	this.gameLog.pass() ;
}

GameBoard.prototype.getNeighbours = function(x, y) {
    var rv = new SortedSet(gameBoardStoneComparator) ;
    
    var xx = x-1
    var yy = y ;
    var stone = this.getField(xx, yy);
    
    if(xx>=0)        
        rv.insert(new GameBoardStone(xx, yy, stone)) ;

    var xx = x+1
    var yy = y ;
    var stone = this.getField(xx, yy);
    
    if(xx<this.boardSize)        
        rv.insert(new GameBoardStone(xx, yy, stone)) ;

    var xx = x
    var yy = y-1 ;
    var stone = this.getField(xx, yy);
    
    if(yy>=0)        
        rv.insert(new GameBoardStone(xx, yy, stone)) ;

    var xx = x
    var yy = y+1 ;
    var stone = this.getField(xx, yy);
    
    if(yy<this.boardSize)        
        rv.insert(new GameBoardStone(xx, yy, stone)) ;
        
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

GameBoard.prototype.applyLog = function (log) {
    var len = log.getLength() ;
    var i ;

    for(i=0; i<len; i++) {
        var s = log.getStep(i) ;
        this.setMove(s.x, s.y, s.color) ;
    }
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
