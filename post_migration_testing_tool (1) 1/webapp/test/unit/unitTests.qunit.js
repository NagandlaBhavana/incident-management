/* global QUnit */
// https://api.qunitjs.com/config/autostart/
QUnit.config.autostart = false;

sap.ui.require([
	"post_migration_testing_tool/test/unit/AllTests"
], function (Controller) {
	"use strict";
	QUnit.start();
});