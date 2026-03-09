import pandas as pd
from sqlalchemy import create_engine
import os

DATABASE_URL = "postgresql://postgres:Garra%4002@localhost:5433/smartfit_db"

engine = create_engine(DATABASE_URL)

# Get project root
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

file_path = os.path.join(BASE_DIR, "data", "brand_size_chart_fixed.xlsx")

print("Reading file from:", file_path)

df = pd.read_excel(file_path)

df.to_sql(
    "brand_sizes",
    engine,
    if_exists="append",
    index=False
)

print("Brand dataset imported successfully!")