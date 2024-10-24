import TicketService from './pairtest/TicketService.js';
import TicketTypeRequest from './pairtest/lib/TicketTypeRequest.js';

const ticketService = new TicketService();

// Purchase tickets
try {
  ticketService.purchaseTickets(
    1, // accountId
    new TicketTypeRequest('ADULT', 2),
    new TicketTypeRequest('CHILD', 1),
    new TicketTypeRequest('INFANT', 1)
  );
} catch (error) {
  console.error('Purchase failed:', error.message);
}