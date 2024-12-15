import { ApolloServer } from "@apollo/server";
import { schema } from "./schema.ts";
import { MongoClient } from "mongodb";
import { CourseModel, StudentModel, TeacherModel } from "./types.ts";
import { startStandaloneServer } from "@apollo/server/standalone";
import { resolvers } from "./resolvers.ts";


const MONGO_URL = Deno.env.get("N_MONGO");

if (!MONGO_URL) {
  throw new Error("Please  provide a MONGO_URL");
}

const mongoClient = new MongoClient(MONGO_URL);
await mongoClient.connect();

console.info("Connected to MongoDB");

const mongoDB_p5 = mongoClient.db("colegio");
const CourseCollection = mongoDB_p5.collection<CourseModel>("course");
const TeacherCollection = mongoDB_p5.collection<TeacherModel>("teacher");
const StudentCollection = mongoDB_p5.collection<StudentModel>("student");


const server = new ApolloServer({
  typeDefs: schema,
  resolvers,
});

const { url } = await startStandaloneServer(server, {
//  listen:{port:8080},
  context: async () => ({ CourseCollection, TeacherCollection, StudentCollection }),
});

console.info(`Server ready at ${url}`);