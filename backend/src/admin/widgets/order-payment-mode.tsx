import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Button, Container, Heading, Input, Text } from "@medusajs/ui";
import { useEffect, useState } from "react";
import { sdk } from "../lib/client";
import { AdminOrder, DetailWidgetProps } from "@medusajs/framework/types";

const formatCurrency = (amount: number, currency?: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

const PaymentModeWidget = ({ data }: DetailWidgetProps<AdminOrder>) => {
  const [paymentMode, setPaymentMode] = useState("");

  return (
    <Container className="p-6 space-y-6">
      <Heading level="h2">Payment Mode:</Heading>
      <Text className="text-lg font-medium">
        {data?.metadata?.payment_mode === "debit-card"
          ? "💳 Debit Card"
          : data?.metadata?.payment_mode === "credit-card"
          ? "💳 Credit Card"
          : data?.metadata?.payment_mode === "cheque"
          ? "🧾 Cheque"
          : data?.metadata?.payment_mode === "cash"
          ? "💵 Cash"
          : data?.metadata?.payment_mode === "e-transfer"
          ? "💸 E-Transfer"
          : "Unknown"}
      </Text>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "order.details.side.after",
});

export default PaymentModeWidget;
