# CowTopia Auto-Manager

CowTopia Auto-Manager is a Node.js application designed to automate various tasks in the CowTopia game. It helps manage multiple accounts, automatically purchase cows, upgrade factories, and claim offline profits.

## Features

- Multi-account management
- Automatic cow purchases
- Factory upgrades
- House upgrades
- Offline profit claiming
- Configurable auto-buy options
- Register Cowtopia [here](https://t.me/cowtopiabot/app?startapp=6944804952)

## Prerequisites

Before running the CowTopia Auto-Manager, make sure you have the following installed:

- Node.js (version 12 or higher)
- npm (Node Package Manager)

## Installation

1. Clone this repository or download the source code.
2. Navigate to the project directory in your terminal.
3. Install the required dependencies by running:

```
npm install
```

## Configuration

1. Create a file named `data.txt` in the project root directory.
2. Add your CowTopia account tokens to `data.txt`, one per line.

Example `data.txt`:

```
query_id=
query_id=
```

## Usage

To start the CowTopia Auto-Manager, run the following command in your terminal:

```
node main.js
```

Follow the prompts to configure auto-buy options for cows and factories.

The program will cycle through all accounts listed in `data.txt`, performing the following actions:

1. Log in and display account information
2. Buy cows (if enabled)
3. Upgrade factories (if enabled)
4. Upgrade houses (if enabled)
5. Claim offline profits

After processing all accounts, the program will wait for 5 minutes before starting the next cycle.

## Customization

You can modify the following parameters in the `main.js` file:

- Change the wait time between cycles (default is 5 minutes)
- Adjust the maximum number of cow purchases per factory
- Modify the console output colors and formatting

## Disclaimer

This tool is for educational purposes only. Use it at your own risk and make sure you comply with CowTopia's terms of service.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).
