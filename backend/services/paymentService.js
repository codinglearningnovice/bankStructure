import { v4 as uuidv4 } from "uuid";
import axios from "axios";

const paymentService = {
  async generatePaystackReference() {
    return uuidv4();
  },

  async generatePaystackPaymentUrl(email, amount) {
    try {
      const amountInKobo = amount * 100;
      const params = {
        email,
        amount: amountInKobo,
        channels: ["card"],
        callback_url: `${process.env.PAYSTACK_CALLBACK_URL}`,
        reference: this.generatePaystackReference(),
      };
      const config = {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      };
      const { data } = await axios.post(
        "https://api.paystack.co/transaction/initialize",
        params,
        config
      );
      if (data && data.status) {
        return data.data;
      }
      return null;
    } catch (error) {
      return null;
    }
  },

  async verifyPaystackPayment(reference, amount) {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      };
      const { data } = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        config
      );

      if (data && data.status) {
        const { amount: amountInKobo } = data.data;
        if (amountInKobo !== amount * 100) {
          return false;
        }
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  },

  async createPaystackRecipient(userRecord) {
    try {
      const params = {
        type: "nuban",
        name: userRecord.accountName,
        account_number: userRecord.accountNumber,
        bank_code: userRecord.bankCode,
        currency: "NGN",
      };

      const { data } = await axios.post(
        "https://api.paystack.co/transferrecipient",
        params,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (data && data.status) {
        return data.data.recipient_code;
      }
      return null;
    } catch (error) {
      return null;
    }
  },

  async initiatePaystackTransfer(recipient, amount, message) {
    try {
      const params = {
        source: "balance",
        reason: message,
        amount: amount * 100,
        recipient,
        reference: this.generatePaystackReference(),
        currency: "NGN",
      };

      const record = await axios.post(
        "https://api.paystack.co/transfer",
        params,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const { data } = record;
      if (data && data.status) {
        return {
          reference: params.reference,
          transferCode: data.data.tranfer_code,
        };
      }
      return null;
    } catch (error) {
      console.log(error);
      return null;
    }
  },
};

export default paymentService;
