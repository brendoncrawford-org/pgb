PGB.include('core', 'helpers.util', 1);
PGB.include('editor', 'toolbar', 1);
PGB.include('editor', 'toolbar.primary', 2);
PGB.include('editor', 'toolbar.form', 2);
PGB.include('editor', 'toolbar.widget', 2);
PGB.include('editor', 'elements', 1);
PGB.include('editor', 'elements.body', 2);
PGB.include('editor', 'components.selection', 1);
PGB.include('editor', 'components.box', 1);



PGB.plg.Edt = Base.extend(null, {

    /**
     * Properties
     */
    elms : {},
    tbrs : {},
    _tbrCoords : {},
    cmp : {},
    elmP : {},
    _activeElm : null,
    ERR : {
        ELM_NO_ELEM : [
            0, 'ELM_NO_ELEM',
            'You cannot register an elm ' +
                'that does not have an "elem" property'
        ],
        ELM_NO_REGID : [
            1, 'ELM_NO_REGID',
            'Trying to unregister an elm without a regID'
        ],
        TBR_NO_REGID : [
            2, 'TBR_NO_REGID',
            'Trying to unregister a toolbar without a regID'
        ]
    },
    
    /**
     * Editor plugin initilizaer
     * 
     * @param {Object[HTMLElement]} context
     * @return {Bool}
     */
    go : function(context) {
        var bodyElm, primTbr, detTbr;
        this.context = context;
        // Need to set a body element
        bodyElm = new PGB.plg.Edt.elmP.Body();
        this.setMouse();
        primTbr = new this.TbrPrim();
        return true;
    },
    
    /**
     * Sets document-wide mousedown actions
     * It is important to note that for some unknown reason we
     * cannot safely lump
     * multiple actions into one mousedown callback.
     * 
     * @return {Bool}
     */
    setMouse : function() {
        var _this;
        _this = this;
        PGB.doc.bind('mousedown', function(e){
            var t, a;
            t = PGB.utl.et(e);
            a = _this.findElm(t);
            // If not on a toolbar and not on the active element
            if (!_this.onToolbar(t) &&
                    (a === false || !_this.onActiveElm(a))) {
                _this.regActiveElm(null);
                _this.deselectElmsEvent(e);
                _this.remDetails();
            }
            return true;
        });
        return true;    
    },

    /**
     * Register the active element
     * 
     * 
     */
    regActiveElm : function(elmPInstance) {
        this._activeElm = elmPInstance;
        return true;
    },

    /**
     * Checks if is on active element
     * 
     */
    onActiveElm : function(elmPInstance) {
        return (this._activeElm !== null &&
            elmPInstance.elem[0] === this._activeElm.elem[0]);
    },

    /**
     * Registers a toolbars last coordinates
     */
    setTbrCoords : function(code, top, left) {
        this._tbrCoords[code] = {top:top, left:left};
        return true;
    },

    /**
     * Gets toolbar coords
     * 
     * @param {Object} code
     */
    getTbrCoords : function(code) {
        if (this._tbrCoords[code] !== undefined) {
            return this._tbrCoords[code];
        }
        else {
            return false;
        }
    },
    
    /**
     * Finds an elm
     * 
     * @param {Object[jQuery]} elm
     * @return {Object[PGB.plg.Edt.elmP.Box]}
     * 
     */
    findElm : function(elm) {
        var d;
        elm = elm[0];
        while (elm !== undefined && elm !== null) {
            d = $(elm).data('pgb');
            if (d !== undefined) {
                if (d.elmPInstance !== undefined) {
                    return d.elmPInstance;
                }
            }
            elm = elm.parentNode;
        }
        return false;
    },
    
    /**
     * Checks if event occurred on toolbar
     * 
     * @param {Object[Event]} e
     * @return {Bool}
     */
    onToolbar : function(t) {
        var i, _i, tbr;
        for (i in this.tbrs) {
            tbr = this.tbrs[i].elem;
            if (PGB.utl.parent(t, tbr)) {
                return true;
            }
        }
        return false;    
    },

    /**
     * Gets smallest toolbar
     * 
     */
    getSmallestTbr : function() {
        var i, sm, w, h, nw, nh;
        w = 0;
        h = 0;
        sm = null;
        for (i in this.tbrs) {
            if (sm === null) {
                sm = this.tbrs[i];
            }
            nw = this.tbrs[i].elem.outerWidth();
            nh = this.tbrs[i].elem.outerHeight();
            if ((w === 0 || h === 0) || ([nw,nh] <= [w,h])) {
                w = nw;
                h = nh;
                sm = this.tbrs[i];
            }
        }
        return sm;
    },
    
    /**
     * Checks if event occurred on elm (drawn elm)
     * 
     * @param {Object[Event]} e
     * @return {Bool}
     */
    onElms : function(e) {
        var i, t, elm;
        t = PGB.utl.et(e);
        for (i in this.elms) {
            elm = this.elms[i].elem;
            if (PGB.utl.parent(t, elm)) {
                return true;
            }
        }
        return false;
    },
    
    
    /**
     * Removes details from toolbars
     * 
     * @return {Bool}
     */
    remDetails : function() {
        var i, _i;
        for (i in this.tbrs) {
            if (!(this.tbrs[i] instanceof PGB.plg.Edt.TbrPrim) &&
                    $.isFunction(this.tbrs[i].destroy)) {
                this.tbrs[i].destroy();
            }
        }
        return true;
    },
    
    
    /**
     * Registers a toolbar
     * 
     * @param {Object[PGB.plg.Edt.Tbr]} tbr
     * @return {Bool}
     */
    regTbr : function(tbr) {
        tbr.regID = PGB.utl.rand();
        this.tbrs[tbr.regID] = tbr;
        return true;
    },
    
    /**
     * Unregisters a toolbar
     * 
     * @param {Object[PGB.plg.Edt.Tbr]} tbr
     */
    unregisterTbr : function(tbr) {
        if (tbr.regID !== undefined) {
            this.tbrs[tbr.regID] = undefined;
            delete this.tbrs[tbr.regID];
            return true;
        }
        else {
            throw this.ERR.TBR_NO_REGID;
            return false;
        }
    },
    
    /**
     * Wrapper function for deselectin all elms
     * 
     * @return {Bool}
     */
    deselectElmsEvent : function(e) {
        var t;
        t = PGB.utl.et(e);
        this.deselectElms(t);
        return false;
    },
    
    /**
     * Deselcts all elements on page
     * 
     * @param {Object[Event]} e
     * @return {Bool}
     */
    deselectElms : function(t) {
        var i, _i, t, exists;
        exists = (t !== null && t !== undefined);
        //console.log(PGB.plg.Edt.elms);
        for (i in this.elms) {
            if ($.isFunction(this.elms[i].desel)) {
                if (!exists || this._canDesel(t, i)){
                    this.elms[i].desel();
                }
            }
        }
        return false;
    },
    
    /**
     * Determines if elm can desel
     * 
     * @param {jQueryElement} t
     * @return {Bool}
     */
    _canDesel : function(t, i) {
        if (t.data('pgb') !== undefined && t[0] !== this.elms[i].elem[0]) {
            return true;
        }
        if (!PGB.utl.parent(t, this.elms[i].elem)) {
            return true;
        }
        return false;
    },
    
    /**
     * Registers an drawn element
     * 
     * @param {Object[PGB.plg.Edt.elmP.Box]} elmPInstance
     * @return {Int}
     */
    unregisterElm : function(elmPInstance) {
        if (elmPInstance.regID !== undefined) {
            this.elms[elmPInstance.regID] = undefined;
            delete this.elms[elmPInstance.regID];
            return true;
        }
        else {
            throw this.ERR.ELM_NO_REGID;
            return false;
        }
    },
    
    /**
     * Unregisters an drawn element
     * 
     * @param {Object[PGB.plg.Edt.elmP.Box]} elmPInstance
     * @return {Int}
     */
    registerElm : function(elmPInstance) {
        var i;
        if (elmPInstance.elem === undefined) {
            throw this.ERR.ELM_NO_ELEM;
            return false;
        }
        else {
            i = PGB.utl.rand();
            //console.log(i);
            // Add reverse lookup
            elmPInstance.elem.data('pgb', {
                elmPInstance : elmPInstance
            });
            elmPInstance.regID = i;
            this.elms[i] = elmPInstance;
            return i;
        }
    }
    
});


