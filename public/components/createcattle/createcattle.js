'use strict';

app.createcattle = kendo.observable({
    onShow: function () { },
    afterShow: function () { }
});
app.localization.registerView('createcattle');

(function (parent) {
    var
        cattleModel = kendo.observable({
            getcattle: function (e) {
                var args = []
                args[0] = "";
                args[1] = "cattlehdr-54404";
                var headerjson = {
                    block: 199 + "",
                    type: "RMTRANSFER",
                    value: "NationalMeetPackingLtd:RMID6",
                    prevHash: "9sKhgQRWEURia0aIzZ7bGtw4p0ddiX9JQHZ3ymxibvq3CCTMmx7AEb+2eNIrs0NZ8IjipR0rKrWggn+OwoyeFQ=="
                };

                args.push(JSON.stringify(headerjson));
                result = app.invokeApi("updateHdr", args);
            }
        });

    parent.set('cattleModel', cattleModel);

    parent.set('onShow', function (e) {
        $("#cattlerow").hide();
    });

})(app.createcattle);
