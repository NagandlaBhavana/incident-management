sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
], function (Controller, JSONModel, MessageBox, MessageToast) {
    "use strict";

    return Controller.extend("postmigrationtestingtool.controller.TableInfo", {
        onInit: function () {
            this._oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            this.selectPIPOInterface();
            this.selectCPIIflow();
        },

        onNext: function () {
            this._oRouter.navTo("RouteView1");
        },

        onBack: function () {
            this._oRouter.navTo("RouteOverviewPage");
        },

        selectPIPOInterface: function() {
            var sURL = this.getOwnerComponent().getManifestObject().resolveUri('PO');
            sURL = sURL + '/http/RetrieveICO';
            var settings = {
                "url": sURL,
                "method": "GET",
                "timeout": 0,
                "headers": {
                    "Content-Type": "application/xml",
                }
            };

            var that = this;
            $.ajax(settings).done(function (response) {
                console.log("ICO Response:", response);

                // Convert XMLDocument response to string
                var xmlString = new XMLSerializer().serializeToString(response);
                xmlString = xmlString.replace(/<\?xml.*?\?>/, '');

                // Parse the XML string
                var parser = new DOMParser();
                var xmlDoc = parser.parseFromString(xmlString, "application/xml");

                // Extract the required information
                var icoDetails = [];
                var integratedConfigNodes = xmlDoc.getElementsByTagName("IntegratedConfigurationID");

                for (var i = 0; i < integratedConfigNodes.length; i++) {
                    var senderComponentID = integratedConfigNodes[i].getElementsByTagName("SenderComponentID")[0].textContent;
                    var interfaceName = integratedConfigNodes[i].getElementsByTagName("InterfaceName")[0].textContent;
                    var interfaceNamespace = integratedConfigNodes[i].getElementsByTagName("InterfaceNamespace")[0].textContent;

                    // Add serial number
                    icoDetails.push({
                        SerialNumber: i + 1, // Serial number starts from 1
                        SenderComponentID: senderComponentID,
                        InterfaceName: interfaceName,
                        InterfaceNamespace: interfaceNamespace
                    });
                }

                // Set the extracted ICO data to a model
                var oICOModel = new JSONModel();
                oICOModel.setData({ icoDetails: icoDetails });

                // Access the table directly by its ID
                var oTable = that.getView().byId("PIPOInterfaceTable_");
                oTable.setModel(oICOModel);
                that.getView().setModel(oICOModel);

                // Update the total count of PI/PO Interfaces
                that.updateTotalCounts(icoDetails.length, null); // Pass null for CPI count

                console.log("ICO Model Data:", oICOModel.getData());

            }).fail(function (jqXHR, textStatus, errorThrown) {
                console.error("Error fetching ICO data:", textStatus, errorThrown);
                MessageBox.error("Error fetching ICO data");
            });
        },

        selectCPIIflow: function() {
            var sURL = this.getOwnerComponent().getManifestObject().resolveUri('PO');
            sURL = sURL + '/http/Get_Integration_List';
            var settings = {
                "url": sURL,
                "method": "GET",
                "timeout": 0,
                "headers": {
                    "Content-Type": "application/json",
                },
                "dataType": "json"
            };

            var that = this;
            $.ajax(settings).done(function (response) {
                console.log("Integration response:", response);

                if (response && response.Root && Array.isArray(response.Root)) {
                    var integrations = response.Root.map(function (item, index) {
                        return {
                            serialNumber: index + 1,
                            package: "Get_Integration_List",
                            id: item.Id || "",
                            name: item.Name || ""
                        };
                    });

                    var oModel = new JSONModel({ integrations: integrations });
                    that.getView().setModel(oModel, "integrationModel");

                    // Update the total count of CPI iFlows
                    that.updateTotalCounts(null, integrations.length); // Pass null for PI/PO count

                } else if (response && response.Root) {
                    var oModel = new JSONModel({
                        integrations: [
                            {
                                serialNumber: 1,
                                package: "Get_Integration_List",
                                id: response.Root.Id || "",
                                name: response.Root.Name || ""
                            }
                        ]
                    });
                    that.getView().setModel(oModel, "integrationModel");

                    // Update the total count of CPI iFlows
                    that.updateTotalCounts(null, 1); // Pass null for PI/PO count

                } else {
                    console.error("Invalid response structure:", response);
                    MessageBox.error("No integrations found.");
                }
            }).fail(function (error) {
                console.error("Failed to fetch data:", error);
                MessageBox.error("Failed to get list of iflows.");
            });
        },

        updateTotalCounts: function(pipoCount, cpiCount) {
            var oViewModel = this.getView().getModel(); // Assuming the main model is used for the view
            var totalPIPO = pipoCount !== null ? pipoCount : (oViewModel.getProperty("/icoDetails") ? oViewModel.getProperty("/icoDetails").length : 0);
            var totalCPI = cpiCount !== null ? cpiCount : (oViewModel.getProperty("/integrations") ? oViewModel.getProperty("/integrations").length : 0);
            this.getView().byId("totalPIPO").setText("" + totalPIPO);
            this.getView().byId("totalCPI").setText("" + totalCPI);
        },

        getPage : function() {
			return this.byId("dynamicPageId");
		},

        onToggleFooter: function () {
			this.getPage().setShowFooter(!this.getPage().getShowFooter());
		},

        onEdit: function() {
            var oIconTabBar = this.byId("iconTabBar");
            var sSelectedKey = oIconTabBar.getSelectedKey();
            if (sSelectedKey === "PIPO") {
                var oPIPOInterfaceTable = this.byId("PIPOInterfaceTable_");
                oPIPOInterfaceTable.setMode("SingleSelect");
                MessageToast.show("Now Table got Selection Mode")
            } else if (sSelectedKey === "CPI") {
                var oCPIInterfaceTable = this.byId("integration_list");
                oCPIInterfaceTable.setMode("SingleSelect");
                MessageToast.show("Now Table got Selection Mode")
            }
        },

        onCopy: function() {
            var oIconTabBar = this.byId("iconTabBar");
            var sSelectedKey = oIconTabBar.getSelectedKey();
        
            var oSelectedItem, oTableData;
        
            if (sSelectedKey === "PIPO") {
                var oPIPOInterfaceTable = this.byId("PIPOInterfaceTable_");
                oSelectedItem = oPIPOInterfaceTable.getSelectedItem();
        
                if (oSelectedItem) {
                    oTableData = oSelectedItem.getBindingContext().getObject();
                    var copyData = JSON.stringify(oTableData);
                    this.copyToClipboard(copyData);
                    console.log("Copied PI/PO Data:", oTableData);
                    MessageToast.show("The selected row is copied.\n", oTableData);
                } else {
                    sap.m.MessageToast.show("Please select a row to copy.");
                }
            } else if (sSelectedKey === "CPI") {
                var oCPIInterfaceTable = this.byId("integration_list");
                oSelectedItem = oCPIInterfaceTable.getSelectedItem();
        
                if (oSelectedItem) {
                    oTableData = oSelectedItem.getBindingContext("integrationModel").getObject();
                    var copyData = JSON.stringify(oTableData);
                    this.copyToClipboard(copyData);
                    console.log("Copied CPI Data:", oTableData);
                } else {
                    sap.m.MessageToast.show("Please select a row to copy.");
                }
            }
        },

        copyToClipboard: function(data) {
            var textarea = document.createElement("textarea");
            textarea.value = data;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
        },

        onNavigateHome: function () {
            this._oRouter.navTo("RouteOverviewPage"); // Adjust the route name as per your routing configuration
        },
        
        onNavigatePIPO: function () {
            this._oRouter.navTo("RouteView1"); // Adjust the route name as per your routing configuration
        },

        onNavigateCPI: function () {
            this._oRouter.navTo("RouteView1"); // Adjust the route name as per your routing configuration
        }
    });
});