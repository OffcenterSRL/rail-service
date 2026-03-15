import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  constructor() {}

  getTickets() {
    // TODO: Implement API call
    return [];
  }

  bookTicket(ticketData: any) {
    // TODO: Implement API call
    return {};
  }

  cancelTicket(ticketId: string) {
    // TODO: Implement API call
    return {};
  }
}
