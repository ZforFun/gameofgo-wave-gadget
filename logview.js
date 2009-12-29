// ----------------------------------------------------------
// ----- Class: LogViewController ---------------------------
// ----------------------------------------------------------

function LogViewController(game, parentDiv) {
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
