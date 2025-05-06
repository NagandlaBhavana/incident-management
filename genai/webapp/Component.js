sap.ui.define([
    "sap/ui/core/UIComponent",
    "genai/model/models"
], (UIComponent, models) => {
    "use strict";

    return UIComponent.extend("genai.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

              // Load external scripts
              this._loadScripts().then(() => {
                console.log("Scripts loaded successfully");
            }).catch((error) => {
                console.error("Error loading scripts", error);
            });


            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            // enable routing
            this.getRouter().initialize();
        },
        _loadScripts() {
            return Promise.all([
                this._loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"),
                this._loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js")
            ]);
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