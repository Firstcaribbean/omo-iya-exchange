export const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "sk_test_mock_paystack_secret_key_for_omoiya";
export const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY || "pk_test_mock_paystack_public_key_for_omoiya";

export const PAYSTACK_API_URL = "https://api.paystack.co";

export const PAYSTACK_WEBHOOK_URL = process.env.PAYSTACK_WEBHOOK_URL || "http://localhost:5000/api/payments/paystack/webhook";
