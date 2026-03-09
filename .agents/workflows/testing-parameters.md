---
description: Parameters for creating and updating unit tests in this project.
---

Follow these parameters for all testing tasks:

1. **New Components**: Always create an associated unit test file for any new components created.
2. **Updated Files**: Update existing tests whenever a base file is modified to ensure coverage reflects the changes.
3. **Structure**: Tests must use `describe/it` blocks for logical grouping and clarity.
4. **Test Utils**: Use `@[app/utils/test-utils.jsx]` for component rendering, event firing, and other testing utilities.
5. **Mantine Components**: Do not overly mock Mantine components; test the actual components that render to ensure realistic behavior.
6. **Integrity**: Ensure all tests in the affected suite(s) pass before considering a task complete.
7. **Test Runner**: Always use `npm test` or `npm run test` to execute tests, rather than calling the test runner (e.g., `jest`) directly. This ensures the correct configuration and environment variables are used.

## Best Practices

- **Mocking Strategy**: Mock loaders, actions, and external API calls (e.g., from `@/loaders` or `@/utils/api`) to keep tests isolated and fast.
- **Query Priority**: Use accessible queries like `getByRole`, `getByLabelText`, and `getByPlaceholderText` over `getByText` or `test-id` to ensure components are accessible.
- **Testing Behavior**: Focus on testing user interactions (clicks, typing) and what is rendered on the screen rather than internal component state or implementation details.
- **Clean Slate**: Use `beforeEach(() => jest.clearAllMocks())` in every test file to avoid side effects between individual tests.
- **Async Handling**: Use `await screen.findBy*` or `waitFor()` when testing for changes that happen after an asynchronous event (like a mock API call or a timeout).
- **Avoid Over-Mocking**: While external dependencies should be mocked, try to avoid mocking internal project components unless they are extremely complex or have side effects that are difficult to manage in a unit test.
- **Test Readability**: Write clear test descriptions and keep test cases focused on a single piece of functionality to make failures easier to debug.
