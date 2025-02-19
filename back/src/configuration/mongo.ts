import { MongoClient, Db, Collection } from 'mongodb';

const uri: string = "mongodb://localhost:27017"; 
const dbName: string = 'socketClientsDb';

const client = new MongoClient(uri);

let getMongoConnection: Collection;

const connectToMongo = async () => {
    try {
        await client.connect();
        const db: Db = client.db(dbName);
        getMongoConnection = db.collection('clients');
        console.log("CONNECTED TO MONGO");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit();
    }
};

connectToMongo();
export { getMongoConnection };
