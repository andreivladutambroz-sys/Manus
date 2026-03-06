# API Documentation

**Base URL:** `http://localhost:3000/api/trpc`

**Format:** tRPC (use GET for queries, POST for mutations)

---

## Authentication Routes

### GET /api/trpc/auth.me
Returns current authenticated user or null

**Response:**
```json
{
  "result": {
    "data": {
      "id": "user-id",
      "email": "user@example.com",
      "role": "user"
    }
  }
}
```

### POST /api/trpc/auth.logout
Logs out current user

**Response:**
```json
{
  "result": {
    "data": { "success": true }
  }
}
```

---

## Profile Routes

### GET /api/trpc/profile.get
Get current user profile

**Response:**
```json
{
  "result": {
    "data": {
      "id": "profile-id",
      "firstName": "John",
      "lastName": "Doe",
      "specialties": ["Engine", "Transmission"],
      "hourly_rate": 75,
      "currency": "USD"
    }
  }
}
```

### POST /api/trpc/profile.update
Update user profile

**Payload:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "specialties": ["Engine"],
  "hourly_rate": 75,
  "currency": "USD"
}
```

---

## Vehicle Routes

### GET /api/trpc/vehicle.list
List all vehicles for current user

**Response:**
```json
{
  "result": {
    "data": [
      {
        "id": "vehicle-id",
        "make": "BMW",
        "model": "320i",
        "year": 2020,
        "vin": "WBXYZ1234567890",
        "mileage": 45000
      }
    ]
  }
}
```

### POST /api/trpc/vehicle.create
Create new vehicle

**Payload:**
```json
{
  "make": "BMW",
  "model": "320i",
  "year": 2020,
  "vin": "WBXYZ1234567890",
  "licensePlate": "ABC123"
}
```

### GET /api/trpc/vehicle.get?id=vehicle-id
Get specific vehicle details

---

## Diagnostic Routes

### GET /api/trpc/diagnostic.list
List all diagnostics for current user

**Response:**
```json
{
  "result": {
    "data": [
      {
        "id": "diagnostic-id",
        "vehicleId": "vehicle-id",
        "symptoms": ["Engine knocking", "Loss of power"],
        "errorCodes": ["P0101"],
        "confidence": 0.85,
        "createdAt": "2026-03-06T10:00:00Z"
      }
    ]
  }
}
```

### POST /api/trpc/diagnostic.create
Create new diagnostic

**Payload:**
```json
{
  "vehicleId": "vehicle-id",
  "symptoms": ["Engine knocking"],
  "errorCodes": ["P0101"],
  "description": "Engine knocking when accelerating"
}
```

### GET /api/trpc/diagnostic.get?id=diagnostic-id
Get specific diagnostic details

---

## Repair Routes

### GET /api/trpc/repair.list
List all repair cases

**Response:**
```json
{
  "result": {
    "data": [
      {
        "id": "repair-id",
        "vehicleId": "vehicle-id",
        "symptoms": ["Engine knocking"],
        "diagnosis": "Worn spark plugs",
        "status": "completed",
        "totalCost": 250
      }
    ]
  }
}
```

### POST /api/trpc/repair.create
Create new repair case

**Payload:**
```json
{
  "vehicleId": "vehicle-id",
  "symptoms": ["Engine knocking"],
  "errorCodes": ["P0101"]
}
```

---

## Analytics Routes

### GET /api/trpc/analytics.dashboard
Get analytics dashboard data

**Response:**
```json
{
  "result": {
    "data": {
      "totalDiagnostics": 150,
      "totalRepairs": 45,
      "averageConfidence": 0.87,
      "successRate": 0.92
    }
  }
}
```

---

## Knowledge Base Routes

### GET /api/trpc/knowledgeBase.search?query=engine
Search knowledge base

**Response:**
```json
{
  "result": {
    "data": [
      {
        "id": "doc-id",
        "title": "Engine Diagnostics Guide",
        "content": "...",
        "category": "Engine",
        "source": "Manufacturer Manual"
      }
    ]
  }
}
```

---

## AI Chat Routes

### POST /api/trpc/ai.chat
Send message to AI chat

**Payload:**
```json
{
  "diagnosticId": "diagnostic-id",
  "message": "What could cause this error code?"
}
```

**Response:**
```json
{
  "result": {
    "data": {
      "response": "Based on the error code P0101, the most likely causes are...",
      "confidence": 0.88
    }
  }
}
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "error": {
    "json": {
      "message": "Unauthorized",
      "code": -32603
    }
  }
}
```

### 404 Not Found
```json
{
  "error": {
    "json": {
      "message": "No procedure found on path",
      "code": -32004
    }
  }
}
```

### 500 Internal Server Error
```json
{
  "error": {
    "json": {
      "message": "Internal server error",
      "code": -32603
    }
  }
}
```

---

## Testing with curl

### Test auth endpoint
```bash
curl -X GET "http://localhost:3000/api/trpc/auth.me"
```

### Test diagnostic list
```bash
curl -X GET "http://localhost:3000/api/trpc/diagnostic.list"
```

### Test vehicle creation
```bash
curl -X POST "http://localhost:3000/api/trpc/vehicle.create" \
  -H "Content-Type: application/json" \
  -d '{
    "make": "BMW",
    "model": "320i",
    "year": 2020,
    "vin": "WBXYZ1234567890",
    "licensePlate": "ABC123"
  }'
```

---

## API Verification Checklist

- [x] Auth endpoints working
- [x] Profile endpoints defined
- [x] Vehicle endpoints defined
- [x] Diagnostic endpoints defined
- [x] Repair endpoints defined
- [x] Analytics endpoints defined
- [x] Knowledge base endpoints defined
- [x] AI chat endpoints defined
- [ ] Error handling tested
- [ ] Performance tested
- [ ] Security tested

---

## Next Steps

1. Test each endpoint with curl
2. Verify error responses
3. Test authentication flow
4. Verify database operations
