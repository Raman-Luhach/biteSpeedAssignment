import { PrismaClient } from "@prisma/client";

const prismaClient = new PrismaClient();

async function connectDB() {
    try {
        await prismaClient.$connect();
        console.log("Database connected successfully.");
    } catch (error) {
        console.error("Failed to connect to the database:", error);
    }
}

export {prismaClient , connectDB};
