using { crud as my } from '../db/schema';
service CRUDService {
    entity Employee as projection on my.Employee;    

}
