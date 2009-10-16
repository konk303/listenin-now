/* ============================================================
listenin-now.js
 javascripts for mixi app "listenin' now"
 http://mixi.jp/view_appli.pl?id=7793
============================================================ */
(function($) {
    // reloading while ajax request causes problem in fx.
    // http://blog.webcreativepark.net/2009/10/09-020452.html
    $("body").bind("ajaxSend", function(c,xhr){
        $(window).bind('beforeunload', function() {
            xhr.abort();
        })
    });
    //onload
    gadgets.util.registerOnLoadHandler(function() {
        // viewinfo can be fetched without request.
        var view = new Class.View();
        $("#container").addClass(view.name);

        // get the ownerinfo
        var owner = Class.OwnerAccount()
        owner.getData(function() {
            //things to do AFTER ownerinfo are fetched.
            owner.show();
            if (view.name == 'canvas') {
                view.initCanvas();
                Class.WhatsNew().display();
                Class.Friends().display();
            } else {
                view.initHomeProfile();
            }
        });
        // mixi oriented
        if (window.mixi) {
            $("#container").addClass("mixi");
            // external links, use mixi.util.requestExternalNavigateTo
            $("a.external").live("click", function(e) {
                e.preventDefault();
                mixi.util.requestExternalNavigateTo($(this).attr("href"));
            });
        };
    });
})(jQuery);
