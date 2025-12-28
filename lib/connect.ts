import mongoose from 'mongoose';

const MONGODB_URI:string = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
    throw new Error("Please add the mongodb uri to the environment variables");
}

interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

declare global {
    var mongoose: MongooseCache | undefined;
}

let cached = global.mongoose;


async function connectDB(): Promise<typeof mongoose> {
    if(!cached) {
    cached = global.mongoose = { conn: null, promise: null};
}

    if (cached.conn) {
        return cached?.conn;
    }
    if (!cached.promise) {
        const opts = { bufferCommands: false};
        cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => mongoose);
    }

    cached.conn = await cached?.promise;
    return cached.conn;
}

export default connectDB;