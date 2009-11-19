function Game(boardImageUrl, blackStoneImageUrl, whiteStoneImageUrl, boardSize, boardGeometry) {
	this.boardImageUrl = boardImageUrl ;
	this.boardImage = document.createElement("IMG") ;
	this.boardImage.src = this.boardImageUrl ;
	
	this.blackStoneImageUrl = blackStoneImageUrl ;
	this.whiteStoneImageUrl = whiteStoneImageUrl ;
	
	this.boardSize = boardSize ;
	this.boardGeometry = boardGeometry ;
	
	console.debug(this.boardLeftOffset);

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

			if(color) {
				this.setStone(i, j, color) ;
			}
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

	var color = 1 ;
	var step = this.gameLog.lastStep() 
	if(step && step[2]==color) color = 2 ;

	this.gameLog.addStep(i, j, color) ;
	this.gameBoard.applyLog(this.gameLog) ;
	this.renderBoard() ;
}


function GameLog() {
	this.log = new Array() ;
}

GameLog.prototype.addStep = function(i, j, color) {
	this.log[this.log.length] = new Array(i, j, color) ;
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

GameLog.prototype.getLength = function() {
	return this.log.length ;
}

function GameBoard(size) {
	this.board = Array() ;
	this.size = size ;
}

GameBoard.prototype.setMove = function (x, y, color) {
	var field = this.board[x*this.size+y] ;
	console.debug("setMove", x, y, color, field) ;
	if(field) return false ;
	
	this.board[x*this.size+y] = color ;
	return true ;
}

GameBoard.prototype.getField = function (x, y) {
	return this.board[x*this.size+y] ;
}

GameBoard.prototype.applyLog = function (log) {
	var len = log.getLength() ;
	var i ;

	for(i=0; i<len; i++) {
		var s = log.getStep(i) ;
		this.setMove(s[0], s[1], s[2]) ;
	}
}

//-------------------------------------------------------------
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
