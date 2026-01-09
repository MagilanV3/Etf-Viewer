from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#Convert prices csv into pandas framework
price_values = pd.read_csv("data/prices.csv")
price_values["DATE"] = pd.to_datetime(price_values["DATE"])

#Quick Check to see if Backend is up 
@app.get("/status")
def status():
    return {"BackendStatus": True}

#Process the uploaded csv
@app.post("/process")
async def process(file:UploadFile = File(...)):

    try:
        contents = await file.read()
        etf_df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error in CSV: {e}")
    
    ### Checking for Errors in Uploaded CSV File

    #Check in case file is empty
    if etf_df.empty:
        raise HTTPException(status_code=400, detail="CSV is empty")
    
    #Check if CSV file has correct columns
    required_columns = {"name", "weight"}
    missing_columns = required_columns - set(etf_df.columns)
    if missing_columns:
        raise HTTPException(status_code=400, detail=f"CSV is missing column: {sorted(missing_columns)}")
    
    #Check if values in weight column are non-negative numbers
    etf_df["weight"] = pd.to_numeric(etf_df["weight"], errors="coerce")

    if etf_df["weight"].isna().any():
        raise HTTPException(status_code=400, detail="Weight column contains non-numeric values.")

    if (etf_df["weight"] < 0).any():
        raise HTTPException(status_code=400, detail="Weights must be non-negative.")
    
    #Check for any duplicate entries
    duplicates = etf_df["name"][etf_df["name"].duplicated()].unique().tolist()
    if duplicates:
        raise HTTPException(status_code=400, detail=f"Duplicate constituents found: {duplicates}")
    
    #Check if the constituents given in CSV exist in the prices.csv (\backend\data\prices)
    missing_constituents = [s for s in etf_df["name"] if s not in price_values.columns]
    if missing_constituents:
        raise HTTPException(status_code=400, detail=f"Price Data missing for: {missing_constituents}")

    ### Back-end Functions after error-checking uploaded CSV File

    #Compute Last Close Price
    last_date = price_values.iloc[-1]
    constituents = []

    for _, row in etf_df.iterrows():
        name = row['name']
        weight = row['weight']
        latest_close = float(last_date[name])
        constituents.append({"name": name, "weight": weight, "latest_close": latest_close})

    #Calculate price of ETF per day based on the constituents prices and weights
    etf_names = etf_df['name'].tolist()
    weights = etf_df['weight'].values
    etf_series = price_values[etf_names].multiply(weights, axis=1).sum(axis=1)

    #Format series
    etf_prices = []
    for d, v in zip(price_values["DATE"], etf_series):
        row = {"date": d.strftime("%Y-%m-%d"), "price": float(v)}
        etf_prices.append(row)

    #Find the top 5 biggest holdings for the bar chart
    holdings = []

    for _, row in etf_df.iterrows():
        constituent_name = row["name"]
        holding_value = float(row["weight"] * last_date[constituent_name])
        holdings.append({"name": constituent_name, "holding_value": holding_value })
    
    top_holdings = sorted(holdings, key=lambda x: x["holding_value"], reverse=True)[:5]
    


    return {"constituents": constituents, "etf_series": etf_prices, "top_holdings": top_holdings}

