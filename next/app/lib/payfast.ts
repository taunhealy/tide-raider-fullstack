interface PayfastConfig {
  merchant_id: string;
  merchant_key: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
}

export const payfastConfig: PayfastConfig = {
  merchant_id: process.env.PAYFAST_MERCHANT_ID!,
  merchant_key: process.env.PAYFAST_MERCHANT_KEY!,
  return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/advertising/success`,
  cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/advertising/cancel`,
  notify_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/payfast`,
};

export function createPayfastPayment(data: {
  amount: number;
  item_name: string;
  email_address: string;
  adId: string;
}) {
  const payload = {
    merchant_id: payfastConfig.merchant_id,
    merchant_key: payfastConfig.merchant_key,
    return_url: payfastConfig.return_url,
    cancel_url: payfastConfig.cancel_url,
    notify_url: payfastConfig.notify_url,
    amount: data.amount.toFixed(2),
    item_name: data.item_name,
    email_address: data.email_address,
    custom_str1: data.adId,
    subscription_type: 1, // Monthly subscription
  };

  return payload;
} 