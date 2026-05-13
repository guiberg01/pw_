"use client";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { checkoutService } from "@/services/checkoutService";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

function InnerPaymentElement({ orderId, onDone }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleConfirm = async () => {
    if (!stripe || !elements) return;
    setProcessing(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({ elements, confirmParams: {} });
      if (error) throw error;

      const status = paymentIntent?.status;
      if (status !== "succeeded" && status !== "processing") {
        throw new Error("Pagamento ainda não foi concluído.");
      }

      // Reconcile on backend and wait until order/payment states are actually settled.
      const reconcileResult = await checkoutService.reconcileCheckoutOrderPaymentUntilSettled(orderId, {
        maxAttempts: 8,
        intervalMs: 1200,
      });

      if (!reconcileResult?.settled) {
        throw new Error("Pagamento processado, mas o pedido ainda está sincronizando. Tente novamente em instantes.");
      }

      toast.success("Pagamento confirmado com sucesso");
      onDone(null);
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Erro ao processar pagamento";
      toast.error(message);
      onDone(message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border p-4">
        <PaymentElement />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => onDone("cancelled")}>
          Cancelar
        </Button>
        <Button onClick={handleConfirm} disabled={processing}>
          {processing ? "Processando..." : "Confirmar pagamento"}
        </Button>
      </div>
    </div>
  );
}

export default function StripePaymentElement({ clientSecret, orderId, onDone }) {
  if (!clientSecret || !stripePromise) return null;
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <InnerPaymentElement orderId={orderId} onDone={onDone} />
    </Elements>
  );
}
