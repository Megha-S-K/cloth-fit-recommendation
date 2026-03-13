#!/usr/bin/env python3
"""
Import brand size data from Excel into PostgreSQL using a single DATABASE_URL.
Expected file structure:
CLOTH-REC/
  backend/
    app/
    data/
      brand_dataset.xlsx
    scripts/
      this_script.py
  .env
  requirements.txt
"""

import os
import pandas as pd
from sqlalchemy import create_engine
from dotenv import load_dotenv

# ------------------------------------------------------
# Load environment variables from .env (project root)
# ------------------------------------------------------
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(script_dir, '..', '..'))
dotenv_path = os.path.join(project_root, '.env')
load_dotenv(dotenv_path)

# ------------------------------------------------------
# Configuration
# ------------------------------------------------------
DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    raise ValueError("DATABASE_URL not found in .env file")

EXCEL_FILE = os.path.join(script_dir, '..', 'data', 'brand_dataset.xlsx')
SHEET_NAME = 'SmartFit_DB'           # Name of the sheet containing the data
TABLE_NAME = 'brand_sizes'            # Target PostgreSQL table

# ------------------------------------------------------
# Mapping of Excel columns to database columns
# ------------------------------------------------------
column_mapping = {
    "Brand": "brand",
    "Gender": "gender",
    "Category": "category",
    "Product Type": "product_type",
    "Garment Type": "garment_type",
    "Size Label": "size_label",
    "Upper Body (cm)": "upper_body_cm",
    "Waist (cm)": "waist_cm",
    "Hip (cm)": "hip_cm",
    "Inseam (cm)": "inseam_cm",
    "Height (cm)": "height_cm",
    "brand_r1": "brand_r1",
    "brand_r2": "brand_r2",
    "brand_r3": "brand_r3"
}

# ------------------------------------------------------
# Read Excel and prepare DataFrame
# ------------------------------------------------------
def load_and_prepare_data(excel_path, sheet):
    # Read the sheet, keep all columns as is
    df = pd.read_excel(excel_path, sheet_name=sheet, dtype=str)

    # Rename columns according to mapping
    df.rename(columns=column_mapping, inplace=True)

    # Keep only the columns that exist in the mapping (and thus in the target table)
    existing_cols = [col for col in column_mapping.values() if col in df.columns]
    df = df[existing_cols]

    # Add neck_cm as NULL (None) – this column is required by the table but missing in source
    df["neck_cm"] = None

    # Reorder columns to match the database order (without id)
    final_columns = [
        "brand", "gender", "category", "product_type", "garment_type",
        "size_label", "upper_body_cm", "waist_cm", "hip_cm", "neck_cm",
        "inseam_cm", "height_cm", "brand_r1", "brand_r2", "brand_r3"
    ]
    df = df[final_columns]

    # Convert numeric columns to float, coerce errors to NaN
    numeric_cols = [
        "upper_body_cm", "waist_cm", "hip_cm", "neck_cm",
        "inseam_cm", "height_cm", "brand_r1", "brand_r2", "brand_r3"
    ]
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    # Replace NaN with None (SQL NULL)
    df = df.where(pd.notnull(df), None)

    return df

# ------------------------------------------------------
# Insert data into PostgreSQL
# ------------------------------------------------------
def insert_data(df, table_name, database_url):
    engine = create_engine(database_url)
    # Append rows to existing table
    df.to_sql(table_name, con=engine, if_exists='append', index=False, method='multi')
    print(f"✅ Successfully inserted {len(df)} rows into {table_name}.")

# ------------------------------------------------------
# Main execution
# ------------------------------------------------------
if __name__ == "__main__":
    # Verify Excel file exists
    if not os.path.exists(EXCEL_FILE):
        print(f"❌ Excel file not found at {EXCEL_FILE}")
        exit(1)

    # Load and prepare the data
    print(f"📂 Reading Excel file from: {EXCEL_FILE}")
    data_df = load_and_prepare_data(EXCEL_FILE, SHEET_NAME)
    print(f"📊 Loaded {len(data_df)} rows from sheet '{SHEET_NAME}'.")

    # Insert into database
    print("💾 Inserting data into PostgreSQL...")
    insert_data(data_df, TABLE_NAME, DATABASE_URL)

    print("🎉 Import completed.")