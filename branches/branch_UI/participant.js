// ------------------------------------------------------------------------------
// ----- Class: ParticipantFilter -----------------------------------------------
// ------------------------------------------------------------------------------

function ParticipantFilter(pmap) {
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

ParticipantFilter.prototype.getName = function() {
    return "ParticipantFilter" ;
}

ParticipantFilter.prototype.getData = function() {
    var uidArr = [] ;
    var colorArr = [] ;
    for(var i in this.participantMap_) {
        uidArr.push(i) ;
        colorArr.push(this.participantMap_[i]) ;
    }
    return {uids: uidArr, colors: colorArr} ;
}

ParticipantFilter.prototype.setPlayerColor = function(participantId, color) {
    if(!color) {
        delete this.participantMap_[participantId] ;
    }
    else {
        this.participantMap_[participantId] = color ;
    }
}

ParticipantFilter.prototype.getPlayerColor = function(participantId, noWildcardForUser) {
    var color = this.participantMap_[participantId] ;
    if(color) {
        return color ;
    }

    if(noWildcardForUser) return null ;

    return this.participantMap_["*"] ;
}

ParticipantFilter.prototype.isColorOfParticipant = function(participantId, color) {
    var playerColor = this.getPlayerColor(participantId) ;

    if(playerColor == color) return true ;
    if(playerColor == "*") return true ;

    return false ;
}

// ------------------------------------------------------------------------------
// ----- Class: Participant Controller ------------------------------------------
// ------------------------------------------------------------------------------

function ParticipantController(game, parentDiv) {
    this.game = game ;
    this.parentDiv = parentDiv ;

    this.div = null ;
}

ParticipantController.prototype.resetUI = function() {
    if(this.div) this.parentDiv.removeChild(this.div) ;
    this.div = null ;
}

ParticipantController.prototype.setCloseCallback = function(callback) {
    this.onCloseCallback = callback ;
}

ParticipantController.prototype.buildUI = function() {
    var self = this ;

    var closeA = document.createElement("A") ;
    closeA.innerHTML = "Apply & Close" ;
    closeA.setAttribute('href', '#');
    closeA.onclick = function() {
        self.onClose() ;
    }

    var cancelA = document.createElement("A") ;
    cancelA.innerHTML = "Cancel" ;
    cancelA.setAttribute('href', '#');
    cancelA.onclick = function() {
        self.onCancel() ;
    }

    var separator = document.createTextNode("\u00A0\u00A0\u00A0"); //non-breaking space

    this.table = document.createElement("TABLE") ;
    this.table.width = "100%" ;
    this.tableBody = document.createElement("TBODY");

    this.table.appendChild(this.tableBody) ;

    for(var i=0; i<this.modelData.length; i++) {
        var tr = document.createElement("TR") ;
        var url ;
        var name ;
        var blackStone ;
        var whiteStone ;


        if(this.modelData[i].participant) {
            url = this.modelData[i].participant.getThumbnailUrl() ;
            name = this.modelData[i].participant.getDisplayName() ;
        }
        else {
            url = "https://wave.google.com/wave/static/images/unknown.jpg" ;
            name = "Defaults (applies if not otherwise specified)" ;
        }

        blackStone = whiteStone = "-" ;
        if(this.modelData[i].mode == '1' ||
           this.modelData[i].mode == '*') {
           blackStone = "B" ;
        }
        if(this.modelData[i].mode == '2' ||
           this.modelData[i].mode == '*') {
           whiteStone = "W" ;
        }

        var urlTd = document.createElement("TD") ;
        if(url) {
            urlTd.innerHTML = '<IMG SRC="'+url+'" width="40"/>' ;
        }
        tr.appendChild(urlTd) ;

        var nameTd = document.createElement("TD") ;
        nameTd.innerHTML = name ;
        tr.appendChild(nameTd) ;

        var blackTd = document.createElement("TD") ;
        var blackA = document.createElement("A") ;
        blackA.innerHTML = blackStone ;
        var blackAOnclickRegisterer = function(index) {
            blackA.onclick = function() {
                self.onTogglePlayerColor(index, '1') ;
            }
        }
        blackAOnclickRegisterer(i) ;

        blackTd.appendChild(blackA) ;
        tr.appendChild(blackTd) ;

        var whiteTd = document.createElement("TD") ;
        var whiteA = document.createElement("A") ;
        whiteA.innerHTML = whiteStone;
        var whiteAOnclickRegisterer = function(index) {
            whiteA.onclick = function() {
                self.onTogglePlayerColor(index, '2') ;
            }
        }
        whiteAOnclickRegisterer(i) ;

        whiteTd.appendChild(whiteA) ;
        tr.appendChild(whiteTd) ;

        this.tableBody.appendChild(tr) ;

        this.modelData[i].whiteA = whiteA ;
        this.modelData[i].blackA = blackA ;
    }

    this.div = document.createElement("DIV") ;
    with(this.div) {
        style.position = "absolute" ;
        style.left = "0px" ;
        style.top = "0px" ;
        style.zIndex = 9999 ;
        style.background = "rgba(196, 196, 196, 0.75)" ;
        style.verticalAlign =  "middle" ;
        style.textAlign = "center" ;
        style.display = "table" ;
    }

    this.div.appendChild(closeA) ;
    this.div.appendChild(separator) ;
    this.div.appendChild(cancelA) ;
    this.div.appendChild(this.table) ;
    this.parentDiv.appendChild(this.div) ;
}

ParticipantController.prototype.loadModelData = function() {
    this.modelData = [] ;

    var participants = wave.getParticipants() ;
    var participant ;
    var mode ;
    var rv = [] ;

    participant = null ;
    mode = this.game.participantFilter.getPlayerColor("*", true) ;
    rv.push({participant: participant, mode: mode}) ;

    for(var i=0; i<participants.length; i++) {
        participant = participants[i] ;
        mode = this.game.participantFilter.getPlayerColor(participant.getId(), true) ;

        rv.push({participant: participant, mode: mode}) ;
    }

    this.modelData = rv ;
    return rv ;
}

ParticipantController.prototype.setVisible = function(visible) {
    if(this.parentDiv) {
        if(!this.div) {
            this.buildUI() ;
        }
    }
    if(this.div && this.parentDiv) {
        with(this.div) {
            if(this.game.boardImage.width && this.game.boardImage.height) {
                style.width = this.game.boardImage.width + "px" ;
                style.height = this.game.boardImage.height + "px" ;
            }
            if(visible) {
                style.visibility = "visible" ;
                style.zIndex = 9999 ;
            } else {
                style.visibility = "hidden" ;
                style.zIndex = -9999 ;
            }
        }
    }
}

ParticipantController.prototype.getParticipantFilter = function() {
    var participantFilter = new ParticipantFilter() ;
    for(var i=0; i<this.modelData.length; i++) {
        var participant = this.modelData[i].participant ;
        var participantId = "*" ;
        if(participant)
            participantId = this.modelData[i].participant.getId() ;
        var color = this.modelData[i].mode ;
        participantFilter.setPlayerColor(participantId, color) ;
    }

    return participantFilter ;
}

ParticipantController.prototype.onClose = function() {
    this.onCloseCallback() ;
}

ParticipantController.prototype.onCancel = function() {
    this.onCloseCallback(true) ;
}


ParticipantController.prototype.onTogglePlayerColor = function(index, colorToToggle) {
    var data = this.modelData[index] ;
    var blackStone ;
    var whiteStone ;

    if(data.mode == '*') {
        data.mode = '1' ;
        if(colorToToggle == '1') {
           data.mode = '2';
        }
    }
    else if(data.mode == '1') {
        data.mode = '*' ;
        if(colorToToggle == '1') {
            data.mode = '' ;
        }
    }
    else if(data.mode == '2') {
        data.mode = '' ;
        if(colorToToggle == '1') {
            data.mode = '*';
        }
    }
    else {
        data.mode = colorToToggle ;
    }

    blackStone = whiteStone = "-" ;
    if(data.mode == '1' ||
        data.mode == '*') {
        blackStone = "B" ;
    }
    if(data.mode == '2' ||
        data.mode == '*') {
        whiteStone = "W" ;
    }

    data.blackA.innerHTML = blackStone ;
    data.whiteA.innerHTML = whiteStone ;
}
