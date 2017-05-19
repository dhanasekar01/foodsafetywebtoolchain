'use strict';

app.vp03home = kendo.observable({
    onShow: function () { },
    afterShow: function () { }
});
app.localization.registerView('vp03home');

(function (parent) {
    var knownBlock = {};
    var
        vp03homeModel = kendo.observable({
            displayname: "",
            farmer: "",
            cattleweight: 1000,
            recvrmList: [],
            cattleJson: {},
            currentlength:0,
            pkgList:[],
            tempSelectList: [],
            rmbatchlist:[],
            known_blocks: {},
            selectTransfertagid: [],
            selectrawmeatid: [],
            currentBlock: {},
            cattleinventory: 0,
            pkginventory:0,
            batchinventory :0,
            transferinventory: 0,
            url: "https://objectstorage-ui.ng.bluemix.net/v2/service_instances/296843db-a9ea-4ad9-aaa4-66b4830197e8/region/dallas/container/fscontainer/object",
            getcattle: function (e) {
                $("#cattlerow").show();
                var template = kendo.template($("#cattleTemplate").html());
                var args = [];
                args.push(vp03homeModel.cattleTagid);
                var result = app.queryApi("getCattle", args);
                if (result.status == 200) {
                    var data = JSON.parse(result.responseText);
                    var message = JSON.parse(data.result.message);
                    var result = template(message);
                    setTimeout(function () {
                        $(".cattleload").removeClass("el-loading").addClass("el-loading-done");
                        $("#cattleinfo").html(result);
                    }, 3000);
                }
            },
            createpkg: function (e) {
                // Validation
                var pkgcount = vp03homeModel.pkgcount;
                var sourceTag = vp03homeModel.rawmeatid;
                var pkgids = [];
                if (pkgcount > 0) {

                    //Save Cattle hdr
                    for (var i = 0; i < pkgcount; i++) {
                        var pkgid = $("#pkgid-" + (vp03homeModel.currentlength+ (i + 1))).val();
                        pkgids.push(pkgid);
                    }

                    var block = app.getChain();

                    var hdrvalue = {
                        rmid: sourceTag,
                        pkgids: pkgids
                    }

                    var args = []
                    args[0] = "";
                    args[1] = "rawmeathdr-" + sourceTag;
                    var headerjson = {
                        block: block.height + "",
                        type: "PKGCREATION",
                        value: JSON.stringify(hdrvalue),
                        prevHash: block.currentBlockHash
                    };
                    args.push(JSON.stringify(headerjson));
                    var result = "";

                    result = app.invokeApi("updateHdr", args);

                    result = app.queryApi("getCattle", [sourceTag]);
                    if (result.status == 200) {

                        var data1 = JSON.parse(result.responseText);
                        var message1 = JSON.parse(data1.result.message);
                        var cattletag = message1.sourcetag;
                        args = []
                        args[0] = "";
                        args[1] = "cattlehdr-" + cattletag;

                        args.push(JSON.stringify(headerjson));
                      result = app.invokeApi("updateHdr", args);
                    }

                    headerjson = "";
                    var result1 = app.queryApi("getCattle", ["rawmeathdr-" + sourceTag])
                    if (result1.status == 200) {
                        var data1 = JSON.parse(result1.responseText);
                        var message = JSON.parse(data1.result.message);
                        
                        for (var i = 0; i < message.blockheader.length; i++) {
                            headerjson += message.blockheader[i];
                            if (!((i + 1) == message.blockheader.length)) {
                                headerjson +=","
                            }
                        }

                        //headerjson = data1.result.message.replace('{"blockheader":[', '').replace(']}', '');
                    }

                    //save each rawmeat
                    for (var i = 0; i < pkgcount; i++) {
                        // var block = app.getChain();

                        var pkgid = $("#pkgid-" + (vp03homeModel.currentlength + (i + 1))).val();
                        pkgids.push(pkgid);
                        var pkgweight = $("#pkgweight-" + (vp03homeModel.currentlength + (i + 1))).val();
                        var pkgdate = $("#pkgdate-" + (vp03homeModel.currentlength + (i + 1))).val();
                        var pkgcut = $("#pkgcut-" + (vp03homeModel.currentlength + (i + 1))).val();
                        var pkgtemp = $("#pkgtemp-" + (vp03homeModel.currentlength + (i + 1))).val();
                       
                        vp03homeModel.savepkg(block, pkgid, pkgweight, pkgdate, pkgcut,pkgtemp, sourceTag, headerjson);
                    }
                    app.showNotification("Pakages created successfully");
                }

                setTimeout(function () {
                    updateinventory();
                }, 3000)

            },
            createTransfers: function (housesender) {
                var pkgids = vp03homeModel.selectrawmeatid;

                if (pkgids != null && pkgids.length > 0) {
                    for (var i = 0 ; i < pkgids.length ; i++) {
                        var block = app.getChain();
                        vp03homeModel.createTransfer(block, pkgids[i], housesender);
                    }
                } else {
                    app.showNotification("Please Pick atleast one Rawmeat Lot to transfer");
                }
            },
            createTransfer: function (prevBlock, pkgid, housesender) {
                var height = prevBlock.height;
                var args = [];

                var zeroarg = {
                    id: pkgid,
                    value: pkgid,
                    header: "Transfered to Retailer",
                    from: localStorage.getItem("displayname"),
                    to: housesender,
                    date: new Date().toLocaleDateString()
                }

                args.push(JSON.stringify(zeroarg));
                args.push(localStorage.getItem("displayname"));
                args.push(housesender);
                
                var result = app.invokeApi("createCattleTransfer", args);

                args = []
                args[0] = "";
                args[1] = "foodpkghdr-" + pkgid;
                var headerjson = {
                    block: height + "",
                    type: "PKGTRANSFER",
                    value: housesender + ":" + pkgid,
                    prevHash: prevBlock.currentBlockHash
                };

                args.push(JSON.stringify(headerjson));
                result = app.invokeApi("updateHdr", args);

                result = app.queryApi("getCattle", [pkgid]);
                if (result.status == 200) {

                    var data1 = JSON.parse(result.responseText);
                    var message1 = JSON.parse(data1.result.message);
                    var rmid = message1.sourcetag;
                    args = []
                    args[0] = "";
                    args[1] = "rawmeathdr-" + rmid;
                    args.push(JSON.stringify(headerjson));
                    result = app.invokeApi("updateHdr", args);

                    result = app.queryApi("getCattle", [rmid]);
                    if (result.status == 200) {

                        var data1 = JSON.parse(result.responseText);
                        var message1 = JSON.parse(data1.result.message);
                        var cattletag = message1.sourcetag;
                        args = []
                        args[0] = "";
                        args[1] = "cattlehdr-" + cattletag;
                        args.push(JSON.stringify(headerjson));
                        result = app.invokeApi("updateHdr", args);
                }

                
                }

                if (result.status == 200) {
                    app.showNotification("Package Transfered successfully");
                }

                updateinventory();

            },
            savepkg: function (prevblock, pkgid, pkgweight, pkgdate, pkgcut, pkgtemp, sourceTag, headerjson) {
                vp03homeModel.currentBlock = prevblock;

                var pkgcertificate = vp03homeModel.pkgcertificate;
                var pkgtype = vp03homeModel.pkgtype;
                var process = vp03homeModel.process;

                var args = [];
                var func = "createFoodPack";
                args.push(pkgid); // 0
                args.push(pkgweight); //1
                args.push(new Date().toLocaleDateString()); //2
                args.push(sourceTag); //3 
                args.push(pkgdate); //4
                args.push(pkgtemp);//5
                args.push("manufacturer");//6
                args.push(process);//7
                args.push(pkgcertificate);//8
                args.push(pkgtype);//9
                args.push(process);//10
                args.push(pkgcut);//11

                args.push(headerjson); //12

                var result = app.invokeApi(func, args);
                if (result.status == 200) {
                    var data = JSON.parse(result.responseText);
                    console.log(data);
                }
            },
            openconsole: function (e) {
                app.mobileApp.navigate("#components/createcattle/view.html");
                e.preventDefault();
            },
            logout: function (e) {
                app.logout();
            },
            getRecvRawmeat: function (e) {
                var result = app.queryApi("getCattle", [localStorage.getItem('displayname')]);
                if (result.status == 200) {
                    vp03homeModel.recvrmList = JSON.parse(result.responseText);
                }
                try {
                    vp03homeModel.showrmList();
                } catch (e) {
                    $(".rmcatalog").removeClass("el-loading").addClass("el-loading-done");
                    $("#rmcatalog").html("<p>List is Empty</p>");
                }
            },
            showrmList: function (e) {
                if (vp03homeModel.recvrmList) {
                    var template = kendo.template($("#rmcatalogTemplate").html());
                    var message = JSON.parse(vp03homeModel.recvrmList.result.message);

                    var cattlearr = []
                    var rmlist = [];


                    $.each(message.transfer, function (k, v) {
                        var transferdata = JSON.parse(v);
                        if (transferdata.to == localStorage.getItem('displayname')) {
                            var transfervalue = JSON.parse(transferdata.value);
                            var arr = [];
                            $.each(transfervalue, function (k1, v1) {
                                var tags = v1.taglist.split(",");
                                for (var i = 0; i < tags.length; i++) {
                                    var args = []
                                    args.push(tags[i]);
                                    rmlist.push(tags[i]);
                                    var result = app.queryApi("getCattle", args);
                                    if (result.status == 200) {
                                        var data1 = JSON.parse(result.responseText);
                                        var message1 = JSON.parse(data1.result.message);
                                        arr.push(message1);
                                    }
                                }
                            });

                            var cattleJson = {
                                rawmeat: arr,
                                transferdetail: transferdata
                            }

                            cattlearr.push(cattleJson);
                        }
                    });

                    var recv = {
                        rawmeat: cattlearr
                    }

                    vp03homeModel.cattleJson = recv;


                    var result = template(recv);
                    setTimeout(function () {
                        $(".rmcatalog").removeClass("el-loading").addClass("el-loading-done");
                        $("#rmcatalog").html(result);
                    }, 3000);
                    var htmldata = "<option></option>";
                    for (var i = 0; i < rmlist.length; i++) {
                        if (rmlist[i] != "") {
                            htmldata += '<option>' + rmlist[i] + '</option>';
                        }
                    }

                    $("#rawmeatid").html(htmldata);

                }
            },
            closecatteinfo: function (e) {
                $("#cattleinfo").html("");
            },
            pkgcreation: function (e) {
                $("#pkgweight").html("");
                var pkgcount = vp03homeModel.pkgcount;
                if (pkgcount > 0) {
                    var template = kendo.template($("#pkgtemplate").html());
                    vp03homeModel.currentlength = vp03homeModel.pkginventory;

                    var data = [];

                    var result = app.queryApi("getCattle", ["foodpackids"]);
                    var response = JSON.parse(result.responseText);
                    var message = JSON.parse(response.result.message);
                    var packageid = 0;
                    vp03homeModel.currentlength = packageid;
                    try {
                        packageid = message.foodpacks.length;
                        vp03homeModel.currentlength = packageid;
                    } catch (e) { }

                    for (var i = 0; i < pkgcount ; i++) {
                        data.push({ id: packageid + (i+1) });
                    }
                    var result = template(data);
                    $("#pkgweight").html(result);

                    for (var i = 0; i < pkgcount ; i++) {
                        $("#pkgweight-" + (packageid + (i+1))).kendoNumericTextBox({
                            format: "#.00 pounds",
                            value: 100.00
                        });

                        $("#pkgdate-" + (packageid + (i + 1))).kendoDatePicker();

                        $("#pkgtemp-" + (packageid + (i + 1))).kendoNumericTextBox({
                            format: "# F",
                            value: -5
                        });
                    }
                }
            },
            createBatch: function (e) {

                var args = [];
                args[0] = localStorage.getItem('displayname');

                var rmids = vp03homeModel.selectrawmeatid;

                if (rmids != null && rmids.length > 0) {
                    vp03homeModel.batchinventory = vp03homeModel.batchinventory + 1;
                    args[1] = "RMLOT" + vp03homeModel.batchinventory;

                    var rmlist = "";

                    for (var i = 0; i < rmids.length; i++) {
                        rmlist += rmids[i];
                        if (!((i + 1) == rmids.length)) {
                            rmlist += ","
                        }
                    }

                    args[2] = rmlist;
                    args[3] = new Date().toLocaleDateString();
                    args[4] = "rawmeathdr-";

                    var block = app.getChain();
                    console.log(args);
                    var result = app.invokeApi("createBatch", args);

                    if (result.status == 200) {
                        for (var i = 0; i < rmids.length; i++) {
                            args = [];
                            args[0] = "",
                            args[1] = "rawmeathdr-" + rmids[i];
                            var headerjson = {
                                block: block.height + "",
                                type: "RAWMEATBATCH",
                                value: "RMLOT" + vp03homeModel.batchinventory,
                                prevHash: block.currentBlockHash
                            };

                            args[2] = JSON.stringify(headerjson);
                            console.log(args);
                            result = app.invokeApi("updateHdr", args);

                            var rmresult = app.queryApi("getCattle", [rmids[i]]);
                            if (rmresult.status == 200) {
                                var data = JSON.parse(rmresult.responseText);
                                var message = JSON.parse(data.result.message);
                                var sourceTag = message.sourcetag;
                                args = [];
                                args[0] = "",
                                args[1] = "cattlehdr-" + sourceTag;

                                headerjson = {
                                    block: block.height + "",
                                    type: "RAWMEATBATCH",
                                    value: "RMLOT" + vp03homeModel.batchinventory + ":" + rmids[i],
                                    prevHash: block.currentBlockHash
                                };

                                args[2] = JSON.stringify(headerjson);
                                console.log(args);
                                result = app.invokeApi("updateHdr", args);
                            }
                        }

                        if (result.status == 200) {
                            app.showNotification("Batch Created successfully");
                            setTimeout(function () {
                                updateinventory();
                                getBatch();
                            }, 5000);
                        }
                    }
                } else {
                    app.showNotification("Please Pick atleast one or more rawmeat to create batch");
                }
            },
            getBatch: function (e) {
                var args = [];
                args.push("batchids-" + localStorage.getItem('displayname'));
                var result = app.queryApi("getCattle", args);
                if (result.status == 200) {
                    var data = JSON.parse(result.responseText);
                    vp03homeModel.rmbatchlist = data;
                    vp03homeModel.batchinventory = 0;

                    var batch = [];
                    var batchids = [];

                    try {
                        var message = JSON.parse(data.result.message);
                        $.each(message.Batch, function (k, v) {
                            vp03homeModel.batchinventory++;
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

                        vp03homeModel.batchjson = batchJson;

                        var template = kendo.template($("#rmbatchTemplate").html());
                        var result2 = template(batchJson);
                        setTimeout(function () {
                            $(".rmbatchcatalog").removeClass("el-loading").addClass("el-loading-done");
                            $("#rmbatchcatalog").html(result2);
                        }, 3000);
                    } catch (e) {
                        $(".rmbatchcatalog").removeClass("el-loading").addClass("el-loading-done");
                    }
                }
            },
            showTransaction: function (e) {
                var pkgid = vp03homeModel.pkgid;
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
                                    for (var k = 0 ; k < pkgvalue.pkgids.length ; k++) {
                                        if (pkgvalue.pkgids[k] != "null" && pkgvalue.pkgids[k] != null) {
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
                                    }

                                    rmtransferdata["items"] = items;
                                    items = [];
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
        });

    parent.set('vp03homeModel', vp03homeModel);

    parent.set('onShow', function (e) {

        $("body").removeClass("page-blue").removeClass('page-red').addClass("page-purple");

        if (e && e.view && e.view.params) {
            var name = e.view.params.name;
            vp03homeModel.set('displayname', "Meat Packaging Ltd");
        } else {
            vp03homeModel.set('displayname', "Meat Packaging Ltd");
        }

        initTabStrip();

        $("#cattlerow").hide();

        $("#pkgwindow").kendoWindow({
            width: "600px",
            title: "Certificate",
            visible: false,
            actions: [
                "Maximize",
                "Close"
            ]
        });

        $("#pkgopen").click(function (e) {
            $("#pkgwindow").data("kendoWindow").center().open();
        });

        vp03homeModel.getRecvRawmeat();

        updateinventory();
    });

    function updateinventory() {
        try {
            console.log("Update Inventory");
            var result = app.queryApi("getCattle", ["foodpackids"]);
            if (result.status == 200) {
                vp03homeModel.pkgList = JSON.parse(result.responseText);
                var message = JSON.parse(vp03homeModel.pkgList.result.message);
                vp03homeModel.pkginventory = 0;
                if (message != "null" && message != null) {
                    $.each(message.foodpacks, function (k, v) {
                        vp03homeModel.pkginventory++;
                    });
                }
            }

        } catch (e) {
            console.log("Inventory Update error" + e);
        }

        try {
            var result1 = app.queryApi("getCattle", [localStorage.getItem('displayname')]);
            if (result1.status == 200) {
                vp03homeModel.recvrmList = JSON.parse(result1.responseText);
                vp03homeModel.cattleinventory = 0;
                vp03homeModel.transferinventory = 0;
                var recvmessagelist = JSON.parse(vp03homeModel.recvrmList.result.message);
                if (recvmessagelist != "null") {
                    $.each(recvmessagelist.transfer, function (k, v) {
                        var transferdata = JSON.parse(v);
                        if (transferdata.to == localStorage.getItem('displayname')) {
                            var transfervalue = JSON.parse(transferdata.value);
                            $.each(transfervalue, function (k1, v1) {
                                var tags = v1.taglist.split(",");
                                for (var i = 0; i < tags.length; i++) {
                                    vp03homeModel.cattleinventory++;
                                }
                            })
                        } else {
                            vp03homeModel.transferinventory++;
                        }

                    });
                }

            }
        } catch (e) {
            console.log("Inventory Update error" + e);
        }


        $("#tysoninventory").html("");
        var data = {
            cattleinventory: vp03homeModel.cattleinventory,
            pkginventory: vp03homeModel.pkginventory,
            transferinventory: vp03homeModel.transferinventory
        }
        var inventoryTemplate = kendo.template($("#tysoninventoryTemplate").html());
        var result = inventoryTemplate(data);
        $("#tysoninventory").html(result);

        $("#tysoninventory ul").kendoMobileButtonGroup({
            index: 0
        });
    }

    function treeViewrmBatchCheck(e) {
        setTimeout(function () {
            updatermBatchSelectedCount(e.sender);
        })
    }

    function actionrmBatchOK(e) {
        var treeView = $("#rmbatchtreeview").data("kendoTreeView");
        var checkedNodes = getCheckedItems(treeView);
        updatermBatchResult(checkedNodes);
    }

    function updatermBatchResult(checkedNodes) {
        var selecttagid = [];

        if (checkedNodes.length > 0) {
            var result = '<div class="tile-wrap"><div class="tile"><div class="tile-inner"><strong> Selected Lot</strong></div></div>';
            for (var i = 0; i < checkedNodes.length; i++) {
                result += '<div class="tile"><div class="tile-inner"><span> Rawmeat Lot - ' + checkedNodes[i].cattletagid + '</span></div></div>'

                selecttagid.push(checkedNodes[i].cattletagid);
            }
            result += '</div>';
        } else {
            result = "No Lot selected.";
        }

        vp03homeModel.selectTransfertagid = selecttagid

        $("#selectrmbatch").html(result);
    }

    function initrmBatchOpen(e) {
        $("#rmbatch-search").on("input", function () {
            var query = this.value.toLowerCase();
            var dataSource = $("#rmbatchtreeview").data("kendoTreeView").dataSource;
            filter(dataSource, query);
            matchrmbatchColors(query);
        });
    }


    function openrmBatchDialog(e) {
        $("#rmbatchdialog").data("kendoDialog").open();
        $("li.k-button").css('width', '49%');

    }

    function dialogrmBatchOpen(e) {
        var treeView = $("#rmbatchtreeview").data("kendoTreeView");
        try {
            vp03homeModel.tempSelectList = getCheckedItems(treeView);
        } catch (e) {
            app.showNotification("No Lot found.")
        }
        setTimeout(function () {
            $("#rmbatch-search").focus().select();
        })
    }

    function treeViewBatchCheck(e) {
        setTimeout(function () {
            updatermBatchSelectedCount(e.sender);
        })
    }

    function updatermBatchSelectedCount(treeView) {
        $(".selected-count-rmbatch").html(getCheckedItems(treeView).length + " Lot selected");
    }


    function matchrmbatchColors(query, element) {
        $("#rmbatchtreeview .k-in:containsIgnoreCase('" + query + "')").each(function () {
            var index = $(this).html().toLowerCase().indexOf(query.toLowerCase());
            var length = query.length;
            var original = $(this).html().substr(index, length);
            var newText = $(this).html().replace(original, "<span class='query-match'>" + original + "</span>");
            $(this).html(newText);
        });
    }

    function createBatchDialog() {

        if ($("#rmbatchdialog").data('kendoDialog') == undefined) {
            var dialog = $("#rmbatchdialog").kendoDialog({
                width: "400px",
                height: "400px",
                visible: false,
                title: "Transfer Lot",
                closable: true,
                modal: false,
                content: "<div class='k-textbox k-space-right search-wrapper'>" +
                    "<input id='rmbatch-search' type='text'  placeholder='Search Lot ID'/><span class='k-icon k-i-search'></span></div>" +
                    "<div class='select-all-wrapper'>" +
                    "<span class='selected-count-rmbatch pull-right'></span></div>" +
                    "<div id='rmbatchtreeview'></div>",
                actions: [
                    { text: 'Cancel' },
                    { text: 'OK', primary: true, action: actionrmBatchOK }
                ],
                initOpen: initrmBatchOpen,
                open: dialogrmBatchOpen
            });
        }


        $("#pickrmbatch").kendoButton({
            click: openrmBatchDialog
        });

        try {

            var cattledatasource = [];

            if (vp03homeModel.rmbatchlist) {
                var message = JSON.parse(vp03homeModel.rmbatchlist.result.message);

                var cattleDs = {}

                $.each(message.Batch, function (k, v) {
                    var cattleDs = {
                        cattletagid: v
                    }
                    cattledatasource.push(cattleDs);
                });

            }

            var homogeneous = new kendo.data.HierarchicalDataSource({ data: cattledatasource });

            if ($("#rmbatchtreeview").data('kendoTreeView') == undefined) {
                $("#rmbatchtreeview").kendoTreeView({
                    dataSource: homogeneous,
                    dataTextField: "cattletagid",
                    checkboxes: true,
                    loadOnDemand: false,
                    expandAll: true,
                    dataBound: treeViewDataBound,
                    check: treeViewrmBatchCheck
                });
            }
        } catch (e) {
            console.log("Not able to create transfer." + e);
        }
    }



    function initTabStrip() {
        $("#tysontabstrip").kendoTabStrip({
            activate: function (e) {
                var txt = $(e.item).find("> .k-link").text();
                txt = txt.trim();
                if ("Review and Process" == txt) {

                } else if ("Transfer" == txt) {
                    createDialog();
                    vp03homeModel.getBatch();
                } else if ("Track Food Packs" == txt) {
                    $("#rmdiagramsection").hide();
                } else if ("Transfer Inventory" == txt) {
                    //createBatchDialog();
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

    // Transfer Section 
    function treeViewDataBound(e) {
        e.sender.expand(e.node);
    }

    function initOpen(e) {
        $("#rm-search").on("input", function () {
            var query = this.value.toLowerCase();
            var dataSource = $("#rmtreeview").data("kendoTreeView").dataSource;
            filter(dataSource, query);
            matchColors(query);
        });
    }

    function dialogOpen(e) {
        var treeView = $("#rmtreeview").data("kendoTreeView");
        vp03homeModel.tempSelectList = getCheckedItems(treeView);
        setTimeout(function () {
            $("#rm-search").focus().select();
        })
    }
    function openDialog(e) {
        $("#rmdialog").data("kendoDialog").open();
        $("li.k-button").css('width', '49%');

    }

    function actionOK(e) {
        var treeView = $("#rmtreeview").data("kendoTreeView");
        var checkedNodes = getCheckedItems(treeView);
        updateResult(checkedNodes);
    }

    function updateResult(checkedNodes) {
        var selecttagid = [];

        if (checkedNodes.length > 0) {
            var result = '<div class="tile-wrap"><div class="tile"><div class="tile-inner"><strong> Selected Packages</strong></div></div>';
            for (var i = 0; i < checkedNodes.length; i++) {
                result += '<div class="tile"><div class="tile-inner"><span> Package - ' + checkedNodes[i].cattletagid + '</span></div></div>'

                selecttagid.push(checkedNodes[i].cattletagid);
            }
            result += '</div>';
        } else {
            result = "No Package selected.";
        }

        vp03homeModel.selectrawmeatid = selecttagid

        $("#selecthousebatch").html(result);
    }
    function treeViewCheck(e) {
        setTimeout(function () {
            updateSelectedCount(e.sender);
        })
    }

    function updateSelectedCount(treeView) {
        $(".selected-count").html(getCheckedItems(treeView).length + " Rawmeat selected");
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
        $("#rmtreeview .k-in:containsIgnoreCase('" + query + "')").each(function () {
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

        if ($("#rmdialog").data('kendoDialog') == undefined) {
            var dialog = $("#rmdialog").kendoDialog({
                width: "400px",
                height: "400px",
                visible: false,
                title: "Cattles",
                closable: true,
                modal: false,
                content: "<div class='k-textbox k-space-right search-wrapper'>" +
                    "<input id='rm-search' type='text'  placeholder='Search Rawmeat'/><span class='k-icon k-i-search'></span></div>" +
                    "<div class='select-all-wrapper'>" +
                    "<span class='selected-count pull-right'></span></div>" +
                    "<div id='rmtreeview'></div>",
                actions: [
                    { text: 'Cancel' },
                    { text: 'OK', primary: true, action: actionOK }
                ],
                initOpen: initOpen,
                open: dialogOpen
            });
        }


        $("#pickrawmeat").kendoButton({
            click: openDialog
        });

        var cattledatasource = [];

        if (vp03homeModel.pkgList) {
            var message = JSON.parse(vp03homeModel.pkgList.result.message);

            var cattleDs = {}

            $.each(message.foodpacks, function (k, v) {
                var cattleDs = {
                    cattletagid: v
                }
                cattledatasource.push(cattleDs);
            });

        }

        var homogeneous = new kendo.data.HierarchicalDataSource({ data: cattledatasource });

        if ($("#rmtreeview").data('kendoTreeView') == undefined) {
            $("#rmtreeview").kendoTreeView({
                dataSource: homogeneous,
                dataTextField: "cattletagid",
                checkboxes: true,
                loadOnDemand: false,
                expandAll: true,
                dataBound: treeViewDataBound,
                check: treeViewCheck
            });
        }
    }


    function visualTemplate(options) {
        var dataviz = kendo.dataviz;
        var g = new dataviz.diagram.Group();
        var dataItem = options.dataItem;

        //console.log(JSON.stringify(dataItem));

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
        $("#rmdiagramsection").show();
        $("#rmdiagram").kendoDiagram({
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

        var diagram = $("#rmdiagram").getKendoDiagram();
        diagram.bringIntoView(diagram.shapes);
    }


    parent.set('afterShow', function (e) {
        $("#transferrawmeat").on("click", function (e) {
            if (vp03homeModel.housesender != "" && vp03homeModel.housesender != undefined) {
                kendo.confirm("Are you sure that you want to proceed?").then(function () {
                    $(".k-confirm .k-window-titlebar").css("display", "none");
                    vp03homeModel.createTransfers(vp03homeModel.housesender);
                }, function () {

                });
                $("li.k-button").css('width', '49%');
            } else {
                app.showNotification("Please select the Receiver");
            }
        });

        $("#createhouseBatch").on("click", function (e) {
            kendo.confirm("Are you sure that you want to proceed?").then(function () {
                vp03homeModel.createBatch();

                $(".k-dialog-title").css("display", "none");
            }, function () {

            });
            $("li.k-button").css('width', '49%');
        });


    });
})(app.vp03home);
