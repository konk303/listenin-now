/* ============================================================
site.js
 javascripts for
 http://listenin-now.konk303.com/
============================================================ */
(function($) {
    //firefox < 3.5 doesn't, dirty fixing by manually wrapping.
    if ($.browser.mozilla && $("header").children().length == 0) {
        var wrap_until_next = function(wrappers) {
            wrappers.each(function(i) {
                var targets = $(this).nextAll().not("script");
                var next_wrapper = wrappers[i+1];
                var next_wrapper_index = targets.index(next_wrapper);
                // last loop
                if (next_wrapper_index == -1) next_wrapper_index = targets.length;
                targets.slice(0,next_wrapper_index).appendTo(this);
            });
        };
        // header, footer
        wrap_until_next($("header").add("div#content").add("footer"));
        // section
        wrap_until_next($("section"));
        // article
        wrap_until_next($("article"));
        // nav
        $("nav").each(function(i) {
            $(this).next("ul,ol").appendTo(this);
        });
    }

    $(function() {
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
    })
})(jQuery);
