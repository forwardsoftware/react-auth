# React Auth - Expo Example

This is an example implementation of [react-auth](https://github.com/webbable/react-auth) using Expo and React Native.

## Prerequisites

- Node.js (v18 or higher)
- pnpm package manager
- iOS Simulator (for iOS development)
- Android Studio/Emulator (for Android development)

## Getting Started

### 1. Install Dependencies

From the project root directory, install all dependencies:

```bash
pnpm install
```

### 2. Install iOS Dependencies (iOS only)

Navigate to the expo example directory and install iOS pods:

```bash
cd examples/expo
npx pod-install
```

### 3. Start the Metro Server

Start the Expo development server:

```bash
npx expo start
```

This will start the Metro bundler and provide options to:
- Open in iOS Simulator
- Open in Android Emulator
- Open in Expo Go app
- Open in web browser

## Project Structure

This example demonstrates how to integrate react-auth with Expo/React Native:

- `src/auth/` - Authentication client configuration
- `src/hooks/` - Custom hooks for authentication
- `src/api/` - API configuration with interceptors
- `src/utilities/` - Utility functions (MMKV storage)
- `app/` - Expo Router file-based routing

## Test Credentials

For testing the authentication flow, use these credentials:
- **Email:** john@mail.com
- **Password:** changeme

## Key Features Demonstrated

- Authentication state management
- Token refresh handling
- Secure storage with MMKV
- API request/response interceptors
- Custom authentication hooks

## Configuration Notes

The `babel.config.js` file includes alias configuration for this example. For normal usage of react-auth in your own project, this configuration is not mandatory - it depends on your specific project setup and requirements.

## Development

You can start developing by editing files in the `app` directory. This project uses [Expo Router](https://docs.expo.dev/router/introduction/) for file-based routing.

## Learn More

- [React Auth Documentation](../../lib/README.md)
- [Expo Documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)