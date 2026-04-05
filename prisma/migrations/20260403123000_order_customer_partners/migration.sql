-- Дополнительные заказчики по заказу (команда заказчика)
CREATE TABLE "OrderCustomerPartner" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderCustomerPartner_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OrderCustomerPartner_orderId_userId_key" ON "OrderCustomerPartner"("orderId", "userId");
CREATE INDEX "OrderCustomerPartner_userId_idx" ON "OrderCustomerPartner"("userId");

ALTER TABLE "OrderCustomerPartner" ADD CONSTRAINT "OrderCustomerPartner_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderCustomerPartner" ADD CONSTRAINT "OrderCustomerPartner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
