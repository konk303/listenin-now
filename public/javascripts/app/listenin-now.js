/* ============================================================
listenin-now.js
 javascripts for mixi app "listenin' now"
 http://mixi.jp/view_appli.pl?id=7793
============================================================ */
(function($) {
    //onload
    gadgets.util.registerOnLoadHandler(function() {
        // viewinfo can be fetched without request.
        var view = new Class.View();
        $("body").addClass(view.name);

        // get the ownerinfo
        var owner = Class.OwnerAccount()
        owner.getData(function() {
            //things to do AFTER ownerinfo are fetched.
            owner.show();
            if (view.name == 'canvas') view.initCanvas();
            else view.initHomeProfile();
        });
        // mixi oriented
        if (window.mixi) {
            $("body").addClass("mixi");
            // external links, use mixi.util.requestExternalNavigateTo
            $("a.external").live("click", function(e) {
                e.preventDefault();
                mixi.util.requestExternalNavigateTo($(this).attr("href"));
            });
        };
    });
})(jQuery);
