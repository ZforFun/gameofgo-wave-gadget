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

// ----------------------------------------------------------
// ----- Class: GameLog -------------------------------------
// ----------------------------------------------------------

function GameLog() {
    this.log = new Array() ;
    this.logLength = 0 ;
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

GameLog.prototype.serialize = function() {
    var res ;
    var a, b, c ;
    res = "";
    for(var i=0; i<this.log.length; i++) {
        var entry = this.log[i] ;
        switch(entry.type) {
            case GameLogEntry.TYPE_PASS:
                c = '<' ;
                if(entry.color == 2) c = '>' ;
                res += c ;
                break ;
            case GameLogEntry.TYPE_PUT:
                c = '{' ;
                if(entry.color == 2) c = '}' ;
                res += c ;
                res += SimpleSerializer.indexToCode[entry.i] ;
                res += SimpleSerializer.indexToCode[entry.j] ;
                break ;
            case GameLogEntry.TYPE_REMOVE:
                c = '[' ;
                if(entry.color == 2) c = ']' ;
                res += c ;
                res += SimpleSerializer.indexToCode[entry.i] ;
                res += SimpleSerializer.indexToCode[entry.j] ;
                break ;
            case GameLogEntry.TYPE_SET:
                c = '(' ;
                if(entry.color == 2) c = ')' ;
                res += c ;
                res += SimpleSerializer.indexToCode[entry.i] ;
                res += SimpleSerializer.indexToCode[entry.j] ;
                break ;
        }

        if(entry.followup) {
            for(var j=0; j<entry.followup.length; j++) {
                res += SimpleSerializer.indexToCode[entry.followup[j].type];
                res += SimpleSerializer.indexToCode[entry.followup[j].i] ;
                res += SimpleSerializer.indexToCode[entry.followup[j].j] ;
            }
        }
    }
    return res;
}

GameLog.prototype.deSerialize = function(l) {
    var index = 0;
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

        this.addEntry(type, i, j, color) ;

        while(index<=l.log.length &&
              c!='<' && c!='>' &&
              c!='{' && c!='}' &&
              c!='[' && c!=']' &&
              c!='(' && c!=')') {
            type = SimpleParser.codeToIndex[c] ;
            c = l.log[index++] ;
            i = SimpleParser.codeToIndex[c] ;
            c = l.log[index++] ;
            j = SimpleParser.codeToIndex[c] ;
            c = l.log[index++] ;

            this.addFollowup(type, i, j) ;
        }
    }
    this.logLength = l.logLength ;
}