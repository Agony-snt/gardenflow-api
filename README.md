# GardenFlow API

A smart irrigation management REST API built with **Node.js, Express.js, and MongoDB**.

GardenFlow is designed to manage gardens, monitor sensor readings, track water sources, and control irrigation operations.

## Features

- User authentication and authorization
- Garden management
- Sensor management
- Sensor reading management
- Water source management
- Water source scheduling
- Irrigation decision and control services
- Irrigation event tracking
- Garden ownership validation
- Request validation
- Centralized error handling
- API documentation with Swagger
- Postman collection for API testing

## Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Token (JWT)
- bcryptjs
- Yup
- Helmet
- Swagger UI Express

## Project Structure

```text
src/
├── v1/
│   ├── middlewares/
│   ├── models/
│   ├── modules/
│   │   ├── auth/
│   │   ├── docs/
│   │   ├── gardens/
│   │   ├── sensors/
│   │   ├── users/
│   │   ├── water-sources/
│   │   └── water-sources-schedule/
│   ├── utils/
│   └── validators/
├── app.js
├── configs.js
└── server.js
```

## Installation

```bash
git clone https://github.com/Agony-snt/gardenflow-api.git
cd gardenflow-api
npm install
```

Create a `.env` file and configure the required environment variables, including your MongoDB connection settings and authentication secrets.

## Run the Project

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

## API Documentation

The project includes Swagger documentation and a Postman collection for exploring and testing API endpoints.

## Purpose

GardenFlow was developed to practice backend architecture and business logic implementation in a real-world inspired application, with a focus on resource management, sensor data, scheduling, and irrigation workflows.
