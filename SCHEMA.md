# Database Schema Documentation

**Total Tables:** 37 (+ 4 relations)

## Core Tables

### 1. users
- id (primary key)
- email (unique)
- password
- role (admin | user)
- createdAt

### 2. profiles
- id (primary key)
- userId (foreign key)
- firstName
- lastName
- avatar
- bio
- specialties
- certifications
- hourly_rate
- currency
- rate_updated_at

### 3. vehicles
- id (primary key)
- userId (foreign key)
- make
- model
- year
- vin
- licensePlate
- mileage
- lastServiceDate

### 4. diagnostics
- id (primary key)
- userId (foreign key)
- vehicleId (foreign key)
- symptoms
- errorCodes
- analysis
- recommendations
- confidence
- createdAt

### 5. diagnosticImages
- id (primary key)
- diagnosticId (foreign key)
- imageUrl
- description
- uploadedAt

### 6. notifications
- id (primary key)
- userId (foreign key)
- title
- message
- read
- createdAt

## Learning Engine Tables

### 7. diagnosticFeedback
- id (primary key)
- diagnosticId (foreign key)
- rating
- corrections
- notes
- createdAt

### 8. learnedPatterns
- id (primary key)
- pattern
- frequency
- confidence
- validated
- createdAt

### 9. promptVersions
- id (primary key)
- agentName
- version
- prompt
- performance
- createdAt

### 10. accuracyMetrics
- id (primary key)
- category
- correctCount
- totalCount
- accuracy
- updatedAt

## Knowledge Base Tables

### 11. knowledgeBase
- id (primary key)
- title
- content
- category
- source
- createdAt

### 12. knowledgeDocuments
- id (primary key)
- title
- content
- fileUrl
- category
- uploadedAt

### 13. chatMessages
- id (primary key)
- userId (foreign key)
- diagnosticId (foreign key)
- message
- response
- createdAt

## Vehicle Data Tables

### 14. vehicleMotorizations
- id (primary key)
- vehicleId (foreign key)
- engineType
- displacement
- power
- torque
- transmission

### 15. vehicleApiCache
- id (primary key)
- vehicleId (foreign key)
- apiName
- data
- cachedAt

### 16. vehicleRecalls
- id (primary key)
- vehicleId (foreign key)
- recallId
- description
- status

### 17. apiRequestLog
- id (primary key)
- endpoint
- status
- responseTime
- createdAt

### 18. vehicleHistory
- id (primary key)
- vehicleId (foreign key)
- eventType
- description
- createdAt

## Predictive Maintenance Tables

### 19. failurePredictions
- id (primary key)
- vehicleId (foreign key)
- componentType
- failureRisk
- estimatedFailureDate
- recommendation

### 20. maintenanceRecommendations
- id (primary key)
- vehicleId (foreign key)
- componentType
- recommendationType
- priority
- estimatedCost

### 21. componentHealthScores
- id (primary key)
- vehicleId (foreign key)
- componentType
- healthScore
- lastUpdated

## Automotive Data Tables

### 22. manufacturers
- id (primary key)
- name
- country
- founded

### 23. models
- id (primary key)
- manufacturerId (foreign key)
- name
- productionStart
- productionEnd

### 24. generations
- id (primary key)
- modelId (foreign key)
- generationName
- startYear
- endYear

### 25. engines
- id (primary key)
- generationId (foreign key)
- engineCode
- displacement
- power
- torque
- fuelType

### 26. vehicleVariants
- id (primary key)
- generationId (foreign key)
- variantName
- bodyStyle
- transmission
- driveType

### 27. vinPatterns
- id (primary key)
- manufacturerId (foreign key)
- pattern
- description

### 28. vinDecodeCache
- id (primary key)
- vin
- decodedData
- cachedAt

## Data Import Tables

### 29. dataImportStatus
- id (primary key)
- importType
- status
- recordsProcessed
- recordsSuccessful
- recordsFailed
- startedAt
- completedAt

## Repair & Service Tables

### 30. repairCases
- id (primary key)
- vehicleId (foreign key)
- symptoms
- errorCodes
- diagnosis
- repairProcedures
- parts
- laborCost
- partsCost
- totalCost
- status
- createdAt

### 31. serviceProcedures
- id (primary key)
- make
- model
- year
- procedure
- steps
- tools
- parts
- estimatedTime
- estimatedCost

### 32. torqueSpecifications
- id (primary key)
- make
- model
- year
- component
- torqueValue
- unit

### 33. repairOutcomes
- id (primary key)
- repairCaseId (foreign key)
- outcome
- actualCost
- actualTime
- successRate

### 34. repairFeedback
- id (primary key)
- repairCaseId (foreign key)
- rating
- comments
- createdAt

## Data Source Tables

### 35. sourceRegistry
- id (primary key)
- sourceDomain
- sourceUrl
- confidence
- successRate
- totalCases
- avgRepairTime
- avgRepairCost
- successCount
- failureCount
- createdAt

## Beta Program Tables

### 36. betaInvites
- id (primary key)
- email
- token
- status
- createdAt

### 37. betaUsers
- id (primary key)
- userId (foreign key)
- betaFeatures
- joinedAt

## Relations

### usersRelations
- profiles (one-to-one)
- vehicles (one-to-many)
- diagnostics (one-to-many)
- notifications (one-to-many)

### profilesRelations
- user (many-to-one)

### vehiclesRelations
- user (many-to-one)
- diagnostics (one-to-many)
- motorizations (one-to-many)

### diagnosticsRelations
- user (many-to-one)
- vehicle (many-to-one)

---

## Schema Verification Checklist

- [x] All 37 tables defined
- [x] All foreign keys configured
- [x] All relations defined
- [x] All indexes created
- [x] All constraints applied
- [ ] CRUD operations tested
- [ ] Migrations applied
- [ ] Data integrity verified

---

## Next Steps

1. Test CRUD operations on each table
2. Verify migrations with `pnpm db:push`
3. Test database connections
4. Verify data integrity
