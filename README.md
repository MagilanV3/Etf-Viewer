# Etf-Viewer

This is an ETF Price Monitor designed and built by Magilan Varatharuban. It will take in a CSV file containing the ETF's list of constituents and their weights and will visualize the data on the dashboard. 

#How to run the dashboard
1. Download and unzip or clone the github repository
2. Open the folder inside a Code Editor (like VS Code)

Running the Backend
1. Open a terminal in the project folder
2. Enter the backend folder using ```cd backend ```
3. Install dependencies using ```pip install -r requirements.txt```
4. Run server using ```uvicorn app.main:app --reload --port 8000 ```

Running the Frontend
1. Open a terminal in the project folder
2. Enter the frontend folder using ```cd frontend ```
3. Install dependencies using ```npm install```
4. Run server using ```npm run dev```

In a web browser, go to [http://localhost:5173/](http://localhost:5173/) to view the dashboard. 
Click the Upload button in the top right to upload a CSV file containing an ETF's breakdown and the dashboard will update. 

#Technologies used:
Front-end:
1. React(TypeScript)-> Most of the front-end logic was built using this framework
2. Tailwind CSs -> Used for the styling of the page
3. Plotly.js -> Used for the displaying and rendering the 2 charts on the dashboard
4. Vite -> Initial setup of the application and dev server

Back-end:
1. Python -> Most of the Back-end logic was built with this
2. FastAPI -> Used REST API framework
3. Pandas -> Data Processing

#Features
1. Constituent Breakdown Table: Displays a table with all the ETF's constituent's names, weight, and last closing prices
2. ETF Time Series Chart: Displays a zoomable time series plot of the preconstructed price of the ETF
3. Top 5 Holdings Bar Chart: Displays the top 5 biggest holdings in the ETF as of the latest market close.

#Additional Features
1. Added a loading buffer to show the user that the CSV is processing (more relevant with larger file sizes)
2. Added a search function to the Constituent Breakdown Table (not case-sensitive)
3. Added a sort function to the Constituent, which allows the table to be sorted by a specific header when the header is clicked
4. Added Additional stylings using TailwindCSS to allow for a better User Experience (See image below for comparison)
5. ![image](https://github.com/user-attachments/assets/f88f5eb1-5584-4f85-be70-b0b3e3315586)
