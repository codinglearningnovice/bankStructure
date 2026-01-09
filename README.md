Banking API A secure and scalable RESTful banking API built with Node.js, featuring account management, transactions, loans, and payment gateway integration. 🚀 Features

User Management

User registration and authentication Email verification Role-based access control (Admin/Customer) Account status management (Active/Suspended/Frozen/Deleted)

Account Operations

Multi-account support per user Real-time balance tracking Account creation and management

Transactions

Internal transfers between accounts External transfers via Paystack Deposit via Paystack payment gateway Withdrawal to external bank accounts Transaction history and tracking

Loan System

Loan application and approval workflow Interest calculation Loan status tracking (Pending/Active/Denied/Completed)

Payment Integration

Paystack payment gateway integration Payment verification Recipient management

Security

JWT-based authentication Password hashing Role-based permissions using AccessControl Account status validation

🛠️ Tech Stack

Runtime: Node.js Database: PostgreSQL ORM: Prisma Authentication: JWT (jsonwebtoken) Email: Nodemailer Authorization: AccessControl Validation: Yup Payment Gateway: Paystack Containerization: Docker

📋 Prerequisites

Node.js (v18 or higher) PostgreSQL (v14 or higher) Docker & Docker Compose Paystack account (for payment integration)
