# Trendtial Internship Result Announcement

A modern, interactive web app for Trendtial internship candidates to check their selection status using their email address. The app connects to a Google Sheet for real-time results and provides a beautiful, engaging user experience.

## Features
- Search your internship result by email address
- See your name, selection status, position, and lead name
- Distinct, interactive UI for selected and not selected candidates
- Real-time data from [Trendtial Internship Sheet](https://docs.google.com/spreadsheets/d/1HzEzCp6mSV6qxlGuRWtHT2whenx3xxTYpSl1b9JbXR4/edit?usp=sharing)
- Modern, responsive design inspired by Trendtial branding

## Technologies Used
- Vite
- React + TypeScript
- shadcn-ui
- Tailwind CSS
- Google Sheets API

## Setup & Development

1. **Clone the repository:**
   ```sh
   git clone <YOUR_GIT_URL>
   cd trendtial-internship-result-announcement
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Configure environment variables:**
   - Create a `.env` file in the root directory with the following:
     ```env
     VITE_SHEET_ID=1HzEzCp6mSV6qxlGuRWtHT2whenx3xxTYpSl1b9JbXR4
     VITE_GOOGLE_SHEETS_API_KEY=YOUR_GOOGLE_SHEETS_API_KEY
     ```
   - [How to get a Google Sheets API key](https://developers.google.com/sheets/api/quickstart/js)
4. **Run the development server:**
   ```sh
   npm run dev
   ```
5. **Open the app:**
   - Visit [http://localhost:5173](http://localhost:5173) in your browser.

## Usage
- Enter your email address in the search box.
- Instantly see your result, including:
  - Name
  - Selection Status
  - Position
  - Lead Name
- If selected, enjoy a celebratory animation and message!
- If not selected, receive a supportive message and encouragement.

## Google Sheet Structure
| Name | Email | Status | Position | Lead Name |
|------|-------|--------|----------|-----------|
| ...  | ...   | ...    | ...      | ...       |

## License
MIT
