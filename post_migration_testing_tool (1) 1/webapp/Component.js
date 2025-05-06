sap.ui.define([
    "sap/ui/core/UIComponent",
    "postmigrationtestingtool/model/models"
], (UIComponent, models) => {
    "use strict";
 
    return UIComponent.extend("postmigrationtestingtool.Component", {
        metadata: {
            manifest: "json",
            interfaces: ["sap.ui.core.IAsyncContentCreation"]
        },
 
        init() {
            // Call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);
 
            // Set the device model
            this.setModel(models.createDeviceModel(), "device");
 
            // Enable routing
            this.getRouter().initialize();
 
            // Load external scripts (jsPDF & html2canvas)
            this._loadScripts();
        },
 
        _loadScripts() {
            this._loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
            this._loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js");
        },
 
        _loadScript(url) {
            return new Promise((resolve, reject) => {
                let script = document.createElement("script");
                script.src = url;
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }
    });
});
 