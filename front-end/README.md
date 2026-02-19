# MeanMall

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.19.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## ZardUI - Ajout de composants UI

Ce projet utilise **ZardUI** (@ngzard/ui) comme librairie de composants UI. Pour ajouter de nouveaux composants, **utilisez toujours la CLI** au lieu de les créer manuellement.

### Lister les composants disponibles

```bash
npx ngzard add
# ou
node_modules/.bin/ngzard add
```

Ceci affiche une liste interactive de tous les composants disponibles.

### Ajouter un composant spécifique

```bash
npx ngzard add button card badge
# ou
node_modules/.bin/ngzard add button card badge
```

### Ajouter tous les composants

```bash
npx ngzard add --all
```

### Options disponibles

| Option              | Description                   |
| ------------------- | ----------------------------- |
| `-y, --yes`         | Skip confirmation prompt      |
| `-o, --overwrite`   | Overwrite existing files      |
| `-a, --all`         | Add all available components  |
| `-p, --path <path>` | Custom path for the component |

### Composants ZardUI disponibles

- `core` - Core utilities
- `dark-mode` - Dark mode support
- `utils` - Utility functions
- `layout` - Layout components
- `button` - Button component
- `sheet` - Sheet/drawer component
- `card` - Card component
- `empty` - Empty state component
- `badge` - Badge component
- `accordion` - Accordion component
- `alert` - Alert component
- `avatar` - Avatar component
- `checkbox` - Checkbox component
- `dialog` - Dialog/modal component
- `dropdown` - Dropdown menu
- `input` - Input component
- `label` - Label component
- `pagination` - Pagination component
- `select` - Select component
- `separator` - Separator component
- `skeleton` - Skeleton loading
- `switch` - Switch/toggle component
- `table` - Table component
- `tabs` - Tabs component
- `textarea` - Textarea component
- `toast` - Toast notifications
- `tooltip` - Tooltip component
- Et bien plus...

### Configuration

La configuration ZardUI se trouve dans `components.json`:

```json
{
  "style": "css",
  "packageManager": "npm",
  "tailwind": {
    "css": "src/styles.css",
    "baseColor": "neutral"
  },
  "aliases": {
    "components": "@/shared/components",
    "utils": "@/shared/utils"
  }
}
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
