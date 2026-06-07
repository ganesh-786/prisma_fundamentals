import "dotenv/config";
import express from "express";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// Safely extract PrismaClient from the default package export
import prismaPackage from "@prisma/client";
const { PrismaClient } = prismaPackage;

// 1. Create a native PostgreSQL connection pool using your environment variable
// Explicitly pass ssl configuration required by hosted platforms like Render
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: true, // Required for Render direct pool links
  },
});

// 2. Instantiate the Prisma adapter with the pool
const adapter = new PrismaPg(pool);

// 3. Pass the adapter instance cleanly into your PrismaClient constructor
const prisma = new PrismaClient({ adapter });

const app = express();
app.use(express.json());

// Create student
app.post("/students", async (req, res) => {
  try {
    const { name, email } = req.body;

    const student = await prisma.student.create({
      data: { name, email },
    });

    res.json(student);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create course
app.post("/courses", async (req, res) => {
  try {
    const { title, description } = req.body;

    const course = await prisma.course.create({
      data: { title, description },
    });

    res.json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enroll student
app.post("/enroll", async (req, res) => {
  try {
    const { studentId, courseId } = req.body;

    const enrollment = await prisma.enrollment.create({
      data: {
        studentId,
        courseId,
      },
    });

    res.json(enrollment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get students with courses
app.get("/students", async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      include: {
        enrollments: {
          include: {
            course: true,
          },
        },
      },
    });

    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
