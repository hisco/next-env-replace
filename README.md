
# next-env-replace

`next-env-replace` bridges the gap in Next.js by enabling the "Build once, deploy many" philosophy. It allows you to build your application once and deploy it across multiple environments without the need for rebuilding, adhering to the twelve-factor methodology and facilitating continuous delivery.

## Why next-env-replace?

In Next.js, environment variables are typically baked into the build, requiring separate builds for different environments. This contradicts the "Build once, deploy many" principle, which is essential for easy deployment and testability. `next-env-replace` solves this problem by allowing you to replace environment variables at runtime, ensuring that the same build can be deployed across various environments without modifications.

## Features

- **No Code Changes Needed**: Integrate seamlessly without modifying your existing codebase.
- **Runtime Environment Variable Replacement**: Replace `NEXT_PUBLIC_*` environment variables at runtime.
- **Faster Deployments**: Avoid lengthy rebuild processes by replacing variables quickly at startup.
- **Compliance with Twelve-Factor App Methodology**: Adheres to best practices for building scalable and maintainable applications.

## Installation

Install the package using npm:

```bash
npm install next-env-replace
```

or with yarn:

```bash
yarn add next-env-replace
```

## Usage

### Build Command

Build your Next.js application using `next-env-replace` to set placeholder environment variables:

```bash
npx next-env-replace set-env-vars -- next build
```

This command locates all `NEXT_PUBLIC_*` variables and sets them with placeholder values during the build process.

### Start Command

Before starting your application, replace the placeholder values with the actual environment variables available at runtime:

```bash
npx next-env-replace replace-env-vars && next start
```

## Example Usage

### Dockerfile Example

Here is how your Dockerfile could look:

```Dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build  # Notice the build happens once
EXPOSE 3000

CMD ["npm", "start"]  # The start command runs each time the container starts
```

### package.json Scripts

Update your `package.json` scripts as follows:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next-env-replace set-env-vars -- next build",
    "start": "next-env-replace replace-env-vars && next start"
  }
}
```
That's it! No code changes are required, and assuming the actual environment variables are provided at runtime, the placeholder values will be replaced by the real values.

## How It Works

- **Build Time**: During the build process, `next-env-replace` scans your codebase for all `NEXT_PUBLIC_*` environment variables and replaces them with placeholder values. This allows the application to be built without needing the actual environment-specific values.
  
- **Runtime**: When the application starts, `next-env-replace` replaces the placeholder values with the actual environment variables available at runtime. This process is significantly faster than rebuilding the application and ensures that the correct values are used in each environment.

## Benefits

- **Efficiency**: Reduce deployment times by eliminating the need to rebuild for each environment.
- **Consistency**: Ensure that the same build artifact is deployed across all environments, reducing the risk of inconsistencies.
- **Simplicity**: No need to change your existing codebase or manage complex build scripts.

## No Code Changes Required

One of the main advantages of `next-env-replace` is that it requires no changes to your code. You can continue using environment variables in your code as usual. The module handles the replacement process transparently.

## License

MIT License


