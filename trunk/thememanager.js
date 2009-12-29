// ----------------------------------------------------------
// ----- Class: ThemeManager --------------------------------
// ----------------------------------------------------------

function ThemeManager(game, url) {
    this.game = game ;
    url = url.replace(/^\s+|\s+$/g, '') ;
    this.url = url ;
    
    this.urlBase = url ;
    if(this.urlBase.length>0) {
        if(this.urlBase.charAt(url.length-1) != '/') {
            this.urlBase += '/' ;
        }
    }

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
        MessageManager.getInstance().createDismissibleMessage("Fetching a theme from URL "+this.url+" failed.") ;
        return ;
    }

    this.boardGeometry          = null ;
    this.boardSize              = null ;
    this.stoneGeometry          = null ;

    this.boardImageUrl          = this.urlBase ;
    this.blackStoneImageUrl     = this.urlBase ;
    this.whiteStoneImageUrl     = this.urlBase ;

    this.blackLastStoneImageUrl = this.urlBase ;
    this.whiteLastStoneImageUrl = this.urlBase ;
    this.blackDeadStoneImageUrl = this.urlBase ;
    this.whiteDeadStoneImageUrl = this.urlBase ;
    this.blackTerritoryImageUrl = this.urlBase ;
    this.whiteTerritoryImageUrl = this.urlBase ;
    this.koImageUrl             = this.urlBase ;


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

    this.game._onThemeChange(this.url,
                             this.boardImageUrl,
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
        }
    }
    
    this.stoneGeometry = new GameStoneGeometry(w, h) ;
}

// ----------------------------------------------------------
// ----- Class: DummyThemeManager ---------------------------
// ----------------------------------------------------------

function DummyThemeManager(game, url) {
    var prefix = "themes/basic-theme/" ;
    game._onThemeChange(prefix,
                        prefix+"board.png",
                        prefix+"black.png",
                        prefix+"white.png",
                        prefix+"black-last.png",
                        prefix+"white-last.png",
                        prefix+"black-dead.png",
                        prefix+"white-dead.png",
                        prefix+"black-terr.png",
                        prefix+"white-terr.png",
                        prefix+"ko.png",
                        19,
                        new GameBoardGeometry(20, 32, 20, 32),
                        new GameStoneGeometry(24, 24)) ;
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
