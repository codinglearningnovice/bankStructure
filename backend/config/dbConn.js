// backend/db.js
// Change from require to import
import pkg from "@prisma/client";
const { PrismaClient } = pkg;
export const prisma = new PrismaClient();

async function connectDB() {
  try {
    await prisma.$connect();
    console.log("✅ Postgres connected successfully via Prisma!");

    // Try to count users (will be 0, but proves it works)
    const userCount = await prisma.user.count();
    console.log(`Current user count: ${userCount}`);
  } catch (e) {
    console.error("❌ Database connection failed:", e);
  } finally {
    await prisma.$disconnect();
  }
}

export default connectDB;


