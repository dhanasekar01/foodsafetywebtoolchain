'use strict';

app.home = kendo.observable({
    onShow: function () { },
    afterShow: function () { }
});
app.localization.registerView('home');

(function (parent) {
    var
        homeModel = kendo.observable({
            username: "",
            password: "",
            validateData: function () {
                var model = homeModel;

                if (homeModel.username == '' && homeModel.password == '') {
                    app.showNotification('Missing credentials');
                    return false;
                }

                if (homeModel.username == '') {
                    app.showNotification('Missing username');
                    return false;
                }

                if (homeModel.password == '') {
                    app.showNotification('Missing password');
                    return false;
                }
                return true;
            },
            signin: function () {
                if (homeModel.validateData()) {
                    var user = app.user;
                    var username = null,
                        peer = null,
                        displayname = null,
                        chaincodeid = null,
                        securecontext = null;
                    $.each(user, function (k, v) {
                        if (v.username == homeModel.username && v.password == homeModel.password) {
                            username = v.username;
                            peer = v.peer;
                            displayname = v.displayname;
                            chaincodeid = v.chaincodeid;
                            securecontext = v.securecontext;
                        }
                    });

                    if (username != null) {
                        app.login(username, peer, displayname, chaincodeid, securecontext);
                    } else {
                        app.showNotification('Please check your username and password');
                    }
                }
            }
        });

    parent.set('homeModel', homeModel);

    parent.set('onShow', function (e) {
        localStorage.clear();
        
    });

    parent.set('afterShow', function (e) {

    });
})(app.home);
