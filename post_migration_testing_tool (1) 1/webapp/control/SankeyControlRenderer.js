sap.ui.define([], function () {
    "use strict";

    const SankeyControlRenderer = {
        apiVersion: 2,
        render: function (oRm, oControl) {
            oRm.openStart("div", oControl);
            oRm.style("width", oControl.getWidth());
            oRm.style("height", oControl.getHeight());
            oRm.openEnd();
            oRm.close("div");
        }
    };

    return SankeyControlRenderer;
});
