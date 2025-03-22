import { Client, Databases, Account } from 'appwrite';

const client = new Client()
    .setEndpoint("https://cloud.appwrite.io/v1")
    .setProject("67dc2e4b00055c69fc12");

const databases = new Databases(client);
const account = new Account(client);

const databaseId = "67dc819e00325b3b1829";

export { client, databases, account, databaseId }; 