function AudioNotificationPlayer(soundFiles) {

    var probablyPlayable = "" ;
    var maybePlayable = "" ;
    for(var i=0; i<soundFiles.length; i++) {
        var a = new Audio() ;
        if(!a) return ;
        
        var type = soundFiles[i].type || "" ;
        var canPlayType = a.canPlayType(type) ;
        
        if(canPlayType == "probably" && probablyPlayable == "") {
            probablyPlayable = soundFiles[i].file || "" ;
        }

        if(canPlayType == "maybe" && maybePlayable == "") {
            maybePlayable = soundFiles[i].file || "" ;
        }
    }
    
    this.file = probablyPlayable ;
    if(this.file == "") {
        this.file = maybePlayable ;
    }

    this.audio = null ;
}

AudioNotificationPlayer.prototype.load = function() {
    this.audio = new Audio(this.file) ;
    this.audio.load() ;
}

AudioNotificationPlayer.prototype.play = function() {
    if(!this.audio) {
        this.load() ;
    }
    this.audio.play() ;
}

// ----------------------------------------------------------
// ----- Class: ThemeManager --------------------------------
// ----------------------------------------------------------

function ThemeManager(game, url) {
    this.game = game ;
    this.urlBase = this.getUrlBase(url);
    this.game.themeManager = this;
}

ThemeManager.prototype.getUrlBase = function(url) {
    var urlBase = url.replace(/^\s+|\s+$/g, '') ;
    if(urlBase.length>0) {
        if(urlBase.charAt(url.length-1) != '/') {
            urlBase += '/' ;
        }
    }
    return urlBase;
}


ThemeManager.prototype.loadTheme = function() {
    // alert("ThemeManager.loadTheme") ;

    var self = this ;
    var params = {} ;
    var callback = function(obj) {
        self.onThemeUrlFetched(obj) ;
    }

    var fileUrl = this.urlBase + "theme.xml" ;
    params[gadgets.io.RequestParameters.CONTENT_TYPE] = gadgets.io.ContentType.DOM ;
    gadgets.io.makeRequest(fileUrl, callback, params) ;
    
    // alert("after makeRequest: " + fileUrl + params) ;
}

ThemeManager.prototype.onThemeUrlFetched = function(obj) {
    if(obj.errors && obj.errors.length && obj.errors.length>0) {
        MessageManager.getInstance().createTimerMessage("Fetching a theme from URL "+this.urlBase+" failed.",5) ;
        return ;
    }

    this.boardGeometry          = null ;
    this.stoneGeometry          = null ;

    this.boardImageUrls         = [];

    this.blackStoneImageUrl     = this.urlBase ;
    this.whiteStoneImageUrl     = this.urlBase ;

    this.blackLastStoneImageUrl = this.urlBase ;
    this.whiteLastStoneImageUrl = this.urlBase ;
    this.blackDeadStoneImageUrl = this.urlBase ;
    this.whiteDeadStoneImageUrl = this.urlBase ;
    this.blackTerritoryImageUrl = this.urlBase ;
    this.whiteTerritoryImageUrl = this.urlBase ;
    this.koImageUrl             = this.urlBase ;
    this.neutralImageUrl        = this.urlBase ;

    this.boardChangedAudioNotificationUrls = [] ;
    //  audio/wav, audio/x-wav, audio/wave, audio/x-pn-wav


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

    if (!this.boardImageUrls[9] ||
        !this.boardImageUrls[13] ||
        !this.boardImageUrls[19]) {
        MessageManager.getInstance().createTimerMessage("Error in theme: it should have boardimages for all the three standard boardsize.", 5) ;
        return;
    }

    this.game._onThemeChange(this.urlBase,
                             this.boardImageUrls,
                             this.blackStoneImageUrl,
                             this.whiteStoneImageUrl,
                             this.blackLastStoneImageUrl,
                             this.whiteLastStoneImageUrl,
                             this.blackDeadStoneImageUrl,
                             this.whiteDeadStoneImageUrl,
                             this.blackTerritoryImageUrl,
                             this.whiteTerritoryImageUrl,
                             this.koImageUrl,
                             this.neutralImageUrl,
                             this.boardGeometry,
                             this.stoneGeometry,
                             this.boardChangedAudioNotificationUrls) ;
}

ThemeManager.prototype.processBoardItem = function(board) {

    for(var i=0; i<board.childNodes.length; i++) {
        var item = board.childNodes.item(i) ;

        if(item.nodeName=="image") {
            this.processBoardImageItem(item) ;
        } else if(item.nodeName=="audioNotification") {
            this.processBoardAudioNotificationItem(item) ;
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
            var size = parseInt(item.getAttribute("size")) ;
            if (size>=2 && size<=36) {
                this.boardImageUrls[size] = this.urlBase + item.firstChild.nodeValue;
            }
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


ThemeManager.prototype.processBoardAudioNotificationItem = function(audioNotification) {
    var typeAttribute = audioNotification.getAttribute("type") ;
    if(typeAttribute != "boardChange") return ;

    for(var i=0; i<audioNotification.childNodes.length; i++) {
        var item = audioNotification.childNodes.item(i) ;
        if(item.nodeName == "audio") {
            var obj = {type:'', file:''} ;
            obj.type = ""+item.getAttribute("type") ;
            obj.file = ""+this.urlBase+item.getAttribute("src") ;
            this.boardChangedAudioNotificationUrls.push(obj) ;
        }
    }
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
            else if(typeAttribute=="1-last") {
                this.blackLastStoneImageUrl += item.firstChild.nodeValue ;
            }
            else if(typeAttribute=="1-dead") {
                this.blackDeadStoneImageUrl += item.firstChild.nodeValue ;
            }
            else if(typeAttribute=="1-terr") {
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
            else if(typeAttribute=="2-terr") {
                this.whiteTerritoryImageUrl += item.firstChild.nodeValue ;
            }
            else if(typeAttribute=="ko") {
                this.koImageUrl += item.firstChild.nodeValue ;
            }
            else if(typeAttribute=="neutral") {
                this.neutralImageUrl += item.firstChild.nodeValue ;
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
    var boardChangedAudioNotification = [] ;
    boardChangedAudioNotification.push({type: "audio/ogg", file:prefix+"boardChange.ogg"}) ;
    boardChangedAudioNotification.push({type: "audio/mp3", file:prefix+"boardChange.mp3"}) ;
    var boardImages = [];
    boardImages[9] = prefix+"board9.png";
    boardImages[13] = prefix+"board13.png";
    boardImages[19] = prefix+"board19.png";
    game._onThemeChange(prefix,
                        boardImages,
                        prefix+"black.png",
                        prefix+"white.png",
                        prefix+"black-last.png",
                        prefix+"white-last.png",
                        prefix+"black-dead.png",
                        prefix+"white-dead.png",
                        prefix+"black-terr.png",
                        prefix+"white-terr.png",
                        prefix+"ko.png",
                        prefix+"neutral.png",
                        new GameBoardGeometry(20, 32, 20, 32),
                        new GameStoneGeometry(24, 24),
                        boardChangedAudioNotification) ;
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
