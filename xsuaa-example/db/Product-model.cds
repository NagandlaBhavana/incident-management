namespace gen.xsuaa;

using { cuid} from '@sap/cds/common';

entity Product : cuid {
    ProductID : String(40);
    Productname: String(40);
    ProductType: String(10)
}

entity ProductDesc : cuid {
    Description : String(100)
    
}