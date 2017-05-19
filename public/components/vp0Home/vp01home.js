'use strict';

app.vp01home = kendo.observable({
    onShow: function () { },
    afterShow: function () { }
});
app.localization.registerView('vp01home');

(function (parent) {
    var knownBlock = {};
    var
        vp01homeModel = kendo.observable({
            displayname: "",
            farmer: "",
            cattleweight: 1000,
            cattleList: [],
            cattleJson: {},
            batchjson :{},
            tempSelectList : [],
            known_blocks: {},
            selectTransfertagid: [],
            selecttagid: [],
            currentBlock: {},
            batchinventory :0,
            cattleinventory: 0,
            transferinventory: 0,
            transHistoryList:[],
            url:"https://objectstorage-ui.ng.bluemix.net/v2/service_instances/296843db-a9ea-4ad9-aaa4-66b4830197e8/region/dallas/container/fscontainer/object",
            getcattle: function (e) {
                $("#cattlerow").show();
                var template = kendo.template($("#cattleTemplate").html());
                var args = [];
                args.push(vp01homeModel.cattleTagid);
                var result = app.queryApi("getCattle", args);
                if (result.status == 200) {
                    var data = JSON.parse(result.responseText);
                    try {
                        var message = JSON.parse(data.result.message);
                        console.log(message);
                        var result = template(message);
                        setTimeout(function () {
                            $(".cattleload").removeClass("el-loading").addClass("el-loading-done");
                            $("#cattleinfo").html(result);
                        }, 3000);
                    } catch (e) {
                        app.showNotification("Livestock not found.");
                        $(".cattleload").removeClass("el-loading").addClass("el-loading-done");
                    }
                }
            },
            createCattle: function (e) {
                // Validation
                var block = app.getChain();
                vp01homeModel.saveCattle(block);
                
                setTimeout(function () {
                    vp01homeModel.getAllCattle();
                }, 7000);
            },
            createTransfers: function (sender) {
                var tags = vp01homeModel.selectTransfertagid;
                
                if (tags != null && tags.length > 0) {
                    for (var i = 0 ; i < tags.length ; i++) {
                        var block = app.getChain();
                        vp01homeModel.createTransfer(block, tags[i], sender);
                    }
                } else {
                    app.showNotification("Please Pick atleast one cattle to transfer");
                }
            },
            createTransfer: function (prevBlock, batchid, sender) {
                var height = prevBlock.height;
                var args = [];

                var cattlelist = [];

                var result1 = app.queryApi("getCattle", [batchid]);
                if (result1.status == 200) {

                    var data1 = JSON.parse(result1.responseText);
                    var message1 = JSON.parse(data1.result.message);
                    cattlelist.push(message1);
                }

                // args[0]
                var zeroarg = {
                    id: batchid,
                    value: JSON.stringify(cattlelist),
                    header: "Transfered to Tyson Fresh Meat",
                    from: localStorage.getItem("displayname"),
                    to: sender,
                    date: new Date().toLocaleDateString()
                }

                args.push(JSON.stringify(zeroarg));
               
                // args[1]
                args.push(localStorage.getItem("displayname"));
                // args[2]
                args.push(sender);

                var result = app.invokeApi("createCattleTransfer", args);
                if (result.status == 200) {
                    var data = JSON.parse(result.responseText);
                    app.showNotification("Lot Transfered successfully");
                }

                console.log(cattlelist);

                for (var i = 0; i < cattlelist.length ; i++) {
                    var batchlist = cattlelist[i];
                    var cattletags = batchlist.taglist;
                    cattletags = cattletags.split(",");
                    for (var k = 0; k < cattletags.length; k++) {
                        args = []
                        args[0] = "";
                        args[1] = "cattlehdr-" + cattletags[k];
                        var headerjson = {
                            block: height + "",
                            type: "TRANSFER",
                            value: sender,
                            prevHash: prevBlock.currentBlockHash
                        };

                        args.push(JSON.stringify(headerjson));
                        console.log(args);
                        result = app.invokeApi("updateHdr", args);
                    }
                }
                setTimeout(function () {
                    updateinventory();
                }, 7000);
            },
            saveCattle: function (prevblock) {
                vp01homeModel.currentBlock = prevblock;

                var args = [];
                var func = "createCattle";
                args.push("Cattle");
                args.push(vp01homeModel.cattletype);
                args.push("" + vp01homeModel.cattleid);
                args.push("" + vp01homeModel.cattletag);
                args.push(vp01homeModel.cattlebirth);
                args.push("" + vp01homeModel.cattleweight);
                args.push(localStorage.getItem("userName"));
                args.push("Active");
                args.push("" + prevblock.height);
                args.push(localStorage.getItem("userName"));
                args.push(prevblock.currentBlockHash);
                args.push(vp01homeModel.cattlecertificate);

                var result = app.invokeApi(func, args);
                if (result.status == 200) {
                    var data = JSON.parse(result.responseText);
                    console.log(data);
                    app.showNotification("Livestock created successfully");
                    $("#cattleform")[0].reset();
                }
            },
            getfarmertransaction: function (e) {
                
            },
            openconsole: function (e) {
                app.mobileApp.navigate("#components/createcattle/view.html");
                e.preventDefault();
            },
            logout: function (e) {
                app.logout();
            },
            getAllCattle: function (e) {
                var result = app.queryApi("getCattle", ["cattleids"]);
                if (result.status == 200) {
                    vp01homeModel.cattleList = JSON.parse(result.responseText);
                }
                updateinventory();
            },
            getTranCattle: function (e) {
                var result = app.queryApi("getCattleTrans", []);
            },
            showCattleList: function (e) {
                try {
                    if (vp01homeModel.cattleList) {
                        var template = kendo.template($("#cattlecatalogTemplate").html());
                        var message = JSON.parse(vp01homeModel.cattleList.result.message);

                        var cattlearr = []
                        vp01homeModel.cattleinventory = 0;
                        $.each(message.cattle, function (k, v) {
                            var args = []
                            args.push(v);
                            vp01homeModel.cattleinventory++;
                            var result = app.queryApi("getCattle", args);
                            if (result.status == 200) {
                                var data = JSON.parse(result.responseText);
                                var message = JSON.parse(data.result.message);
                                cattlearr.push(message);
                            }
                        });

                        var cattleJson = {
                            cattle: cattlearr
                        }

                        vp01homeModel.cattleJson = cattleJson;

                        var result = template(cattleJson);
                        setTimeout(function () {
                            $(".cattlecatalog").removeClass("el-loading").addClass("el-loading-done");
                            $("#cattlecatalog").html(result);
                            if ($(".viewcert")) {
                                $(".viewcert").bind("click", function (e) {
                                    $("#window").data("kendoWindow").center().open();
                                });
                            }
                        }, 3000);
                    }
                } catch (e) {
                    console.log("Error on Cattle list")
                    $("#cattlecatalog").html("No livestock found.");
                    $(".cattlecatalog").removeClass("el-loading").addClass("el-loading-done");
                }
            },
            getTransferredCattle: function (e) {
                //var result = app.queryApi("getCattle", [localStorage.getItem('displayname')]);
                //try{
                //    if (result.status == 200) {
                //        vp01homeModel.transcattleList = JSON.parse(result.responseText);

                //        var transmessagelist = JSON.parse(vp01homeModel.transcattleList.result.message);
                //        var transHistoryList = [];
                //        $.each(transmessagelist.transfer, function (k, v) {
                //            var cattletransdata = {};
                //            var cattlemessage = {};
                //            var cattlehdrmessage = {};

                //            if (typeof v != "object") {
                //                cattletransdata = JSON.parse(v);
                //            } else {
                //                cattletransdata = v;
                //            }


                //            $.each(JSON.parse(cattletransdata.value), function (k1, v1) {
                //                var taglist = v1.taglist;
                //                taglist = taglist.split(",");
                //                for (var i = 0; i < taglist.length; i++) {
                //                    var result1 = app.queryApi("getCattle", [taglist[i]]);
                //                    if (result1.status == 200) {
                //                        var data1 = JSON.parse(result1.responseText);
                //                        cattlemessage = JSON.parse(data1.result.message);
                //                        console.log(cattlemessage);
                //                        cattlemessage["cattletransdata"] = cattletransdata;
                //                    }

                //                    var result2 = app.queryApi("getCattle", [v1.sourcehdr + "-" + taglist[i]]);
                //                    if (result2.status == 200) {
                //                        var data2 = JSON.parse(result2.responseText);
                //                        cattlehdrmessage = JSON.parse(data2.result.message);
                //                        cattlemessage["cattlehdrmessage"] = cattlehdrmessage;
                //                    }
                //                }
                //            });

                //            var transhistory = {
                //                cattle: cattlemessage,
                //            }

                //            transHistoryList.push(transhistory);

                //        });

                //        vp01homeModel.transHistoryList = transHistoryList;

                //    }           
                //} catch (e) {
                //    app.showNotification("Livestock not found");
                //}
            },
            showTransaction: function () {
                var tag = vp01homeModel.transcattleTagid;
                if (tag == "") {
                    app.showNotification("Please select Tag");
                    return false;
                }
                var masterdata = [], datavalue = {}, items = [], itemsvalue = {};

                // Cattle information
                var cattleinfo = [];
                var result = app.queryApi("getCattle", [tag]);
                if (result.status == 200) {
                    var data = JSON.parse(result.responseText);
                    try {
                        cattleinfo.push(JSON.parse(data.result.message));
                    } catch (e) {
                        console.log(e);
                    }
                }
                if (cattleinfo.length < 0) {
                    app.showNotification("TAG information is not found");
                    return false;
                }

                var cattlehdrmessage =[]

                var result1 = app.queryApi("getCattle", ["cattlehdr-" + tag]);
                if (result1.status == 200) {
                    var data1 = JSON.parse(result1.responseText);
                    var message1 = JSON.parse(data1.result.message);
                    cattlehdrmessage.push(message1);

                    var createdata = {};
                    var batchdata = {}, batcharr =[];
                    var transferdata = {},trnasferarr =[];
                    var rmcreationdata = {}, rmcreationarr = [];
                    var rmbatchdata = {},rmbatch =[];
                    var rmtransferdata = {}, rmtransferarr = [];
                    var foodpkgcreationdata = {}, foodpkgcreation= [];
                    var foodpkgbatchdata = {}, foodpkgbatcharr =[];
                    var foodpkgtransferdata = {},foodpkgtransfer =[];
                   
                    var len = message1.blockheader.length;

                    for (var i = len-1 ; i >= 0 ; i--) {
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
                            console.log(rmid);
                            for (var j = 0; j < foodpkgcreation.length; j++) {
                                var pkgvalue = foodpkgcreation[j].value;
                                
                                if(typeof pkgvalue != "object"){
                                    pkgvalue = JSON.parse(pkgvalue);
                                }
                                console.log(pkgvalue);
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
                                        items=[];
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
            opencertificate: function (e) {
                $("#window").data("kendoWindow").center().open();
            },
            closecatteinfo: function (e) {
                $("#cattleinfo").html("");
            },
            createBatch: function (e) {

                var args = [];
                args[0] = localStorage.getItem('displayname');

                var tags = vp01homeModel.selecttagid;

                if (tags != null && tags.length > 0) {
                    vp01homeModel.batchinventory = vp01homeModel.batchinventory + 1;
                    args[1] = "LOT" + vp01homeModel.batchinventory;

                    var taglist = "";

                    for (var i = 0; i < tags.length; i++) {
                        taglist += tags[i];
                        if (!((i + 1) == tags.length)) {
                            taglist += ","
                        }
                    }

                    args[2] = taglist;
                    args[3] = new Date().toLocaleDateString();
                    args[4] = "cattlehdr-";

                    var block = app.getChain();

                    var result = app.invokeApi("createBatch", args);
                    if (result.status == 200) {
                        var data = JSON.parse(result.responseText);

                        for (var i = 0; i < tags.length; i++) {
                            args = [];
                            args[0] = "",
                            args[1] = "cattlehdr-" + tags[i];
                            var headerjson = {
                                block: block.height + "",
                                type: "BATCH",
                                value: "LOT" + vp01homeModel.batchinventory,
                                prevHash: block.currentBlockHash
                            };

                            args[2] = JSON.stringify(headerjson);
                            result = app.invokeApi("updateHdr", args);
                            if (result.status == 200) {
                                app.showNotification("Lot Created successfully");
                                setTimeout(function () {
                                    updateinventory();
                                }, 5000);
                            }
                        }
                    }
                } else {
                    app.showNotification("Please Pick atleast one or more livestock to create Lot");
                }
            },
            getBatch: function (e) {
                var args = [];
                args.push("batchids-"+localStorage.getItem('displayname'));
                var result = app.queryApi("getCattle", args);
                if (result.status == 200) {
                    var data = JSON.parse(result.responseText);
                    vp01homeModel.batchlist = data;
                    vp01homeModel.batchinventory = 0;

                    var batch = [];
                    var batchids = [];

                    try {
                        var message = JSON.parse(data.result.message);
                        $.each(message.Batch, function (k, v) {
                            vp01homeModel.batchinventory++;
                            var batchid = v;
                            batchids.push(batchid);
                            var result1 = app.queryApi("getCattle", [batchid]);
                            if (result1.status == 200) {
                               
                                var data1 = JSON.parse(result1.responseText);
                                var message1 = JSON.parse(data1.result.message);
                                var batchdetail = {
                                    batchdetail: message1
                                }
                                batch.push(batchdetail);
                            }
                        });

                        var batchJson = {
                            batchdetail: batch
                        }

                        vp01homeModel.batchjson = batchJson;

                        var template = kendo.template($("#batchTemplate").html());
                        var result2 = template(batchJson);
                        setTimeout(function () {
                            $(".batchcatalog").removeClass("el-loading").addClass("el-loading-done");
                            $("#batchcatalog").html(result2);
                        }, 3000);
                    } catch (e) {
                        console.log(e)
                        $(".batchcatalog").removeClass("el-loading").addClass("el-loading-done");
                    }
                }
            },
            uploadfile: function (e) {
                var data = {
                    "auth": {
                        "identity": {
                            "methods": [
                                "password"
                            ],
                            "password": {
                                "user": {
                                    "id": "admin_b11598133c186c303d9f20c67cbfdfef37633bd9",
                                    "password": "zhvUvQNx53X{S8S."
                                }
                            }
                        },
                        "scope": {
                            "project": {
                                "id": "c779efd1ff5441f7b3f75798ba41ada3"
                            }
                        }
                    }
                };

                $.ajax({
                    url: "https://identity.open.softlayer.com/v3/auth/tokens",
                    type: 'POST',
                    contentType: "application/json",
                    data: JSON.stringify(data),
                    headers: {
                        'Access-Control-Allow-Origin': 'http://localhost:8696',
                    },
                    async: false,
                    complete: function (data,txt) {
                        console.log(data);
                    }
                });

            }
        });

    parent.set('vp01homeModel', vp01homeModel);

    parent.set('onShow', function (e) {


        $("body").removeClass("page-red").addClass("page-blue");

        if (e && e.view && e.view.params) {
            var name = e.view.params.name;
            vp01homeModel.set('displayname', name);
        } else {
            vp01homeModel.set('displayname', localStorage.getItem('displayname'));
        }

        vp01homeModel.set('farmer', localStorage.getItem('username'));

        initTabStrip();

        $("#cattlerow").hide();

        $("#cattlebirth").kendoDatePicker();

        $("#cattleweight").kendoNumericTextBox({
            format: "#.00 pounds"
        });

        $("#window").kendoWindow({
            width: "600px",
            title: "Certificate",
            visible: false,
            actions: [
                "Maximize",
                "Close"
            ]
        });


        $("#open").click(function (e) {
            $("#window").data("kendoWindow").center().open();
        });

        vp01homeModel.getAllCattle();

    });
    
    function updateinventory() {
        try {
            var result = app.queryApi("getCattle", ["cattleids"]);
            if (result.status == 200) {
                vp01homeModel.cattleList = JSON.parse(result.responseText);
                var message = JSON.parse(vp01homeModel.cattleList.result.message);

                vp01homeModel.cattleinventory = 0;
                if (message != "null" && message != null) {
                    $.each(message.cattle, function (k, v) {
                        vp01homeModel.cattleinventory++;
                    });
                }
            }
        } catch (e) {
            console.log("Inventory Update error" + e);
        }

        try {
            var result1 = app.queryApi("getCattle", [localStorage.getItem('displayname')]);
            if (result1.status == 200) {
                vp01homeModel.transcattleList = JSON.parse(result1.responseText);
                vp01homeModel.transferinventory = 0;
                var transmessagelist = JSON.parse(vp01homeModel.transcattleList.result.message);
                if (transmessagelist != "null" && transmessagelist != null) {
                    $.each(transmessagelist.transfer, function (k, v) {
                        vp01homeModel.transferinventory++;
                    });
                }
            }
        } catch (e) {
            console.log("Inventory Update error" + e);
        }

        try {
           vp01homeModel.getBatch();
        } catch (e) {
            console.log("Batch Inventory Update error" + e);
        }

        $("#inventory").html("");
        var data = {
            cattleinventory: vp01homeModel.cattleinventory,
            transferinventory: vp01homeModel.transferinventory,
            batchinventory : vp01homeModel.batchinventory
        }
        var inventoryTemplate = kendo.template($("#inventoryTemplate").html());
        var result = inventoryTemplate(data);
        $("#inventory").html(result);

        $("#inventory ul").kendoMobileButtonGroup({
            index: 0
        });
    }

    function initTabStrip() {
        $("#tabstrip").kendoTabStrip({
            activate: function (e) {
                var txt = $(e.item).find("> .k-link").text();
                txt = txt.trim();
                if ("Review" == txt) {
                    vp01homeModel.showCattleList();
                } else if ("Lot Creation" == txt) {
                    createDialog();
                    vp01homeModel.getBatch();
                } else if ("Transfer" == txt) {
                    createBatchDialog();
                } else if ("Track Livestock" == txt) {
                    $("#diagramsection").hide();
                    vp01homeModel.getTransferredCattle();
                }
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
            name = "Meat Packaging Ltd";
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

    // Transfer Section 
    function treeViewDataBound(e) {
        e.sender.expand(e.node);
    }

    function initOpen(e) {
        $("#Cattle-search").on("input", function () {
            var query = this.value.toLowerCase();
            var dataSource = $("#treeview").data("kendoTreeView").dataSource;
            filter(dataSource, query);
            matchColors(query);
        });
    }


    function dialogOpen(e) {
        var treeView = $("#treeview").data("kendoTreeView");
        try {
            vp01homeModel.tempSelectList = getCheckedItems(treeView);
        } catch (e) {
            app.showNotification("No livestock found.")
        }
        setTimeout(function () {
            $("#Cattle-search").focus().select();
        })
    }
    function openDialog(e) {
        $("#dialog").data("kendoDialog").open();
        $("li.k-button").css('width', '49%');

    }

    function actionOK(e) {
        var treeView = $("#treeview").data("kendoTreeView");
        var checkedNodes = getCheckedItems(treeView);
        updateResult(checkedNodes);
    }

    function updateResult(checkedNodes) {
        var selecttagid = [];

        if (checkedNodes.length > 0) {
            var result = '<div class="tile-wrap"><div class="tile"><div class="tile-inner"><strong> Selected Livestock</strong></div></div>';
            for (var i = 0; i < checkedNodes.length; i++) {
                result += '<div class="tile"><div class="tile-inner"><span> Cattle - ' + checkedNodes[i].cattletagid + '</span></div></div>'

                selecttagid.push(checkedNodes[i].cattletagid);
            }
            result += '</div>';
        } else {
            result = "No Cattle selected.";
        }

        vp01homeModel.selecttagid = selecttagid

        $("#selectbatch").html(result);
    }

    function initBatchOpen(e) {
        $("#batch-search").on("input", function () {
            var query = this.value.toLowerCase();
            var dataSource = $("#batchtreeview").data("kendoTreeView").dataSource;
            filter(dataSource, query);
            matchbatchColors(query);
        });
    }

    function openBatchDialog(e) {
        $("#batchdialog").data("kendoDialog").open();
        $("li.k-button").css('width', '49%');

    }

    function dialogBatchOpen(e) {
        var treeView = $("#batchtreeview").data("kendoTreeView");
        try {
            vp01homeModel.tempSelectList = getCheckedItems(treeView);
        } catch (e) {
            app.showNotification("No Batch found.")
        }
        setTimeout(function () {
            $("#batch-search").focus().select();
        })
    }

    function actionBatchOK(e) {
        var treeView = $("#batchtreeview").data("kendoTreeView");
        var checkedNodes = getCheckedItems(treeView);
        updateBatchResult(checkedNodes);
    }

    function updateBatchResult(checkedNodes) {
        var selecttagid = [];
					
        if (checkedNodes.length > 0) {
            var result = '<div class="tile-wrap"><div class="tile"><div class="tile-inner"><strong> Selected Lot</strong></div></div>';
            for (var i = 0; i < checkedNodes.length; i++) {
                result += '<div class="tile"><div class="tile-inner"><span> Livestock Lot - '+checkedNodes[i].cattletagid+'</span></div></div>'
                    
                selecttagid.push(checkedNodes[i].cattletagid);
            }
            result += '</div>';
        } else {
            result = "No Lot selected.";
        }

        vp01homeModel.selectTransfertagid = selecttagid

        $("#selectbatchid").html(result);
    }

    function treeViewCheck(e) {
        setTimeout(function () {
            updateSelectedCount(e.sender);
        })
    }

    function updateSelectedCount(treeView) {
        $(".selected-count").html(getCheckedItems(treeView).length + " Cattle selected");
    }


    function treeViewBatchCheck(e) {
        setTimeout(function () {
            updateBatchSelectedCount(e.sender);
        })
    }

    function updateBatchSelectedCount(treeView) {
        $(".selected-count-batch").html(getCheckedItems(treeView).length + " Lot selected");
    }

    function getCheckedItems(treeview) {
        var nodes = treeview.dataSource.view();
        return getCheckedNodes(nodes);
    }

    function getCheckedNodes(nodes) {
        var node, childCheckedNodes;
        var checkedNodes = [];

        for (var i = 0; i < nodes.length; i++) {
            node = nodes[i];
            if (node.checked) {
                checkedNodes.push(node);
            }

            if (node.hasChildren) {
                childCheckedNodes = getCheckedNodes(node.children.view());
                if (childCheckedNodes.length > 0) {
                    checkedNodes = checkedNodes.concat(childCheckedNodes);
                }
            }

        }

        return checkedNodes;
    }

    function filter(dataSource, query) {
        var hasVisibleChildren = false;
        var data = dataSource instanceof kendo.data.HierarchicalDataSource && dataSource.data();

        for (var i = 0; i < data.length; i++) {
            var item = data[i];
            var text = item.cattletagid.toLowerCase();
            var itemVisible =
                query === true // parent already matches
                || query === "" // query is empty
                || text.indexOf(query) >= 0; // item text matches query

            var anyVisibleChildren = filter(item.children, itemVisible || query); // pass true if parent matches

            hasVisibleChildren = hasVisibleChildren || anyVisibleChildren || itemVisible;

            item.hidden = !itemVisible && !anyVisibleChildren;
        }

        if (data) {
            // re-apply filter on children
            dataSource.filter({ field: "hidden", operator: "neq", value: true });
        }

        return hasVisibleChildren;
    }

    function matchColors(query, element) {
        $("#treeview .k-in:containsIgnoreCase('" + query + "')").each(function () {
            var index = $(this).html().toLowerCase().indexOf(query.toLowerCase());
            var length = query.length;
            var original = $(this).html().substr(index, length);
            var newText = $(this).html().replace(original, "<span class='query-match'>" + original + "</span>");
            $(this).html(newText);
        });
    }

    function matchbatchColors(query, element) {
        $("#batchtreeview .k-in:containsIgnoreCase('" + query + "')").each(function () {
            var index = $(this).html().toLowerCase().indexOf(query.toLowerCase());
            var length = query.length;
            var original = $(this).html().substr(index, length);
            var newText = $(this).html().replace(original, "<span class='query-match'>" + original + "</span>");
            $(this).html(newText);
        });
    }

    $.expr[':'].containsIgnoreCase = function (n, i, m) {
        return jQuery(n).text().toUpperCase().indexOf(m[3].toUpperCase()) >= 0;
    };

    function createDialog() {

        if ($("#dialog").data('kendoDialog') == undefined) {
            var dialog = $("#dialog").kendoDialog({
                width: "400px",
                height: "400px",
                visible: false,
                title: "Livestocks",
                closable: true,
                modal: false,
                content: "<div class='k-textbox k-space-right search-wrapper'>" +
                    "<input id='Cattle-search' type='text'  placeholder='Search Livestock ear id'/><span class='k-icon k-i-search'></span></div>" +
                    "<div class='select-all-wrapper'>" +
                    "<span class='selected-count pull-right'></span></div>" +
                    "<div id='treeview'></div>",
                actions: [
                    { text: 'Cancel' },
                    { text: 'OK', primary: true, action: actionOK }
                ],
                initOpen: initOpen,
                open: dialogOpen
            });
        }
        

        $("#pickCattles").kendoButton({
            click: openDialog
        });

        try{

            var cattledatasource = [];

            if (vp01homeModel.cattleList) {
                var message = JSON.parse(vp01homeModel.cattleList.result.message);

                var cattleDs = {}

                $.each(message.cattle, function (k, v) {
                    var cattleDs = {
                        cattletagid : v
                    }
                    cattledatasource.push(cattleDs);
                });

            }

            var homogeneous = new kendo.data.HierarchicalDataSource({ data: cattledatasource });

            if ($("#treeview").data('kendoTreeView') == undefined) {
                $("#treeview").kendoTreeView({
                    dataSource: homogeneous,
                    dataTextField: "cattletagid",
                    checkboxes: true,
                    loadOnDemand: false,
                    expandAll: true,
                    dataBound: treeViewDataBound,
                    check: treeViewCheck
                });
            }
        } catch (e) {
            console.log("Not able to create log." + e);
        }
    }


    function createBatchDialog() {

        if ($("#batchdialog").data('kendoDialog') == undefined) {
            var dialog = $("#batchdialog").kendoDialog({
                width: "400px",
                height: "400px",
                visible: false,
                title: "Livestock Lot",
                closable: true,
                modal: false,
                content: "<div class='k-textbox k-space-right search-wrapper'>" +
                    "<input id='batch-search' type='text'  placeholder='Search Lot ID'/><span class='k-icon k-i-search'></span></div>" +
                    "<div class='select-all-wrapper'>" +
                    "<span class='selected-count-batch pull-right'></span></div>" +
                    "<div id='batchtreeview'></div>",
                actions: [
                    { text: 'Cancel' },
                    { text: 'OK', primary: true, action: actionBatchOK }
                ],
                initOpen: initBatchOpen,
                open: dialogBatchOpen
            });
        }


        $("#pickbatch").kendoButton({
            click: openBatchDialog
        });

        try {

            var cattledatasource = [];

            if (vp01homeModel.batchlist) {
                var message = JSON.parse(vp01homeModel.batchlist.result.message);

                var cattleDs = {}

                $.each(message.Batch, function (k, v) {
                    var cattleDs = {
                        cattletagid: v
                    }
                    cattledatasource.push(cattleDs);
                });

            }

            var homogeneous = new kendo.data.HierarchicalDataSource({ data: cattledatasource });

            if ($("#batchtreeview").data('kendoTreeView') == undefined) {
                $("#batchtreeview").kendoTreeView({
                    dataSource: homogeneous,
                    dataTextField: "cattletagid",
                    checkboxes: true,
                    loadOnDemand: false,
                    expandAll: true,
                    dataBound: treeViewDataBound,
                    check: treeViewBatchCheck
                });
            }
        } catch (e) {
            console.log("Not able to create log." + e);
        }
    }


    parent.set('afterShow', function (e) {
        $("#transferBatch").on("click", function (e) {
            if (vp01homeModel.sender != "" && vp01homeModel.sender != undefined) {
                kendo.confirm("Are you sure that you want to proceed?").then(function () {
                    vp01homeModel.createTransfers(vp01homeModel.sender);
                }, function () {

                });
                $("li.k-button").css('width', '49%');
            } else {
                app.showNotification("Please select the Receiver");
            }
        });

        $("#createBatch").on("click", function (e) {
                kendo.confirm("Are you sure that you want to proceed?").then(function () {
                    vp01homeModel.createBatch();
                }, function () {

                });
                $("li.k-button").css('width', '49%');
        });

    });
})(app.vp01home);
