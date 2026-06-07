# Contributing to FaceTrack AI

Thank you for your interest in contributing to FaceTrack AI! This document provides guidelines and instructions for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Create a feature branch: `git checkout -b feature/your-feature-name`
4. Follow the setup instructions in [README.md](README.md)

## Development Workflow

### Before Making Changes
- Ensure your local environment is up to date: `npm install`
- Check that linting passes: `npm run lint`
- Verify TypeScript compilation: `npm run build`

### Code Standards
- Follow the ESLint configuration in [eslint.config.js](eslint.config.js)
- Write TypeScript with proper types (no `any` unless absolutely necessary)
- Add JSDoc comments for exported functions and complex logic
- Keep components focused and reusable
- Use Zustand for global state management

### Testing Your Changes
1. Test locally: `npm run dev`
2. Verify the build works: `npm run build`
3. Check for linting errors: `npm run lint`
4. Test the specific feature you're working on in multiple browsers if UI changes

### Commit Messages
- Use clear, descriptive commit messages
- Start with a verb: "Add feature", "Fix bug", "Refactor component"
- Reference issues when applicable: "Fix #123"

### Pull Request Process
1. Push your changes to your fork
2. Create a Pull Request with a clear title and description
3. Ensure CI/linting checks pass
4. Request review from maintainers
5. Be responsive to feedback and review comments

## Code Style Guidelines

### TypeScript
```typescript
// Good: Proper typing
interface UserSession {
  id: string;
  email: string;
  role: 'admin' | 'staff' | 'student';
}

export const loadUserSession = async (id: string): Promise<UserSession | null> => {
  // implementation
};

// Avoid: Using 'any'
const data: any = {}; // ❌ Bad
```

### React Components
```typescript
// Good: Functional component with clear props
interface DashboardProps {
  userId: string;
  title?: string;
}

export default function Dashboard({ userId, title }: DashboardProps) {
  // implementation
}

// Avoid: Large single files
// Split into smaller, testable components
```

### Imports
- Keep imports organized: external packages first, then local files
- Remove unused imports before committing

### Environment Variables
- Never commit `.env.local` or sensitive credentials
- Always use `.env.example` as the template
- Document new environment variables in `.env.example`

## Reporting Issues

When reporting bugs, please include:
- Clear, descriptive title
- Steps to reproduce
- Expected behavior vs actual behavior
- Browser and OS information
- Screenshots/videos if applicable

## Security

- Never commit API keys, passwords, or sensitive information
- Report security vulnerabilities privately to maintainers
- Follow the principle of least privilege for database access

## Questions?

Feel free to open an issue or reach out to the maintainers. We're here to help!

---

Thank you for contributing! 🚀
