#!/usr/bin/env python3
"""
FRED Economic Data Fetcher
Fetches live data from Federal Reserve Economic Data API
Securely uses FRED_API_KEY from environment variables
"""

import requests
import json
import os
from datetime import datetime

def fetch_fred_data():
    """Fetch data from FRED API"""
    
    # Get API key from environment variable (GitHub Secret)
    API_KEY = os.getenv('FRED_API_KEY')
    
    if not API_KEY:
        raise ValueError("ERROR: FRED_API_KEY environment variable not set!")
    
    BASE_URL = 'https://api.stlouisfed.org/fred/series/observations'
    
    # Define all series to fetch
    SERIES_CONFIG = {
        'mortgage': {
            'MORTGAGE30US': {
                'name': '30-Year Fixed Rate Mortgage Average',
                'frequency': 'weekly',
                'units': 'percent'
            },
            'MORTGAGE15US': {
                'name': '15-Year Fixed Rate Mortgage Average',
                'frequency': 'weekly',
                'units': 'percent'
            },
            'MORTGAGE5US': {
                'name': '5/1-Year Adjustable Rate Mortgage Average',
                'frequency': 'weekly',
                'units': 'percent'
            }
        },
        'treasury': {
            'DGS10': {
                'name': '10-Year Treasury Constant Maturity Rate',
                'frequency': 'daily',
                'units': 'percent'
            },
            'DGS2': {
                'name': '2-Year Treasury Constant Maturity Rate',
                'frequency': 'daily',
                'units': 'percent'
            }
        },
        'inflation': {
            'CPIAUCSL': {
                'name': 'Consumer Price Index for All Urban Consumers',
                'frequency': 'monthly',
                'units': 'index'
            },
            'CPILFESL': {
                'name': 'Core CPI (excl. Food & Energy)',
                'frequency': 'monthly',
                'units': 'index'
            }
        },
        'employment': {
            'UNRATE': {
                'name': 'Unemployment Rate',
                'frequency': 'monthly',
                'units': 'percent'
            }
        },
        'gdp': {
            'GDP': {
                'name': 'Gross Domestic Product',
                'frequency': 'quarterly',
                'units': 'billions'
            }
        }
    }
    
    # Initialize result structure
    result = {
        'metadata': {
            'last_updated': datetime.utcnow().isoformat() + 'Z',
            'source': 'Federal Reserve Economic Data (FRED)',
            'api_url': 'https://fred.stlouisfed.org/',
            'data_provider': 'Federal Reserve Bank of St. Louis'
        },
        'categories': {}
    }
    
    print("🚀 Starting FRED data fetch...")
    print(f"⏰ Timestamp: {result['metadata']['last_updated']}")
    print(f"🔑 API Key: {'*' * 20}{'*' * 12} (hidden for security)")
    
    # Fetch each series
    for category, series_dict in SERIES_CONFIG.items():
        print(f"\n📊 Processing category: {category}")
        result['categories'][category] = {}
        
        for series_id, metadata in series_dict.items():
            try:
                # Build API request URL
                params = {
                    'series_id': series_id,
                    'api_key': API_KEY,
                    'file_type': 'json',
                    'sort_order': 'desc',
                    'limit': '100'
                }
                
                print(f"   📥 Fetching {series_id}...", end='')
                
                # Make API request
                response = requests.get(BASE_URL, params=params, timeout=10)
                response.raise_for_status()
                
                data = response.json()
                
                # Check if we got observations
                if 'observations' not in data or len(data['observations']) == 0:
                    print(f" ⚠️ No data")
                    continue
                
                # Filter valid observations (remove missing values marked as ".")
                valid_obs = []
                for obs in data['observations']:
                    if obs['value'] != '.':
                        valid_obs.append({
                            'date': obs['date'],
                            'value': float(obs['value']),
                            'realtime_start': obs.get('realtime_start'),
                            'realtime_end': obs.get('realtime_end')
                        })
                
                if not valid_obs:
                    print(f" ⚠️ No valid observations")
                    continue
                
                # Store the data
                result['categories'][category][series_id] = {
                    'name': metadata['name'],
                    'frequency': metadata['frequency'],
                    'units': metadata['units'],
                    'data': {
                        'series_id': series_id,
                        'realtime_start': data.get('realtime_start'),
                        'realtime_end': data.get('realtime_end'),
                        'observation_start': data.get('observation_start'),
                        'observation_end': data.get('observation_end'),
                        'units': data.get('units'),
                        'count': len(valid_obs),
                        'observations': valid_obs
                    }
                }
                
                print(f" ✅ ({len(valid_obs)} records)")
                
            except requests.exceptions.RequestException as e:
                print(f" ❌ ERROR: {str(e)}")
                continue
            except (KeyError, ValueError) as e:
                print(f" ❌ PARSE ERROR: {str(e)}")
                continue
    
    # Create data directory if it doesn't exist
    os.makedirs('data', exist_ok=True)
    
    # Save to JSON file
    output_file = 'data/rates.json'
    with open(output_file, 'w') as f:
        json.dump(result, f, indent=2)
    
    print(f"\n✅ Data saved successfully to {output_file}")
    print(f"📁 File size: {os.path.getsize(output_file) / 1024:.1f} KB")
    print(f"📊 Categories: {len(result['categories'])}")
    for cat, series in result['categories'].items():
        print(f"   - {cat}: {len(series)} series")
    
    return result

if __name__ == '__main__':
    try:
        fetch_fred_data()
        print("\n✨ FRED data fetch completed successfully!")
        exit(0)
    except Exception as e:
        print(f"\n❌ FATAL ERROR: {str(e)}")
        exit(1)
