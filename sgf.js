// -----------------------------------------------------------------------------
// ----- Class: SGFParser ------------------------------------------------------
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// ----- Class: SGFParser ------------------------------------------------------
// ----- Constructor      ------------------------------------------------------
function SGFParser(str, game) {
    this.str   = str;
    this.game  = game;
    this.propertyName  = "";
    this.propertyValue = "";
}

// -----------------------------------------------------------------------------
// ----- Class: SGFParser ------------------------------------------------------
// ----- Public Methods   ------------------------------------------------------

SGFParser.prototype.parse = function() {
    this.game._reset();
    if (!this._consumeWhiteSpaces()) {
        MessageManager.getInstance().createTimerMessage("Unexpected end of file",5) ;
        return;
    }
    if (this.str.charAt(0)!='('){
        MessageManager.getInstance().createTimerMessage("Non-expected character: '"+this.str.charAt(0)+"'. Expected: '('",5);
        return;
    }
    this.str = this.str.slice(1);

    while(this._parseProperty()){
        if (this.propertyName=="B"){
            if (this.propertyValue.length==0) {
                this.game.gameBoard.pass(1);
            } else if (this.propertyValue.length!=2) {
                MessageManager.getInstance().createTimerMessage("Non-expected property-value: '"+this.propertyValue+"'.",5);
                return;
            } else {
                var i=this.propertyValue.charCodeAt(0)-97;
                var j=this.propertyValue.charCodeAt(1)-97;
                if (i>19 || j>19 || i<0 || j<0) {
                    MessageManager.getInstance().createTimerMessage("Non-expected property-value: '"+this.propertyValue+"'.",5);
                    return;
                }
                this.game.gameBoard.makeMove(i,j,1);
            }
        } else if (this.propertyName=="W"){
            if (this.propertyValue.length==0) {
                this.game.gameBoard.pass(2);
            } else if (this.propertyValue.length!=2) {
                MessageManager.getInstance().createTimerMessage("Non-expected property-value: '"+this.propertyValue+"'.",5);
                return;
            } else {
                var i=this.propertyValue.charCodeAt(0)-97;
                var j=this.propertyValue.charCodeAt(1)-97;
                if (i>19 || j>19 || i<0 || j<0) {
                    MessageManager.getInstance().createTimerMessage("Non-expected property-value: '"+this.propertyValue+"'.",5);
                    return;
                }
                this.game.gameBoard.makeMove(i,j,2);
            }
        }
    }
}

// -----------------------------------------------------------------------------
// ----- Class: SGFParser ------------------------------------------------------
// ----- Private Methods  ------------------------------------------------------

SGFParser.prototype._parseProperty = function(){
    var ok = true;
    ok = this._consumeWhiteSpaces();
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
            ok = this._parsePropertyName();
            if (!ok) break;
            ok = this._consumeWhiteSpaces();
            if (!ok) break;
            ok = this._parsePropertyValue();
            break;
        }
        ok = this._consumeWhiteSpaces();
    }
    return ok;
}

SGFParser.prototype._parsePropertyName = function(){
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

SGFParser.prototype._parsePropertyValue = function(){
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

SGFParser.prototype._consumeWhiteSpaces = function(){
    while (this.str.length>0 &&
        (this.str.charAt(0)==" " || this.str.charAt(0)=="\n" || this.str.charAt(0)=="\t")) {
        this.str = this.str.slice(1);
    }
    return this.str.length>0;
}

// -----------------------------------------------------------------------------
// ----- Class: SGFExporter ----------------------------------------------------
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// ----- Class: SGFExporter ----------------------------------------------------
// ----- Constructor        ----------------------------------------------------
function SGFExporter(game) {
    this.game  = game;
}

// -----------------------------------------------------------------------------
// ----- Class: SGFExporter ----------------------------------------------------
// ----- Public Methods     ----------------------------------------------------

SGFExporter.prototype.export = function() {
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
    strSGF+="SZ["+this.game.boardSize+"]"; //Board size: 19x19
    strSGF+="PB[Black]"; //Black's name          //TODO: Getting name for black from Wave
    strSGF+="PW[White]"; //White's name          //TODO: Getting name for white from Wave
    strSGF+="DT["+year+"-"+month+"-"+day+"]"; //Date
    strSGF+="TM["+hour+minute+"]"; //Time

////////////////////////////////////
// Adding the moves from the gameLog
    for(i=0;i<this.game.gameBoard.gameLog.getLength();i++){
        var stone;
        strSGF+="\n;";
        stone = this.game.gameBoard.gameLog.getEntry(i);
        if (stone.color==1) strSGF+="B["; else strSGF+="W[";
        strSGF+=String.fromCharCode(97+stone.i);
        strSGF+=String.fromCharCode(97+stone.j);
        strSGF+="]";
    }

    strSGF += "\n)";
    return strSGF;
}