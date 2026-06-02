const express = require("express");
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});
const app = express();

app.use(express.json());

app.post("/students", async (req, res) => {
  const { name, email } = req.body;

  const student = await prisma.student.create({
    data: { name, email },
  });

  res.json(student);
});

app.post("/courses", async (req, res) => {
  const { title, description } = req.body;

  const course = await prisma.course.create({
    data: { title, description },
  });

  res.json(course);
});

app.post("/enroll", async (req, res) => {
  const { studentId, courseId } = req.body;

  const enrollment = await prisma.enrollment.create({
    data: {
      studentId,
      courseId,
    },
  });

  res.json(enrollment);
});

app.get("/students", async (req, res) => {
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
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
