import { MercadoPagoConfig, Payment } from "mercadopago";

// Inicializa o cliente do Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || "",
  options: { timeout: 5000 },
});

// Inicializa o objeto de pagamento
const payment = new Payment(client);

export interface PaymentResponse {
  id: string;
  status: string;
  point_of_interaction: {
    transaction_data: {
      qr_code: string;
      qr_code_base64: string;
    };
  };
}

export interface PaymentCreate {
  transaction_amount: number;
  payment_method_id: string;
  payer: {
    email: string;
    first_name: string;
    last_name: string;
  };
  description: string;
  external_reference: string;
}

export const createPayment = async (
  data: PaymentCreate
): Promise<PaymentResponse> => {
  const response = await payment.create({ body: data });
  return response as unknown as PaymentResponse;
};

export const getPayment = async (paymentId: string) => {
  const response = await payment.get({ id: paymentId });
  return response;
};

export { payment as mercadopago };
