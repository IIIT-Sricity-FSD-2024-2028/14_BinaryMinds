Review–4 Requirements:1. Backend Development (Mandatory)
●	The backend must be developed using NestJS
●	Follow proper modular architecture (Modules, Controllers, Services)
2. In-Memory Data Management
●	No external database is required
●	Use in-memory data structures (arrays/objects) to manage data 
●	Data structures should reflect the previously designed ER diagrams
●	CRUD operations must be fully functional
3. Role-Based Access Control (RBAC)
●	Implement authorization using roles (no authentication required)
●	Roles must be passed through the API request header
●	Use Guards/Middleware in NestJS to enforce access control
4. REST API Development
●	Implement proper RESTful APIs (GET, POST, PUT/PATCH, DELETE)
●	APIs must align with frontend modules 
●	Maintain consistent request and response formats
5. Validation and Error Handling
●	Use DTOs (Data Transfer Objects) for validation
●	Handle invalid inputs, missing data, and edge cases
●	Return appropriate HTTP status codes
6. Frontend–Backend Integration
●	Replace all mock data (used for evaluation 3) with backend API calls
●	Ensure seamless integration between frontend and backend
●	All CRUD operations must be backend-driven
7. API Documentation
●	API documentation must be generated using Swagger. 
●	Swagger documentation must reflect all implemented APIs and their usage. Each API must include: Request body schema, Response schema, Header (role) description.
8. Code Structure and Best Practices
●	Maintain clean and modular code
●	Proper separation of concerns (Controller, Service, Module)
●	Ensure readability and maintainability

