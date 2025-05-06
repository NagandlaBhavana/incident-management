sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/Text",
    "sap/m/TextArea",
    "sap/m/Button",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast"
    // "axios"
], (Controller, Text, TextArea, Button, Fragment, MessageToast) => {
    "use strict";

    return Controller.extend("genai.controller.View1", {
        onInit() {
            const oMessageInput = this.getView().byId("messageInput");
            oMessageInput.attachBrowserEvent("keydown", this.onKeyDown.bind(this));
            this.getView().setModel(new sap.ui.model.json.JSONModel({ ChatHistory: [] }));
            this.startTypingEffect("Ask Anything about Sales report", this.getView().byId("backgroundText"));
        },
        startTypingEffect(text, oTextControl) {
            let index = 0;
            oTextControl.setText(""); 

            const typeLetter = () => {
                if (index < text.length) {
                    oTextControl.setText(oTextControl.getText() + text.charAt(index));
                    index++;
                    setTimeout(typeLetter, 100); 
                }
            };

            typeLetter();
        },
        onMessageInputChange: function(oEvent) {
            var sValue = oEvent.getParameter("value");
            var oBackgroundText = this.byId("backgroundText");
            oBackgroundText.setVisible(!sValue);
        },
        onKeyDown: function (oEvent) {

            if ( oEvent.key === "Enter") {
                oEvent.preventDefault(); 
                this.onSendMessage();
            }
            
        },
        onSendMessage: function() {
            var MessageInput = this.getView().byId("messageInput").getValue();
            var oChatArea = this.getView().byId("chatArea");
            var oUserText = new Text({
                text: "You: " + MessageInput,
                width: "100%",
                wrapping: true
            });
            oChatArea.addItem(oUserText);
            var oUserText = new Text({
                text: "ChatBot: ",
                width: "100%",
                wrapping: true
            });
            oChatArea.addItem(oUserText);
            this.getView().byId("messageInput").setValue("");
            var data = {
                "Question": MessageInput,
                "Answer": "",
                "Username": this.loggedInUsername
            };
            var sUrl = "odata/v4/sales-report/ChatMessages";
            sUrl=this.getOwnerComponent().getManifestObject().resolveUri(sUrl);
            $.ajax({
                url: sUrl,
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify(data),
                success: function(response) {
                    console.log("response", response);
                    var answer = response.Answer;
                    var oChatbotVBox = new sap.m.VBox({
                        items: [
                            new TextArea({
                                value: answer,
                                width: "100%",
                                growing: true,
                                growingMaxLines: 10,
                                editable: false
                            }),
                            new Button({
                                icon: "sap-icon://download",
                                press: function () {
                                    this.downloadChat(answer);
                                }.bind(this)
                            })
                        ]
                    });
                    oChatArea.addItem(oChatbotVBox);
                    console.log("The answer is:", answer);
                }.bind(this),
                error: function(error) {
                    console.log("error", error);
                }
            });
        },
        downloadChat: function(content) {
            if (typeof window.jspdf === 'undefined') {
                console.error("jsPDF is not loaded");
                return;
            }
            const { jsPDF } = window.jspdf;
            var doc = new jsPDF();
            const spaceBeforeHeading = 20; 
            const spaceBetween = 10; 
            doc.setFontSize(18);
            const headingY = spaceBeforeHeading; 
            doc.text("Sales Report Document", 10, headingY);
            doc.setFontSize(11);
            const contentY = headingY + spaceBetween; 
            doc.text(content, 10, contentY, { maxWidth: 180 });
            doc.save("Sales_Report.pdf");
        },
        onToggleSideNavigation: function () {
            var oSideNav = this.getView().byId("sideNavigation");
            var oChatArea = this.getView().byId("chatArea");
            var bVisible = oSideNav.getVisible();
            oSideNav.setVisible(!bVisible);
            console.log("Side Navigation Visible:", !bVisible); 
            if (bVisible) {
                oChatArea.removeStyleClass("blurBackground");
            } else {
                oChatArea.addStyleClass("blurBackground");
                this.loadChatHistory();
            }
        },
        async onSignin() {
            this.oDialog ??= await this.loadFragment({
                name: "genai.view.fragments.login"
            });
        
            this.oDialog.open();
        },
        onclose: function(){
            var MesssageUsername = this.getView().byId("username").getValue();
            var MessagePassword = this.getView().byId("password").getValue();
            if (!MesssageUsername || !MessagePassword) {
                MessageToast.show("Please enter both username and password.");
                return;
            }
            var sUrl = "odata/v4/sales-report/Users";
            sUrl=this.getOwnerComponent().getManifestObject().resolveUri(sUrl)+"?$filter=Username eq '" + MesssageUsername + "'";
            $.ajax({
                url: sUrl,
                method: "GET",
                contentType: "application/json",
                success: function(response) {
                    if (response.value.length === 0) {
                        MessageToast.show("Username does not exist. Please register.");
                    } else {
                        var user = response.value[0]; 
                        if (user.Password === MessagePassword) {
                            MessageToast.show("Login successful!");
                            this.isLoggedIn = true;
                            this.loggedInUsername = MesssageUsername; 
                            var welcomeText = this.getView().byId("welcomeText");
                            welcomeText.setText("Welcome, " + MesssageUsername);
                            welcomeText.setVisible(true); 
                            var signinButton = this.getView().byId("signinButton");
                            signinButton.setVisible(false); 
                            var signoutButton = this.getView().byId("signoutButton");
                            signoutButton.setVisible(true); 
                            var messageInput = this.getView().byId("messageInput");
                            messageInput.setEditable(true); 
                            this.oDialog.close();
                            this.startTypingEffect("Ask Anything about Sales report", this.getView().byId("backgroundText"));
                            this.getView().byId("username").setValue("");
                            this.getView().byId("password").setValue("");
                        }
                        else {
                            MessageToast.show("Incorrect password. Please try again.");
                        }
                    }
                }.bind(this),
                error: function(error) {
                    console.log("Error fetching user data", error);
                    MessageToast.show("An error occurred while logging in.");
                }
            });
        },
        async onRegister() {
            this.oDialogs ??= await this.loadFragment({
                name: "genai.view.fragments.register"
            });
            this.oDialogs.open();
        },
        onclose1: function(){
            var MesssageName = this.getView().byId("name").getValue();
            var MessageEmail = this.getView().byId("email").getValue();
            var MessageCreate = this.getView().byId("create").getValue();
            var data1={
                "Username": MesssageName,
                "Email": MessageEmail,
                "Password": MessageCreate
            };
            var sUrl = "odata/v4/sales-report/Users";
            sUrl=this.getOwnerComponent().getManifestObject().resolveUri(sUrl);
            $.ajax({
                url: sUrl,
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify(data1)
            });
            var msg = 'Registered Successfully.....\r\n Login with your credentials';
			MessageToast.show(msg);
            this.oDialogs.close();
            this.getView().byId("name").setValue("");
            this.getView().byId("email").setValue("");
            this.getView().byId("create").setValue("");
        },
        
        loadChatHistory: function () {
            if (!this.loggedInUsername) {
        MessageToast.show("Please log in to see chat history.");
                return;
            }
         
            var sUrl = "odata/v4/sales-report/ChatMessages";
            sUrl=this.getOwnerComponent().getManifestObject().resolveUri(sUrl)+"?$filter=Username eq '" + this.loggedInUsername + "'";
            var oModel = this.getView().getModel();
         
            $.ajax({
                url: sUrl,
                method: "GET",
                contentType: "application/json",
                success: function (response) {
                    console.log("Chat History:", response);
                    oModel.setProperty("/ChatHistory", response.value);
                },
                error: function (error) {
                    console.log("Error loading chat history", error);
        MessageToast.show("Failed to load chat history.");
                }
            });
        },
        onSignOut: function() {
            this.isLoggedIn = false;
            this.loggedInUsername = null; 
            this.getView().byId("welcomeText").setVisible(false);
            this.getView().byId("signinButton").setVisible(true);
            this.getView().byId("signoutButton").setVisible(false);
            this.getView().byId("messageInput").setEditable(false); 
            this.getView().byId("chatArea").removeAllItems(); 
            MessageToast.show("You have been signed out.");
        },
        onChatHistoryItemSelect: function(oEvent) {
            var oSelectedItem = oEvent.getSource(); 
            if (!oSelectedItem) {
                console.error("No item selected");
                return;
            }
            var oContext = oSelectedItem.getBindingContext();
            if (!oContext) {
                console.error("No context found for the selected item");
                return;
            }
            var sSelectedAnswer = oSelectedItem.getText(); 
            var sSelectedQuestion = oSelectedItem.getTooltip(); 
            var oChatArea = this.getView().byId("chatArea");
            oChatArea.removeAllItems(); 
            var oUserText1 = new sap.m.Text({
                text: "You: " + sSelectedQuestion,
                width: "100%",
                wrapping: true
            });
            oChatArea.addItem(oUserText1);
            var oChatbotText = new sap.m.Text({
                text: "ChatBot: " + sSelectedAnswer,
                width: "100%",
                wrapping: true
            });
            oChatArea.addItem(oChatbotText);
            var oSideNav = this.getView().byId("sideNavigation");
            oSideNav.setVisible(false); 
            oChatArea.removeStyleClass("blurBackground"); 
            var oBackgroundText1 = this.getView().byId("backgroundText");
            oBackgroundText1.setVisible(false);
        },
        onAddChat:function(){
            var oChatArea = this.getView().byId("chatArea");
            oChatArea.removeAllItems(); 
            this.getView().byId("messageInput").setValue("");
            var oBackgroundText = this.getView().byId("backgroundText");
            oBackgroundText.setVisible(true); 
            this.startTypingEffect("Ask Anything about Sales report", this.getView().byId("backgroundText"));
            this.getView().byId("messageInput").setEditable(true);   
        }
    });
});