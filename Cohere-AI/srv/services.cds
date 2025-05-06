using { cohere as my } from '../db/schema';

service SalesReportService {
    entity  ChatMessages as projection on my.ChatMessages;
    entity Users as projection on my.Users;
}