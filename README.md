# bookify-db-seeder

A script to seed the Bookify database with Node.js.

This project is designed to populate the Bookify database with sample data from a customizable JSON file. It's a useful tool for setting up the initial database for development or testing purposes.

## Features
- Populate the database with data from `data.json`.
- Easily configurable database credentials.
- Fully customizable data for seeding.

## Prerequisites
- [Node.js](https://nodejs.org/) installed on your system.
- A MySQL database ready for connection.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/mromer08/bookify-db-seeder.git
   cd bookify-db-seeder
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

1. Open the `index.js` file and update the database credentials in the following section:
   ```javascript
   const connection = await mysql.createConnection({
       host: 'localhost',       // Replace with your database host
       user: 'root',            // Replace with your database username
       password: '12345',       // Replace with your database password
       database: 'bookify',     // Replace with your database name
   });
   ```

2. Customize the `data.json` file with the data you want to seed into the database. This file contains the default sample data, but you can modify it to suit your needs.

## Usage

1. Run the script to seed the database:
   ```bash
   node index.js
   ```

2. The script will connect to the database, read the data from `data.json`, and populate the database accordingly.

## Notes
- Ensure your MySQL server is running and accessible with the provided credentials.
- Any errors during execution will be logged in the console for troubleshooting.

## License
This project is licensed under the terms of the [LICENSE](./LICENSE).
