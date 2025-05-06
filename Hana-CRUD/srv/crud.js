const cds = require('@sap/cds');

module.exports = cds.service.impl( async function(){
    const {Employee}=this.entities('crud');
    this.on('CREATE', 'Employee', async (req) => {
        const { ID, Firstname, Lastname, Email,Skillset} = req.data;
        if (!Username) {
            return req.error(400, "Question is required.");
        }
        const dataInsert = {
            ID, Firstname, Lastname, Email,Skillset

        };
        console.log("output",dataInsert);
        var result = await INSERT.into(Employee).entries(dataInsert);
        console.log("result",result);
        return result;
       
    });
    this.on('UPDATE', 'Employee', async (req) => {
        const { ID, Firstname, Lastname, Email, Skillset } = req.data;
        if (!ID) {
            return req.error(400, "ID is required for updating an employee.");
        }
        const dataUpdate = {
            Firstname, Lastname, Email, Skillset
        };
        console.log("Updating employee with ID:", ID);
        var result = await UPDATE(Employee).set(dataUpdate).where({ ID });
        console.log("Update result", result);
        return result;
    });
    this.on('DELETE', 'Employee', async (req) => {
        const { ID } = req.data;
        if (!ID) {
            return req.error(400, "ID is required for deleting an employee.");
        }
        console.log("Deleting employee with ID:", ID);
        var result = await DELETE.from(Employee).where({ ID });
        console.log("Delete result", result);
        return result;
    });
});