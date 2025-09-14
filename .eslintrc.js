module.exports = {
  "parser": "babel-eslint",
  "plugins": ["react", "react-hooks"],
  "env": {
    "browser": true,
    "es6": true,
    "jest": true
  },
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module",
    "ecmaFeatures": { 
      "jsx": false
    }
  },
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended"
  ],
  "settings": {
    "react": {
      "version": "18.3.1",
      "createElement": "React.createElement"
    }
  },
  "rules": {
    // Allow console statements in development
    "no-console": "warn",

    // Windows style (CRLF) or UNIX style (LF only) are both OK
    "linebreak-style": "off",

    // It's OK to use ++/-- in a for loop
    "no-plusplus": ["error", { "allowForLoopAfterthoughts": true }],

    // Allow underscore prefix in method names
    "no-underscore-dangle": ["error", { "allowAfterThis": true }],

    // Allow short circuit evaluation
    "no-unused-expressions": ["error", { "allowShortCircuit": true }],

    // Object formatting
    "object-curly-newline": ["error", {
      "ObjectExpression": { "minProperties": 5, "consistent": true },
      "ObjectPattern": { "minProperties": 5, "consistent": true },
      "ExportDeclaration": { "minProperties": 5, "consistent": true },
      "ImportDeclaration": "never"
    }],

    // Consistent object shorthand
    "object-shorthand": ["error", "consistent"],

    // No destructuring requirement
    "prefer-destructuring": "off",

    // Quote props as needed
    "quote-props": ["error", "consistent-as-needed"],

    // Allow arrow function parentheses flexibility
    "arrow-parens": "off",

    // Allow loose equality in some cases
    "eqeqeq": ["error", "smart"],

    // React specific rules for React.createElement usage
    "react/react-in-jsx-scope": "off",
    "react/jsx-uses-react": "off",
    "react/jsx-uses-vars": "off",
    "react/prop-types": "warn",
    "react/display-name": "off",
    "react/no-deprecated": "warn",
    "react/destructuring-assignment": "off",

    // Hooks rules
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
};
