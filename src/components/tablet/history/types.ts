export interface PaidOrder {
  id: string;
  tableNumber?: string;
  serviceMode: "dine-in" | "takeaway" | "delivery" | "pickup" | "kiosk" | "qr";
  items: {
    name: string;
    quantity: number;
    price: number;
    modifiers: { name: string; price: number }[];
  }[];
  subtotal: number;
  discount: number;
  serviceCharge: number;
  gst: number;
  total: number;
  paidAt: string;
  paymentMethod: string;
  cashReceived?: number;
  changeDue?: number;
}