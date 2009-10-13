/* ============================================================
listenin-now_class.js
 javascript classes for mixi app "listenin' now"
 http://mixi.jp/view_appli.pl?id=7793
============================================================ */
(function($) {
    // classes, keep them under a namespace
    window.Class = {};
    // Tracks
    Class.Tracks = $.classUtil.createClass({
        init: function(account) {
            this.account = account;
            this.template = $("dl.track", "#templates");
            this.showArea = $("#tracksArea");
            this.loading = new Class.LoadingImage();

            this.responseHandler = $.classUtil.createHandler(this, this.response);
            this.createEachDomHandler = $.classUtil.createHandler(this, this.createEachDom);
        },
        display: function(showLimit) {
            this.showLimit = showLimit || 5;
            this.showArea.empty();
            this.loading.showAt(this.showArea);
            this.request();
        },
        request: function() {
            var queries = {
                method: "user.getRecentTracks",
                user: this.account,
                limit: 40
            };
            Class.LastFm().request(queries, this.responseHandler);
        },
        response: function(res, message) {
            this.message = message;
            if (!message.length) {
                if (res.recenttracks && res.recenttracks.track) {
                    this.trackDatas = res.recenttracks.track;
                    //reduce nowplaying
                    this.trackDatas = $.grep(this.trackDatas, function(item, i) {
                        return (item["@attr"] && item["@attr"].nowplaying);
                    }, true);
                    //reduce data to showLimit
                    var self = this;
                    this.trackDatas = $.grep(this.trackDatas, function(item, i) {
                        return (i < self.showLimit);
                    });
                } else {
                    this.message = this.message.add('<p>データがありません。<br>last.fm側の「設定」->「プライバシー」->「リアルタイム再生データ」の「リアルタイム再生情報を隠す」にチェックがついていないか、又はアカウント名が違わないかご確認ください。</p>');
                }
            }
            this.show();
        },
        show: function() {
            this.loading.hide();
            if (this.message.length) {
                this.showArea.append(this.message);
            } else {
                $.each(this.trackDatas, this.createEachDomHandler);
                gadgets.window.adjustHeight();
            }
        },
        createEachDom: function(i, data) {
            var showObj = this.template.clone();
            // create displaying date
            var playedDate = new Date(data.date["uts"] * 1000);
            var now = new Date();
            var diff = now.getTime() - playedDate.getTime();
            var dateString;
            if (diff < 60 * 60 * 1000) { //less than hour
                dateString = (Math.floor(diff / 60 / 1000)) + "分前";
            } else if (diff < 24 * 60 * 60 * 1000) { // less than day
                dateString = (Math.floor(diff / 60/ 60 / 1000)) + "時間前";
            } else {
                dateString = playedDate.toLocaleDateString();
            }

            //image
            // $("dt.image a", showObj).attr("href", data.url);
            var img = $("dt.image img", showObj).attr({
                "src": data.image[0]["#text"] || "http://listenin-now.konk303.com/images/app/noimage.png",
                "alt": data.artist["#text"] + " - " + data.name,
                "title": data.artist["#text"] + " - " + data.name
            })
            if (!data.image[0]["#text"]) {
                img.addClass("noimage");
                Class.ArtistImages().replace(data.artist["#text"], img);
            }
            //name
            $("p.name a", showObj).
            attr({"href":data.url, "title":data.name}).text(data.name);
            //artist
            $("p.artist a", showObj).
            attr({
                "href": "http://www.last.fm/music/" + encodeURIComponent(data.artist["#text"]),
                "title": data.artist["#text"]
            }).
            text(data.artist["#text"]);
            //album
            $("p.album a", showObj).
            attr({
                "href": "http://www.last.fm/music/" + encodeURIComponent(data.artist["#text"]) + "/" + encodeURIComponent(data.album["#text"]),
                "title": data.album["#text"]
            }).
            text(data.album["#text"])
            //date
            $("p.date", showObj).text(dateString);
            //iTS link
            var button_iTS = $("div.button_iTS", showObj);
            new Class.Search_iTS(button_iTS, data.artist["#text"] + " " + data.name);
            //community link
            var button_community = $("div.button_community", showObj);
            new Class.SearchCommunity(button_community, data.artist["#text"]);

            // only for IE6
            showObj.hover( 
                function(){$(this).addClass("hover");},
                function(){$(this).removeClass("hover");}
            );
            this.showArea.append(showObj);
        }
    });

    // artist image, replace the song image when there's no data
    Class.ArtistImageData = $.classUtil.createClassSingleton({
        init: function() {
            this.images = {};
        }
    });
    Class.ArtistImages = $.classUtil.createClass({
        init: function() {
            this.FETCHING_STRING = "fetching";
            this.images = Class.ArtistImageData().images;
            this.checkFetchingHandler = $.classUtil.createHandler(this, this.checkFetching);
            this.responseHandler = $.classUtil.createHandler(this, this.response);
        },
        replace: function(artistName, imgObj, size) {
            this.artist = artistName;
            this.imgObj = imgObj;
            this.size = size || 0;
            if (this.images[this.artist]) {
                this.checkFetching();
            } else {
                this.request();
            }
        },
        checkFetching: function() {
            if (this.images[this.artist] == this.FETCHING_STRING) {
                window.setTimeout(this.checkFetchingHandler, 500);
            } else {
                this.replaceImage();
            }
        },
        replaceImage: function() {
            if (this.images[this.artist][this.size]["#text"]) {
                this.imgObj.
                attr("src", this.images[this.artist][this.size]["#text"]).
                removeClass("noimage");
            }
        },
        request: function() {
            this.images[this.artist] = this.FETCHING_STRING;
            var queries = {
                method: "artist.getInfo",
                artist: this.artist
            };
            Class.LastFm().request(queries, this.responseHandler);
        },
        response: function(res, message) {
            if (!message.length && res.artist) {
                var artist = res.artist;
                this.images[artist.name] = artist.image;
                this.replaceImage();
                //post data to cache, to be classed.
                if (!artist.cached_by_listenin_now) this.postResponse(artist);
            } else {
                this.images[this.artist] = "";
            }
        },
        postResponse: function(artist) {
            var req = new Class.IoRequest();
            req.param("METHOD", req.io.MethodType.POST).
            param("AUTHORIZATION", req.io.AuthorizationType.NONE).
            param("CONTENT_TYPE", req.io.ContentType.JSON).
            param("POST_DATA",
                  $.param({
                      artist: artist.name,
                      image: gadgets.json.stringify(artist.image),
                      container: "mixi",
                      updater_id: Class.OwnerAccount().id,
                      updater_name: Class.OwnerAccount().name
                  })).
            request(ListeninNowConfig.base_uri + "/api/artist");
        }
    });
    // Ranking
    Class.Ranking = $.classUtil.createClass({
        init: function(account, showArea) {
            this.account = account;
            this.showArea = showArea;
            this.template = $("dl.ranking", "#templates");
            this.loading = new Class.LoadingImage();

            this.responseHandler = $.classUtil.createHandler(this, this.response);
            this.createEachDomHandler = $.classUtil.createHandler(this, this.createEachDom);
        },
        display: function(showLimit) {
            this.showLimit = showLimit || 1;
            this.showArea.empty();
            this.loading.showAt(this.showArea);
            this.request();
        },
        request: function() {
            var queries = {
                method: "user.getTopArtists",
                user: this.account
            };
            Class.LastFm().request(queries, this.responseHandler);
        },
        response: function(res, message) {
            this.message = message;
            if (!message.length) {
                if (res.topartists && res.topartists.artist) {
                    this.rankingDatas = res.topartists.artist;
                    var self = this;
                    //reduce data to showLimit
                    this.rankingDatas = $.grep(this.rankingDatas, function(item, i) {
                        return (i < self.showLimit);
                    });
                } else {
                    this.message = this.message.add('<p>データがありません。</p>');
                }
                if (!res.topartists.cached_by_listenin_now) this.postResponse(res);
            }
            this.show();
        },
        postResponse: function(data) {
            var req = new Class.IoRequest();
            req.param("METHOD", req.io.MethodType.POST).
            param("AUTHORIZATION", req.io.AuthorizationType.NONE).
            param("CONTENT_TYPE", req.io.ContentType.JSON).
            param("POST_DATA",
                  $.param({
                      user: this.account,
                      data: gadgets.json.stringify(data),
                      container: "mixi",
                      updater_id: Class.OwnerAccount().id,
                      updater_name: Class.OwnerAccount().name
                  })).
            request(ListeninNowConfig.base_uri + "/api/user_topArtist");
        },
        show: function() {
            this.loading.hide();
            if (this.message.length) {
                this.showArea.append(this.message);
            } else {
                $.each(this.rankingDatas, this.createEachDomHandler);
            }
        },
        createEachDom: function(i, data) {
            var showObj = this.template.clone();
            //image
            // $("dt.image a", showObj).attr("href", data.url);
            $("dt.image img", showObj).attr({
                "src": data.image[1]["#text"] || "http://listenin-now.konk303.com/images/app/noimage.png",
                "alt": data.name,
                "title": data.name
            })
            //name
            $("p.name a", showObj).
            attr({"href":data.url, "title":data.name}).text(data.name);
            //playcount
            $("p.playcount", showObj).text(data.playcount + "回再生");
            //iTS link
            var button_iTS = $("div.button_iTS", showObj);
            new Class.Search_iTS(button_iTS, data.name);
            //community link
            var button_community = $("div.button_community", showObj);
            new Class.SearchCommunity(button_community, data.name);

            this.showArea.append(showObj);
        }
    });
    // search community
    Class.SearchCommunity = $.classUtil.createClass ({
        init: function(targetArea, term) {
            this.targetArea = targetArea;
            this.term = term;

            this.doSearchHandler = $.classUtil.createHandler(this, this.doSearch);
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
    Class.Search_iTS = $.classUtil.createClass({
        init: function(targetArea, term) {
            this.targetArea = targetArea;
            this.term = term;
            this.iTS_apiUrl = "http://ax.phobos.apple.com.edgesuite.net/WebObjects/MZStoreServices.woa/wa/wsSearch?";
            this.requested = false;
            this.loading = new Class.LoadingImage();

            this.showHandler = $.classUtil.createHandler(this, this.show);
            this.hideHandler = $.classUtil.createHandler(this, this.hide);
            this.responseHandler = $.classUtil.createHandler(this, this.response);
            this.createEachDomHandler = $.classUtil.createHandler(this, this.createEachDom);
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
            var img = data.artworkUrl100 || "http://listenin-now.konk303.com/images/app/noimage.png";
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
    Class.LoadingImage = $.classUtil.createClass({
        init: function() {
            this.showObj = $("div.loading", "div#templates").clone();
        },
        showAt: function(area) {
            this.showObj.appendTo(area).show();
        },
        hide: function() {
            this.showObj.hide();
        }
    });
    // owner account
    Class.OwnerAccount = $.classUtil.createClassSingleton({
        init: function() {
            this.showArea = $("#infoArea");
            this.accountArea = $("#accountArea");
            this.keyOwner = "owner";
            this.keyViewer = "viewer";
            this.keyLf = "lf_account";
            this.message = new gadgets.MiniMessage();
            this.messageArea = false;
            this.loading = new Class.LoadingImage();

            this.responseHandler = $.classUtil.createHandler(this, this.response);
            this.requestUpdateLfHandler = $.classUtil.createHandler(this, this.requestUpdateLf);
            this.responseUpdateLfHandler = $.classUtil.createHandler(this, this.responseUpdateLf);
            this.showInputBoxHandler = $.classUtil.createHandler(this, this.showInputBox);
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
            req.add(this.keyLf, "newFetchPersonAppDataRequest", [req.idSpec({userId: "OWNER"}), [this.keyLf]]);
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
                Class.Tracks(this.lf_account).display(Class.View().name == "canvas" ? 40: 5);
                if (Class.View().name == "canvas") {
                    Class.Ranking(this.lf_account, $("#rankingsArea")).display(5);
                }
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
    // owner's friends
    Class.Friends = $.classUtil.createClassSingleton({
        init: function() {
            this.showArea = $("#friendsArea");
            this.template = $("dl.friends", "#templates");
            this.loading = new Class.LoadingImage();
            this.FriendsKeyName = "friends";
            this.DataPerPage = 5;
            this.responseHandler = $.classUtil.createHandler(this, this.response);
            this.createEachDomHandler = $.classUtil.createHandler(this, this.createEachDom);
            this.displayHandler = $.classUtil.createHandler(this, this.display);
            this.pager = new Class.Pager(this.showArea, this.DataPerPage, this.displayHandler);
        },
        display: function(offset) {
            this.offset = offset || 0;
            this.showArea.empty();
            this.loading.showAt(this.showArea);
            this.request();
        },
        request: function() {
            var req = new Class.OsRequest();
            var idSpec = req.idSpec({userId: "OWNER", groupId: "FRIENDS"});
            var params = {};
            // params[req.PeopleRequestFields("FILTER")] = req.FilterType("HAS_APP");
            params[req.PeopleRequestFields("FIRST")] = this.offset;
            params[req.PeopleRequestFields("MAX")] = this.DataPerPage;
            params[req.PeopleRequestFields("PROFILE_DETAILS")] = [
                opensocial.Person.Field.PROFILE_URL,
                opensocial.Person.Field.GENDER,
                opensocial.Person.Field.AGE
            ];
            req.add(this.FriendsKeyName, "newFetchPeopleRequest", [idSpec, params]).
            request(this.responseHandler);
        },
        response: function(res) {
            var result = res.get(this.FriendsKeyName).getData();
            this.datas = $.map(result.asArray(), function(data) {
                return {
                    id: data.getId(),
                    name: data.getDisplayName(),
                    image: data.getField(opensocial.Person.Field.THUMBNAIL_URL) || "noimage",
                    url: data.getField(opensocial.Person.Field.PROFILE_URL),
                    gender: data.getField(opensocial.Person.Field.GENDER).displayValue || "",
                    age: data.getField(opensocial.Person.Field.AGE) || ""
                };
            });
            this.totalSize = result.getTotalSize();
            this.offset = result.getOffset();
            // fetch each personappdata
            this.show();
        },
        show: function() {
            this.loading.hide();
            if (this.totalSize > this.DataPerPage) {
                //this.pager.display(this.offset, this.totalSize);
            }
            $.each(this.datas, this.createEachDomHandler);
        },
        createEachDom: function(i, data) {
            var showObj = this.template.clone();
            $("dt a", showObj).attr("href", data.url).click(
                Class.View().createGoToCanvasHandler(data.id)
            );
            $("dt img", showObj).attr({"src": data.image, title: data.name + "さんのリスニンなう"});
            $("dt span", showObj).text(
                data.name + "さん " + (data.age || data.gender ? "（" + data.gender + " " + data.age + "）" : "")
            );

            this.showArea.append(showObj);
        }
    });
    // View
    Class.View = $.classUtil.createClassSingleton({
        init: function() {
            this.viewObj = gadgets.views;
            this.name = this.viewObj.getCurrentView().getName();
            this.views = this.viewObj.getSupportedViews();

            this.goToProfileHandler = $.classUtil.createHandler(this, this.goToProfile);
            this.goToAppHomeHandler = $.classUtil.createHandler(this, this.goToAppHome);
            this.inviteFriendsHandler = $.classUtil.createHandler(this, this.inviteFriends);
            this.goToCanvasHandler = $.classUtil.createHandler(this, this.goToCanvas);
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
        goToCanvas: function(e, id) {
            e.preventDefault();
            gadgets.views.requestNavigateTo(this.views["canvas"], null, id || this.owner.id);
        },
        createGoToCanvasHandler: function(id) {
            return $.classUtil.createHandler(this, this.goToCanvas, id);
        }
    });
    // opensocial request
    Class.OsRequest = $.classUtil.createClass({
        init: function() {
            this.responseHandler = $.classUtil.createHandler(this, this.response);
            this.req = opensocial.newDataRequest();
        },
        add: function(key, method, param) {
            this.req.add(this.req[method].apply(this.req, param), key);
            return this; // chainable
        },
        request: function(callback) {
            this.callback = callback;
            this.req.send(this.responseHandler);
        },
        response: function(res) {
            if (res.hadError()) {
                // alert(res.getErrorMessage());
            } else {
                this.callback(res);
            }
        },
        // accessors
        idSpec: function(keys) {
            return opensocial.newIdSpec(keys);
        },
        PeopleRequestFields: function(key) {
            return opensocial.DataRequest.PeopleRequestFields[key];
        },
        FilterType: function(key) {
            return opensocial.DataRequest.FilterType[key];
        }
    });
    // gadget io request
    Class.IoRequest = $.classUtil.createClass({
        init: function() {
            this.responseHandler = $.classUtil.createHandler(this, this.response);
            this.params = {};
            this.io = gadgets.io;
        },
        param: function(key, val) {
            this.params[this.io.RequestParameters[key]] = val;
            return this; // chainable
        },
        request: function(location, callback) {
            this.callback = callback;
            gadgets.io.makeRequest(location, this.responseHandler, this.params);
        },
        response: function(res) {
            if (res.errors && res.errors.length) {
//                 alert("エラー:\n" + res.errors.join("\n"));
            } else {
                this.callback(res.data, res);
            }
        }
    });
    //last.fm api
    Class.LastFm = $.classUtil.createClass({
        init: function() {
            this.lf_apiUrl = ListeninNowConfig.base_uri + "/api/lastfm?";
            this.responseHandler = $.classUtil.createHandler(this, this.response);
        },
        request: function(queries, callback) {
            this.callback = callback;
            var requestUrl = this.lf_apiUrl + $.param(queries);
            var req = new Class.IoRequest();
            req.param("METHOD", req.io.MethodType.GET).
            param("AUTHORIZATION", req.io.AuthorizationType.NONE).
            param("CONTENT_TYPE", req.io.ContentType.JSON).
            request(requestUrl, this.responseHandler);
        },
        response: function(res) {
            var message = $([]);
            if (res.error) {
                message = message.add('<p>通信エラー ' + res.error + ": " + res.message + '</p>');
            }
            this.callback(res, message);
        }
    });
    //what's new
    Class.WhatsNew = $.classUtil.createClass({
        init: function() {
            this.template = $("dl.whatsnew", "#templates");
            this.showArea = $("#whatsnewArea");
            this.loading = new Class.LoadingImage();
            this.rssUrl = "http://feeds.feedburner.com/listenin-now";
            this.maxDisplay = 1; // display entries count
            this.validDays = 5; // display until

            this.responseHandler = $.classUtil.createHandler(this, this.response);
            this.createEachDomHandler = $.classUtil.createHandler(this, this.createEachDom);
        },
        display: function() {
            this.showArea.empty().show();
            this.loading.showAt(this.showArea);
            this.request();
        },
        request: function() {
            var req = new Class.IoRequest();
            req.param("METHOD", req.io.MethodType.GET).
            param("AUTHORIZATION", req.io.AuthorizationType.NONE).
            param("CONTENT_TYPE", req.io.ContentType.FEED).
            param("GET_SUMMARIES", false).
            param("NUM_ENTRIES", this.maxDisplay).
            request(this.rssUrl, this.responseHandler);
        },
        response: function(res) {
            var self = this;
            this.entries = $.grep(res.Entry, function(entry) {
                // mixi returns js date(ms), should be uts.
                entry.Date = new Date(window.mixi ? entry.Date : entry.Date * 1000);
                var now = new Date();
                var valid = now.setDate(now.getDate() - self.validDays);
                return (entry.Date.getTime() > valid);
            });
            this.show();
        },
        show: function() {
            this.loading.hide();
            $.each(this.entries, this.createEachDomHandler);
        },
        createEachDom: function(i, data) {
            var showObj = this.template.clone();
            $("dt", showObj).text(data.Date.toLocaleDateString());
            $("dd a", showObj).attr("href", data.Link).text(data.Title);
            this.showArea.append(showObj);
        }
    });
    // pager
    Class.Pager = $.classUtil.createClass({
        init: function(showArea, dataPerPage, handler, totalSize) {
            this.showArea = showArea;
            this.dataPerPage = dataPerPage;
            this.handler = handler;
            this.totalSize = totalSize || 0;
            this.template = $("ol.pager", "#templates");
        },
        display: function(offset, totalSize, displayPosition) {
            this.offset = offset;
            if (totalSize) this.totalSize = totalSize;
            showArea[displayPosition == "top" ? "prepend" : "append"](this.createDom());
        },
        createDom: function() {
            var showObj = this.template.clone();
            this.pageSize = Math.ceil(this.totalSize / this.dataPerPage);
            console.log("pager");
        }
    });

    // showObjBase. currently not used, to be extendend as a base for each showing classes.
    Class.showObjBase = $.classUtil.createClassSingleton({
        init: function(showArea, template) {
            this.showArea = showArea || $([]);
            this.template = template || $([]);
            this.loading = new Class.LoadingImage();

            this.responseHandler = $.classUtil.createHandler(this, this.response);
            this.createEachDomHandler = $.classUtil.createHandler(this, this.createEachDom);
        },
        display: function() {
            this.showArea.empty();
            this.loading.showAt(this.showArea);
            this.request();
        },
        request: function() {
        },
        response: function(res) {
            this.datas = res;
            this.show();
        },
        show: function() {
            this.loading.hide();
            $.each(this.datas, this.createEachDomHandler);
        },
        createEachDom: function(i, data) {
            var showObj = this.template.clone();
            this.showArea.append(showObj);
        }
    });
})(jQuery);
