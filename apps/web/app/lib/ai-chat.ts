"use client";

const agentKeywords = ["agent", "human", "person", "real support", "representative", "admin"];

export function shouldEscalateToAgent(message: string) {
  const normalized = message.toLowerCase();
  return agentKeywords.some((keyword) => normalized.includes(keyword));
}

export function generateAiReply(message: string) {
  const normalized = message.toLowerCase();

  if (shouldEscalateToAgent(message)) {
    return "I can connect you with a real agent now. I have opened a support thread so an admin can reply from the dashboard.";
  }

  if (normalized.includes("otp")) {
    return "For services that require OTP, keep this chat open and paste the code when requested. An admin can also add the OTP to your order from the admin page so it appears in your dashboard.";
  }

  if (normalized.includes("ghana") || normalized.includes("nigeria") || normalized.includes("country") || normalized.includes("region")) {
    return "You can filter services by region and country in the marketplace. If a country is not listed, tell me the country and service type and I will send it to support as a custom request.";
  }

  if (normalized.includes("pay") || normalized.includes("price") || normalized.includes("cost")) {
    return "Prices are shown in NGN on each service. Checkout uses Paystack, and after payment you can track fulfillment from your dashboard.";
  }

  if (normalized.includes("whatsapp") || normalized.includes("sim")) {
    return "WhatsApp Business and SIM registration assistance services are handled as compliant onboarding services. Some may require buyer-side verification or OTP during fulfillment.";
  }

  return "I can help with service availability, country support, pricing, checkout, OTP handoff, and fulfillment status. What service and country are you interested in?";
}
