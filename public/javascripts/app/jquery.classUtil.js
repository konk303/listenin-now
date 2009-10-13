/* ============================================================
jquery.classUtil.js
 class utilities for jQuery
============================================================ */
(function($) {
    // utils
    $.extend({classUtil: {
        //class builder. "new"忘れに対応
        createClass: function(methods) {
            return function() {
                var self = arguments.callee;
                $.extend(self.prototype,methods);
                if (this instanceof self) {// with "new"
                    this.init.apply(this, arguments);
                    return this;
                } else {//without "new"
                    var F = function(){};
                    F.prototype = self.prototype;
                    var O = new F();
                    O.init.apply(O, arguments);
                    return O;
                }
            }
        },
        // or build a singleton class
        createClassSingleton: function(methods) {
            return function() {
                var self = arguments.callee;
                $.extend(self.prototype,methods);
                if (self.instance == null) {//first time
                    if (this instanceof self) {//with "new"
                        this.init.apply(this, arguments);
                        self.instance = this;
                    } else {//without "new"
                        var F = function(){};
                        F.prototype = self.prototype;
                        var O = new F();
                        O.init.apply(O, arguments);
                        self.instance = O;
                    }
                }
                return self.instance;
            };
        },
        createHandler: function(thisObj, func) {
            return function() {return func.apply(thisObj, arguments);}
        }
    }});
})(jQuery);
