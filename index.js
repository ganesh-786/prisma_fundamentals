import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pg from "pg";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost")
    ? false
    : { rejectUnauthorized: true },
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";
const BCRYPT_ROUNDS = 12;

app.use(express.json());
app.use(cookieParser());

function auth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    res.clearCookie("token");
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

app.post("/auth/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: { email, name, password: hashed },
      });
      await tx.wallet.create({
        data: { userId: u.id, balance: 1000 },
      });
      return u;
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/auth/logout", (_req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
});

app.get("/auth/me", auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/wallet", auth, async (req, res) => {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { userId: req.userId },
    });
    if (!wallet) return res.status(404).json({ error: "Wallet not found" });
    res.json({ wallet });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/transactions", auth, async (req, res) => {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { userId: req.userId },
    });
    if (!wallet) return res.status(404).json({ error: "Wallet not found" });

    const transactions = await prisma.transaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        transfer: {
          include: {
            senderWallet: { select: { userId: true } },
            receiverWallet: { select: { userId: true } },
          },
        },
      },
    });

    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/transfers", auth, async (req, res) => {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { userId: req.userId },
    });
    if (!wallet) return res.status(404).json({ error: "Wallet not found" });

    const transfers = await prisma.transfer.findMany({
      where: {
        OR: [{ senderWalletId: wallet.id }, { receiverWalletId: wallet.id }],
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        senderWallet: { select: { userId: true } },
        receiverWallet: { select: { userId: true } },
        transactions: true,
      },
    });

    res.json({ transfers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/transfers", auth, async (req, res) => {
  try {
    const { receiverEmail, amount, description } = req.body;

    if (!receiverEmail || !amount || amount <= 0) {
      return res.status(400).json({
        error: "receiverEmail and positive amount are required",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const senderWallet = await tx.wallet.findUnique({
        where: { userId: req.userId },
      });
      if (!senderWallet) throw new Error("Sender wallet not found");
      if (senderWallet.balance < amount) {
        throw new Error("Insufficient balance");
      }

      const receiver = await tx.user.findUnique({
        where: { email: receiverEmail },
      });
      if (!receiver) throw new Error("Receiver not found");
      if (receiver.id === req.userId) {
        throw new Error("Cannot send money to yourself");
      }

      const receiverWallet = await tx.wallet.findUnique({
        where: { userId: receiver.id },
      });
      if (!receiverWallet) throw new Error("Receiver wallet not found");

      const transfer = await tx.transfer.create({
        data: {
          senderWalletId: senderWallet.id,
          receiverWalletId: receiverWallet.id,
          amount,
          description,
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      await tx.transaction.create({
        data: {
          walletId: senderWallet.id,
          amount,
          type: "DEBIT",
          status: "SUCCESS",
          transferId: transfer.id,
          description: description || `Transfer to ${receiver.email}`,
        },
      });

      await tx.transaction.create({
        data: {
          walletId: receiverWallet.id,
          amount,
          type: "CREDIT",
          status: "SUCCESS",
          transferId: transfer.id,
          description: description || `Transfer from ${senderWallet.userId}`,
        },
      });

      await tx.wallet.update({
        where: { id: senderWallet.id },
        data: { balance: { decrement: amount } },
      });

      await tx.wallet.update({
        where: { id: receiverWallet.id },
        data: { balance: { increment: amount } },
      });

      return transfer;
    });

    res.status(201).json({ transfer: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
