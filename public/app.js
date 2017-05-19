'use strict';

(function() {
    var app = {
        data: {},
        user:{},
        networkId:"cf0f5cf0db584db1beaa964a0d1a2e41",
        localization: {
            defaultCulture: 'en',
            cultures: [{
                name: "English",
                code: "en"
            }]
        },
        navigation: {
            viewModel: kendo.observable()
        },
        showMore: {
            viewModel: kendo.observable()
        },
        queryOptions: {
            "jsonrpc": "2.0",
            "method": "query",
            "params": {
                "type": 1,
                "chaincodeID": {
                    "name": ""
                },
                "ctorMsg": {
                    "function": "",
                    "args": []
                },
                "secureContext": ""
            },
            "id": 0
        },
        deployOptions: {
            "jsonrpc": "2.0",
            "method": "deploy",
            "params": {
                "type": 1,
                "chaincodeID": {
                    "path": ""
                },
                "ctorMsg": {
                    "function": "",
                    "args": []
                },
                "secureContext": ""
            },
            "id": 0
        },
        invokeOption: {
            "jsonrpc": "2.0",
            "method": "invoke",
            "params": {
                "type": 1,
                "chaincodeID": {
                    "name": ""
                },
                "ctorMsg": {
                    "function": "",
                    "args": [
                      "string"
                    ]
                },
                "secureContext": ""
            },
            "id": 0
        }
    };
    
    var bootstrap = function() {
        $(function() {
            app.mobileApp = new kendo.mobile.Application(document.body, {
                transition: 'slide',
                skin: 'nova',
                initial: 'components/home/view.html'
            });

            kendo.bind($('.navigation-link-text'), app.navigation.viewModel);
        });
    };

    $(document).ready(function() {

        var navigationShowMoreView = $('#navigation-show-more-view').find('ul'),
            allItems = $('#navigation-container-more').find('a'),
            navigationShowMoreContent = '';

        allItems.each(function(index) {
            navigationShowMoreContent += '<li>' + allItems[index].outerHTML + '</li>';
        });

        navigationShowMoreView.html(navigationShowMoreContent);
        kendo.bind($('#navigation-show-more-view'), app.showMore.viewModel);

        app.notification = $("#notify");

        $.getJSON('components/home/user.json',function(data){
            app["user"] = data;
         });

    });

    app.listViewClick = function _listViewClick(item) {
        var tabstrip = app.mobileApp.view().footer.find('.km-tabstrip').data('kendoMobileTabStrip');
        tabstrip.clear();
    };

    app.showNotification = function(message, time) {
        var autoHideAfter = time ? time : 3000;
        app.notification.find('.notify-pop-up__content').html(message);
        app.notification.fadeIn("slow").delay(autoHideAfter).fadeOut("slow");
    };

    app.queryApi = function (methodname, args) {
        var url = app.createPeer("/chaincode");
        var data = {
                    "jsonrpc": "2.0",
                    "method": "query",
                    "params": {
                        "type": 1,
                        "chaincodeID": {
                            "name": localStorage.getItem('chaincodeid')
                        },
                        "ctorMsg": {
                            "function": methodname,
                            "args": args
                        },
                        "secureContext": localStorage.getItem('securecontext')
                    },
                    "id": 0
                  };
    
        return this.postData(url, data);
    }


    app.invokeApi = function (methodname, args) {
        var url = app.createPeer("/chaincode");
        var data = {
            "jsonrpc": "2.0",
            "method": "invoke",
            "params": {
                "type": 1,
                "chaincodeID": {
                    "name": localStorage.getItem('chaincodeid')
                },
                "ctorMsg": {
                    "function": methodname,
                    "args": args
                },
                "secureContext": localStorage.getItem('securecontext')
            },
            "id": 0
        };

        return this.postData(url, data);
    }

    app.getChain = function () {
        var url = app.createPeer("/chain");
        var result = {};
        $.ajax({
            async: false,
            timeout: 15000,
            type: "GET",
            url: url,
            success: function (json) {
                console.log('Success - getting peer\'s chain data', json);
                result = json
            },
            error: function (e) {
                console.log('Error - failed to get chain data');
            }
        });
        return result;
    }

    app.getBlock = function (block) {
        var url = app.createPeer("/chain/blocks/" + block);
        var result = {};
        $.ajax({
            async: false,
            timeout: 15000,
            type: "GET",
            url: url,
            success: function (json) {
                result = json
            },
            error: function (e) {
                console.log('Error - failed to get chain data');
            }
        });
        return result;
    }

    app.postData = function (url, data) {
        var result = {};
        $.ajax({
            async: false,
            type: "POST",
            url: url,
            data: JSON.stringify(data),
            dataType: "application/json",
            complete: function (jqxhr, txt_status) {
                result = jqxhr;
            }
        });
        return result;
    }


    app.createPeer = function (api) {
        return "https://" + app.networkId + "-" + "vp0" + ".us.blockchain.ibm.com:5004" + (api != null ? api : "");
    }

    app.login = function (userName, peer, data, chaincodeid, securecontext) {
        if (localStorage) {
            localStorage.setItem("peer", peer);
            localStorage.setItem("userName", userName);
            localStorage.setItem("chaincodeid", chaincodeid);
            localStorage.setItem('displayname', data);
            localStorage.setItem('securecontext', securecontext);
            app.mobileApp.navigate("components/" + peer + "Home/view.html?name="+data);
        }
    };

    app.checkuser = function () {
        if (localStorage) {
            var peer = localStorage.getItem("peer")
            if (peer != null) {
                if (localStorage.getItem("peer") && localStorage.getItem("userName")) {
                    app.mobileApp.navigate("components/" + peer + "Home/view.html");
                } 
            } else {
                app.logout();
            }
        }
    };

    app.logout = function () {
        if (localStorage) {
            localStorage.clear();
            app.mobileApp.navigate("components/home/view.html?value=logout");
        }
    };

    if (window.cordova) {
        document.addEventListener('deviceready', function () {
            if (navigator && navigator.splashscreen) {
                navigator.splashscreen.hide();
            }
            bootstrap();
        }, false);
    } else {
        bootstrap();
    }

    

    app.getGeoLocation = function () {
        navigator.geolocation.getCurrentPosition(
            function (position) {
               /* alert('Latitude: ' + position.coords.latitude + '\n' +
                      'Longitude: ' + position.coords.longitude + '\n' +
                      'Altitude: ' + position.coords.altitude + '\n' +
                      'Accuracy: ' + position.coords.accuracy + '\n' +
                      'Altitude Accuracy: ' + position.coords.altitudeAccuracy + '\n' +
                      'Heading: ' + position.coords.heading + '\n' +
                      'Speed: ' + position.coords.speed + '\n' +
                      'Timestamp: ' + position.timestamp + '\n');*/
            },
            function (error) {
                alert('code: ' + error.code + '\n' +
                      'message: ' + error.message + '\n');
            });
    };


    app.keepActiveState = function _keepActiveState(item) {
        var currentItem = item;
        $('#navigation-container li.active').removeClass('active');
        currentItem.addClass('active');
    };

    window.app = app;

    app.isOnline = function() {
        if (!navigator || !navigator.connection) {
            return true;
        } else {
            return navigator.connection.type !== 'none';
        }
    };

    app.openLink = function(url) {
        if (url.substring(0, 4) === 'geo:' && device.platform === 'iOS') {
            url = 'http://maps.apple.com/?ll=' + url.substring(4, url.length);
        }

        window.open(url, '_system');
        if (window.event) {
            window.event.preventDefault && window.event.preventDefault();
            window.event.returnValue = false;
        }
    };

    /// start appjs functions
    /// end appjs functions
    app.showFileUploadName = function(itemViewName) {
        $('.' + itemViewName).off('change', 'input[type=\'file\']').on('change', 'input[type=\'file\']', function(event) {
            var target = $(event.target),
                inputValue = target.val(),
                fileName = inputValue.substring(inputValue.lastIndexOf('\\') + 1, inputValue.length);

            $('#' + target.attr('id') + 'Name').text(fileName);
        });

    };

    app.clearFormDomData = function(formType) {
        $.each($('.' + formType).find('input:not([data-bind]), textarea:not([data-bind])'), function(key, value) {
            var domEl = $(value),
                inputType = domEl.attr('type');

            if (domEl.val().length) {

                if (inputType === 'file') {
                    $('#' + domEl.attr('id') + 'Name').text('');
                }

                domEl.val('');
            }
        });
    };




    /// start kendo binders
    kendo.data.binders.widget.buttonText = kendo.data.Binder.extend({
        init: function(widget, bindings, options) {
            kendo.data.Binder.fn.init.call(this, widget.element[0], bindings, options);
        },
        refresh: function() {
            var that = this,
                value = that.bindings["buttonText"].get();

            $(that.element).text(value);
        }
    });
    /// end kendo binders
}());

/// start app modules
(function localization(app) {
    var localization = app.localization = kendo.observable({
            cultures: app.localization.cultures,
            defaultCulture: app.localization.defaultCulture,
            currentCulture: '',
            strings: {},
            viewsNames: [],
            registerView: function (viewName) {
                app[viewName].set('strings', getStrings() || {});

                this.viewsNames.push(viewName);
            }
        }),
        i, culture, cultures = localization.cultures,
        getStrings = function() {
            var code = localization.get('currentCulture'),
                strings = localization.get('strings')[code];

            return strings;
        },
        updateStrings = function() {
            var i, viewName, viewsNames,
                strings = getStrings();

            if (strings) {
                viewsNames = localization.get('viewsNames');

                for (i = 0; i < viewsNames.length; i++) {
                    viewName = viewsNames[i];

                    app[viewName].set('strings', strings);
                }

                app.navigation.viewModel.set('strings', strings);
                app.showMore.viewModel.set('strings', strings);
            }
        },
        loadCulture = function(code) {
            $.getJSON('cultures/' + code + '/app.json',
                function onLoadCultureStrings(data) {
                    localization.strings.set(code, data);
                });
        };

    localization.bind('change', function onLanguageChange(e) {
        if (e.field === 'currentCulture') {
            var code = e.sender.get('currentCulture');

            updateStrings();
        } else if (e.field.indexOf('strings') === 0) {
            updateStrings();
        } else if (e.field === 'cultures' && e.action === 'add') {
            loadCulture(e.items[0].code);
        }
    });

    for (i = 0; i < cultures.length; i++) {
        loadCulture(cultures[i].code);
    }

    localization.set('currentCulture', localization.defaultCulture);
})(window.app);