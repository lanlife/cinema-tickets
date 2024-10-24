# Cinema Ticket Service

A NodeJS service for handling cinema ticket bookings with validation rules and seat allocation.

## 🎯 Overview

This service handles the purchase of cinema tickets with different types (Adult, Child, Infant) while enforcing business rules, handling payments, and managing seat reservations.

### Key Features

- Multiple ticket type support (Adult, Child, Infant)
- Business rule validation
- Payment processing
- Seat reservation
- Comprehensive error handling

## 📋 Requirements

- Node.js 20.17.0 or later
- npm 10.8.2 or later

## 🚀 Installation

1. Clone the repository:
```bash
git clone https://github.com/lanlife/cinema-tickets.git
cd cinema-ticket-service
```

2. Install dependencies:
```bash
npm install
```


## 📜 Business Rules

1. Maximum 25 tickets per purchase
2. Child and Infant tickets require accompanying Adult tickets
3. Infants do not require a seat (they sit on an Adult's lap)
4. Infants tickets are free
5. Cannot purchase more Infant tickets than Adult tickets

## 🔍 Usage Example

```javascript
import TicketService from './src/pairtest/TicketService.js';
import TicketTypeRequest from './src/pairtest/lib/TicketTypeRequest.js';

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
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

### Test Coverage Areas

- Input Validation
- Business Rules
- Payment Calculation
- Seat Reservation
- Integration Tests

## 🛠 Development

### Prerequisites

1. Create a `.env` file in the root directory:
```env
NODE_ENV=development
```

2. Install development dependencies:
```bash
npm install --save-dev @babel/core @babel/preset-env jest
```



## 🚨 Error Handling

The service throws `InvalidPurchaseException` for:
- Invalid account IDs
- Invalid ticket requests
- Business rule violations
- Validation failures



### TicketService

#### `purchaseTickets(accountId, ...ticketTypeRequests)`

Processes a ticket purchase request.

**Parameters:**
- `accountId` (Number): Valid account ID (must be > 0)
- `ticketTypeRequests` (TicketTypeRequest[]): Array of ticket requests

**Throws:**
- `InvalidPurchaseException`: When purchase validation fails

### TicketTypeRequest

#### `constructor(type, noOfTickets)`

Creates a new ticket request.

**Parameters:**
- `type` (String): Ticket type ('ADULT', 'CHILD', or 'INFANT')
- `noOfTickets` (Number): Number of tickets requested


