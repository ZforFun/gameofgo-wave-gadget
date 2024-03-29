// -----------------------------------------------------------------------------
// ----- Class: Game -----------------------------------------------------------
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// ----- Class: Game -----------------------------------------------------------
// ----- Constructor -----------------------------------------------------------

function Game(div, themeUrl) {
    this.div = div ;
    this.state = 0 ; 
}

// -----------------------------------------------------------------------------
// ----- Class: Game -----------------------------------------------------------
// ----- Constants -------------------------------------------------------------

Game.STATE_INITIAL = 0 ;
Game.STATE_THEME_LOADED = 1 ;
Game.STATE_WAVE_STATE_LOADED = 2 ;

// -----------------------------------------------------------------------------
// ----- Class: Game -----------------------------------------------------------
// ----- Public Methods --------------------------------------------------------

Game.prototype.initiateChangeTheme = function (themeUrl, size) {
    this.newSize = size;
    if (!themeUrl && this.themeManager) themeUrl = this.themeManager.urlBase;

    if (this.themeManager && this.themeManager.urlBase == this.themeManager.getUrlBase(themeUrl)) {
        if (this.gameBoard && this.gameBoard.boardSize != size) {
            this._onSizeChange(size);
        }
    } else {
        this.themeManager = new ThemeManager(this, themeUrl) ;
        this.themeManager.loadTheme() ;
    }
}

Game.prototype.newSimpleGame = function() {
    // New game...
    this.participantFilter = new ParticipantFilter() ;
    // ... the one who added the gadget plays black
    this.participantFilter.setPlayerColor(wave.getHost().getId(), '1') ;
    // ... and all other players are white
    this.participantFilter.setPlayerColor("*", '2') ;

    // Make sure the board is clear, and state is saved to the Wave...
    this._reset() ;
    this._saveStateToWave() ;
}

Game.prototype.newAllPlayersCanPlayGame = function() {
    this.participantFilter = new ParticipantFilter() ;
    this.participantFilter.setPlayerColor("*", "*") ;
    
    // Make sure the board is clear, and state is saved to the Wave...
    this._reset() ;
    this._saveStateToWave() ;
}

Game.prototype.openParticipantFilterUI = function() {
    var self = this ;
    if(!this.participantFilter) {
        this.participantFilter = new ParticipantFilter() ;
    }
    if(!this.participantController) {
        this.participantController = new ParticipantController(this, this.div) ;
    }
    this.participantController.resetUI() ;
    this.participantController.setCloseCallback(function(cancel) {
        self._onParticipantFilterChange(cancel) ;
    }) ;
    this.participantController.loadModelData() ;
    this.participantController.setVisible(true) ;
}

Game.prototype.onClickOnBoardImg = function(event) {

    if(this.state != (Game.STATE_THEME_LOADED | Game.STATE_WAVE_STATE_LOADED))
        return ;

    var x, y ;

    if(event.offsetX && event.offsetY) {
        x = event.offsetX ;
        y = event.offsetY ;
    } else {
        var offsetLeft = 0 ;
        var offsetTop = 0 ;
        var obj = this.boardImage ;

        if(obj.offsetParent) {
            do {
                offsetLeft += obj.offsetLeft ;
                offsetTop += obj.offsetTop ;
            } while( obj=obj.offsetParent ) ;
        }

        x = event.pageX - offsetLeft ;
        y = event.pageY - offsetTop ;
    }

    var i, j ;

    i = this.boardGeometry.getIndexForX(x) ;
    j = this.boardGeometry.getIndexForY(y) ;
    
    this._onClick(i,j);

}

Game.prototype.onClickOnStoneImg = function(event,i,j) {
    this._onClick(i,j);
}

Game.prototype.undo = function(trimLog) {
    this.gameBoard.undo(trimLog) ;
    this._renderBoardAbstract();
}

Game.prototype.redo = function() {
    this.gameBoard.redo() ;
    this._renderBoardAbstract();
}

Game.prototype.pass = function() {
    if(!this.participantFilter) return ;

    if(!this.participantFilter.isColorOfParticipant(wave.getViewer().getId(),
                                                 this.gameBoard.nextPlayerColor)) {
        return ;
    }

    this.gameBoard.pass(this.gameBoard.nextPlayerColor) ;
    this._renderBoardAbstract();
}

Game.prototype.result = function() {
    var str = this.gameBoard.result();
    alert(str);
}

Game.prototype.gotoStep = function(i) {
    this.gameBoard.gotoStep(i) ;
    this._renderBoardAbstract();
}

Game.prototype.gotoFirstStep = function () {
    this.gotoStep(0) ;
}

Game.prototype.gotoLastStep = function () {
    this.gotoStep(this.gameBoard.getNumberOfTotalSteps()) ;
}

Game.prototype.exportToSGF = function() {
    var exporter = new SGFExporter(this);
    return exporter.export();
}

Game.prototype.importFromSGF = function(strSGF) {
    var parser = new SGFParser(strSGF,this);
    parser.parse();  
    this._renderBoardAbstract();
}

Game.prototype.onWaveStateChange = function() {
    this.state |= Game.STATE_WAVE_STATE_LOADED;

    if(this.state == (Game.STATE_THEME_LOADED | Game.STATE_WAVE_STATE_LOADED)) {
        this._restoreStateFromWave();
        this._setWaitAnimation(false);
        this._renderBoard() ;
    }
}

// -----------------------------------------------------------------------------
// ----- Class: Game -----------------------------------------------------------
// ----- Private Methods -------------------------------------------------------


Game.prototype._reset = function () {
    this.gameBoard = new GameBoard(this.boardSize) ;
}

Game.prototype._onSizeChange = function(size) {
    this._initGameBoard() ;
    this._resetBoardUI() ;
    if(this.state == (Game.STATE_THEME_LOADED | Game.STATE_WAVE_STATE_LOADED)) {
        this._restoreStateFromWave( /*noAudio=*/ true);
        this._setWaitAnimation(false);
        this._renderBoard() ;
    }
}

Game.prototype._onThemeChange = function(themeUrl, boardImageUrls,
                                         blackStoneImageUrl, whiteStoneImageUrl,
                                         blackLastStoneImageUrl, whiteLastStoneImageUrl,
                                         blackDeadStoneImageUrl, whiteDeadStoneImageUrl,
                                         blackTerritoryImageUrl, whiteTerritoryImageUrl,
                                         koImageUrl, neutralImageUrl, boardGeometry, stoneGeometry,
                                         boardChangeAudioNotificationUrls) {

    this.boardImageUrls         = boardImageUrls;
    this.blackStoneImageUrl     = blackStoneImageUrl ;
    this.whiteStoneImageUrl     = whiteStoneImageUrl ;
    this.blackLastStoneImageUrl = blackLastStoneImageUrl ;
    this.whiteLastStoneImageUrl = whiteLastStoneImageUrl ;
    this.blackDeadStoneImageUrl = blackDeadStoneImageUrl ;
    this.whiteDeadStoneImageUrl = whiteDeadStoneImageUrl ;
    this.blackTerritoryImageUrl = blackTerritoryImageUrl ;
    this.whiteTerritoryImageUrl = whiteTerritoryImageUrl ;
    this.koImageUrl             = koImageUrl ;
    this.neutralImageUrl        = neutralImageUrl ;
    this.boardGeometry = boardGeometry ;
    this.stoneGeometry = stoneGeometry ;

    this.boardChangedAudioNotificationPlayer =
        new AudioNotificationPlayer(boardChangeAudioNotificationUrls) ;
    this.boardChangedAudioNotificationPlayer.load() ;

    var themeUrlFromPref = prefs.getString('themeUrl') ;
    if(themeUrlFromPref != themeUrl) {
        prefs.set('themeUrl', themeUrl) ;
        MessageManager.getInstance().createTimerMessage("Default theme changed to "+themeUrl, 5) ;
    }

    this.state |= Game.STATE_THEME_LOADED  ;

    this._onSizeChange();
}

Game.prototype._initGameBoard = function(){
    if (!this.gameBoard) {
        if (!this.newSize) {
            this.boardSize = 19;
        } else {
            this.boardSize = this.newSize;
        }
        this.gameBoard = new GameBoard(this.boardSize);
    }
    this._restoreStateFromWave(/*noAudio=*/ true);
    if (this.gameBoard) this.boardSize = this.gameBoard.boardSize;

    if (this.newSize && this.boardSize != this.newSize) {
        if (this.gameBoard.gameLog.log.length != 0) {
            MessageManager.getInstance().createTimerMessage("Changing to a theme with different board-size is allowed only if there were no moves yet.", 5) ;
        } else {
            this.boardSize = this.newSize;
            this.gameBoard = new GameBoard(this.boardSize);
            this._saveStateToWave() ;
        }
    }

    if (!this.newSize) {
        this.newSize = this.gameBoard.boardSize;
    }
}


Game.prototype._onParticipantFilterChange = function(cancel) {
    this.participantController.setVisible(false) ;
    if(!cancel) {
        var participantFilter = this.participantController.getParticipantFilter() ;
        this._setParticipantFilter(participantFilter) ;
    }
}

Game.prototype._setParticipantFilter = function(participantFilter) {
    this.participantFilter = participantFilter ;
    this._saveStateToWave() ;
}

Game.prototype._resetBoardUI = function() {
    var i, j ;

    //setting the right board-image
    this.boardImageUrl = this.boardImageUrls[this.gameBoard.boardSize];

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
    this._registerOnClickBoardImg() ;

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
            this._registerOnClickStoneImg(i,j);
        }
    }
}

Game.prototype._registerOnClickBoardImg = function() {
    var self = this ;
    this.boardImage.onclick = function (event) {
        self.onClickOnBoardImg(event) ;
    }
}

Game.prototype._registerOnClickStoneImg = function(i, j) {
    var self = this ;
    var img = this.stoneImages[i*this.boardSize+j];
    img.onclick = function (event) {
        self.onClickOnStoneImg(event,i,j) ;
    };
}

Game.prototype._renderBoard = function() {
    var i, j ;
    for(i=0 ; i<this.boardSize; i++) {
        for(j=0; j<this.boardSize; j++) {
            var color = this.gameBoard.getField(i, j) ;
            var last  = this.gameBoard.isLast(i, j) ;
            var ko    = false ;
            if (this.gameBoard.ko.ko && this.gameBoard.ko.i == i && this.gameBoard.ko.j == j ) {
                ko = true;
            }
            this._setStone(i, j, color, last, ko) ;
        }
    }
}

Game.prototype._onClick = function(i, j) {

    if(i>=this.boardSize || j>=this.boardSize || i<0 || j<0) {
        return ;
    }

    if(!this.participantFilter) return ;
    if (this.gameBoard.mode == GameBoard.MODE_NORMAL && this.gameBoard.phase == GameBoard.PHASE_NORMAL_PLAYING) {
        if(!this.participantFilter.isColorOfParticipant(wave.getViewer().getId(),
                                                     this.gameBoard.nextPlayerColor)) {
            return ;
        }
    } else if (this.gameBoard.mode == GameBoard.MODE_NORMAL && this.gameBoard.phase == GameBoard.PHASE_NORMAL_SCORING) {
        if(!this.participantFilter.isColorOfParticipant(wave.getViewer().getId(), GameBoardStone.COLOR_BLACK_STONE) &&
           !this.participantFilter.isColorOfParticipant(wave.getViewer().getId(), GameBoardStone.COLOR_WHITE_STONE)) {
            return ;
        }
    }

    this.gameBoard.onClick(i, j, this.gameBoard.nextPlayerColor) ;
    this._renderBoardAbstract();
}

Game.prototype._setStone = function(i, j, color, last, ko) {
    var x, y ;
    var visibility ;
    var src ;
    var im = this.stoneImages[i*this.boardSize+j] ;

    if (!color) {
        color = GameBoardStone.COLOR_EMPTY;
    }
/*
    if (color == GameBoardStone.COLOR_NEUTRAL) {
        color = GameBoardStone.COLOR_EMPTY;
    }
*/
    if (color != GameBoardStone.COLOR_EMPTY) {
        if (color == GameBoardStone.COLOR_BLACK_STONE) {
            if (!last) {
              src = this.blackStoneImageUrl ;
            } else {
              src = this.blackLastStoneImageUrl ;
            }
        } else if (color == GameBoardStone.COLOR_WHITE_STONE) {
            if (!last) {
              src = this.whiteStoneImageUrl ;
            } else {
              src = this.whiteLastStoneImageUrl ;
            }
        } else if (color == GameBoardStone.COLOR_DEAD_BLACK_STONE) {
              src = this.blackDeadStoneImageUrl ;
        } else if (color == GameBoardStone.COLOR_DEAD_WHITE_STONE) {
              src = this.whiteDeadStoneImageUrl ;
        } else if (color == GameBoardStone.COLOR_BLACK_TERRITORY) {
              src = this.blackTerritoryImageUrl ;
        } else if (color == GameBoardStone.COLOR_WHITE_TERRITORY) {
              src = this.whiteTerritoryImageUrl ;
        } else if (color == GameBoardStone.COLOR_NEUTRAL) {
              src = this.neutralImageUrl ;
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

Game.prototype._renderBoardAbstract = function() {
    if(this._isInWave()) {
        var saveSuccessful = this._saveStateToWave() ;
        if(saveSuccessful) {
            this._setWaitAnimation(true) ;
        }
    } else {
        this._renderBoard() ;
    }
}

Game.prototype._saveStateToWave = function() {
    var delta = {} ;
    var change = false ;

    if(typeof wave == 'undefined') return change;
    
    // Transmit board

    var s = new SimpleSerializer(this.gameBoard) ;
    var newBoard = s.serialize() ;
    var oldBoard = wave.getState().get('gameBoard') ;
    if(newBoard != oldBoard) {
        delta['gameBoard'] = newBoard ;
        change = true ;
    }
    
    if(this.participantFilter) {
        var newParticipantFilter = Serializer.serialize(this.participantFilter) ;
        var oldParticipantFilter = wave.getState().get('participantFilter') ;
        if(newParticipantFilter != oldParticipantFilter) {
            delta['participantFilter'] = newParticipantFilter ;
            change = true ;
        }
    }

    if(change) {
        wave.getState().submitDelta(delta) ;
    }
    
    return change;
}

Game.prototype._restoreStateFromWave = function(noAudio) {
    if(!wave) return ;

    var waveState = wave.getState();
    if (!waveState) return;

    var gameBoard = waveState.get('gameBoard') ;
    if(gameBoard) {
        var s = new SimpleSerializer(this.gameBoard) ;
        var oldBoard = s.serialize() ;
        var oldSize  = this.gameBoard.boardSize;

        var p = new SimpleParser(gameBoard) ;
        this.gameBoard = p.construct() ;

        if(oldBoard != gameBoard) {
            if (oldSize != this.gameBoard.boardSize) {
                this.boardSize = this.gameBoard.boardSize;
                this._resetBoardUI() ; //Somebody else changed the game-size (possilbe only when the game begins); TODO: What if theme also changed???
            }
            if (!noAudio) {
                this.boardChangedAudioNotificationPlayer.play() ;
            }
        }
    }

    var participantFilter = wave.getState().get('participantFilter') ;
    if(participantFilter) {
        this.participantFilter = Serializer.construct(participantFilter) ;
    }
}

Game.prototype._setWaitAnimation = function(on) {
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

Game.prototype._isInWave = function() {
    return typeof wave != "undefined" ;
}

