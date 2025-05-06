using gen.xsuaa as pr from '../db/Product-model';

service ProductServide {
    @requires: 'authenticated-user'
    entity ProductInfo as select from pr.Product;

    @requires: 'Admin'
    @restrict: [{grant: 'READ'}]
    entity ProductDesc as select from pr.ProductDesc;
}