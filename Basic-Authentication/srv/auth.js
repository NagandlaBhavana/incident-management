const cds = require('@sap/cds');
const axios = require('axios');
async function askQuestion(Question) {
    console.log("ask Question", Question);
    const data = {
        "input": Question
    };
    const sUrl = "https://cohere-fantastic-serval-fg.cfapps.us10-001.hana.ondemand.com/chat";
    try {
        console.log("Sending request to:", sUrl);
        console.log("Request data:", data);
        const response = await axios.post(sUrl, data, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        console.log("Response status:", response.status);
        console.log("Response data:", response.data);
        return response.data; 
    } catch (error) {
        console.log("error", error);
        return { response: "An error occurred while processing your question." };
    }
}
module.exports = cds.service.impl( async function(){
    const { ChatMessages , Users}=this.entities('cohere');
    this.on('CREATE', 'ChatMessages', async (req) => {
        const { Question , Username } = req.data;
        if (!Question) {
            return req.error(400, "Question is required.");
        }
        const apiResponse = await askQuestion(Question);
        const Answer = apiResponse.response;
        // const Answer = await askQuestion(Question);
        const result = {
            Question,
            Answer,
            Username
        };
        var result1 = await INSERT.into(ChatMessages).entries(result);
        console.log("result",result1);
        return result; 
    });
    this.on('CREATE', 'Users', async (req) => {
        const { Username, Email, Password } = req.data;
        if (!Username) {
            return req.error(400, "Question is required.");
        }
        const dataInsert = {
            Username,
            Email,
            Password
        };
        console.log("output",dataInsert);
        var result = await INSERT.into(Users).entries(dataInsert);
        console.log("result",result);
        return result;
    });
      
});