sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",

], function (Controller, JSONModel) {
    "use strict";
    
    return Controller.extend("postmigrationtestingtool.controller.OverviewPage", {
        
        onInit: function () {
            this._oRouter = sap.ui.core.UIComponent.getRouterFor(this);

            const data = {
                "nodes": [
                  {"node": 0, "name": "PIPO"},
                  {"node": 1, "name": "CPI"},
                  {"node": 2, "name": "Tested"},
                  {"node": 3, "name": "Not Tested"},
                  {"node": 4, "name": "Matched"},
                  {"node": 5, "name": "UnMatched"}
                ],
                "links": 
                // [
                //   {"source": 0, "target": 2, "value": 58}, // Ensure value is >= 1
                //   {"source": 1, "target": 2, "value": 54},
                //   {"source": 2, "target": 4, "value": 70},
                //   {"source": 2, "target": 5, "value": 30},
                //   {"source": 0, "target": 3, "value": 42},
                //   {"source": 1, "target": 3, "value": 46},
                //   // {"source": 3, "target": 3, "value": 38},
                //   // {"source": 3, "target": 3, "value": 38}
                // ]
                [
                  {"source": 0, "target": 2, "value": 40},
                  {"source": 1, "target": 2, "value": 40},
                  {"source": 2, "target": 4, "value": 60},
                  {"source": 2, "target": 5, "value": 20},
                  {"source": 0, "target": 3, "value": 10},
                  {"source": 1, "target": 3, "value": 10},
                  // Add a small dummy flow from Not Tested to Matched to make Node 3 visible
                  {"source": 3, "target": 4, "value": 1}
                ]
              };
            
            const oModel = new JSONModel({ Diagram1: data });
            this.getView().setModel(oModel, "DiagramModel");
            

        },
        onGetStarted: function() {
            this._oRouter.navTo("RouteTableInfo")
        },

        onCollapseExpandPress: function () {
          const oSideNavigation = this.byId("sideNavigation"),
          bExpanded = oSideNavigation.getExpanded();

          oSideNavigation.setExpanded(!bExpanded);
        },

        onNavigationItemSelect: function (oEvent) {
          const sKey = oEvent.getParameter("item").getKey();
          const oView = this.getView();
       
          const oOverviewCard = oView.byId("OverviewCard");
          const oAnalysisCard = oView.byId("AnalysisCard");
       
          // Default hide all cards
          oOverviewCard.setVisible(false);
          oAnalysisCard.setVisible(false);
       
          // Show relevant card based on key
          switch (sKey) {
              case "Overview":
                  oOverviewCard.setVisible(true);
                  break;
              case "Analysis":
              case "Sankey-Chart":
              case "Donut-Chart":
              case "Bar-Chart":
              case "Line-Chart":
                  oAnalysisCard.setVisible(true);
                  break;
          }
      }
       
       

    });
});