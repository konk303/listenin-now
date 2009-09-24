/* ============================================================
site.js
 javascripts for
 http://listenin-now.konk303.com/
============================================================ */
(function($) {
    // set tabs, if there are
    var tab = $("#content > nav.tabArea").
    tabs();
//     .bind('tabsshow', function(e, ui) {
//         window.location.hash = $(ui.tab).attr("href");
//         window.scrollTo(0,0);
//     });
    if (tab.length) {
        if (window.location.hash) {
            tab.tabs('select', window.location.hash);
            window.scrollTo(0,0);
        }
        $("a[href^='#']", ".ui-tabs-panel").click(function() { // bind click event to link
            tab.tabs('select', $(this).attr("href")); // switch to third tab
            window.scrollTo(0,0);
            return false;
        })
    }
})(jQuery);
