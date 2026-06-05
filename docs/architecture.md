# Architecture Overview

## Current Tech Stack
- Frontend: React
- Backend: Node.js with Express
- Database: PostgreSQL
- Authentication: JSON Web Tokens (JWT)
- Deployment: container-based hosting or cloud platform with CI/CD pipeline

## Database Schema
- `users`
  - `id`
  - `email`
  - `password_hash`
  - `role`
- `vehicles`
  - `id`
  - `make`
  - `model`
  - `year`
  - `price`
  - `mileage`
  - `description`
  - `status`
- `vehicle_images`
  - `id`
  - `vehicle_id`
  - `image_url`
- `inquiries`
  - `id`
  - `vehicle_id`
  - `user_id`
  - `message`
  - `created_at`

## Vehicle-Related Features Already Implemented
- Vehicle listing and detail pages
- Search and filter capabilities by make, model, year, price, and status
- Vehicle image gallery support
- Vehicle inquiry/contact flow
- Admin management of vehicle records

## Frontend Framework
- React
- Likely uses component-based UI and standard React state management

## Backend Framework
- Node.js with Express
- REST API endpoints for vehicle data, user authentication, and inquiries

## Authentication Method
- JWT-based authentication
- User login issues a token stored client-side and sent with API requests

## Hosting / Deployment Plan
- Deploy backend and frontend to a cloud provider or container host
- Use CI/CD on the repository to build, test, and deploy automatically
- Host PostgreSQL as a managed database service or within a private database container
