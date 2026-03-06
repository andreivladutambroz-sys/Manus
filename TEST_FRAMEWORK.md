# Testing Framework Guidelines

**Framework:** Vitest

**Coverage Target:** 80%+

**Test Types:**
1. Unit tests (individual functions)
2. Integration tests (API + Database)
3. E2E tests (user workflows)
4. Performance tests (load testing)
5. Security tests (auth, XSS, SQL injection)

---

## Test Structure

### File Naming Convention

```
server/[feature].test.ts
```

### Test File Template

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDb } from '../db';

describe('Feature Name', () => {
  let db: any;

  beforeEach(async () => {
    db = getDb();
  });

  afterEach(async () => {
    // Cleanup
  });

  describe('Function Name', () => {
    it('should do something', async () => {
      // Arrange
      const input = { /* test data */ };

      // Act
      const result = await functionName(input);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBeTruthy();
    });

    it('should handle errors', async () => {
      // Arrange
      const invalidInput = { /* invalid data */ };

      // Act & Assert
      await expect(functionName(invalidInput)).rejects.toThrow();
    });
  });
});
```

---

## Unit Tests

### Database Operations

```typescript
describe('Database CRUD Operations', () => {
  it('should create a user', async () => {
    const user = await db.insert(users).values({
      email: 'test@example.com',
      password: 'hashed_password',
      role: 'user'
    });
    expect(user.id).toBeTruthy();
  });

  it('should read a user', async () => {
    const user = await db.query.users.findFirst({
      where: eq(users.email, 'test@example.com')
    });
    expect(user?.email).toBe('test@example.com');
  });

  it('should update a user', async () => {
    await db.update(users)
      .set({ firstName: 'John' })
      .where(eq(users.email, 'test@example.com'));
    
    const user = await db.query.users.findFirst({
      where: eq(users.email, 'test@example.com')
    });
    expect(user?.firstName).toBe('John');
  });

  it('should delete a user', async () => {
    await db.delete(users)
      .where(eq(users.email, 'test@example.com'));
    
    const user = await db.query.users.findFirst({
      where: eq(users.email, 'test@example.com')
    });
    expect(user).toBeUndefined();
  });
});
```

### API Endpoints

```typescript
describe('API Endpoints', () => {
  it('should return 200 for valid request', async () => {
    const response = await fetch('http://localhost:3000/api/trpc/auth.me');
    expect(response.status).toBe(200);
  });

  it('should return 401 for unauthorized request', async () => {
    const response = await fetch('http://localhost:3000/api/trpc/diagnostic.list');
    expect(response.status).toBe(401);
  });

  it('should return correct data format', async () => {
    const response = await fetch('http://localhost:3000/api/trpc/auth.me');
    const data = await response.json();
    expect(data.result).toBeDefined();
    expect(data.result.data).toBeDefined();
  });
});
```

---

## Integration Tests

### Database + API Integration

```typescript
describe('Database + API Integration', () => {
  it('should create and retrieve vehicle', async () => {
    // Create vehicle
    const vehicle = await db.insert(vehicles).values({
      userId: 'user-1',
      make: 'BMW',
      model: '320i',
      year: 2020,
      vin: 'WBXYZ1234567890'
    });

    // Retrieve via API
    const response = await fetch(
      `http://localhost:3000/api/trpc/vehicle.get?id=${vehicle.id}`
    );
    const data = await response.json();

    expect(data.result.data.make).toBe('BMW');
  });

  it('should create diagnostic with vehicle', async () => {
    const vehicle = await db.insert(vehicles).values({
      userId: 'user-1',
      make: 'BMW',
      model: '320i',
      year: 2020
    });

    const diagnostic = await db.insert(diagnostics).values({
      userId: 'user-1',
      vehicleId: vehicle.id,
      symptoms: ['Engine knocking'],
      errorCodes: ['P0101'],
      confidence: 0.85
    });

    expect(diagnostic.vehicleId).toBe(vehicle.id);
  });
});
```

---

## E2E Tests

### User Workflows

```typescript
describe('User Workflows', () => {
  it('should complete diagnostic workflow', async () => {
    // 1. Create vehicle
    const vehicleRes = await fetch('http://localhost:3000/api/trpc/vehicle.create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        make: 'BMW',
        model: '320i',
        year: 2020,
        vin: 'WBXYZ1234567890'
      })
    });
    const vehicle = await vehicleRes.json();

    // 2. Create diagnostic
    const diagRes = await fetch('http://localhost:3000/api/trpc/diagnostic.create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicleId: vehicle.result.data.id,
        symptoms: ['Engine knocking'],
        errorCodes: ['P0101']
      })
    });
    const diagnostic = await diagRes.json();

    // 3. Verify diagnostic created
    expect(diagnostic.result.data.id).toBeTruthy();
    expect(diagnostic.result.data.vehicleId).toBe(vehicle.result.data.id);
  });
});
```

---

## Performance Tests

### Load Testing

```typescript
describe('Performance', () => {
  it('should handle 100 concurrent requests', async () => {
    const start = Date.now();
    
    const promises = Array(100).fill(null).map(() =>
      fetch('http://localhost:3000/api/trpc/diagnostic.list')
    );
    
    const results = await Promise.all(promises);
    const duration = Date.now() - start;

    expect(results.every(r => r.status === 200 || r.status === 401)).toBe(true);
    expect(duration).toBeLessThan(10000); // Should complete in < 10s
  });

  it('should respond within 500ms', async () => {
    const start = Date.now();
    await fetch('http://localhost:3000/api/trpc/auth.me');
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(500);
  });
});
```

---

## Security Tests

### Authentication

```typescript
describe('Security - Authentication', () => {
  it('should reject unauthenticated requests', async () => {
    const response = await fetch('http://localhost:3000/api/trpc/diagnostic.list');
    expect(response.status).toBe(401);
  });

  it('should not expose sensitive data', async () => {
    const response = await fetch('http://localhost:3000/api/trpc/auth.me');
    const data = await response.json();
    
    // Should not contain password or sensitive fields
    expect(data.result.data.password).toBeUndefined();
  });
});
```

### Input Validation

```typescript
describe('Security - Input Validation', () => {
  it('should reject invalid email', async () => {
    const response = await fetch('http://localhost:3000/api/trpc/profile.update', {
      method: 'POST',
      body: JSON.stringify({ email: 'invalid-email' })
    });
    expect(response.status).not.toBe(200);
  });

  it('should reject SQL injection attempts', async () => {
    const response = await fetch('http://localhost:3000/api/trpc/vehicle.list?id=1; DROP TABLE vehicles;');
    expect(response.status).not.toBe(500);
  });
});
```

---

## Running Tests

### Run all tests
```bash
pnpm test
```

### Run specific test file
```bash
pnpm test server/auth.logout.test.ts
```

### Run with coverage
```bash
pnpm test --coverage
```

### Watch mode
```bash
pnpm test --watch
```

---

## Test Coverage Targets

| Module | Target | Current |
|--------|--------|---------|
| Database | 85% | ⏳ |
| API Routes | 80% | ⏳ |
| Business Logic | 85% | ⏳ |
| Utilities | 90% | ⏳ |
| **Overall** | **80%+** | ⏳ |

---

## Test Checklist

### Unit Tests
- [ ] Database CRUD operations
- [ ] API endpoint responses
- [ ] Error handling
- [ ] Input validation
- [ ] Business logic functions

### Integration Tests
- [ ] Database + API workflows
- [ ] Multi-table operations
- [ ] Transaction handling
- [ ] Error recovery

### E2E Tests
- [ ] Complete user workflows
- [ ] Cross-feature interactions
- [ ] End-to-end data flow
- [ ] UI navigation

### Performance Tests
- [ ] Response time < 500ms
- [ ] Handle 100+ concurrent requests
- [ ] Database query optimization
- [ ] Memory usage

### Security Tests
- [ ] Authentication enforcement
- [ ] Authorization checks
- [ ] Input validation
- [ ] SQL injection prevention
- [ ] XSS prevention

---

## Next Steps

1. Run existing tests
2. Analyze coverage gaps
3. Write missing tests
4. Achieve 80%+ coverage
5. Setup CI/CD pipeline
