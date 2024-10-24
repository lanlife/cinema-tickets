import TicketTypeRequest from './lib/TicketTypeRequest.js';
import InvalidPurchaseException from './lib/InvalidPurchaseException.js';
import TicketPaymentService from '../thirdparty/paymentgateway/TicketPaymentService.js';
import SeatReservationService from '../thirdparty/seatbooking/SeatReservationService.js';

export default class TicketService {
  /**
   * Should only have private methods other than the one below.
   */
  #ticketPaymentService;
  #seatReservationService;
  #TICKET_PRICES = {
    INFANT: 0,
    CHILD: 15,
    ADULT: 25
  };
  #MAX_TICKETS = 25;

  constructor() {
    this.#ticketPaymentService = new TicketPaymentService();
    this.#seatReservationService = new SeatReservationService();
  }

  /**
   * Purchase tickets for the given account
   * @param {number} accountId - The account ID making the purchase
   * @param {...TicketTypeRequest} ticketTypeRequests - The ticket requests
   * @throws {InvalidPurchaseException} If the purchase request is invalid
   */
  purchaseTickets(accountId, ...ticketTypeRequests) {
    // throws InvalidPurchaseException
    this.#validateAccountId(accountId);
    this.#validateTicketRequests(ticketTypeRequests);

    const ticketCounts = this.#countTicketsByType(ticketTypeRequests);
    this.#validateBusinessRules(ticketCounts);

    const totalAmount = this.#calculateTotalAmount(ticketCounts);
    const totalSeats = this.#calculateTotalSeats(ticketCounts);

    // Process payment and reserve seats
    this.#ticketPaymentService.makePayment(accountId, totalAmount);
    this.#seatReservationService.reserveSeat(accountId, totalSeats);
  }

  /**
   * Validate the account ID
   * @private
   */
  #validateAccountId(accountId) {
    if (!Number.isInteger(accountId) || accountId <= 0) {
      throw new InvalidPurchaseException('Invalid account ID');
    }
  }

  /**
   * Validate ticket requests
   * @private
   */
  #validateTicketRequests(requests) {
    if (!requests || requests.length === 0) {
      throw new InvalidPurchaseException('No tickets requested');
    }

    if (!requests.every(request => request instanceof TicketTypeRequest)) {
      throw new InvalidPurchaseException('Invalid ticket request format');
    }
  }

  /**
   * Count tickets by type
   * @private
   */
  #countTicketsByType(requests) {
    return requests.reduce((counts, request) => {
      const type = request.getTicketType();
      const quantity = request.getNoOfTickets();
      counts[type] = (counts[type] || 0) + quantity;
      return counts;
    }, {});
  }

  /**
   * Validate business rules
   * @private
   */
  #validateBusinessRules(ticketCounts) {
    const totalTickets = Object.values(ticketCounts).reduce((sum, count) => sum + count, 0);
    
    // Check maximum ticket limit
    if (totalTickets > this.#MAX_TICKETS) {
      throw new InvalidPurchaseException(`The Maximum number of tickets per purchase allowed is ${this.#MAX_TICKETS}, and this limit has been exceeded `);
    }

    // Check for adult ticket requirement
    const adultCount = ticketCounts.ADULT || 0;
    const childCount = ticketCounts.CHILD || 0;
    const infantCount = ticketCounts.INFANT || 0;

    if (adultCount === 0 && (childCount > 0 || infantCount > 0)) {
      throw new InvalidPurchaseException('Child and Infant tickets require an Adult ticket');
    }

    // Check infant to adult ratio
    if (infantCount > adultCount) {
      throw new InvalidPurchaseException('Each infant requires an adult lap');
    }
  }

  /**
   * Calculate total amount to pay
   * @private
   */
  #calculateTotalAmount(ticketCounts) {
    return Object.entries(ticketCounts).reduce((total, [type, count]) => {
      return total + (this.#TICKET_PRICES[type] * count);
    }, 0);
  }

  /**
   * Calculate total seats to reserve
   * @private
   */
  #calculateTotalSeats(ticketCounts) {
    // Infants don't need seats
    return (ticketCounts.ADULT || 0) + (ticketCounts.CHILD || 0);
  }
}