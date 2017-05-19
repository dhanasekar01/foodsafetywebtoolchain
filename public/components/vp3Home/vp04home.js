'use strict';

app.vp04home = kendo.observable({
    onShow: function () { },
    afterShow: function () { }
});
app.localization.registerView('vp04home');

(function (parent) {
    var knownBlock = {};
    var
        vp04homeModel = kendo.observable({
            displayname: "",
            pkginventory: 0,
            recvpkgList: [],
            showTransaction: function (e) {
                var pkgid = vp04homeModel.pkgid;
                if (pkgid == "") {
                    app.showNotification("Please select Package id");
                    return false;
                }

                var cattletag = "';"
                var cattleinfo = [];
                // Foodinfo information
                var foodinfo = [];
                var result = app.queryApi("getCattle", [pkgid]);
                if (result.status == 200) {
                    var data = JSON.parse(result.responseText);
                    try {
                        var message = JSON.parse(data.result.message);
                        foodinfo.push(message);
                        var rmid = message.sourcetag;

                        result = app.queryApi("getCattle", [rmid]);
                        if (result.status == 200) {
                            data = JSON.parse(result.responseText);
                            message = JSON.parse(data.result.message);
                            cattletag = message.sourcetag;

                            result = app.queryApi("getCattle", [cattletag]);
                            if (result.status == 200) {
                                var data = JSON.parse(result.responseText);
                                try {
                                    cattleinfo.push(JSON.parse(data.result.message));
                                } catch (e) {
                                    console.log(e);
                                }
                            }
                        }
                    } catch (e) {
                        console.log(e);
                    }
                }

                if (foodinfo.length < 0) {
                    app.showNotification("TAG information is not found");
                    return false;
                }
                var masterdata = [], datavalue = {}, items = [], itemsvalue = {};

                var cattlehdrmessage = [];
                var result1 = app.queryApi("getCattle", ["cattlehdr-" + cattletag]);
                if (result1.status == 200) {
                    var data1 = JSON.parse(result1.responseText);
                    var message1 = JSON.parse(data1.result.message);
                    cattlehdrmessage.push(message1);

                    var createdata = {};
                    var batchdata = {}, batcharr = [];
                    var transferdata = {}, trnasferarr = [];
                    var rmcreationdata = {}, rmcreationarr = [];
                    var rmbatchdata = {}, rmbatch = [];
                    var rmtransferdata = {}, rmtransferarr = [];
                    var foodpkgcreationdata = {}, foodpkgcreation = [];
                    var foodpkgbatchdata = {}, foodpkgbatcharr = [];
                    var foodpkgtransferdata = {}, foodpkgtransfer = [];

                    var len = message1.blockheader.length;

                    for (var i = len - 1 ; i >= 0 ; i--) {
                        var hdrinfo = JSON.parse(message1.blockheader[i]);

                        if (hdrinfo.type == "PKGTRANSFER") {
                            foodpkgtransferdata = {};
                            foodpkgtransferdata["block"] = hdrinfo.block;
                            foodpkgtransferdata["type"] = hdrinfo.type;
                            foodpkgtransferdata["value"] = hdrinfo.value;
                            foodpkgtransferdata["prevHash"] = hdrinfo.prevHash;
                            foodpkgtransfer.push(foodpkgtransferdata)

                        } else if (hdrinfo.type == "PKGCREATION") {
                            foodpkgcreationdata = {};
                            foodpkgcreationdata["block"] = hdrinfo.block;
                            foodpkgcreationdata["type"] = hdrinfo.type;
                            foodpkgcreationdata["value"] = hdrinfo.value;
                            foodpkgcreationdata["prevHash"] = hdrinfo.prevHash;
                            foodpkgcreation.push(foodpkgcreationdata)

                        } else if (hdrinfo.type == "RMTRANSFER") {
                            rmtransferdata = {};
                            rmtransferdata["block"] = hdrinfo.block;
                            rmtransferdata["type"] = hdrinfo.type;
                            rmtransferdata["value"] = hdrinfo.value;
                            rmtransferdata["prevHash"] = hdrinfo.prevHash;

                            var rmid = hdrinfo.value.split(":")[1];
                            for (var j = 0; j < foodpkgcreation.length; j++) {
                                var pkgvalue = foodpkgcreation[j].value;

                                if (typeof pkgvalue != "object") {
                                    pkgvalue = JSON.parse(pkgvalue);
                                }
                                if (pkgvalue.rmid == rmid) {
                                    items = [];
                                    for (var k = 0 ; k < pkgvalue.pkgids.length ; k++) {
                                        foodpkgcreationdata = {};
                                        foodpkgcreationdata["block"] = foodpkgcreation[j].block;
                                        foodpkgcreationdata["type"] = foodpkgcreation[j].type;
                                        foodpkgcreationdata["value"] = pkgvalue.pkgids[k];
                                        foodpkgcreationdata["prevHash"] = foodpkgcreation[j].prevHash;
                                        var inneritems = [];
                                        for (var h = 0 ; h < foodpkgtransfer.length ; h++) {
                                            var pkgid = foodpkgtransfer[h].value.split(":")[1];
                                            if (pkgvalue.pkgids[k] == pkgid) {
                                                inneritems.push(foodpkgtransfer[h]);
                                                foodpkgcreationdata["items"] = inneritems;
                                            }
                                        }

                                        items.push(foodpkgcreationdata);
                                    }
                                    rmtransferdata["items"] = items;
                                }
                            }

                            rmtransferarr.push(rmtransferdata);

                        } else if (hdrinfo.type == "RAWMEATBATCH") {
                            rmbatchdata = {};
                            rmbatchdata["block"] = hdrinfo.block;
                            rmbatchdata["type"] = hdrinfo.type;
                            rmbatchdata["value"] = hdrinfo.value;
                            rmbatchdata["prevHash"] = hdrinfo.prevHash;

                            var rmid = hdrinfo.value.split(":")[1];

                            for (var j = 0; j < rmtransferarr.length; j++) {
                                var transferrmid = rmtransferarr[j].value.split(":")[1];
                                if (rmid == transferrmid) {
                                    items = [];
                                    items.push(rmtransferarr[j])
                                    rmbatchdata["items"] = items;
                                }
                            }

                            rmbatch.push(rmbatchdata)
                        } else if (hdrinfo.type == "RAWMEATCREATION") {
                            rmcreationarr = [];
                            var value1 = hdrinfo.value;
                            if (typeof value != "object") {
                                value1 = eval(value1);
                            }
                            for (var j = 0 ; j < value1.length; j++) {
                                rmcreationdata = {};
                                var rmid = value1[j];
                                rmcreationdata["block"] = hdrinfo.block;
                                rmcreationdata["type"] = hdrinfo.type;
                                rmcreationdata["value"] = rmid;
                                rmcreationdata["prevHash"] = hdrinfo.prevHash;

                                for (var k = 0; k < rmbatch.length; k++) {
                                    var rmbatchvalue = rmbatch[k].value.split(":");
                                    if (rmid == rmbatchvalue[1]) {
                                        items = [];
                                        items.push(rmbatch[k])
                                        rmcreationdata["items"] = items;
                                    }
                                }

                                rmcreationarr.push(rmcreationdata);
                            }
                        } else if (hdrinfo.type == "TRANSFER") {
                            transferdata["block"] = hdrinfo.block;
                            transferdata["type"] = hdrinfo.type;
                            transferdata["value"] = hdrinfo.value;
                            transferdata["prevHash"] = hdrinfo.prevHash;
                            transferdata["items"] = rmcreationarr;
                        } else if (hdrinfo.type == "BATCH") {
                            items = [];
                            batchdata["block"] = hdrinfo.block;
                            batchdata["type"] = hdrinfo.type;
                            batchdata["value"] = hdrinfo.value;
                            batchdata["prevHash"] = hdrinfo.prevHash;
                            items.push(transferdata);
                            batchdata["items"] = items;
                        } else if (hdrinfo.type == "CREATE") {
                            items = [];
                            createdata["species"] = cattleinfo[0].species;
                            createdata["cattletype"] = cattleinfo[0].cattletype;
                            createdata["cattleid"] = cattleinfo[0].cattleid;
                            createdata["cattletag"] = cattleinfo[0].cattletag;
                            createdata["birthdate"] = cattleinfo[0].birthdate;
                            createdata["weight"] = cattleinfo[0].weight + " pounds";
                            createdata["farmerid"] = cattleinfo[0].farmerid;
                            createdata["status"] = cattleinfo[0].status;
                            createdata["certificate"] = cattleinfo[0].certificate;
                            createdata["block"] = hdrinfo.block;
                            createdata["type"] = hdrinfo.type;
                            createdata["value"] = hdrinfo.value;
                            createdata["prevHash"] = hdrinfo.prevHash;
                            items.push(batchdata);
                            createdata["items"] = items;
                        }
                    }

                    masterdata.push(createdata);

                    createDiagram(masterdata);

                }

            },
            showrecved: function (e) {
                if (vp04homeModel.recvpkgList) {
                    var template = kendo.template($("#pkgcatalogTemplate").html());
                    var message = JSON.parse(vp04homeModel.recvpkgList.result.message);
                    var cattlearr = []
                    var duplicate = [];
                    $.each(message.transfer, function (k, v) {
                        var transferdata = JSON.parse(v);
                        var arr = [], args=[];
                        args.push(transferdata.id);
                        if ($.inArray(transferdata.id, duplicate) < 0) {
                            duplicate.push(transferdata.id);
                            var result = app.queryApi("getCattle", args);
                            if (result.status == 200) {
                                var data1 = JSON.parse(result.responseText);
                                var message1 = JSON.parse(data1.result.message);
                                arr.push(message1);
                            }
                        }

                        var cattleJson = {
                            pkg: arr,
                            transferdetail: transferdata
                        }

                        cattlearr.push(cattleJson);
                    });

                    var recv = {
                        pkg: cattlearr
                    }

                    vp04homeModel.cattleJson = recv;

                    var result = template(recv);
                    setTimeout(function () {
                        $(".pkgcatalog").removeClass("el-loading").addClass("el-loading-done");
                        $("#pkgcatalog").html(result);
                    }, 3000);
                }
            },
            logout: function (e) {
                app.logout();
            }
        });

    parent.set('vp04homeModel', vp04homeModel);

    parent.set('onShow', function (e) {


        $("body").removeClass("page-red").removeClass("page-blue").removeClass("page-purple").addClass("page-yellow");

        if (e && e.view && e.view.params) {
            var name = e.view.params.name;
            vp04homeModel.set('displayname', name);
        } else {
            vp04homeModel.set('displayname', localStorage.getItem('displayname'));
        }

        updateinventory();

        initTabStrip();

        vp04homeModel.showrecved();
    });

    function visualTemplate(options) {
        var dataviz = kendo.dataviz;
        var g = new dataviz.diagram.Group();
        var dataItem = options.dataItem;

        console.log(JSON.stringify(dataItem));

        var name = "", title = "", image = "", gradientcolor = "", via = false, content = "", height = 65, width = 190;

        if (dataItem.type == "CREATE") {
            name = "Cattle Tag - " + dataItem.cattletag;
            title = dataItem.cattletype;
            image = "components/home/farmer.png";
            gradientcolor = "#2196f3";
            content = "Farmer"
        } else if (dataItem.type == "BATCH") {
            name = "Lot ID -" + dataItem.value;
            title = "";
            image = "components/home/batch.png";
            gradientcolor = "#8700ff";
            content = "Batch Created";
        }
        else if (dataItem.type == "TRANSFER") {
            name = dataItem.value;
            title = "";
            image = "components/home/transfer.png";
            gradientcolor = "#00e68a";
            content = "Transfered to Fresh Meats";
        }
        else if (dataItem.type == "RAWMEATCREATION") {
            name = "Raw Meat";
            title = dataItem.value;
            image = "components/home/rawmeatcreate.png";
            gradientcolor = "#f44336";
            content = "Raw meats creation";
        } else if (dataItem.type == "RAWMEATBATCH") {
            name = "Raw Meat Batch";
            title = dataItem.value;
            image = "components/home/meat.gif";
            gradientcolor = "#ffaa00";
            content = "Raw meats Batch creation";
        } else if (dataItem.type == "RMTRANSFER") {
            name = "Meat Packaging Ltd";
            title = dataItem.value.split(":")[1];
            image = "components/home/transfer.png";
            gradientcolor = "#00e68a";
            content = "Transfered to Meat Packaging Ltd";
            width = 250;
        } else if (dataItem.type == "PKGCREATION") {
            name = "Package Creation";
            title = dataItem.value;
            image = "components/home/pkg.png";
            gradientcolor = "#e600e6";
            content = "Package Creation";
        } else if (dataItem.type == "PKGTRANSFER") {
            name = "Package Transfer";
            title = dataItem.value;
            image = "components/home/retailer.png";
            gradientcolor = "#1e4c96";
            content = "Package Transfer";
        }

        g.append(new dataviz.diagram.Rectangle({
            width: width,
            height: 65,
            stroke: {
                width: 0
            },
            tooltip: {
                shared: true,
                content: content,
                autoHide: false,
                position: "right"
            },
            fill: {
                gradient: {
                    type: "linear",
                    stops: [{
                        color: gradientcolor,
                        offset: 0,
                        opacity: 0.5
                    }, {
                        color: gradientcolor,
                        offset: 1,
                        opacity: 1
                    }]
                }
            }
        }));

        g.append(new dataviz.diagram.TextBlock({
            text: name,
            x: 55,
            y: 10,
            fill: "#fff"
        }));

        if (via) {
            g.append(new dataviz.diagram.TextBlock({
                text: "to",
                x: 75,
                y: 30,
                fill: "#fff"
            }));

            g.append(new dataviz.diagram.TextBlock({
                text: title,
                x: 55,
                y: 50,
                fill: "#fff"
            }));
        } else {
            g.append(new dataviz.diagram.TextBlock({
                text: title,
                x: 55,
                y: 30,
                fill: "#fff"
            }));
        }



        g.append(new dataviz.diagram.Image({
            source: image,
            x: 3,
            y: 3,
            width: 50,
            height: 50
        }));

        return g;
    }

    var diagram = kendo.dataviz.diagram;
    var Shape = diagram.Shape;
    var Connection = diagram.Connection;
    var Point = diagram.Point;

    function elementText(element) {
        var text;
        if (element instanceof Shape) {
            text = element.dataItem;
        } else if (element instanceof Point) {
            text = "(" + element.x + "," + element.y + ")";
        } else if (element instanceof Connection) {
            var source = element.source();
            var target = element.target();
            var sourceElement = source.shape || source;
            var targetElement = target.shape || target;
            text = elementText(sourceElement) + " - " + elementText(targetElement);
        }
        return text;
    }

    function onSelect(e) {

        var dialog = $("#blockwindow").data("kendoWindow");
        var html = "<table class='table'>";
        var dataItem = e.item.dataItem;

        try {
            var block = dataItem.block;
            var blockdata = app.getBlock(block);

            var txid = blockdata.transactions[0].txid;
            html += "<tr><td><strong>Transaction Id : </strong></td><td>" + txid + "</td></tr>";
            var payload = window.atob(blockdata.transactions[0].payload);
            html += "<tr><td><strong>Payload : </strong></td><td>" + payload + "</td></tr>";
            var unix_timestamp = blockdata.transactions[0].timestamp.seconds;

            var date = new Date(unix_timestamp * 1000);
            html += "<tr><td><strong>Date : </strong></td><td>" + date.toDateString() + "</td></tr>";
            // Hours part from the timestamp
            var hours = date.getHours();
            // Minutes part from the timestamp
            var minutes = "0" + date.getMinutes();
            // Seconds part from the timestamp
            var seconds = "0" + date.getSeconds();

            // Will display time in 10:30:23 format
            var formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
            html += "<tr><td><strong>Time : </strong></td><td>" + formattedTime + "</td></tr>";
            html + "</table>";


            if (dataItem.type == "CREATE") {

            } else if (dataItem.type == "TRANSFER") {

            }

            if (dialog == undefined) {
                dialog = $("#blockwindow").kendoWindow({
                    width: "500px",
                    title: "Block Information",
                    visible: false,
                    actions: [
                        "Maximize",
                        "Close"
                    ]
                });
                dialog = $("#blockwindow").data("kendoWindow");
                dialog.content(html);
                dialog.center().open();
            } else {
                dialog.content(html);
                dialog.center().open();
            }
        } catch (e) {
            console.log("Error getting block information" + e);
        }
    }


    function createDiagram(data) {
        $("#diagramsection").show();
        $("#diagram").kendoDiagram({
            dataSource: new kendo.data.HierarchicalDataSource({
                data: data,
                schema: {
                    model: {
                        children: "items"
                    }
                }
            }),
            layout: {
                type: "layered"
            },
            shapeDefaults: {
                visual: visualTemplate
            },
            connectionDefaults: {
                stroke: {
                    color: "#979797",
                    width: 2
                },
                startCap: "FilledCircle",
                endCap: "ArrowEnd"
            },
            click: onSelect
        });

        var diagram = $("#diagram").getKendoDiagram();
        diagram.bringIntoView(diagram.shapes);
    }


    function initTabStrip() {
        $("#retailertabstrip").kendoTabStrip({
            activate: function (e) {
                var txt = $(e.item).find("> .k-link").text();
            },
            animation: {
                // fade-out current tab over 1000 milliseconds
                close: {
                    duration: 200,
                    effects: "fadeOut"
                },
                // fade-in new tab over 500 milliseconds
                open: {
                    duration: 200,
                    effects: "fadeIn"
                }
            }
        });
    }
    
    function updateinventory() {
        try {
            var duplicate = [];
            var result1 = app.queryApi("getCattle", [localStorage.getItem('displayname')]);
            if (result1.status == 200) {
                vp04homeModel.recvpkgList = JSON.parse(result1.responseText);
                vp04homeModel.pkginventory = 0;
                var recvmessagelist = JSON.parse(vp04homeModel.recvpkgList.result.message);
                if (recvmessagelist != "null") {
                    $.each(recvmessagelist.transfer, function (k, v) {
                        if (typeof v == "string") {
                            var obj = JSON.parse(v);
                            if ($.inArray(obj.id, duplicate) < 0) {
                                duplicate.push(obj.id);
                                if (obj.to == localStorage.getItem('displayname')) {
                                    vp04homeModel.pkginventory++;
                                }
                            }
                        }
                    });
                }

            }
        } catch (e) {
            console.log("Inventory Update error" + e);
        }


        $("#retailerPkgInventory").html("");
        var data = {
            pkginventory: vp04homeModel.pkginventory
        }
        var inventoryTemplate = kendo.template($("#retailerPkgInventoryTemplate").html());
        var result = inventoryTemplate(data);
        $("#retailerPkgInventory").html(result);

        $("#retailerPkgInventory ul").kendoMobileButtonGroup({
            index: 0
        });
    }


    function visualTemplate(options) {
        var dataviz = kendo.dataviz;
        var g = new dataviz.diagram.Group();
        var dataItem = options.dataItem;

        console.log(JSON.stringify(dataItem));

        var name = "", title = "", image = "",gradientcolor="", via = false, content="",height=65,width=190;

        if (dataItem.type == "CREATE") {
            name = "Cattle Tag - " + dataItem.cattletag;
            title = dataItem.cattletype;
            image = "components/home/farmer.png";
            gradientcolor = "#2196f3";
            content = "Farmer"
        } else if (dataItem.type == "BATCH") {
            name = "Lot ID -" + dataItem.value;
            title = "";
            image = "components/home/batch.png";
            gradientcolor = "#8700ff";
            content = "Batch Created";
        }
        else if (dataItem.type == "TRANSFER") {
            name = dataItem.value;
            title = "";
            image = "components/home/transfer.png";
            gradientcolor = "#00e68a";
            content = "Transfered to Fresh Meats";
        }
        else if (dataItem.type == "RAWMEATCREATION") {
            name = "Raw Meat";
            title = dataItem.value;
            image = "components/home/rawmeatcreate.png";
            gradientcolor = "#f44336";
            content = "Raw meats creation";
        } else if (dataItem.type == "RAWMEATBATCH") {
            name = "Raw Meat Batch";
            title = dataItem.value;
            image = "components/home/meat.gif";
            gradientcolor = "#ffaa00";
            content = "Raw meats Batch creation";
        } else if (dataItem.type == "RMTRANSFER") {
            name = dataItem.value.split(":")[0];
            title = dataItem.value.split(":")[1];
            image = "components/home/transfer.png";
            gradientcolor = "#00e68a";
            content = "Transfered to Meat Packaging Ltd";
            width =250;
        } else if (dataItem.type == "PKGCREATION") {
            name = "Package Creation";
            title = dataItem.value;
            image = "components/home/pkg.png";
            gradientcolor = "#e600e6";
            content = "Package Creation";
        } else if (dataItem.type == "PKGTRANSFER") {
            name = "Package Transfer";
            title = dataItem.value;
            image = "components/home/retailer.png";
            gradientcolor = "#1e4c96";
            content = "Package Transfer";
        }

        g.append(new dataviz.diagram.Rectangle({
            width: width,
            height: 65,
            stroke: {
                width: 0
            },
            tooltip: {
                shared: true,
                content: content,
                autoHide: false,
                position: "right"
            },
            fill: {
                gradient: {
                    type: "linear",
                    stops: [{
                        color: gradientcolor,
                        offset: 0,
                        opacity: 0.5
                    }, {
                        color: gradientcolor,
                        offset: 1,
                        opacity: 1
                    }]
                }
            }
        }));

        g.append(new dataviz.diagram.TextBlock({
            text: name,
            x: 55,
            y: 10,
            fill: "#fff"
        }));

        if (via) {
            g.append(new dataviz.diagram.TextBlock({
                text: "to",
                x: 75,
                y: 30,
                fill: "#fff"
            }));

            g.append(new dataviz.diagram.TextBlock({
                text: title,
                x: 55,
                y: 50,
                fill: "#fff"
            }));
        } else {
            g.append(new dataviz.diagram.TextBlock({
                text: title,
                x: 55,
                y: 30,
                fill: "#fff"
            }));
        }

       

        g.append(new dataviz.diagram.Image({
            source: image,
            x: 3,
            y: 3,
            width: 50,
            height: 50
        }));

        return g;
    }

    var diagram = kendo.dataviz.diagram;
    var Shape = diagram.Shape;
    var Connection = diagram.Connection;
    var Point = diagram.Point;

    function elementText(element) {
        var text;
        if (element instanceof Shape) {
            text = element.dataItem;
        } else if (element instanceof Point) {
            text = "(" + element.x + "," + element.y + ")";
        } else if (element instanceof Connection) {
            var source = element.source();
            var target = element.target();
            var sourceElement = source.shape || source;
            var targetElement = target.shape || target;
            text = elementText(sourceElement) + " - " + elementText(targetElement);
        }
        return text;
    }

    function onSelect(e) {

        var dialog = $("#blockwindow").data("kendoWindow");
        var html = "<table class='table'>";
        var dataItem = e.item.dataItem;

        try {
            var block = dataItem.block;
            var blockdata = app.getBlock(block);

            var txid = blockdata.transactions[0].txid;
            html += "<tr><td><strong>Transaction Id : </strong></td><td>" + txid + "</td></tr>";
            var payload = window.atob(blockdata.transactions[0].payload);
            html += "<tr><td><strong>Payload : </strong></td><td>" + payload + "</td></tr>";
            var unix_timestamp = blockdata.transactions[0].timestamp.seconds;

            var date = new Date(unix_timestamp * 1000);
            html += "<tr><td><strong>Date : </strong></td><td>" + date.toDateString() + "</td></tr>";
            // Hours part from the timestamp
            var hours = date.getHours();
            // Minutes part from the timestamp
            var minutes = "0" + date.getMinutes();
            // Seconds part from the timestamp
            var seconds = "0" + date.getSeconds();

            // Will display time in 10:30:23 format
            var formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
            html += "<tr><td><strong>Time : </strong></td><td>" + formattedTime + "</td></tr>";
            html + "</table>";


            if (dataItem.type == "CREATE") {

            } else if (dataItem.type == "TRANSFER") {

            }

            if (dialog == undefined) {
                dialog = $("#blockwindow").kendoWindow({
                    width: "500px",
                    title: "Block Information",
                    visible: false,
                    actions: [
                        "Maximize",
                        "Close"
                    ]
                });
                dialog = $("#blockwindow").data("kendoWindow");
                dialog.content(html);
                dialog.center().open();
            } else {
                dialog.content(html);
                dialog.center().open();
            }
        } catch (e) {
            console.log("Error getting block information" + e);
        }
    }

    function createDiagram(data) {
        $("#diagramsection").show();
        $("#diagram").kendoDiagram({
            dataSource: new kendo.data.HierarchicalDataSource({
                data: data,
                schema: {
                    model: {
                        children: "items"
                    }
                }
            }),
            layout: {
                type: "layered"
            },
            shapeDefaults: {
                visual: visualTemplate
            },
            connectionDefaults: {
                stroke: {
                    color: "#979797",
                    width: 2
                },
                startCap: "FilledCircle",
                endCap: "ArrowEnd"
            },
            click: onSelect
        });

        var diagram = $("#diagram").getKendoDiagram();
        diagram.bringIntoView(diagram.shapes);
    }


    parent.set('afterShow', function (e) {
      
    });
})(app.vp04home);
