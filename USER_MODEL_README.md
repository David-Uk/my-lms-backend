# User Model Documentation

## Overview

The User model has been created for the LMS application with support for 4 different user types:

- **Superadmin**: Highest level of access
- **Admin**: Administrative access
- **Tutor**: Instructors/teachers
- **Learner**: Students

## Files Created

### 1. `src/models/user.model.ts`

The main User model with the following features:

#### User Roles (Enum)

- `SUPERADMIN` - Super administrator
- `ADMIN` - Administrator
- `TUTOR` - Tutor/Instructor
- `LEARNER` - Student (default role)

#### User Status (Enum)

- `ACTIVE` - Active user (default)
- `INACTIVE` - Inactive user
- `SUSPENDED` - Suspended user

#### Fields

- `id` (UUID) - Primary key
- `firstName` (String, required)
- `lastName` (String, required)
- `email` (String, unique, required)
- `password` (String, required)
- `role` (Enum, default: LEARNER)
- `status` (Enum, default: ACTIVE)
- `phoneNumber` (String, optional)
- `profilePicture` (Text, optional)
- `bio` (Text, optional)
- `lastLoginAt` (Date, optional)
- `resetPasswordToken` (String, optional)
- `resetPasswordExpires` (Date, optional)
- `emailVerified` (Boolean, default: false)
- `emailVerificationToken` (String, optional)
- `createdAt` (Timestamp)
- `updatedAt` (Timestamp)
- `deletedAt` (Timestamp, soft delete)

#### Helper Methods

- `fullName` - Virtual getter for full name
- `isSuperAdmin()` - Check if user is superadmin
- `isAdmin()` - Check if user is admin
- `isTutor()` - Check if user is tutor
- `isLearner()` - Check if user is learner
- `hasRole(role)` - Check if user has specific role
- `canAccessAdmin()` - Check if user can access admin features

### 2. `src/models/index.ts`

Export file for all models

### 3. `src/dto/user.dto.ts`

Data Transfer Objects for validation:

- `CreateUserDto` - For creating new users
- `UpdateUserDto` - For updating existing users
- `LoginDto` - For user authentication

## Database Configuration

The User model has been registered in `app.module.ts`:

```typescript
SequelizeModule.forRoot({
  dialect: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: '[PASSWORD]',
  database: 'lms',
  autoLoadModels: true,
  synchronize: true,
  models: [User],
});
```

## Features

### Soft Deletes

The model uses `paranoid: true`, which means deleted records are not permanently removed but marked with a `deletedAt` timestamp.

### Email Validation

Email field has built-in validation using `@IsEmail` decorator.

### Password Reset

Built-in support for password reset functionality with token and expiration fields.

### Email Verification

Support for email verification workflow with token field.

## Next Steps

To fully utilize this model, you should:

1. **Install validation dependencies** (if not already installed):

   ```bash
   npm install class-validator class-transformer
   ```

2. **Create a Users Module**:
   - Users Controller
   - Users Service
   - Users Repository

3. **Implement Authentication**:
   - JWT authentication
   - Password hashing (bcrypt)
   - Login/Register endpoints

4. **Add Guards**:
   - Role-based guards
   - Authentication guards

5. **Create Migrations** (optional, if not using synchronize):
   - Generate migration for users table

## Usage Example

```typescript
import { User, UserRole } from './models';

// Create a new user
const user = await User.create({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  password: 'hashedPassword',
  role: UserRole.LEARNER,
});

// Check user role
if (user.isSuperAdmin()) {
  // Grant superadmin access
}

// Get full name
console.log(user.fullName); // "John Doe"
```
