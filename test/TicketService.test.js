import TicketService  from '../src/pairtest/TicketService.js';
import TicketTypeRequest from '../src/pairtest/lib/TicketTypeRequest.js';
import InvalidPurchaseException from '../src/pairtest/lib/InvalidPurchaseException.js';
import TicketPaymentService  from '../src/thirdparty/paymentgateway/TicketPaymentService.js';
import SeatReservationService   from '../src/thirdparty/seatbooking/SeatReservationService.js';

// Mock the external services
jest.mock('../src/thirdparty/paymentgateway/TicketPaymentService');
jest.mock('../src/thirdparty/seatbooking/SeatReservationService');

describe('TicketService', () => {
  let ticketService;
  let mockPaymentService;
  let mockReservationService;

  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();
    
    // Create fresh instance and get mock instances
    ticketService = new TicketService();
    mockPaymentService = TicketPaymentService.mock.instances[0];
    mockReservationService = SeatReservationService.mock.instances[0];
  });

  describe('Input Validation', () => {
    test('should reject invalid account IDs', () => {
      const invalidAccountIds = [0, -1, null, undefined, 'string', 1.5];
      
      invalidAccountIds.forEach(accountId => {
        expect(() => {
          ticketService.purchaseTickets(accountId, new TicketTypeRequest('ADULT', 1));
        }).toThrow(InvalidPurchaseException);
      });
    });

    test('should reject empty ticket requests', () => {
      expect(() => {
        ticketService.purchaseTickets(1);
      }).toThrow(InvalidPurchaseException);
    });

    test('should reject invalid ticket type requests', () => {
      expect(() => {
        ticketService.purchaseTickets(1, 'not a ticket request');
      }).toThrow(InvalidPurchaseException);
    });
  });

  describe('Business Rules', () => {
    test('should reject purchases exceeding 25 tickets', () => {
      expect(() => {
        ticketService.purchaseTickets(1, new TicketTypeRequest('ADULT', 26));
      }).toThrow(InvalidPurchaseException);
    });

    test('should reject child tickets without adult tickets', () => {
      expect(() => {
        ticketService.purchaseTickets(1, new TicketTypeRequest('CHILD', 1));
      }).toThrow(InvalidPurchaseException);
    });

    test('should reject infant tickets without adult tickets', () => {
      expect(() => {
        ticketService.purchaseTickets(1, new TicketTypeRequest('INFANT', 1));
      }).toThrow(InvalidPurchaseException);
    });

    test('should reject more infants than adults', () => {
      expect(() => {
        ticketService.purchaseTickets(
          1,
          new TicketTypeRequest('ADULT', 1),
          new TicketTypeRequest('INFANT', 2)
        );
      }).toThrow(InvalidPurchaseException);
    });

    test('should allow equal number of infants and adults', () => {
      expect(() => {
        ticketService.purchaseTickets(
          1,
          new TicketTypeRequest('ADULT', 2),
          new TicketTypeRequest('INFANT', 2)
        );
      }).not.toThrow();
    });
  });

  describe('Payment Calculation', () => {
    test('should calculate correct payment for adult tickets', () => {
      ticketService.purchaseTickets(1, new TicketTypeRequest('ADULT', 2));
      expect(mockPaymentService.makePayment).toHaveBeenCalledWith(1, 50); // 2 * £25
    });

    test('should calculate correct payment for mixed tickets', () => {
      ticketService.purchaseTickets(
        1,
        new TicketTypeRequest('ADULT', 2),
        new TicketTypeRequest('CHILD', 1),
        new TicketTypeRequest('INFANT', 1)
      );
      expect(mockPaymentService.makePayment).toHaveBeenCalledWith(1, 65); // (2 * £25) + (1 * £15) + (1 * £0)
    });

    test('should not charge for infant tickets', () => {
      ticketService.purchaseTickets(
        1,
        new TicketTypeRequest('ADULT', 1),
        new TicketTypeRequest('INFANT', 1)
      );
      expect(mockPaymentService.makePayment).toHaveBeenCalledWith(1, 25); // 1 * £25
    });
  });

  describe('Seat Reservation', () => {
    test('should reserve seats for adults and children only', () => {
      ticketService.purchaseTickets(
        1,
        new TicketTypeRequest('ADULT', 2),
        new TicketTypeRequest('CHILD', 1),
        new TicketTypeRequest('INFANT', 2)
      );
      expect(mockReservationService.reserveSeat).toHaveBeenCalledWith(1, 3); // 2 adults + 1 child
    });

    test('should not reserve seats for infants', () => {
      ticketService.purchaseTickets(
        1,
        new TicketTypeRequest('ADULT', 1),
        new TicketTypeRequest('INFANT', 1)
      );
      expect(mockReservationService.reserveSeat).toHaveBeenCalledWith(1, 1); // 1 adult only
    });
  });

  describe('Integration Tests', () => {
    test('should process valid purchase request successfully', () => {
      const purchase = () => {
        ticketService.purchaseTickets(
          1,
          new TicketTypeRequest('ADULT', 2),
          new TicketTypeRequest('CHILD', 2),
          new TicketTypeRequest('INFANT', 1)
        );
      };

      expect(purchase).not.toThrow();
      expect(mockPaymentService.makePayment).toHaveBeenCalledWith(1, 80); // (2 * £25) + (2 * £15)
      expect(mockReservationService.reserveSeat).toHaveBeenCalledWith(1, 4); // 2 adults + 2 children
    });

    test('should handle multiple ticket requests of the same type', () => {
      ticketService.purchaseTickets(
        1,
        new TicketTypeRequest('ADULT', 2),
        new TicketTypeRequest('ADULT', 1)
      );
      
      expect(mockPaymentService.makePayment).toHaveBeenCalledWith(1, 75); // 3 * £25
      expect(mockReservationService.reserveSeat).toHaveBeenCalledWith(1, 3);
    });
  });
});