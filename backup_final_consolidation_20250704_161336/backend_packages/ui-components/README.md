# @renexus/ui-components

This package contains the shared UI components for the Renexus project.

## Installation

To use these components in your project, install the package:

```bash
npm install @renexus/ui-components
# or
yarn add @renexus/ui-components
```

## Usage

Import components as needed:

```typescript
import { Button } from '@renexus/ui-components';

function MyComponent() {
  return <Button>Click Me</Button>;
}
```

## Peer Dependencies

Ensure you have the following peer dependencies installed in your project:

- `react`
- `react-dom`
- `tailwindcss` (and its PostCSS setup)
- `class-variance-authority`
- `clsx`
- `lucide-react`
- `tailwind-merge`

## Development

To develop or contribute to these components:

1. Clone the Renexus repository.
2. Navigate to `packages/ui-components`.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run Storybook for local development:
   ```bash
   npm run storybook
   ```
5. Build the components:
   ```bash
   npm run build
   ```

## Linting

To lint the codebase:

```bash
npm run lint
```

## Testing

To run tests:

```bash
npm run test
```
