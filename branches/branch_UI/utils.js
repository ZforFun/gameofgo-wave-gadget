// ----------------------------------------------------------
// ----- Message Manager ------------------------------------
// ----------------------------------------------------------

MessageManager = {} ;
MessageManager.getInstance = function() {
    if(!MessageManager.mainMessageManager) {
        MessageManager.mainMessageManager = new gadgets.MiniMessage(myModuleId) ;
    }

    return MessageManager.mainMessageManager ;
}

// ------------------------------------------------------------------------------
// ----- Class: Serializer ------------------------------------------------------
// ----- Assistant Class for serializing/deserializing objects  -----------------
// ----- which "implements" serializable interface:             -----------------
// ----- getName: returning the classname                       -----------------
// ----- getData: returning their all data in a map             -----------------
// ----- constructor with one parameter: it reconstructs itself -----------------
// ------------------------------------------------------------------------------

function Serializer() {
}

Serializer.serialize = function(obj) {
    var d = {name: obj.getName(), data: obj.getData()};
    var str = wave.util.printJson(d) ;
    return str ;
}

Serializer.construct = function(str) {
    var d = eval('('+str+')') ;
    var obj = eval('new '+d.name+'(d.data)') ;
    return obj ;
}

// ----------------------------------------------------------
// ----- Class: SortedSet -----------------------------------
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
