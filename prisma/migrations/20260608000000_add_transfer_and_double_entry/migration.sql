-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "transferId" TEXT,
ADD COLUMN "description" TEXT;

-- CreateTable
CREATE TABLE "Transfer" (
    "id" TEXT NOT NULL,
    "senderWalletId" TEXT NOT NULL,
    "receiverWalletId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "status" "TransferStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Transfer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Transfer_senderWalletId_idx" ON "Transfer"("senderWalletId");
CREATE INDEX "Transfer_receiverWalletId_idx" ON "Transfer"("receiverWalletId");
CREATE INDEX "Transfer_createdAt_idx" ON "Transfer"("createdAt");

-- CreateIndex
CREATE INDEX "Transaction_transferId_idx" ON "Transaction"("transferId");

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_senderWalletId_fkey" FOREIGN KEY ("senderWalletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_receiverWalletId_fkey" FOREIGN KEY ("receiverWalletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "Transfer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
