# 📚 Prisma Learning Project (PostgreSQL + Render)

## 🚀 Overview

This project is a **production-oriented learning implementation of Prisma ORM** using:

- **Node.js (Express)**
- **Prisma ORM (v7+)**
- **PostgreSQL (Render hosted DB)**

The goal is to build a **strong foundational understanding of Prisma**, including:

- Schema design
- Database migrations
- Relationships (1:N, M:N)
- Querying with Prisma Client
- Real-world trade-offs

---

## 🧠 Mental Model

```
PostgreSQL (Database)
        ↑
Prisma Client (Type-safe queries)
        ↑
Express API (Business logic)
        ↑
Client / Postman
```

Prisma acts as a **type-safe abstraction layer** between your backend and database.

---

## 🏗️ Project Structure

```
.
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── prisma.config.ts
├── .env
├── index.js
├── package.json
```

---

## ⚙️ Tech Stack

| Layer      | Technology          |
| ---------- | ------------------- |
| Backend    | Node.js + Express   |
| ORM        | Prisma v7           |
| Database   | PostgreSQL (Render) |
| Env Config | dotenv              |

---

## 🧱 Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

model Student {
  id        String   @id @default(uuid()) @db.Uuid
  name      String
  email     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  enrollments Enrollment[]

  @@index([email])
}

model Course {
  id          String   @id @default(uuid()) @db.Uuid
  title       String
  description String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  enrollments Enrollment[]

  @@index([title])
}

model Enrollment {
  id        String   @id @default(uuid()) @db.Uuid
  studentId String   @db.Uuid
  courseId  String   @db.Uuid
  createdAt DateTime @default(now())

  student Student @relation(fields: [studentId], references: [id], onDelete: Cascade)
  course  Course  @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@unique([studentId, courseId])
  @@index([studentId])
  @@index([courseId])
}
```

---

## 🔧 Prisma v7 Configuration (IMPORTANT)

### `prisma.config.ts`

```ts
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
```

---

## 🔐 Environment Variables

### `.env`

```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

> Get this from Render → PostgreSQL → External Database URL

---

## 📦 Installation

```bash
npm install
```

---

## 🔄 Database Migration

```bash
npx prisma migrate dev --name init
npx prisma generate
```

For production:

```bash
npx prisma migrate deploy
```

---

## 🚀 Running the Server

```bash
node index.js
```

---

## 🧪 API Endpoints

### Create Student

```
POST /students
```

```json
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

---

### Create Course

```
POST /courses
```

```json
{
  "title": "Backend Engineering",
  "description": "Learn APIs"
}
```

---

### Enroll Student

```
POST /enroll
```

```json
{
  "studentId": "...",
  "courseId": "..."
}
```

---

### Get Students with Courses

```
GET /students
```

---

## 🔍 Key Prisma Concepts

| Concept       | Description              |
| ------------- | ------------------------ |
| Model         | Represents a DB table    |
| Migration     | Version control for DB   |
| Prisma Client | Auto-generated query API |
| Relation      | Links between tables     |
| Index         | Performance optimization |

---

## ⚔️ Why Prisma?

### ✅ Advantages

- Type-safe queries
- Auto-generated client
- Easy relationship handling
- Clean schema-driven design
- Built-in migration system

---

### ❌ Trade-offs

| Limitation              | Explanation            |
| ----------------------- | ---------------------- |
| Less SQL control        | Complex queries harder |
| Performance overhead    | Abstraction layer      |
| Learning curve          | Schema + config        |
| Not ideal for analytics | SQL preferred          |

---

## 🧠 Internal Working

When you run:

```js
prisma.student.findMany();
```

Prisma:

1. Converts to SQL
2. Sends query to PostgreSQL
3. Parses response
4. Returns typed JavaScript object

---

## 🔐 Production Best Practices

- Use UUIDs for IDs
- Add indexes for frequent queries
- Use transactions for critical operations
- Never expose raw DB errors
- Validate input before DB operations

---

## 🚀 Next Steps

After mastering this project:

- Add authentication (JWT)
- Implement pagination
- Use Prisma transactions
- Integrate payments (eSewa/Khalti)
- Add KYC system

---

## 🧠 Final Insight

```
Schema → Migration → Prisma Client → API → Database
```

Prisma is not just an ORM — it's a **database workflow system**.

---

## 📎 Resources

- Prisma Docs: https://www.prisma.io/docs
- Prisma v7 Config: https://pris.ly/d/prisma7-client-config
- Render PostgreSQL: https://render.com/docs/databases

---

## 👨‍💻 Author

Learning-focused implementation for mastering Prisma fundamentals and preparing for real-world backend systems.
