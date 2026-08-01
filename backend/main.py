from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import yfinance as yf
import pandas as pd

app = FastAPI(title="StockDash yfinance API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

RANGE_INTERVALS = {
    "5d": "15m",
    "1mo": "1d",
    "3mo": "1d",
    "6mo": "1d",
    "1y": "1d",
    "5y": "1wk",
}

def _safe_float(value):
    try:
        if value is None or pd.isna(value):
            return None
        return float(value)
    except (TypeError, ValueError):
        return None

def _df_records(df):
    records = []
    if df is None or df.empty:
        return records
    for idx, row in df.iterrows():
        ts = row.name
        if isinstance(ts, pd.Timestamp):
            time_ms = int(ts.timestamp() * 1000)
        else:
            time_ms = int(pd.Timestamp(ts).timestamp() * 1000)
        records.append({
            "time": time_ms,
            "open": _safe_float(row.get("Open")),
            "high": _safe_float(row.get("High")),
            "low": _safe_float(row.get("Low")),
            "close": _safe_float(row.get("Close")),
            "volume": _safe_float(row.get("Volume")),
        })
    return records


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/quote/{symbol}")
def get_quote(symbol: str):
    symbol = symbol.strip().upper()
    try:
        ticker = yf.Ticker(symbol)
        fast = ticker.fast_info
        df = ticker.history(period="1d", interval="1m")
    except Exception as exc:
        raise HTTPException(status_code=404, detail=f"Could not fetch {symbol}: {exc}")

    price = _safe_float(fast.get("lastPrice"))
    prev = _safe_float(fast.get("previousClose"))
    high = _safe_float(fast.get("dayHigh"))
    low = _safe_float(fast.get("dayLow"))
    volume = _safe_float(fast.get("lastVolume"))
    name = symbol

    if price is None and df is not None and not df.empty:
        price = _safe_float(df["Close"].iloc[-1])
    if prev is None and price is not None and df is not None and len(df) > 1:
        prev = _safe_float(df["Close"].iloc[-2])
    if price is None:
        raise HTTPException(status_code=404, detail=f"No data for {symbol}")

    try:
        meta = ticker.get_history_metadata()
        name = meta.get("shortName") or meta.get("longName") or symbol
    except Exception:
        pass

    change = None
    change_percent = 0.0
    if prev is not None:
        change = price - prev
        change_percent = (change / prev) * 100 if prev else 0.0

    prices = []
    if df is not None and not df.empty:
        for rec in _df_records(df)[-30:]:
            if rec["close"] is not None:
                prices.append({"time": rec["time"], "close": rec["close"], "open": rec["open"]})

    return {
        "symbol": symbol,
        "name": name,
        "price": price,
        "change": change,
        "changePercent": change_percent,
        "previousClose": prev,
        "high": high,
        "low": low,
        "volume": volume,
        "prices": prices,
    }


@app.get("/api/history/{symbol}")
def get_history(
    symbol: str,
    range: str = Query("1mo", pattern="^(5d|1mo|3mo|6mo|1y|5y)$"),
    interval: Optional[str] = None,
):
    symbol = symbol.strip().upper()
    if interval is None:
        interval = RANGE_INTERVALS.get(range, "1d")
    try:
        df = yf.Ticker(symbol).history(period=range, interval=interval)
    except Exception as exc:
        raise HTTPException(status_code=404, detail=f"Could not fetch history for {symbol}: {exc}")
    return _df_records(df)


@app.get("/api/search")
def search_stocks(q: str = Query(..., min_length=1)):
    try:
        search = yf.Search(q, max_results=8)
        quotes = search.quotes
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Search failed: {exc}")

    results = []
    for quote in quotes or []:
        symbol = quote.get("symbol")
        if not symbol:
            continue
        results.append({
            "symbol": symbol,
            "name": quote.get("shortname") or quote.get("longname") or symbol,
            "exchange": quote.get("exchDisp") or quote.get("exchange") or "",
        })
    return results


@app.get("/api/news")
def get_news(count: int = Query(8, ge=1, le=20)):
    try:
        search = yf.Search("stock market today", news_count=count, max_results=0)
        items = search.news
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"News fetch failed: {exc}")

    results = []
    for item in items or []:
        results.append({
            "id": item.get("uuid"),
            "title": item.get("title"),
            "pubDate": item.get("providerPublishTime"),
            "publisher": item.get("publisher"),
            "link": item.get("link"),
        })
    return results
