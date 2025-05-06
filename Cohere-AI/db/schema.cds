namespace cohere;
entity ChatMessages{
    key ID : UUID;
    Question : String;
    Answer: String;
    Username: String;
}
entity Users{
    key ID : UUID;
    Username: String;
    Email: String;
    Password: String;
    
}