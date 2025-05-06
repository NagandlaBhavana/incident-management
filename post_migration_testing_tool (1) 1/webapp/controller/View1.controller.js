sap.ui.define([
    "sap/ui/core/mvc/Controller", 
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/mvc/XMLView",
    "sap/ui/export/Spreadsheet" 

], function (Controller,  JSONModel, MessageBox, MessageToast, Filter, FilterOperator, XMLView, Spreadsheet) {
    "use strict";
    
    return Controller.extend("postmigrationtestingtool.controller.View1", {
        
        onInit: function () {
            // var response = "";
			// var urldes = "http://";
			// var a ="http://"+"d0aavwboj01.hrpsdev.local:8000/DataServices/servlet/webservices?ver=2.1&label=job_rt_test&wsdlxml";
				
			// $.ajax({
			// 	url: a,
			// 	type: "POST",
			// 	crossDomain: true,
			// 	data: request,
			// 	dataType: "xml",
			// 	processData: false,
			// 	contentType: "application/soap+xml; charset=utf-8",
			// 	headers: {
			// 		"Access-Control-Allow-Origin": "*",
			// 		"Access-Control-Allow-Credentials": false,
			// 	},
			// 	success: function (data, textStatus, jqXHR) {
			// 		response = data;
			// 		// console.log("Response : ", data);
			// 	},
			// 	error: function (xhr, status, thrownError) {
				
			// 	},
			// 	complete: function (xhr, status) {
			// 		// console.log("COMPLETE");
			// 	}
			// });

            this._oRouter = sap.ui.core.UIComponent.getRouterFor(this);

            this._bAscending = true;
            this._currentSortKey = null;

            // In your controller's onInit method or wherever you initialize your models
            var oModel = new sap.ui.model.json.JSONModel({
                isPIPOInterfaceRowSelected: false,
                isPIPOMessageRowSelected: false,
                isCPIIflowRowSelected: false,
                isCPIMessageSelected: false,

                selectedLines: [],
                Scenariotitle: ""
            });
            this.getView().setModel(oModel, "uiModel");
            console.log("uiModel ", oModel.getData());

            this._oNavContainer = this.getView().byId("navContainer");
            this._oWizardContentPage = this.getView().byId("dynamicPage"); 
            this._oWizard = this.byId("CreateProductWizard");

            this.selectPIPOInterface()
            this.selectCPIIflow()
            this.getUserMail()


            // this._loadStepView("postmigrationtestingtool.view.scenario", "scenarioContainer");
        },

        // _loadStepView: function (sViewName, sContainerId) {
        //     var oContainer = this.byId(sContainerId);
        //     if (oContainer) {
        //         XMLView.create({
        //             viewName: sViewName
        //         }).then(function (oView) {
        //             oContainer.addItem(oView);
        //         });
        //     }
        // },

        getUserMail: function () {
            var useremail;
            var username
            if (sap.ushell && sap.ushell.Container) {
                var oUserInfo = sap.ushell.Container.getService("UserInfo");
                var sUserName = oUserInfo.getUser().getFullName();
                console.log("sUserName",sUserName);
                var sUser = oUserInfo.getUser().getEmail();
                if (sUser) {
                    useremail = sUser;
                    username = sUserName
                } else {
                    useremail = "abc@yash.com";
                    username = sUserName
                }
            } else {
                useremail = "abc@yash.com";
                username = sUserName
            }
            this.getView().byId("username").setText(username);
            // this.getView().byId("emailText").setText(useremail);
            var oModel = this.getView().getModel("uiModel");
            oModel.setProperty("/testedBy", username);
            oModel.setProperty("/UserMail", useremail);

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
                console.log("ICO Response:", response); // Log the response
                
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
                    var senderComponentID = integratedConfigNodes[i].getElementsByTagName("SenderComponentID")[0]?.textContent || '';
                    var interfaceName = integratedConfigNodes[i].getElementsByTagName("InterfaceName")[0]?.textContent || '';
                    var interfaceNamespace = integratedConfigNodes[i].getElementsByTagName("InterfaceNamespace")[0]?.textContent || '';
        
                    // Only push to icoDetails if all required fields are present
                    if (senderComponentID && interfaceName && interfaceNamespace) {
                        icoDetails.push({
                            serialNumber: i + 1, // Add serial number (1-based index)
                            SenderComponentID: senderComponentID,
                            InterfaceName: interfaceName,
                            InterfaceNamespace: interfaceNamespace
                        });
                    }
                }
                console.log("Filtered ICO Details:", icoDetails);        
                // Set the extracted ICO data to a model
                var oICOModel = new sap.ui.model.json.JSONModel();
                oICOModel.setData({ icoDetails: icoDetails });
                var oTable = that.getView().byId("PIPOInterfaceTable"); 
                // Clear any existing model data
                oTable.setModel(null);
                // Set the new model to the table
                oTable.setModel(oICOModel); 
                // Set the visible row count to the number of records
                oTable.setVisibleRowCount(icoDetails.length);
                // Log the ICO model data
                console.log("ICO Model Data:", oICOModel.getData()); // Log the ICO model data
                that.getView().setModel(oICOModel);
                var oTextControl = that.getView().byId("totalPIPOInterfaces");
                oTextControl.setText("Total PI/PO Interfaces: (" + icoDetails.length + ")");
        
            }).fail(function (jqXHR, textStatus, errorThrown) {
                console.error("Error fetching ICO data:", textStatus, errorThrown);
                MessageBox.error("Error fetching ICO data");
            });


            
        },

        onDateChange: function() {
            var fromDate = this.byId("FromDate").getDateValue();
            var toDate = this.byId("ToDate").getDateValue();
            var table = this.byId("PIPOInterfaceTable");
        
            if (fromDate && toDate) {
                table.setSelectionMode("Single");
            } else {
                table.setSelectionMode("None");
            }
        },
        
        async onSettingsPress() {
            this._oDialog ??= await this.loadFragment({
                name: "postmigrationtestingtool.view.fragments.PIPOInterfaceSettings"
            });
            this._oDialog.open()
        },

        onCancel: function () {
            this._oDialog.close();
        },
        onSearchPIPOInterfaceFrg: function(oEvent) {
            var sQuery = oEvent.getParameter("query");
            var oList = this.byId("checkboxList");
            var aItems = oList.getItems();
            if (!sQuery) {
                aItems.forEach(function(oItem) {
                    oItem.setVisible(true);
                });
                return;
            }
            sQuery = sQuery.toLowerCase();
            aItems.forEach(function(oItem) {
                var sTitle = oItem.getTitle().toLowerCase();
                oItem.setVisible(sTitle.includes(sQuery));
            });
        },
        
        onSelectionChangePIPOInterface: function (oEvent) {
            var oList = this.byId("PIPOInterfaceCheckboxList");
            var oSelectedItem = oEvent.getParameter("listItem");
            var sSelectedItemId = oSelectedItem.getId();
        
            // Check if "Select All" was selected or deselected
            if (sSelectedItemId === this.byId("selectAll").getId()) {
                var bSelected = oSelectedItem.getSelected();
        
                // Select or deselect all items based on "Select All" state
                oList.getItems().forEach(function (oItem) {
                    if (oItem.getId() !== this.byId("selectAll").getId()) {
                        oItem.setSelected(bSelected);
                    }
                }, this);
            }
        },

        onSortAscending: function() {
            this._bAscending = true;
            this.getView().byId("sorting_text").setText("ASCENDING ORDER" );
            this.getView().byId("sortAscendingBtn").setType("Emphasized")
            this.getView().byId("sortDescendingBtn").setType("Default");
        },
        
        onSortDescending: function() {
            this._bAscending = false;
            this.getView().byId("sorting_text").setText("DESCENDING ORDER" );
            this.getView().byId("sortDescendingBtn").setType("Emphasized")
            this.getView().byId("sortAscendingBtn").setType("Default");
        },

        searchPIPOInterfaceDetails: function(oEvent) {
            // Get the value from the search field
            var sQuery = oEvent.getParameter("query") || oEvent.getParameter("newValue");
            
            // Get the binding of the table
            var oTable = this.byId("PIPOInterfaceTable");
            var oBinding = oTable.getBinding("rows");
            
            // Create a filter for the Interface Name
            var aFilters = [];
            if (sQuery) {
                var oFilter = new sap.ui.model.Filter("InterfaceName", sap.ui.model.FilterOperator.Contains, sQuery);
                aFilters.push(oFilter);
            }
            
            // Apply the filter to the binding
            oBinding.filter(aFilters);
        },

        onOK: function() {
            var oView = this.getView();
            var oTable = oView.byId("PIPOInterfaceTable");
            var oIconTabBar = this.byId("idIconTabBarNoIcons"); // Get the IconTabBar
            var sSelectedKey = oIconTabBar.getSelectedKey();

            if (sSelectedKey === "columns") {
                var aColumns = oTable.getColumns();
                var aCheckboxes = [
                    "SerialNoFrag","SenderComponentIDFrag", "InterfaceNameFrag", "InterfaceNamespaceFrag"
                ];
                aCheckboxes.forEach(function (sCheckboxId, index) {
                    var bSelected;
                    
                    bSelected = sap.ui.getCore().byId(oView.getId() + "--" + sCheckboxId).getSelected();
                    
                    aColumns[index].setVisible(bSelected);
                });
            } else if(sSelectedKey === "sort") {
                var oComboBox = oView.byId("PIPOInterfaceDetailsSort");
                var sSortKey = oComboBox.getSelectedKey();
                if (sSortKey) {
                    // Store the current sort key
                    this._currentSortKey = sSortKey;
                    // Create a sorter based on the selected key and current order
                    var oSorter = new sap.ui.model.Sorter(sSortKey, !this._bAscending); // Set descending if _bAscending is false
    
                    // Apply the sorter to the table's binding
                    var oBinding = oTable.getBinding("rows");
                    console.log("binding items: ", oBinding.getLength())
                    // Check if there are rows to sort
                    if (oBinding.getLength() === 0) {
                        // Show a message toast if there are no rows
                        sap.m.MessageToast.show("No rows available to sort.");
                    } else {
                        oBinding.sort(oSorter);
                    }
                }
            } else if (sSelectedKey === "filter") {
                // Assuming you have filter controls for InterfaceName and SenderComponentID
                var sInterfaceNameKey = oView.byId("InterfaceNameFilter").getSelectedKey();
                var sSenderComponentIDKey = oView.byId("SenderComponentIDFilter").getSelectedKey();

                // Create an array to hold filters
                var aFilters = [];

                // Apply filters based on selected keys
                if (sInterfaceNameKey) {
                    aFilters.push(new Filter("InterfaceName", FilterOperator.EQ, sInterfaceNameKey));
                }
                if (sSenderComponentIDKey) {
                    aFilters.push(new Filter("SenderComponentID", FilterOperator.EQ, sSenderComponentIDKey));
                }

                // Apply the filters to the table binding
                var oBinding = oTable.getBinding("rows");
                oBinding.filter(aFilters);

            }
            this._oDialog.close();
        },

        onResetPIPOSettings: function() {
            var oView = this.getView();
            var oTable = oView.byId("PIPOInterfaceTable");
         
            // Reset Columns - Make all columns visible
            var aColumns = oTable.getColumns();
            aColumns.forEach(function (oColumn) {
                oColumn.setVisible(true);
            });
         
            // Reset Checkboxes in the Fragment
            var aCheckboxes = ["SerialNoFrag", "SenderComponentIDFrag", "InterfaceNameFrag", "InterfaceNamespaceFrag"];
            aCheckboxes.forEach(function (sCheckboxId) {
                var oCheckbox = sap.ui.getCore().byId(oView.getId() + "--" + sCheckboxId);
                if (oCheckbox) {
                    oCheckbox.setSelected(true);
                }
            });
         
            // Reset Sorting
            var oComboBox = oView.byId("PIPOInterfaceDetailsSort");
            if (oComboBox) {
                oComboBox.setSelectedKey(""); // Clear selected sort key
                this.getView().byId("sorting_text").setText("Sort" );
                this.getView().byId("sortDescendingBtn").setType("Default")
                this.getView().byId("sortAscendingBtn").setType("Default");
            }
            var oBinding = oTable.getBinding("rows");
            if (oBinding) {
                oBinding.sort(null); // Remove all sorters
            }
         
            // Reset Filters
            var oInterfaceNameFilter = oView.byId("InterfaceNameFilter");
            var oSenderComponentIDFilter = oView.byId("SenderComponentIDFilter");
            if (oInterfaceNameFilter) {
                oInterfaceNameFilter.setSelectedKey(""); // Clear Interface Name filter
            }
            if (oSenderComponentIDFilter) {
                oSenderComponentIDFilter.setSelectedKey(""); // Clear Sender Component ID filter
            }
            if (oBinding) {
                oBinding.filter([]); // Remove all filters
            }
         
            // Show Message Toast for Reset Confirmation
            sap.m.MessageToast.show("Columns, Sorting, and Filters have been reset.");
            this._oDialog.close();
        },
         

        async onVersionPress() {
            if (!this._oDialogVer) {
                this._oDialogVer = await this.loadFragment({
                    name: "postmigrationtestingtool.view.fragments.PIPOVersion"
                });
                const oManifest = this.getOwnerComponent().getManifest();
                const sAppVersion = oManifest["sap.app"].applicationVersion.version;
        
                this._oDialogVer.setModel(new JSONModel({
                    version: sAppVersion
                }), "fragmentData");
                this.getView().addDependent(this._oDialogVer);
            }
            this._oDialogVer.open();
        },

        onOKVersion: function() {
            this._oDialogVer.close();
        },

        onExportPIPOInterface: function () {
            var aCols, oRowBinding, oSettings, oSheet, oTable;
        
            // Get the table by its ID
            oTable = this.getView().byId("PIPOInterfaceTable"); 
            oRowBinding = oTable.getBinding("items"); 
        
            // Create column configuration
            aCols = this.createColumnConfig(); 
        
            // Get the model and data
            var oModel = oTable.getModel(); // Get the model set in selectPIPOInterface
            var oData = oModel.getProperty("/icoDetails"); // Access the icoDetails array
        
            // Set up the export settings
            oSettings = { 
                workbook: { columns: aCols }, 
                dataSource: oData, 
                fileName: "PI_PO_Interface_Details.xlsx" 
            }; 
        
            // Show confirmation alert
            var userConfirmed = window.confirm("Do you want to download the table as an Excel sheet?");
            
            if (userConfirmed) {
                // Create a new Spreadsheet instance
                oSheet = new Spreadsheet(oSettings); 
        
                // Build the spreadsheet and handle the promise
                oSheet.build()
                    .then(function () {
                        MessageToast.show("Spreadsheet export has finished"); 
                    })
                    .finally(function () {
                        oSheet.destroy(); 
                    });
            }
        },
        
        createColumnConfig: function () {
            return [
                {
                    label: "S.No", 
                    property: "serialNumber", 
                    type: "number" // Change to number for serial number
                }, 
                {
                    label: "Sender Component ID", 
                    property: "SenderComponentID", 
                    type: "string" 
                },
                {
                    label: "Interface Name", 
                    property: "InterfaceName", 
                    type: "string" 
                },
                {
                    label: "Interface Namespace", 
                    property: "InterfaceNamespace", 
                    type: "string" 
                }
            ];
        },

        onPIPOInterfaceSelect: function(oEvent) {
            // Get the selected row index
            var oTable = this.byId("PIPOInterfaceTable");
            var aSelectedIndices = oTable.getSelectedIndices();
            
            if (aSelectedIndices.length > 0) {
                // Get the first selected index (if using Single selection mode)
                var iSelectedIndex = aSelectedIndices[0];
                
                // Get the binding context of the selected row
                var oSelectedItem = oTable.getContextByIndex(iSelectedIndex);
                
                if (oSelectedItem) {
                    // Retrieve the entire row data from the context
                    var oRowData = oSelectedItem.getObject();
                    
                    // Log the selected row data
                    console.log("Selected PIPO interface data: ", oRowData);
                    
                    // Get the model
                    var oModel = this.getView().getModel("uiModel");
                    
                    // Set the selected row data in the model
                    oModel.setProperty("/selectedPIPOInterface", oRowData);
                    
                    // Update the UI to reflect the selected interface name
                    var oText = this.byId("selectedInterfaceName");
                    oText.setText(oRowData.InterfaceName);
        
                    var InterfaceName = oRowData.InterfaceName;
                    var InterfaceNameSpace = oRowData.InterfaceNamespace;
        
                    console.log("Selected PIPO interface name: ", InterfaceName);
                    console.log("Selected PIPO interface nameSpace: ", InterfaceNameSpace);

                    // Retrieve the selected dates from the DatePicker controls
                    var oFromDatePicker = this.byId("FromDate");
                    var oToDatePicker = this.byId("ToDate");
                    
                    var sFromDate = oFromDatePicker.getDateValue();
                    var sToDate = oToDatePicker.getDateValue();
                    
                    this.selectOnPremiseMsg(InterfaceName, InterfaceNameSpace, sFromDate, sToDate);
                    // Set the flag to indicate that a row is selected
                    oModel.setProperty("/isPIPOInterfaceRowSelected", true);
                    console.log("uiModel data: ", oModel.getData());
                }
            } else {
                // Clear the selected row data in the model
                var oModel = this.getView().getModel("uiModel");
                oModel.setProperty("/selectedPIPOInterface", null);
                
                // Set the flag to indicate that no row is selected
                oModel.setProperty("/isPIPOInterfaceRowSelected", false);
            }
        },
        

        selectOnPremiseMsg: function(InterfaceName, InterfaceNameSpace, sFromDate, sToDate) {
            var sURL = this.getOwnerComponent().getManifestObject().resolveUri('PO');
            sURL = sURL + '/http/GetMessageKey';
            var payload = {
                InterfaceName_: InterfaceName,
                InterfaceNameSpace_: InterfaceNameSpace,
                FromDate: sFromDate,
                ToDate: sToDate
                
            };
        
            console.log("payload_interfacename _namespace", payload)
        
            var settings = {
                "url": sURL,
                "method": "POST", // Change to POST if you're sending a payload
                "timeout": 0,
                "headers": {
                    "Content-Type": "application/json",
                    
                },
                "data": JSON.stringify(payload)
                
            };
        
            var that = this;
            $.ajax(settings).done(function(response) {
                console.log("PO Message:", response); // Log the response
        
                // Convert XMLDocument response to string
                var xmlString = new XMLSerializer().serializeToString(response);
                xmlString = xmlString.replace(/<\?xml.*?\?>/, '');
        
                // Parse the XML string
                var parser = new DOMParser();
                var xmlDoc = parser.parseFromString(xmlString, "application/xml");
                
                // Extract the required information
                var messages = [];
                var adapterFrameworkDataNodes = xmlDoc.getElementsByTagName("rn7:AdapterFrameworkData");
        
                for (var i = 0; i < adapterFrameworkDataNodes.length; i++) {
                    var messageID = adapterFrameworkDataNodes[i].getElementsByTagName("rn7:messageID")[0].textContent;
                    var serviceInterfaceName = adapterFrameworkDataNodes[i].getElementsByTagName("rn2:name")[0].textContent;
                    var senderName = adapterFrameworkDataNodes[i].getElementsByTagName("rn7:senderName")[0].textContent;
                    var receiverName = adapterFrameworkDataNodes[i].getElementsByTagName("rn7:receiverName")[0].textContent;
                    var messageKey = adapterFrameworkDataNodes[i].getElementsByTagName("rn7:messageKey")[0].textContent;
                    var qualityOfService = adapterFrameworkDataNodes[i].getElementsByTagName("rn7:qualityOfService")[0].textContent;
                    var scheduledTime = adapterFrameworkDataNodes[i].getElementsByTagName("rn7:scheduleTime")[0].textContent;
                
                    messages.push({
                        MessageID: messageID,
                        ServiceInterface: serviceInterfaceName,
                        Sender: senderName,
                        Receiver: receiverName,
                        QualityOfService: qualityOfService,
                        ScheduledTime: scheduledTime,
                        MessageKey: messageKey
                    });
                }
                console.log("message id", messageID)

                // Set the extracted data to a model
                var on_PremiseModel = new sap.ui.model.json.JSONModel();
                on_PremiseModel.setData({ messages: messages });

                var oTable = that.getView().byId("onPremiseTable"); 
                // Clear any existing model data
                oTable.setModel(null);
                // Set the new model to the table
                oTable.setModel(on_PremiseModel); 
                // Set the visible row count to the number of records
                oTable.setVisibleRowCount(messages.length);
                var oTextControl = that.getView().byId("totalOnPremiseMessages");
                oTextControl.setText("Total On-Premise Messages: (" + messages.length + ")");

            }).fail(function(jqXHR, textStatus, errorThrown) {
                console.error("Error PO Message:", textStatus, errorThrown);
                
            });

        },

        onSearchOnPremiseMsg: function(oEvent) {
            var oDatePicker = this.byId("scheduledTimeFilter"); 
            var oBinding = this.byId("onPremiseTable").getBinding("rows"); 
        
            var oSelectedDate = oDatePicker.getDateValue();
        
            var aFilters = [];
            if (oSelectedDate) {
                // Format the selected date to match the date part of your data model
                var sFormattedDate = sap.ui.core.format.DateFormat.getInstance({
                    pattern: "yyyy-MM-dd" // Adjust the pattern according to your date format
                }).format(oSelectedDate);
        
                // Create a custom filter function
                var oCustomFilter = new sap.ui.model.Filter({
                    path: "ScheduledTime",
                    test: function(value) {
                        if (value) {
                            // Extract the date part from the ScheduledTime
                            var oDate = new Date(value);
                            var sDate = sap.ui.core.format.DateFormat.getInstance({
                                pattern: "yyyy-MM-dd"
                            }).format(oDate);
                            return sDate === sFormattedDate; // Compare the date parts
                        }
                        return false; // If value is null or undefined, return false
                    }
                });
        
                aFilters.push(oCustomFilter);
            }
        
            // Apply the filters to the table binding
            oBinding.filter(aFilters);
        
            // Check if there are any rows after filtering
            var aFilteredContexts = oBinding.getContexts();
            if (aFilteredContexts.length === 0) {
                // Show an info message box if no data is found
                sap.m.MessageToast.show("No data found for the selected date.");
            }
        },

        async onPIPOMsgSettingsPress() {
            this._oDialogMsgKey ??= await this.loadFragment({
                name: "postmigrationtestingtool.view.fragments.PIPOMessageKey"
            });
            this._oDialogMsgKey.open()
        },

        onPIPOMsgSettingsFrgCancel: function () {
            this._oDialogMsgKey.close();
        },

        
        onSelectionChangePIPOMsg: function(oEvent) {
            var oList = this.byId("PIPOMsgCheckboxList");
            var oSelectedItem = oEvent.getParameter("listItem");
            var sSelectedItemId = oSelectedItem.getId();
        
            // Check if "Select All" was selected or deselected
            if (sSelectedItemId === this.byId("selectAllPIPOMsg").getId()) {
                var bSelected = oSelectedItem.getSelected();
        
                // Select or deselect all items based on "Select All" state
                oList.getItems().forEach(function (oItem) {
                    if (oItem.getId() !== this.byId("selectAllPIPOMsg").getId()) {
                        oItem.setSelected(bSelected);
                    }
                }, this);
            }
        },
        onSortAscendingPIPOMsg: function() {
            this._bAscending = true;
            this.getView().byId("sorting_textPIPOMsg").setText("ASCENDING ORDER" );
            this.getView().byId("sortAscendingBtnPIPOMsg").setType("Emphasized")
            this.getView().byId("sortDescendingBtnPIPOMsg").setType("Default");
        },
        
        onSortDescendingPIPOMsg: function() {
            this._bAscending = false;
            this.getView().byId("sorting_textPIPOMsg").setText("DESCENDING ORDER" );
            this.getView().byId("sortDescendingBtnPIPOMsg").setType("Emphasized")
            this.getView().byId("sortAscendingBtnPIPOMsg").setType("Default");
        },

        onPIPOMsgSettingsFrgOK: function() {
            var oView = this.getView();
            var oTable = oView.byId("onPremiseTable");
            var oIconTabBar = this.byId("idIconTabBarNoIconsPIPOMsg"); 
            var sSelectedKey = oIconTabBar.getSelectedKey();

            if (sSelectedKey === "columns") {
                var aColumns = oTable.getColumns();
                var aCheckboxes = [
                    "MessageIDFrag","ServiceInterfaceFrag", "SenderComponentFrag", "ReceiverComponentFrag", "QualityOfServiceFrag", "scheduledTimeFrag"
                ];
                aCheckboxes.forEach(function (sCheckboxId, index) {
                    var bSelected;
                    
                    bSelected = sap.ui.getCore().byId(oView.getId() + "--" + sCheckboxId).getSelected();
                    
                    aColumns[index].setVisible(bSelected);
                });
            } else if(sSelectedKey === "sort") {
                var oComboBox = oView.byId("PIPOPIPOMsgDetailsSort");
                var sSortKey = oComboBox.getSelectedKey();
                if (sSortKey) {
                    // Store the current sort key
                    this._currentSortKey = sSortKey;
                    // Create a sorter based on the selected key and current order
                    var oSorter = new sap.ui.model.Sorter(sSortKey, !this._bAscending); // Set descending if _bAscending is false
    
                    // Apply the sorter to the table's binding
                    var oBinding = oTable.getBinding("rows");
                    console.log("binding items: ", oBinding.getLength())
                    // Check if there are rows to sort
                    if (oBinding.getLength() === 0) {
                        // Show a message toast if there are no rows
                        sap.m.MessageToast.show("No rows available to sort.");
                    } else {
                        oBinding.sort(oSorter);
                    }
                }
            } 
            this._oDialogMsgKey.close();
        },

        onResetPIPOMsgSettings: function() {
            var oView = this.getView();
            var oTable = oView.byId("onPremiseTable");
         
            // Reset Columns - Make all columns visible
            var aColumns = oTable.getColumns();
            aColumns.forEach(function (oColumn) {
                oColumn.setVisible(true);
            });
         
            // Reset Checkboxes in the Fragment
            var aCheckboxes = ["MessageIDFrag","ServiceInterfaceFrag", "SenderComponentFrag", "ReceiverComponentFrag", "QualityOfServiceFrag", "scheduledTimeFrag"];
            aCheckboxes.forEach(function (sCheckboxId) {
                var oCheckbox = sap.ui.getCore().byId(oView.getId() + "--" + sCheckboxId);
                if (oCheckbox) {
                    oCheckbox.setSelected(true);
                }
            });
         
            
            var oComboBox = oView.byId("PIPOPIPOMsgDetailsSort");
            if (oComboBox) {
                oComboBox.setSelectedKey("");
                this.getView().byId("sorting_textPIPOMsg").setText("Sort" );
                this.getView().byId("sortAscendingBtnPIPOMsg").setType("Default")
                this.getView().byId("sortDescendingBtnPIPOMsg").setType("Default");
            }
            var oBinding = oTable.getBinding("rows");
            if (oBinding) {
                oBinding.sort(null); // Remove all sorters
            }
            sap.m.MessageToast.show("Columns, Sorting, and Filters have been reset.");
            this._oDialogMsgKey.close();
        },

        onMessageKeySelect: function(oEvent) {
            // Get the selected item
            var oSelectedItem = oEvent.getParameter("rowContext"); 
        
            // Get the model
            var oModel = this.getView().getModel("uiModel");
        
            if (oSelectedItem) {
                // Get the binding context of the selected item
                var oContext = oSelectedItem;
        
                // Retrieve the entire row data from the context
                var oRowData = oContext.getObject();
        
                // Log the selected row data
                console.log("Selected On-Premise Message data: ", oRowData);
        
                // Assuming MessageKey is a property in the row data
                var selectedMessageKey = oRowData.MessageKey;
        
                console.log("selectedMessageKey: ", selectedMessageKey);
        
                // Set the selected row data in the model
                oModel.setProperty("/selectedPIPOMessage", oRowData);
                console.log("uiModel data1: ", oModel.getData());
        
                // Set the flag to indicate that a row is selected
                oModel.setProperty("/isPIPOMessageRowSelected", true);
            } else {
                // Clear the selected row data in the model
                oModel.setProperty("/selectedPIPOMessage", null);
        
                // Set the flag to indicate that no row is selected
                oModel.setProperty("/isPIPOMessageRowSelected", false);
            }
        },

        selectCPIIflow: function() {
            // Remove the input check since we want to initiate the GET call without input
            var sURL = this.getOwnerComponent().getManifestObject().resolveUri('PO');
            sURL = sURL + '/http/Get_Integration_List';
            var settings = {
                "url": sURL,
                "method": "GET",
                "timeout": 0,
                "headers": {
                    "Content-Type": "application/json", // Change to application/json
                },
                "dataType": "json" // Specify that we expect a JSON response
            };
        
            var that = this;
            $.ajax(settings).done(function (response) {
                console.log("Integration response:", response);
             
                if (response && response.Root && Array.isArray(response.Root)) {
                    // Transform the data to include serial numbers
                    var integrations = response.Root.map(function (item, index) {
                        return {
                            serialNumber: index + 1, // Serial number based on the index (1-based)
                            package: "Get_Integration_List", // Fixed value for the package
                            id: item.Id || "",              // Message ID
                            name: item.Name || ""           // Artifact Name
                        };
                    });
             
                    // Set data to model
                    var oCPIModel = new JSONModel({ integrations: integrations });
                    
                    var oTable = that.getView().byId("cpiIflowTable"); 
                    // Clear any existing model data
                    oTable.setModel(null);
                    // Set the new model to the table
                    oTable.setModel(oCPIModel); 
                    // Set the visible row count to the number of records
                    oTable.setVisibleRowCount(integrations.length);
                    that.getView().byId("totalCPIIflows").setText("Total CPI Iflows: (" + integrations.length + ")");

                    // console.log("Model data:", oModel.getData());
                } else if (response && response.Root) {
                    // Single object case
                    var oCPIModel = new JSONModel({
                        integrations: [
                            {
                                serialNumber: 1, // Serial number for the single object
                                package: "Get_Integration_List",
                                id: response.Root.Id || "",
                                name: response.Root.Name || ""
                            }
                        ]
                    });
                    that.getView().setModel(oCPIModel);

                    
                } else {
                    console.error("Invalid response structure:", response);
                    MessageToast.show("No integrations found.");
                }
            }).fail(function (error) {
                console.error("Failed to fetch data:", error);
                MessageToast.show("Failed to get list of iflows.");
            });
        },

        searchCPIIflowDetails: function(oEvent) {
            var searchValue = oEvent.getParameter("query")
            var oTable = this.byId("cpiIflowTable");
            var oBinding = oTable.getBinding("rows");
            var aFilters = [];
            if (searchValue) {
                var oFilter = new sap.ui.model.Filter("name", sap.ui.model.FilterOperator.Contains, searchValue);
                aFilters.push(oFilter);
            }
            oBinding.filter(aFilters);
            var aFilteredItems = oBinding.getCurrentContexts();
            if (aFilteredItems.length === 0) {
                sap.m.MessageBox.information("No data found for the entered name: " + searchValue);
            }
        },

        onExportCPIIflows: function() {
            var aCols, oRowBinding, oSettings, oSheet, oTable;
        
            // Get the table by its ID
            oTable = this.getView().byId("cpiIflowTable"); 
            oRowBinding = oTable.getBinding("items"); 
        
            // Create column configuration
            aCols = this.createColumnConfigCPI(); 
        
            // Get the model and data
            var oModel = oTable.getModel(); // Get the model set in selectPIPOInterface
            var oData = oModel.getProperty("/integrations"); // Access the icoDetails array
        
            // Set up the export settings
            oSettings = { 
                workbook: { columns: aCols }, 
                dataSource: oData, 
                fileName: "CPI_IFLOW_Details.xlsx" 
            }; 
        
            // Show confirmation alert
            var userConfirmed = window.confirm("Do you want to download the table as an Excel sheet?");
            
            if (userConfirmed) {
                // Create a new Spreadsheet instance
                oSheet = new Spreadsheet(oSettings); 
        
                // Build the spreadsheet and handle the promise
                oSheet.build()
                    .then(function () {
                        MessageToast.show("Spreadsheet export has finished"); 
                    })
                    .finally(function () {
                        oSheet.destroy(); 
                    });
            }
        },
        
        createColumnConfigCPI: function () {
            return [
                {
                    label: "S.No", 
                    property: "serialNumber", 
                    type: "number" 
                }, 
                {
                    label: "ID", 
                    property: "id", 
                    type: "string" 
                },
                {
                    label: "Artifact Name", 
                    property: "name", 
                    type: "string" 
                }
            ];
        },
        
        onGetMsgDetailsCPI: function(oEvent) {
            var oSelectedItem = oEvent.getParameter("rowContext");
            var oUiModel = this.getView().getModel("uiModel");
            
            if (oSelectedItem) {
                var oContext = oSelectedItem;

                var oRowData = oContext.getObject();
                console.log("Selected CPI iFlow data: ", oRowData);
                
                // Set the selected row data in the model
                oUiModel.setProperty("/selectedCPIIflow", oRowData);
                console.log("uiModel datacpi1: ", oUiModel.getData());
        
                // Update the UI to reflect the selected iFlow ID
                var oText = this.byId("selectedIflow");
                oText.setText(oRowData.id);
                
                // Now use the selected ID to make the next AJAX call
                this.selectIflowMsgs(oRowData.id);
                
                // Set the flag to indicate that a row is selected
                oUiModel.setProperty("/isCPIIflowRowSelected", true);
            } else {
                // Clear the selected row data in the model
                oUiModel.setProperty("/selectedCPIIflow", null);
                
                // Set the flag to indicate that no row is selected
                oUiModel.setProperty("/isCPIIflowRowSelected", false);
            }
        },

        selectIflowMsgs: function(selectedId) {
            console.log("Selected ID for AJAX call:", selectedId); // Log the selected ID
        
            var sURL = this.getOwnerComponent().getManifestObject().resolveUri('PO');
            sURL = sURL + '/http/Get_IFlow_Executions';
        
            var inputBody = {
                "id": selectedId 
            };
        
            // Define the settings for the AJAX call
            var settings = {
                "url": sURL,
                "method": "POST",
                "timeout": 0,
                "headers": {
                    "Content-Type": "application/json"
                },
                "data": JSON.stringify(inputBody),
                "dataType": "json"
            };
        
            // Make the AJAX call
            $.ajax(settings).done((response) => { // Use arrow function here
                console.log("Response from Get IFlow Executions:", response);
                var cpiMsgs = [];
        
                // Check if response.Message is an array or an object
                if (Array.isArray(response.Message)) {
                    // If it's an array, iterate through it
                    response.Message.forEach(message => {
                        cpiMsgs.push({
                            Message_GUID: message.Message_Guid,
                            StartDate: message.Log_StartDate,
                            EndDate: message.Log_EndDate,
                            Status: message.Status
                        });
                    });
                } else if (typeof response.Message === 'object') {
                    // If it's a single object, push it directly
                    cpiMsgs.push({
                        Message_GUID: response.Message.Message_Guid,
                        StartDate: response.Message.Log_StartDate,
                        EndDate: response.Message.Log_EndDate,
                        Status: response.Message.Status
                    });
                }
        
                var oCpiMsgsModel = new sap.ui.model.json.JSONModel();
                oCpiMsgsModel.setData({ cpiMsgs: cpiMsgs });
        
                var oTable = this.getView().byId("CPIMessageTable"); // 'this' refers to the controller
                oTable.setModel(null);
                oTable.setModel(oCpiMsgsModel);
                oTable.setVisibleRowCount(cpiMsgs.length);
                this.getView().byId("totalCPIMessages").setText("Total CPI Messages: (" + cpiMsgs.length + ")");
        
                console.log("CPI Messages", oCpiMsgsModel.getData());
        
            }).fail((jqXHR, textStatus, errorThrown) => {
                console.error("Error occurred:", textStatus, errorThrown);
            });
        },

        onCPIMessageSelect: function(oEvent) {
            var oSelectedItem = oEvent.getParameter("rowContext");
            var oUiModel = this.getView().getModel("uiModel");
            if (oSelectedItem) {
                var oContext = oSelectedItem;
                var oRowData = oContext.getObject(); 
                console.log("Selected CPI Message data: ", oRowData);                
                oUiModel.setProperty("/selectedCPIMessage", oRowData);
                console.log("uiModel data after selection: ", oUiModel.getData());
                oUiModel.setProperty("/isCPIMessageSelected", true);
            } else {
                oUiModel.setProperty("/selectedCPIMessage", null);
                oUiModel.setProperty("/isCPIMessageSelected", false);
            }
        },
        
        searchCPIMsgDetails: function(oEvent) {
            var searchValue = oEvent.getParameter("query");
            var oTable = this.byId("CPIMessageTable");
            var oBinding = oTable.getBinding("rows");   
            var aFilters = [];
            if (searchValue) {
                aFilters.push(new sap.ui.model.Filter("Status", sap.ui.model.FilterOperator.EQ, searchValue));
            }
            oBinding.filter(aFilters);
            var aFilteredItems = oBinding.getCurrentContexts();
            if (aFilteredItems.length === 0) {
                sap.m.MessageBox.information("No data found for the entered status: " + searchValue);
            }
        },

        async onCPIMsgSettingsPress() {
            this._oDialogCPIMsg ??= await this.loadFragment({
                name: "postmigrationtestingtool.view.fragments.CPIMsgSettings"
            });
            this._oDialogCPIMsg.open()
        },

        onCancelCPIMsg: function () {
            this._oDialogCPIMsg.close();
        },

        onSortAscendingCPIMsg: function() {
            this._bAscending = true;
            this.getView().byId("sorting_textCPIMsg").setText("ASCENDING ORDER" );
            this.getView().byId("sortAscendingBtnCPIMsg").setType("Emphasized")
            this.getView().byId("sortDescendingBtnCPIMsg").setType("Default");
        },
        
        onSortDescendingCPIMsg: function() {
            this._bAscending = false;
            this.getView().byId("sorting_textCPIMsg").setText("DESCENDING ORDER" );
            this.getView().byId("sortDescendingBtnCPIMsg").setType("Emphasized")
            this.getView().byId("sortAscendingBtnCPIMsg").setType("Default");
        },

        onOKCPIMsg: function() {
            var oView = this.getView();
            var oTable = oView.byId("CPIMessageTable");
            var oIconTabBar = this.byId("idIconTabBarNoIconsCPIMsg"); // Get the IconTabBar
            var sSelectedKey = oIconTabBar.getSelectedKey();

            if (sSelectedKey === "columns") {
                var aColumns = oTable.getColumns();
                var aCheckboxes = [
                    "GUIDMsgFragCPIMsg","startDateFragCPIMsg", "EndDateFragCPIMsg", "statusFragCPIMsg"
                ];
                aCheckboxes.forEach(function (sCheckboxId, index) {
                    var bSelected;
                    
                    bSelected = sap.ui.getCore().byId(oView.getId() + "--" + sCheckboxId).getSelected();
                    
                    aColumns[index].setVisible(bSelected);
                });
            } else if(sSelectedKey === "sort") {
                var oComboBox = oView.byId("CPIIflowDetailsSort");
                var sSortKey = oComboBox.getSelectedKey();
                if (sSortKey) {
                    // Store the current sort key
                    this._currentSortKey = sSortKey;
                    // Create a sorter based on the selected key and current order
                    var oSorter = new sap.ui.model.Sorter(sSortKey, !this._bAscending); // Set descending if _bAscending is false
    
                    // Apply the sorter to the table's binding
                    var oBinding = oTable.getBinding("rows");
                    console.log("binding items: ", oBinding.getLength())
                    // Check if there are rows to sort
                    if (oBinding.getLength() === 0) {
                        // Show a message toast if there are no rows
                        sap.m.MessageToast.show("No rows available to sort.");
                    } else {
                        oBinding.sort(oSorter);
                    }
                }
            } else if (sSelectedKey === "filter") {
                // Filtering logic based on selected start and end dates
                var oStartDatePicker = this.byId("StartDateFilter");
                var oEndDatePicker = this.byId("EndDateFilter");
                var oBinding = oTable.getBinding("rows");

                var oStartDate = oStartDatePicker.getDateValue();
                var oEndDate = oEndDatePicker.getDateValue();

                var aFilters = [];

                if (oStartDate) {
                    var sFormattedStartDate = sap.ui.core.format.DateFormat.getInstance({
                        pattern: "yyyy-MM-dd"
                    }).format(oStartDate);

                    var oStartDateFilter = new sap.ui.model.Filter({
                        path: "StartDate",
                        test: function(value) {
                            if (value) {
                                var oDate = new Date(value);
                                var sDate = sap.ui.core.format.DateFormat.getInstance({
                                    pattern: "yyyy-MM-dd"
                                }).format(oDate);
                                return sDate >= sFormattedStartDate; // Filter for dates greater than or equal to start date
                            }
                            return false;
                        }
                    });

                    aFilters.push(oStartDateFilter);
                }

                if (oEndDate) {
                    var sFormattedEndDate = sap.ui.core.format.DateFormat.getInstance({
                        pattern: "yyyy-MM-dd"
                    }).format(oEndDate);

                    var oEndDateFilter = new sap.ui.model.Filter({
                        path: "EndDate",
                        test: function(value) {
                            if (value) {
                                var oDate = new Date(value);
                                var sDate = sap.ui.core.format.DateFormat.getInstance({
                                    pattern: "yyyy-MM-dd"
                                }).format(oDate);
                                return sDate <= sFormattedEndDate; // Filter for dates less than or equal to end date
                            }
                            return false;
                        }
                    });

                    aFilters.push(oEndDateFilter);
                }

                // Apply the filters to the table binding
                oBinding.filter(aFilters);

                // Check if there are any rows after filtering
                var aFilteredContexts = oBinding.getContexts();
                if (aFilteredContexts.length === 0) {
                    // Show an info message box if no data is found
                    sap.m.MessageToast.show("No data found for the selected date.");
                }
            }
            this._oDialogCPIMsg.close();
        },

        onNextButton: function () {
            this._oWizard.nextStep();
        },
        
        onPreviousButton: function () {
            this._oWizard.previousStep();
        },
        
        // handleNavigationChange: function (oEvent) {
        //     var oStep = oEvent.getParameter("step");
        //     console.log("Navigated to step:", oStep.getTitle());
        // },

        onShowComparison: function () {
            // Create the dialog if it doesn't exist
            if (!this._oDialogShow) {
                this._oDialogShow = sap.ui.xmlfragment("postmigrationtestingtool.view.fragments.show", this);
                this.getView().addDependent(this._oDialogShow);
            }

            // Fetch the PO data and open the dialog
            this.fetchPOPayload();
            this.fetchCPIPayload();
            this._oDialogShow.open();
        },
         
        fetchPOPayload: function() {
            var sURL = this.getOwnerComponent().getManifestObject().resolveUri('PO');
            sURL = sURL + '/http/GetPOMsg';
            
         
            // Get the selected item from the table
            var oTable = this.byId("onPremiseTable");
            var aSelectedIndices = oTable.getSelectedIndices();
            if (aSelectedIndices.length === 0) {
                console.error("No item selected in the table.");
                return; 
            }

            var oContext = oTable.getContextByIndex(aSelectedIndices[0]);
            var selectedMessageKey = oContext.getProperty("MessageKey");
            console.log("selected message key: ", selectedMessageKey)
         
            // Construct the XML payload with the selected messageKey
            var xmlPayload = selectedMessageKey
            // AJAX settings
            var settings = {
                "url": sURL,
                "method": "POST",
                "timeout": 0,
                "headers": {
                    "Content-Type": "application/xml"
                },
                "data": xmlPayload
            };
         
            var that = this;
            $.ajax(settings).done(function(response) {
                console.log("Message Key success Response:", response);
         
                // Convert XML response to a string
                var responseText = new XMLSerializer().serializeToString(response);

                // Format the XML response
                var formattedResponse = that.formatXML(responseText);
                
                var poLines = formattedResponse.split('\n').map(line => ({ pipo: line.trim(), cpi: "" }));

                // Set the model for the table
                var oModel = new JSONModel({ responses: poLines });
                that._oDialogShow.setModel(oModel);
         
            }).fail(function(jqXHR, textStatus, errorThrown) {
                console.error("Error in fetching PIPO Payload:", textStatus, errorThrown);
            });
        },

        fetchCPIPayload: function() {
            var oTable = this.byId("CPIMessageTable");
            var aSelectedIndices = oTable.getSelectedIndices();
            if (aSelectedIndices.length === 0) {
                console.error("No item selected in the table.");
                return; 
            }

            var oContext = oTable.getContextByIndex(aSelectedIndices[0]);
            var messageGuid = oContext.getProperty("Message_GUID");
        
            // Log the selected Message_Guid (for debugging)
            console.log("Selected Message_Guid:", messageGuid);
        
            var sURL = this.getOwnerComponent().getManifestObject().resolveUri('PO');
            sURL = sURL + '/http/get_attachment';
        
            // Define the input body using the selected Message_Guid
            var inputBody = {
                "id": messageGuid
            };

            console.log("inputbody", inputBody)
        
            // Define the settings for the AJAX call
            var settings = {
                "url": sURL,
                "method": "POST",
                "timeout": 0,
                "headers": {
                    "Content-Type": "application/json"
                },
                "data": JSON.stringify(inputBody),
                "dataType": "xml" // Change this to "xml"
            };
        
            var that = this;
            // Make the AJAX call
            $.ajax(settings)
                .done(function(response) {
                    console.log("CPI attachment:", response);
                    // Convert XML response to a string
                    var responseText = new XMLSerializer().serializeToString(response);
                    // Format the XML response
                    var formattedResponse = that.formatXML(responseText);
                    
                    // // Get the existing model and update it
                    var oModel = that._oDialogShow.getModel();
                    var cpiResponses = oModel.getData().responses;

                    // Split the CPI response into lines
                    var cpiLines = formattedResponse.split('\n').map(line => line.trim());

                    // Update the CPI responses in the model
                    cpiResponses.forEach((item, index) => {
                        item.cpi = cpiLines[index] || ""; // Assign CPI response or empty if not available
                    });

                    // Refresh the model
                    oModel.refresh();
                })
                .fail(function(jqXHR, textStatus, errorThrown) {
                    console.error("CPI attachment failed:", textStatus, errorThrown);
                });
        },
        formatXML: function (xmlString) {
            // Parse the XML string into a document
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlString, "application/xml");
        
            // Serialize the XML document with indentation
            const serializer = new XMLSerializer();
            let formattedXML = serializer.serializeToString(xmlDoc);
        
            // Add line breaks after each element
            formattedXML = formattedXML.replace(/></g, ">\n<");
        
            // Ensure the root element is on the first line
            formattedXML = formattedXML.replace(/^<\?xml[^>]*>\n?/, "");
        
            // Indent the XML for better readability
            const indent = (str, spaces) => {
                return str.split('\n').map(line => ' '.repeat(spaces) + line).join('\n');
            };
        
            // Indent the XML with 4 spaces
            formattedXML = indent(formattedXML, 4);
        
            return formattedXML.trim(); // Remove any leading or trailing whitespace
        },

        onCloseComparisonDialog: function () {
            if (this._oDialogShow) {
                this._oDialogShow.close();
            }
            
            sap.ui.getCore().byId("dateText").setText("Date: ");
            this.clearTableStyles();
        },

        onCompare: function () {
            // Get the model from the dialog
            var oModel = this._oDialogShow.getModel();
            var Responses = oModel.getData().responses;
        
            // Initialize variables to track match status
            var allMatched = true;
            var currentDate = new Date().toLocaleString(); // Get current date and time
        
            // Loop through each response and compare PIPO and CPI
            Responses.forEach(function (item) {
                if (item.pipo === item.cpi) {
                    item.status = "Success"; // Mark as success if they match
                    item.color = "Success"; // Set color for success
                } else {
                    item.status = "Error"; // Mark as error if they don't match
                    item.color = "Error"; // Set color for error
                    allMatched = false; // Set allMatched to false if any mismatch
                }
            });
        
            // Update the model with the new status and colors
            oModel.refresh();

            // Update the status and date
            const status = allMatched ? "Matched" : "Not Matched";
            const statusColor = allMatched ? "Green" : "Red"; // Determine color based on allMatch
        
            // Wrap the status text in a span with the appropriate color
            const statusText = `Status: <span style="color: ${statusColor.toLowerCase()};">${status}</span>`;
            const statusControl = sap.ui.getCore().byId("statusText");
            const domRef = statusControl.getDomRef();
            if (domRef) {
                domRef.innerHTML = statusText;
            }
        
            var oDateText = this._oDialogShow.getContent()[0].getItems()[1]; // Access the VBox and then the Text
            oDateText.setText("Date: " + currentDate); // Update date text

            var uiModel = this.getView().getModel("uiModel");
            uiModel.setProperty("/status", status);
            uiModel.setProperty("/date", currentDate);
    
            console.log("uiModel after compare: ", uiModel.getData());

            // Access the comparison table correctly
            var oTable = this._oDialogShow.getContent()[1].getContent()[0]; // Access the Table from the ScrollContainer
            oTable.setMode("MultiSelect"); // Set the selection mode
        
            // Update the text colors in the table rows
            Responses.forEach(function (item, index) {
                var oRow = oTable.getItems()[index];
                if (oRow) {
                    // Get the Text elements in the row
                    var oPipoText = oRow.getCells()[0]; // First cell (PIPO Response)
                    var oCpiText = oRow.getCells()[1]; // Second cell (CPI Response)
        
                    // Set the text color based on the comparison result
                    if (item.color === "Success") {
                        oPipoText.addStyleClass("SuccessText"); // Add success text class
                        oCpiText.addStyleClass("SuccessText"); // Add success text class
                    } else if (item.color === "Error") {
                        oPipoText.addStyleClass("ErrorText"); // Add error text class
                        oCpiText.addStyleClass("ErrorText"); // Add error text class
                    }
                }
            });
            sap.ui.getCore().byId("ignore").setEnabled(true)
        },

        onIgnore: function () {
            // Get the model from the dialog
            var oModel = this._oDialogShow.getModel();
            var Responses = oModel.getData().responses;
        
            // Access the comparison table correctly
            var oTable = this._oDialogShow.getContent()[1].getContent()[0]; // Table inside ScrollContainer
            var selectedItems = oTable.getSelectedItems(); // Get selected rows
        
            if (selectedItems.length === 0) {
                MessageBox.information("No rows selected for ignoring.")
                console.error("No rows selected for ignoring.");
                return; // Exit if no rows are selected
            }
        
            var isDate = function (content) {
                // Trim the content to remove unnecessary whitespace
                content = content.trim();
        
                // Define regex patterns for common date formats
                var datePatterns = [
                    /^\d{4}-\d{2}-\d{2}$/,          // YYYY-MM-DD
                    /^\d{2}\/\d{2}\/\d{4}$/,        // MM/DD/YYYY
                    /^\d{2}-\d{2}-\d{4}$/,          // DD-MM-YYYY
                    /^\d{4}\/\d{2}\/\d{2}$/,        // YYYY/MM/DD
                    /^\d{2}\s[A-Za-z]{3}\s\d{4}$/,  // DD MMM YYYY (e.g., 28 Jan 2025)
                    /^[A-Za-z]{3}\s\d{2},\s\d{4}$/,  // MMM DD, YYYY (e.g., Jan 28, 2025)
                    /^\d{4}\d{2}\d{2}$/
                ];
        
                // Check if the content matches any of the patterns
                for (var i = 0; i < datePatterns.length; i++) {
                    if (datePatterns[i].test(content)) {
                        return true;
                    }
                }
        
                // If no pattern matches, return false
                return false;
            };
        
            // Function to check if the content is an empty XML tag or self-closing
            var isEmptyTag = function (content) {
                return content.trim().match(/^<\w+\/>$|^<\w+>\s*<\/\w+>$/);
            };
        
            // Function to compare XML tags ignoring self-closing and formatting differences
            var areTagsEqual = function (pipo, cpi) {
                var pipoTag = pipo.replace(/\/>/g, "></").trim(); // Normalize self-closing tags
                var cpiTag = cpi.replace(/\/>/g, "></").trim(); // Normalize self-closing tags
                return pipoTag === cpiTag;
            };
        
            var extractTextContent = function (xmlString) {
                var parser = new DOMParser();
                var xmlDoc = parser.parseFromString(xmlString, "text/xml");
                return xmlDoc.documentElement.textContent; // Get the text content of the root element
            };
        
            // Array to hold selected lines
            var selectedLines = [];
        
            // Iterate through selected rows
            selectedItems.forEach(function (oRow) {
                var index = oTable.indexOfItem(oRow); // Get row index
                var item = Responses[index]; // Get corresponding response object
        
                // Extract PIPO and CPI content
                var pipoContent = extractTextContent(item.pipo);
                var cpiContent = extractTextContent(item.cpi);
        
                // Check if either content is a date
                var pipoIsDate = isDate(pipoContent);
                var cpiIsDate = isDate(cpiContent);
        
                // Prioritize date comparison
                if (pipoIsDate && cpiIsDate) {
                    item.status = "Success"; // Update status to success
                    item.color = "Success"; // Set color to success
                } 
                // Check for empty tags or tag equality only if not dates
                else if (
                    areTagsEqual(pipoContent, cpiContent) || 
                    (isEmptyTag(pipoContent) && isEmptyTag(cpiContent))
                ) {
                    item.status = "Success"; // Update status to success
                    item.color = "Success"; // Set color to success
                } else {
                    item.status = "Error"; // Keep as error if content differs
                    item.color = "Error"; // Keep error color
                }
        
                // Add the processed item to the selectedLines array
                selectedLines.push({
                    pipo: item.pipo,
                    cpi: item.cpi,
                    status: item.status,
                    color: item.color
                });
            });
        
            // Refresh the model and update the table
            oModel.refresh();
        
            // Update the text colors in the table rows
            selectedItems.forEach(function (oRow) {
                var index = oTable.indexOfItem(oRow); // Get row index
                var item = Responses[index]; // Get corresponding response object
        
                // Get the Text elements in the row
                var oPipoText = oRow.getCells()[0]; // First cell (PIPO Response)
                var oCpiText = oRow.getCells()[1]; // Second cell (CPI Response)
        
                // Update text styles based on the comparison result
                if (item.color === "Success") {
                    oPipoText.removeStyleClass("ErrorText").addStyleClass("SuccessText");
                    oCpiText.removeStyleClass("ErrorText").addStyleClass("SuccessText");
                } else if (item.color === "Error") {
                    oPipoText.removeStyleClass("SuccessText").addStyleClass("ErrorText");
                    oCpiText.removeStyleClass("SuccessText").addStyleClass("ErrorText");
                }
            });
        
            // Check if all responses are successful
            var allMatched = Responses.every(function (item) {
                return item.color === "Success"; // Check if all items have the color "Success"
            });
        
            // Update the status and date
            const status = allMatched ? "Matched" : "Not Matched";
            const statusColor = allMatched ? "Green" : "Red"; // Determine color based on allMatch
        
            // Wrap the status text in a span with the appropriate color
            const statusText = `Status: <span style="color: ${statusColor.toLowerCase()};">${status}</span>`;
            const statusControl = sap.ui.getCore().byId("statusText");
            const domRef = statusControl.getDomRef();
            if (domRef) {
                domRef.innerHTML = statusText; // Update the status text in the UI
            }

            var currentDate = new Date().toLocaleString(); // Get current date and time
            var oDateText = this._oDialogShow.getContent()[0].getItems()[1]; // Access the VBox and then the Text
            oDateText.setText("Date: " + currentDate); // Update date text
        
            // Update the uiModel with the selected lines
            var uiModel = this.getView().getModel("uiModel");

            uiModel.setProperty("/status", status);
            uiModel.setProperty("/date", currentDate);
            uiModel.setProperty("/selectedLines", selectedLines); // Set the selected lines in the uiModel

            console.log("uiModel after ignore: ", uiModel.getData());
            MessageToast.show("The selected lines are ignored")
        },        
         

        clearTableStyles: function () {
            // Access the comparison table
            var oTable = this._oDialogShow.getContent()[1].getContent()[0]; // Access the Table from the ScrollContainer
        
            // Loop through each row and remove style classes
            oTable.getItems().forEach(function (oRow) {
                var oPipoText = oRow.getCells()[0]; // First cell (PIPO Response)
                var oCpiText = oRow.getCells()[1]; // Second cell (CPI Response)
        
                // Remove success and error classes
                oPipoText.removeStyleClass("SuccessText");
                oPipoText.removeStyleClass("ErrorText");
                oCpiText.removeStyleClass("SuccessText");
                oCpiText.removeStyleClass("ErrorText");
            });
        },
        
        onReviewButtonPress: function () {
            this.byId("navContainer").to(this.byId("reviewPage"));
        },

        onNavigateToTableInfo: function() {
            this._oRouter.navTo("RouteTableInfo")        
        },

        onNavigateToOverview: function() {
            this._oRouter.navTo("RouteOverviewPage")
        },
        
        onBackToTestPage: function() {
            this.byId("navContainer").to(this.byId("dynamicPage"));
        },

        onEdit1: function () {
            this._handleNavigationToStep(0); 
        },
 
        onEdit2: function () {
            this._handleNavigationToStep(1); 
        },
        onEdit3: function () {
            this._handleNavigationToStep(2);
        },
        onEdit4: function () {
            this._handleNavigationToStep(3);
        },
        onEdit5: function () {
            this._handleNavigationToStep(4);
        },

        
 
        _handleNavigationToStep: function (iStepNumber) {
            var fnAfterNavigate = function () {
                this._oWizard.goToStep(this._oWizard.getSteps()[iStepNumber]);
                this._oNavContainer.detachAfterNavigate(fnAfterNavigate);
            }.bind(this);
 
            this._oNavContainer.attachAfterNavigate(fnAfterNavigate);
            this.backToWizardContent();
        },

        backToWizardContent: function () {
            this._oNavContainer.backToPage(this._oWizardContentPage.getId());
        },

        onDownload: async function () {
            var oView = this.getView();
            var oDynamicPage = oView.byId("reviewPage");
            if (!oDynamicPage) {
                sap.m.MessageToast.show("Error: Review page not found.");
                return;
            }
        
            // Prompt the user for confirmation
            const userConfirmed = confirm("Do you want to download the test results as a PDF?");
            if (!userConfirmed) {
                return; // Exit the function if the user clicks "Cancel"
            }
        
            var oModel = oView.getModel("uiModel");
        
            // Safely get properties from the model, defaulting to "N/A" if undefined
            var scenarioTitle = oModel.getProperty("/Scenariotitle") || "N/A";
            var testedBy = oModel.getProperty("/testedBy") || "N/A";
            var selectedPIPOInterface = oModel.getProperty("/selectedPIPOInterface") || {};
            var selectedPIPOMessage = oModel.getProperty("/selectedPIPOMessage") || {};
            var selectedCPIIflow = oModel.getProperty("/selectedCPIIflow") || {};
            var selectedCPIMessage = oModel.getProperty("/selectedCPIMessage") || {};
            var status = oModel.getProperty("/status") || "N/A";
            var date = oModel.getProperty("/date") || "N/A";
            var selectedLines = oModel.getProperty("/selectedLines") || [];
        
            try {
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF("p", "mm", "a4");
        
                // Define margins
                const marginLeft = 10;
                const marginRight = 200; // 210 mm (A4 width) - 15 mm (left margin)
                const marginTop = 15;
                const marginBottom = 15;
        
                // Function to draw margin lines
                const drawMargins = () => {
                    pdf.setDrawColor(0, 0, 0); // Set color for margin lines to black
                    pdf.setLineWidth(0.5); // Set line width (increase this value for thicker lines)
                    pdf.line(marginLeft, marginTop, marginLeft, 297 - marginBottom); // Left margin line
                    pdf.line(marginRight, marginTop, marginRight, 297 - marginBottom); // Right margin line
                    pdf.line(marginLeft, 297 - marginBottom, marginRight, 297 - marginBottom); // Bottom margin line
                    pdf.line(marginLeft, marginTop, marginRight, marginTop); // Top margin line
                };
        
                // Function to check if we need to add a new page
                const addPageIfNeeded = (currentY) => {
                    if (currentY > 270) { // 270 mm is a safe limit for content before a page break
                        pdf.addPage();
                        drawMargins(); // Draw margins on the new page
                        return marginTop + 10; // Reset Y position after adding a new page
                    }
                    return currentY;
                };
        
                // Draw margins on the first page
                drawMargins();
        
                pdf.setFont("Times New Roman", "bold");
                pdf.setFontSize(18);
                const title = "Post Migration Testing Report";
                const titleWidth = pdf.getTextWidth(title);
                const titleX = (pdf.internal.pageSize.getWidth() - titleWidth) / 2; // Center the title
                pdf.text(title, titleX, marginTop + 10);
                
                // Add gap after header
                let currentY = marginTop + 30; // Start after the header

                pdf.setFontSize(12);
                pdf.setFont("Times New Roman", "bold"); // Set font to bold for headings
                pdf.text("Scenario Title: " + scenarioTitle, marginLeft + 10, currentY);
                
                currentY += 10;

                // Determine the test result and draw the appropriate mark
                const testResult = status || "N/A";
                const resultText = "Test Result: " + testResult;
                pdf.text(resultText, marginLeft + 10, currentY);

                // Draw the tick or cross mark
                const markX = marginLeft + pdf.getTextWidth(resultText) + 15; // Position mark after the text with a space
                const markY = currentY-2 ; // Adjust Y position to align with the text

                if (testResult === "Matched") {
                    // Draw a green tick mark
                    pdf.setDrawColor(0, 128, 0); // Green color
                    pdf.setLineWidth(1); // Set line width to match font size
                    const tickSize = 2; // Size of the tick mark
                    pdf.line(markX, markY, markX + tickSize, markY + tickSize); // Draw first line of tick
                    pdf.line(markX + tickSize, markY + tickSize, markX + 2 * tickSize, markY - tickSize); // Draw second line of tick
                } else if (testResult === "Not Matched") {
                    // Draw a red cross mark
                    pdf.setDrawColor(255, 0, 0); // Red color
                    pdf.setLineWidth(1); // Set line width to match font size
                    const crossSize = 2; // Size of the cross mark
                    pdf.line(markX - crossSize, markY - crossSize, markX + crossSize, markY + crossSize); // Draw first line of cross
                    pdf.line(markX + crossSize, markY - crossSize, markX - crossSize, markY + crossSize); // Draw second line of cross
                }

                currentY += 10; // Move down for the next section
                pdf.text("Date: " + (date || "N/A"), marginLeft + 10, currentY);
                currentY += 15;
        
                // Add PI/PO Interface details
                currentY = addPageIfNeeded(currentY);
                pdf.setFontSize(14);
                pdf.setFont("Times New Roman", "bold");
                pdf.text("1. PI/PO Interface", marginLeft + 10, currentY);
                pdf.setFontSize(12);
                pdf.setFont("Times New Roman", "normal");
                currentY += 10;
                pdf.text("Interface Name: " + (selectedPIPOInterface.InterfaceName || "N/A"), marginLeft + 10, currentY);
                currentY += 10;
                pdf.text("Interface Namespace: " + (selectedPIPOInterface.InterfaceNamespace || "N/A"), marginLeft + 10, currentY);
                currentY += 10;
                pdf.text("Sender Component ID: " + (selectedPIPOInterface.SenderComponentID || "N/A"), marginLeft + 10, currentY);
                currentY += 15;
        
                // Add On-Premise Message details
                currentY = addPageIfNeeded(currentY);
                pdf.setFontSize(14);
                pdf.setFont("Times New Roman", "bold");
                pdf.text("2. On-Premise Message", marginLeft + 10, currentY);
                pdf.setFontSize(12);
                pdf.setFont("Times New Roman", "normal");
                currentY += 10;
                pdf.text("Message ID: " + (selectedPIPOMessage.MessageID || "N/A"), marginLeft + 10, currentY);
                currentY += 10;
                pdf.text("Service Interface: " + (selectedPIPOMessage.ServiceInterface || "N/A"), marginLeft +10, currentY);
                currentY += 10;
                pdf.text("Sender Component: " + (selectedPIPOMessage.Sender || "N/A"), marginLeft + 10, currentY);
                currentY += 10;
                pdf.text("Receiver Component: " + (selectedPIPOMessage.Receiver || "N/A"), marginLeft + 10, currentY);
                currentY += 10;
                pdf.text("Quality of Service: " + (selectedPIPOMessage.QualityOfService || "N/A"), marginLeft + 10, currentY);
                currentY += 10;
                pdf.text("Scheduled Time: " + (selectedPIPOMessage.ScheduledTime || "N/A"), marginLeft + 10, currentY);
                currentY += 15;
        
                // Add CPI IFlow details
                currentY = addPageIfNeeded(currentY);
                pdf.setFontSize(14);
                pdf.setFont("Times New Roman", "bold");
                pdf.text("3. CPI IFlow", marginLeft + 10, currentY);
                pdf.setFontSize(12);
                pdf.setFont("Times New Roman", "normal");
                currentY += 10;
                pdf.text("Package: " + (selectedCPIIflow.package || "N/A"), marginLeft + 10, currentY);
                currentY += 10;
                pdf.text("Artifact Name: " + (selectedCPIIflow.name || "N/A"), marginLeft + 10, currentY);
                currentY += 15;
        
                // Add CPI Message details
                currentY = addPageIfNeeded(currentY);
                pdf.setFontSize(14);
                pdf.setFont("Times New Roman", "bold");
                pdf.text("4. CPI Message", marginLeft + 10, currentY);
                pdf.setFontSize(12);
                pdf.setFont("Times New Roman", "normal");
                currentY += 10;
                pdf.text("Guid Message: " + (selectedCPIMessage.Message_GUID || "N/A"), marginLeft + 10, currentY);
                currentY += 10;
                pdf.text("Start Date: " + (selectedCPIMessage.StartDate || "N/A"), marginLeft + 10, currentY);
                currentY += 10;
                pdf.text("End Date: " + (selectedCPIMessage.EndDate || "N/A"), marginLeft + 10, currentY);
                currentY += 10;
                pdf.text("Status: " + (selectedCPIMessage.Status || "N/A"), marginLeft + 10, currentY);
                currentY += 15;
        
                // // Draw table for Ignored Nodes
                currentY = addPageIfNeeded(currentY);
                pdf.setFontSize(14);
                pdf.setFont("Times New Roman", "bold");
                pdf.text("5. Ignored Nodes", marginLeft + 10, currentY);
                pdf.setFontSize(10); // Reduced font size for ignored lines
                pdf.setFont("Times New Roman", "normal");
                currentY += 10;

                // Initialize currentY for the table
                var availableWidth = marginRight - marginLeft - 20; // 20 mm for left and right padding
                var colWidth = availableWidth / 2; // Divide available width for two columns
                var rowHeight = 10;

                // Draw headers
                pdf.rect(marginLeft + 10, currentY, colWidth, rowHeight); // PI/PO column
                pdf.rect(marginLeft + 10 + colWidth, currentY, colWidth, rowHeight); // CPI column
                pdf.text("PI/PO", marginLeft + 10 + colWidth / 2, currentY + 7, { align: "center" }); // Centered text
                pdf.text("CPI", marginLeft + 10 + colWidth + colWidth / 2, currentY + 7, { align: "center" }); // Centered text

                // Draw rows dynamically
                let currentTableY = currentY + rowHeight; // Initialize currentY for the table
                selectedLines.forEach((line) => {
                    currentTableY = addPageIfNeeded(currentTableY); // Check for page break

                    // Draw the rectangles for the table cells
                    pdf.rect(marginLeft + 10, currentTableY, colWidth, rowHeight);
                    pdf.rect(marginLeft + 10 + colWidth, currentTableY, colWidth, rowHeight);

                    // Function to wrap text
                    const wrapText = (text, x, y, maxWidth) => {
                        const words = text.split(' ');
                        let line = '';
                        let lineHeight = 10; // Adjust line height if necessary

                        words.forEach((word) => {
                            const testLine = line + word + ' ';
                            const testWidth = pdf.getTextWidth(testLine);
                            if (testWidth > maxWidth && line) {
                                pdf.text(line, x, y);
                                line = word + ' ';
                                y += lineHeight; // Move down for the next line
                            } else {
                                line = testLine;
                            }
                        });
                        pdf.text(line, x, y); // Draw the last line
                    };

                    // Draw the PI/PO and CPI text with wrapping
                    wrapText(line.pipo || "N/A", marginLeft + 15, currentTableY + 7, colWidth - 10); // Adjusted text position
                    wrapText(line.cpi || "N/A", marginLeft + 15 + colWidth, currentTableY + 7, colWidth - 10); // Adjusted text position

                    currentTableY += rowHeight; // Move down for the next row
                });

                currentY = currentTableY + 10; // Add some space after the table

                // Position for "Tested By" at the bottom of the last page
                const testedByY = 285 - marginBottom; // Position at the bottom margin
                pdf.setFontSize(12);
                pdf.setFont("Times New Roman", "normal");

                // Get the right margin position
                const rightMarginX = marginRight - 50; // 50 mm from the right margin for the signature

                // Add the name above the "Tested By" text
                pdf.text("" + testedBy, rightMarginX+2, testedByY - 10); // 10 mm above the bottom
                pdf.text("Tested By", rightMarginX + 5, testedByY); // At the bottom
        
                const sanitizedScenarioTitle = scenarioTitle.replace(/[<>:"/\\|?*]/g, '_');
                pdf.save(`${sanitizedScenarioTitle}.pdf`); // Save with scenario title as filename
            } catch (error) {
                console.error("PDF Generation Error:", error);
                sap.m.MessageBox.error("PDF Generation Error: " + error.message);
            }
        }
       
    });
});
 
  