/* ============================================================
listenin_now.js
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

        // external links, use mixi.util.requestExternalNavigateTo
        if (window.mixi) {
            $("a.external").live("click", function(e) {
                e.preventDefault();
                mixi.util.requestExternalNavigateTo($(this).attr("href"));
            });
        };
    });

    // utils
    $.extend({myUtil: {
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

    // classes, keep them under a namespace
    var Class = {};
    // Tracks
    Class.Tracks = $.myUtil.createClass({
        init: function(account) {
            this.account = account;
            this.showArea = $("#tracksArea");
            this.loading = new Class.LoadingImage();

            this.responseHandler = $.myUtil.createHandler(this, this.response);
            this.createEachDomHandler = $.myUtil.createHandler(this, this.createEachDom);
        },
        request: function() {
            this.loading.showAt(this.showArea);
            var queries = {
                method: "user.getRecentTracks",
                user: this.account,
                limit: Class.View().name == "canvas"? 40: 5
            };
            Class.LastFm().request(queries, this.responseHandler);
        },
        response: function(res, status) {
            this.loading.hide();
            if (status) {
                this.trackDatas = res.recenttracks.track;
                if (this.trackDatas) {
                    $.each(this.trackDatas, this.createEachDomHandler);
                }
                else this.showArea.append('<p>データがありません。<br>last.fm側の「設定」->「プライバシー」->「リアルタイム再生データ」の「リアルタイム再生情報を隠す」にチェックがついていないか、又はアカウント名が違わないかご確認ください。</p>');
            } else {
                this.showArea.append(res);
            }
            gadgets.window.adjustHeight();
        },
        show: function() {
            this.showArea.empty();
            this.request();
        },
        createEachDom: function(i, data) {
            var dl = $('<dl class="track" />');
            var dt = $("<dt />");
            var dd = $("<dd />");

            //image
            //                 var a = $('<a class="external" />').attr("href", data.url);
            $('<img />').attr({
                "src": data.image[0]["#text"] || "http://listenin_now.konk303.com/images/app/noimage.png",
                "alt": data.artist["#text"] + " - " + data.name,
                "title": data.artist["#text"] + " - " + data.name
            })
            //                 .appendTo(a).parent()
            .appendTo(dt).parent().addClass("image").appendTo(dl);
            //name
            $('<a class="external" />')
            .attr({"href":data.url, "title":data.name})
            .text(data.name)
            .wrap('<p class="name" />').parent().appendTo(dd);
            //artist
            $('<a class="external" />')
            .attr({
                "href": "http://www.last.fm/music/" + encodeURIComponent(data.artist["#text"]),
                "title": data.artist["#text"]
            })
            .text(data.artist["#text"])
            .wrap('<p class="artist" />').parent().appendTo(dd);
            //album
            $('<a class="external" />')
            .attr({
                "href": "http://www.last.fm/music/" + encodeURIComponent(data.artist["#text"]) + "/" + encodeURIComponent(data.album["#text"]),
                "title": data.album["#text"]
            })
            .text(data.album["#text"])
            .wrap('<p class="album" />').parent().appendTo(dd);
            //date
            $('<p class="date" />')
            .text(data.date["#text"])
            .appendTo(dd);
            //iTS link
            var div_iTs = $('<div class="button_iTS" />')
            .attr("title", "iTunes Storeで探す")
            .appendTo(dd);
            new Class.Search_iTS(div_iTs, data.artist["#text"] + " " + data.name);
            //community link
            var div_community = $('<div class="button_community" />')
            .attr("title","コミュニティを検索")
            .appendTo(dd);
            new Class.SearchCommunity(div_community, data.artist["#text"]);

            dl.append(dd)
            .hover( // only for IE6
                function(){$(this).addClass("hover");},
                function(){$(this).removeClass("hover");}
            );
            this.showArea.append(dl);
        }
    });
    // search community
    Class.SearchCommunity = $.myUtil.createClass ({
        init: function(targetArea, term) {
            this.targetArea = targetArea;
            this.term = term;

            this.doSearchHandler = $.myUtil.createHandler(this, this.doSearch);
            this.targetArea.click(this.doSearchHandler);
        },
        doSearch: function() {
            var searchUrl = 'http://mixi.jp/search_community.pl?submit=main';
            var queries = {
                type: "com",
                // submit: "main", これあるとsubmitされない…
                category_id: 6, // music
                sort: "member",
                mode: "title",
                per_page: 10,
                keyword: this.term
            };
            // charset of mixi is euc-jp, so simple get url doesn't do good.
            var form = $("<form />").attr({
                acceptCharset: "euc-jp",
                action: searchUrl,
                method: "post", // getのフォームにはinput name="submit"が書けない…
                target: "_parent"
            }).hide().appendTo(this.targetArea);
            $.each(queries, function(key,val) {
                $('<input />').attr({
                    type: "hidden",
                    name: key
                }).val(val).appendTo(form);
            });
            form.submit(function() {
                if (document.charset) {
                    document.charset = 'euc-jp';
                    window.setTimeout('document.charset = "utf-8";',1000);
                }
            }).submit();
            //window.open(searchUrl+ $.param(queries));
            //window.parent.location.href = searchUrl+ $.param(queries);
        }
    });
    // search_iTS
    // see http://www.apple.com/itunesaffiliates/API/AffiliatesSearch2.1.pdf
    Class.Search_iTS = $.myUtil.createClass({
        init: function(targetArea, term) {
            this.targetArea = targetArea;
            this.term = term;
            this.iTS_apiUrl = "http://ax.phobos.apple.com.edgesuite.net/WebObjects/MZStoreServices.woa/wa/wsSearch?";
            this.requested = false;
            this.loading = new Class.LoadingImage();

            this.showHandler = $.myUtil.createHandler(this, this.show);
            this.hideHandler = $.myUtil.createHandler(this, this.hide);
            this.responseHandler = $.myUtil.createHandler(this, this.response);
            this.createEachDomHandler = $.myUtil.createHandler(this, this.createEachDom);
            this.targetArea.click(this.showHandler).click(function(e){e.stopPropagation();});
        },
        request: function() {
            this.loading.showAt(this.showArea);
            var params = {};
            params[gadgets.io.RequestParameters.METHOD] = gadgets.io.MethodType.GET;
            params[gadgets.io.RequestParameters.AUTHORIZATION] = gadgets.io.AuthorizationType.NONE;
            params[gadgets.io.RequestParameters.CONTENT_TYPE] = gadgets.io.ContentType.JSON;
            var queries = {
                term: this.term,
                country: "JP",
                media: "music",
                entity: "musicTrack",
                limit: 20,
                lang: "ja_jp"
            };
            var requestUrl = this.iTS_apiUrl + $.param(queries);
            gadgets.io.makeRequest(requestUrl, this.responseHandler, params);
        },
        response: function(res) {
            this.loading.hide();
            if (res.errors && res.errors.length) {
//                 alert("エラー:\n" + res.errors.join("\n"));
            } else {
                var result = res.data;
                if (result.resultCount > 0) {
                    this.dl = $('<dl class="tracks_iTS" />').insertBefore(this.closeButton);
                    $.each(result.results, this.createEachDomHandler);
                } else {
                    this.showArea.append("<p>見つかりませんでした</p>");
                }
                this.requested = true;
            }
        },
        show: function() {
            if (!this.showArea) {
                this.showArea = $('<div class="result_iTS" />')
                .append('<h2>iTunes Store 検索</h2>')
                .insertAfter(this.targetArea)
                .click(function(e) {e.stopPropagation();});
                this.closeButton = $('<div class="close_button" />').attr("title","閉じる")
                .click(this.hideHandler).appendTo(this.showArea);
            };
            if (!this.requested) this.request();
            //close window by clicking other area
            $("body").trigger('click.otherArea').bind('click.otherArea', this.hideHandler);
            this.showArea.show();
            //fix me.dirty fix for ie z-index imprementation.
            this.parentDl = this.showArea.parent("dd").parent("dl").css("zIndex","1");
        },
        hide: function() {
            //fix me.dirty fix for ie z-index imprementation.
            this.parentDl.css("zIndex","0");
            this.showArea.hide();
            $("body").unbind('click.otherArea');
        },
        createEachDom: function(i,data) {
            var dt = $("<dt />");
            var dd = $('<dd />');

            //artist
            $('<a class="artist" />')
            .attr({"href": data.artistViewUrl, "target": "_blank"})
            .text(data.artistName).appendTo(dt);
            $('<br />').appendTo(dt);
            //image
            var img = data.artworkUrl100 || "http://listenin_now.konk303.com/images/app/noimage.png";
            var a = $('<a class="image" />').attr({"href": data.collectionViewUrl || data.trackViewUrl, "target": "_blank"})
            $('<img />').attr({
                "src": img,
                "alt": data.artistName + " - " + (data.collectionName || data.trackName),
                "title": data.artistName + " - " + (data.collectionName || data.trackName)
            })
            .appendTo(a).parent().appendTo(dt).parent().appendTo(this.dl);
            //track(name)
            $('<a />')
            .attr({"href": data.trackViewUrl, "target": "_blank"})
            .text(data.trackName)
            .append('<span class="price">' + data.trackPrice + '円</span>')
            .wrap('<p class="name" />')
            .parent()
            .appendTo(dd);
            //album
            if (data.collectionId) {
                $('<a />')
                .attr({"href": data.collectionViewUrl, "target": "_blank"})
                .text(data.collectionName)
                .append('<span class="price">' + data.collectionPrice + '円</span>')
                .wrap('<p class="album" />')
                .parent().appendTo(dd);
            }

            this.dl.append(dd);
        }
    });
    //loading image
    Class.LoadingImage = $.myUtil.createClassSingleton({
        init: function() {
            this.img = $('<img />').attr({
                src: "http://listenin_now.konk303.com/images/app/ajax-loader.gif",
                alt: "now loading",
                titile: "now loading"
            })
            .wrap('<div class="loading" />')
            .parent().hide();
        },
        showAt: function(area) {
            this.img.appendTo(area).show();
        },
        hide: function() {
            this.img.hide();
        }
    });
    // owner account
    Class.OwnerAccount = $.myUtil.createClassSingleton({
        init: function() {
            this.showArea = $("#infoArea");
            this.accountArea = $("#accountArea");
            this.keyOwner = "owner";
            this.keyViewer = "viewer";
            this.keyLf = "lf_account";
            this.message = new gadgets.MiniMessage();
            this.messageArea = false;
            this.loading = new Class.LoadingImage();

            this.responseHandler = $.myUtil.createHandler(this, this.response);
            this.requestUpdateLfHandler = $.myUtil.createHandler(this, this.requestUpdateLf);
            this.responseUpdateLfHandler = $.myUtil.createHandler(this, this.responseUpdateLf);
            this.showInputBoxHandler = $.myUtil.createHandler(this, this.showInputBox);
        },
        getData: function(callback) {
            this.postResponse = callback;
            if (!this.person) {
                this.request();
            }
        },
        request: function() {
            this.loading.showAt(this.accountArea);
            var req = new Class.OsRequest();
            req.add(this.keyOwner, "newFetchPersonRequest", ['OWNER']);
            req.add(this.keyLf, "newFetchPersonAppDataRequest", ['OWNER', this.keyLf]);
            //viewerinfo, need to know if he/she has app.
            var params = {};
            params[opensocial.DataRequest.PeopleRequestFields.PROFILE_DETAILS] = [
                opensocial.Person.Field.HAS_APP
            ];
            req.add(this.keyViewer, "newFetchPersonRequest", ['VIEWER', params]);
            req.request(this.responseHandler);
        },
        response: function(res) {
            this.loading.hide();
            this.person = res.get(this.keyOwner).getData();
            this.id = this.person.getId();
            this.name = this.person.getDisplayName();
            this.isViewer = this.person.isViewer();
            var lf_data = res.get(this.keyLf).getData();
            if (this.id in lf_data && this.keyLf in lf_data[this.id])
                this.lf_account = lf_data[this.id][this.keyLf];
            this.viewerHasApp = res.get(this.keyViewer).getData()
            .getField(opensocial.Person.Field.HAS_APP);
            if (this.postResponse) this.postResponse();
        },
        requestUpdateLf: function() {
            this.account_input = $("input#inputAccount").val();
            if (!this.account_input) {// no input
                $("p#errMsg").text("アカウント名を入力してください");
            } else if (this.account_input == this.lf_account) {// not changed
                //do nothing
            } else {
                if (this.isViewer) {
                    this.loading.showAt(this.showArea);
                    var req = new Class.OsRequest();
                    req.add(
                        this.keyLf,
                        "newUpdatePersonAppDataRequest",
                        ['VIEWER', this.keyLf, this.account_input]
                    );
                    req.request(this.responseUpdateLfHandler);
                    this.message.dismissMessage(this.messageArea);
                    this.messageArea = false;
                }
            }
            return false;
        },
        responseUpdateLf:function(res) {
            this.loading.hide();
            var response = res.get(this.keyLf);
            if (response.hadError()) {
                //alert(response.getErrorMessage());
            } else {
                this.lf_account = this.account_input;
                // reload
                this.show();
            }
        },
        show: function() {
            this.showArea.add(this.accountArea).empty();
            if (this.lf_account) {
                this.showOwnerInfo();
                Class.Tracks(this.lf_account).show();
            } else {
                if (this.isViewer)
                    this.showInputBox();
                else
                    this.showArea.append('<p>last.fmアカウントが登録されていません</p>')
            }
        },
        showOwnerInfo: function() {
            $('<a />').attr("href", "http://www.last.fm/user/" + this.lf_account)
            .addClass("external")
            .click(function(e) {
                if (Class.View().name != "canvas") {
                    e.stopImmediatePropagation()
                    e.preventDefault();
                    var self = this;
                    gadgets.views.requestNavigateTo(
                        Class.View().views["canvas"], null, self.id
                    );
                }
            })
            .text(this.lf_account)
            .wrap('<p class="accountMessage" />')
            .parent().prepend('<span>last.fm id: </span>').appendTo(this.showArea)
            .end().end().clone()
            .text(this.name)
            .wrap('<p class="account" />')
            .append('さん@last.fm')
            .parent().appendTo(this.accountArea);
            if (this.isViewer) {
                // add account update icon
                $('<span class="button_edit" />').attr("title", "アカウント変更")
                .click(this.showInputBoxHandler)
                .appendTo("p.accountMessage", this.showArea);
            }
        },
        showInputBox: function() {
            if (!this.messageArea) {
                var div = document.createElement("div");
                $('<form id="formAccount" />')
                .submit(this.requestUpdateLfHandler)
                .append('<p>last.fmアカウント名</p>')
                .append('<input type="text" id="inputAccount" value="' + this.lf_account + '" />')
                .append('<input type="submit" value="登録" />')
                .appendTo(div);
                $('<p id="errMsg"></p>').appendTo(div);
                var self = this;
                this.messageArea = this.message.createDismissibleMessage(
                    div, function() {self.messageArea = false;return true;}
                );
                $("input#inputAccount").select();
            }
        }
    });
    // View
    Class.View = $.myUtil.createClassSingleton({
        init: function() {
            this.viewObj = gadgets.views;
            this.name = this.viewObj.getCurrentView().getName();
            this.views = this.viewObj.getSupportedViews();

            this.goToProfileHandler = $.myUtil.createHandler(this, this.goToProfile);
            this.goToAppHomeHandler = $.myUtil.createHandler(this, this.goToAppHome);
            this.inviteFriendsHandler = $.myUtil.createHandler(this, this.inviteFriends);
            this.goToCanvasHandler = $.myUtil.createHandler(this, this.goToCanvas);
        },
        initCanvas: function() {
            this.owner = new Class.OwnerAccount();
            if (!this.owner.isViewer) {
                $('<p>プロフィール</p>')
                .attr("title", this.owner.name + "さんのプロフィールを見る")
                .appendTo("div#navigationArea").click(this.goToProfileHandler);
            }
            if (this.owner.viewerHasApp) {
                //invite friends
                $('<p>マイミクを招待！</p>')
                .attr("title", "マイミクに招待状を出そう！")
                .appendTo("div#navigationArea").click(this.inviteFriendsHandler);
            } else {
                $('<p>使ってみる</p>')
                .attr("title", "このアプリを使ってみる")
                .appendTo("div#navigationArea").click(this.goToAppHomeHandler);
            }
        },
        initHomeProfile: function() {
            this.owner = new Class.OwnerAccount();
            if (!this.owner.isViewer){
                //navigation to canvas
                $('<p>もっと見る</p>')
                .attr("title", this.owner.name + "さんの再生履歴をもっと見る")
                .appendTo("div#navigationArea").click(this.goToCanvasHandler)
                .parent().show();
            }
        },
        goToProfile: function() {
            gadgets.views.requestNavigateTo(this.views["profile"], null, this.owner.id);
        },
        goToAppHome: function() {
            window.parent.location = "http://mixi.jp/view_appli.pl?id=7793";
            // or http://mixi.jp/join_appli.pl?id=7793
        },
        inviteFriends: function() {
            window.opensocial.requestShareApp("VIEWER_FRIENDS", null, function(response) {
                //var recipientIds = response.getData()["recipientIds"];
            });
        },
        goToCanvas: function() {
            gadgets.views.requestNavigateTo(this.views["canvas"], null, this.owner.id);
        }
    });
    // opensocial request
    Class.OsRequest = $.myUtil.createClass({
        init: function() {
            this.responseHandler = $.myUtil.createHandler(this, this.response);
            this.req = opensocial.newDataRequest();
        },
        add: function(key, method, param) {
            this.req.add(this.req[method].apply(this.req, param), key);
        },
        request: function(callback) {
            this.callback = callback;
            this.req.send(this.responseHandler);
        },
        response: function(res) {
            //if (res.hadError()) alert(res.getErrorMessage());
            //else 
            this.callback(res);
        }
    });
    //last.fm api
    Class.LastFm = $.myUtil.createClass({
        init: function() {
            this.lf_apiUrl = ListeninNowConfig.base_uri + "/api/lastfm?";

            this.responseHandler = $.myUtil.createHandler(this, this.response);
        },
        request: function(queries, callback) {
            this.callback = callback;
            var params = {};
            params[gadgets.io.RequestParameters.METHOD] =  gadgets.io.MethodType.GET;
            params[gadgets.io.RequestParameters.AUTHORIZATION] = gadgets.io.AuthorizationType.NONE;
            params[gadgets.io.RequestParameters.CONTENT_TYPE] = gadgets.io.ContentType.JSON;
            var requestUrl = this.lf_apiUrl + $.param(queries);
            gadgets.io.makeRequest(requestUrl, this.responseHandler, params);
        },
        response: function(res) {
            if (res.errors && res.errors.length) {
//                 alert("エラー:\n" + res.errors.join("\n"));
            } else {
                var result = res.data;
                if (result.error) {
                    this.callback(
                        $('<p>通信エラー ' + result.error + ": " + result.message + '</p>'),
                        false
                    );
                } else {
                    this.callback(result, true);
                }
            }
        }

    });
})(jQuery);
