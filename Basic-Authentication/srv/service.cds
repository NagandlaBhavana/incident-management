using { basic_auth as my } from '../db/schema';

service BasicAuthenticationService @(requires: 'authenticated-user') {
    entity  ChatMessages as projection on my.ChatMessages;
    entity Users as projection on my.Users;
     
}