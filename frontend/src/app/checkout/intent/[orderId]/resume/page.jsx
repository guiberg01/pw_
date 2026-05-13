import { CheckoutResumeClient } from "@/components/checkout/CheckoutResumeClient";

export default async function ResumeCheckoutPage({ params }) {
  const resolvedParams = await params;
  return <CheckoutResumeClient orderId={resolvedParams?.orderId} />;
}
