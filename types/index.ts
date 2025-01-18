export interface Ticket {
  raffle_id: string
  user_id: string
  ticket_number: string
  order_id: string
}

export interface Raffle {
  id: string
  price: number
  // outros campos necessários
}

export interface Order {
  id: string
  // outros campos necessários
} 