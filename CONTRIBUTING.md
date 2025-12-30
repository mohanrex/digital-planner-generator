# Contributing to PDF Planner Generator

Thank you for your interest in contributing to the PDF Planner Generator! We welcome contributions from the community to help make this project better.

## How to Contribute

### Reporting Bugs

If you find a bug, please create a new issue in the repository. Be sure to include:
- A clear and descriptive title.
- Steps to reproduce the issue.
- Expected behavior vs. actual behavior.
- Screenshots or logs if applicable.

### Suggesting Enhancements

Have an idea for a new feature? We'd love to hear it! Open an issue with the tag `enhancement` and describe your idea in detail.

### Pull Requests

1.  **Fork the repository** and create your branch from `main`.
2.  **Clone your fork** locally:
    ```bash
    git clone https://github.com/YOUR-USERNAME/pdf-planner-generator.git
    ```
3.  **Install dependencies**:
    ```bash
    npm install
    ```
4.  **Make your changes**. Ensure your code follows the existing style and conventions.
5.  **Test your changes**. Run the application locally to verify everything works as expected:
    ```bash
    npm run dev
    ```
6.  **Commit your changes** with clear and concise commit messages.
7.  **Push to your fork**:
    ```bash
    git push origin my-new-feature
    ```
8.  **Open a Pull Request** targeting the `main` branch of the original repository. Provide a detailed description of your changes.

## Code Style

- Use TypeScript for all new logic.
- Ensure components are modular and reusable.
- Follow the existing folder structure (`src/worker` for PDF logic, `src/components` for UI).

## License

By contributing, you agree that your contributions will be licensed under its MIT License.
