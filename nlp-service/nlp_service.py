# nlp_service.py
from flask import Flask, request, jsonify
import spacy
import re
from flask_cors import CORS # Import CORS

app = Flask(__name__)
CORS(app) # ++ Enable CORS for all routes

# Load a spaCy model (download first: python -m spacy download en_core_web_sm)
try:
    nlp = spacy.load("en_core_web_sm")
    print("spaCy model loaded successfully.")
except OSError:
    print("spaCy model 'en_core_web_sm' not found.")
    print("Download it by running: python -m spacy download en_core_web_sm")
    nlp = None # Set nlp to None if model loading fails

# More robust price extraction
def extract_price(text):
    min_price = None
    max_price = None
    text_lower = text.lower()

    # Pattern: "under X million/lakh/k/rs" or "less than X ..." etc.
    match_under = re.search(r'(under|less than|below|max|maximum)\s*([\d,]+(?:\.\d+)?)\s*(m|mil|million|l|lakh|k|thousand|rs)?', text_lower)
    if match_under:
        amount = float(match_under.group(2).replace(',', ''))
        unit = match_under.group(3)
        if unit in ['m', 'mil', 'million']:
            max_price = amount * 1000000
        elif unit in ['l', 'lakh']:
            max_price = amount * 100000
        elif unit in ['k', 'thousand']:
            max_price = amount * 1000
        else: # Handles "rs X" or just "X" as max
            max_price = amount

    # Pattern: "over X million/lakh/k/rs" or "more than X ..." etc.
    match_over = re.search(r'(over|above|more than|min|minimum)\s*([\d,]+(?:\.\d+)?)\s*(m|mil|million|l|lakh|k|thousand|rs)?', text_lower)
    if match_over:
        amount = float(match_over.group(2).replace(',', ''))
        unit = match_over.group(3)
        if unit in ['m', 'mil', 'million']:
            min_price = amount * 1000000
        elif unit in ['l', 'lakh']:
            min_price = amount * 100000
        elif unit in ['k', 'thousand']:
            min_price = amount * 1000
        else: # Handles "rs X" or just "X" as min
             min_price = amount

    # Pattern: "between X and Y (units)" or "X to Y (units)"
    match_range = re.search(r'(between|from)?\s*([\d,]+(?:\.\d+)?)\s*(?:to|and|-)\s*([\d,]+(?:\.\d+)?)\s*(m|mil|million|l|lakh|k|thousand|rs)?', text_lower)
    if match_range:
        amount_min = float(match_range.group(2).replace(',', ''))
        amount_max = float(match_range.group(3).replace(',', ''))
        unit = match_range.group(4)
        multiplier = 1
        if unit in ['m', 'mil', 'million']:
            multiplier = 1000000
        elif unit in ['l', 'lakh']:
             multiplier = 100000
        elif unit in ['k', 'thousand']:
            multiplier = 1000

        min_price = amount_min * multiplier
        max_price = amount_max * multiplier

    # Pattern: Simple number like "5 million", "50 lakh", "500k", "500000" - treat as max if no other range found
    if min_price is None and max_price is None:
         match_single = re.search(r'\b([\d,]+(?:\.\d+)?)\s*(m|mil|million|l|lakh|k|thousand|rs)?\b', text_lower)
         if match_single:
            amount = float(match_single.group(1).replace(',', ''))
            unit = match_single.group(2)
            price_val = amount
            if unit in ['m', 'mil', 'million']:
                price_val = amount * 1000000
            elif unit in ['l', 'lakh']:
                 price_val = amount * 100000
            elif unit in ['k', 'thousand']:
                price_val = amount * 1000

            # Heuristic: If number is large, assume it's a max price unless keywords like 'minimum' were found earlier
            if 'min' not in text_lower and 'minimum' not in text_lower and 'over' not in text_lower and 'above' not in text_lower :
                 max_price = price_val
            # Heuristic: If number is small (like a year), don't set price
            elif price_val < 1900 or price_val > 2100: # Avoid confusing with years
                 max_price = price_val


    return min_price, max_price

@app.route('/parse', methods=['GET'])
def parse_query():
    # ++ Check if spaCy model loaded
    if nlp is None:
        return jsonify({"error": "spaCy model not loaded. Please download it."}), 500

    query = request.args.get('query', '')
    if not query:
        return jsonify({"error": "Query parameter missing"}), 400

    print(f"Received query: {query}") # Log received query

    doc = nlp(query)
    entities = {
        "make": None,
        "model": None,
        "location": None,
        "year": None,
        "min_price": None,
        "max_price": None,
        "fuel_type": None,
        # Add more fields as needed: condition, transmission?
    }

    # --- Entity Extraction Logic ---

    # 1. spaCy NER
    for ent in doc.ents:
        print(f"spaCy NER: Text='{ent.text}', Label='{ent.label_}'") # Debug log
        if ent.label_ == "GPE" and not entities["location"]: # Geopolitical Entity
             # Simple check for Sri Lankan cities/districts (improve this list significantly)
             lk_locations = ["colombo", "kandy", "galle", "negombo", "kurunegala", "matara", "jaffna", "gampaha", "kalutara", "ratnapura"]
             if ent.text.lower() in lk_locations:
                entities["location"] = ent.text.capitalize() # Capitalize location
        elif ent.label_ == "ORG" and not entities["make"]: # ORG might catch car brands
            # Very basic check - needs a proper list/database of makes
            car_makes_spacy = ["toyota", "honda", "nissan", "suzuki", "bmw", "mercedes", "audi", "mitsubishi", "mazda", "kia", "hyundai", "ford"]
            if ent.text.lower() in car_makes_spacy:
                entities["make"] = ent.text.capitalize()
        elif ent.label_ == "DATE" and not entities["year"]: # DATE might catch year
             # Look for 4-digit years within the DATE entity
             year_match = re.search(r'\b(19[89]\d|20\d{2})\b', ent.text) # Years from 1980 onwards
             if year_match:
                 entities["year"] = int(year_match.group(1))
        elif ent.label_ == "CARDINAL" and (entities["min_price"] is None and entities["max_price"] is None):
            # Try price extraction if NER identifies a number and price isn't set yet
             min_p, max_p = extract_price(ent.text)
             if min_p is not None: entities["min_price"] = min_p
             if max_p is not None: entities["max_price"] = max_p

    # 2. Rule-based Extraction (Keywords, Patterns) - apply if NER missed something

    # Makes (more comprehensive list)
    if not entities["make"]:
         car_makes_rules = [
            "toyota", "honda", "nissan", "suzuki", "bmw", "mercedes-benz", "mercedes", "audi",
            "mitsubishi", "mazda", "kia", "hyundai", "ford", "volkswagen", "subaru",
            "land rover", "range rover", "jaguar", "porsche", "volvo", "peugeot", "fiat"
         ]
         # Find the longest matching make first to avoid partial matches (e.g., "Land Rover" vs "Rover")
         found_make = None
         for make in sorted(car_makes_rules, key=len, reverse=True):
             if f' {make} ' in f' {query.lower()} ': # Check with spaces to avoid parts of words
                 found_make = make
                 break
             # Check beginning/end of string too
             elif query.lower().startswith(f'{make} '):
                 found_make = make
                 break
             elif query.lower().endswith(f' {make}'):
                  found_make = make
                  break
             elif query.lower() == make: # Exact match
                 found_make = make
                 break
         if found_make:
             entities["make"] = found_make.replace("-benz", " Benz").title() # Proper capitalization


    # Models (dependent on make, more complex)
    # Example for Toyota:
    if entities["make"] == "Toyota" and not entities["model"]:
        models_toyota = ["prius", "aqua", "vitz", "axio", "corolla", "camry", "land cruiser", "prado", "hilux", "hiace", "chr", "c-hr", "yaris", "rav4"]
        found_model = None
        for model in sorted(models_toyota, key=len, reverse=True):
            if f' {model} ' in f' {query.lower()} ':
                found_model = model
                break
            elif query.lower().startswith(f'{model} '):
                 found_model = model
                 break
            elif query.lower().endswith(f' {model}'):
                  found_model = model
                  break
            elif query.lower() == model:
                 found_model = model
                 break
        if found_model:
            # Handle variations like C-HR
             entities["model"] = "CHR" if found_model in ["chr", "c-hr"] else found_model.capitalize()

     # Example for Honda:
    if entities["make"] == "Honda" and not entities["model"]:
        models_honda = ["vezel", "civic", "fit", "crv", "cr-v", "hrv", "hr-v", "accord", "insight"]
        found_model = None
        for model in sorted(models_honda, key=len, reverse=True):
             if f' {model} ' in f' {query.lower()} ':
                 found_model = model
                 break
             elif query.lower().startswith(f'{model} '):
                  found_model = model
                  break
             elif query.lower().endswith(f' {model}'):
                  found_model = model
                  break
             elif query.lower() == model:
                  found_model = model
                  break
        if found_model:
            if found_model in ["crv", "cr-v"]: entities["model"] = "CRV"
            elif found_model in ["hrv", "hr-v"]: entities["model"] = "HRV"
            else: entities["model"] = found_model.capitalize()

    # Add more make-model mappings here...

    # Year (if NER missed it)
    if not entities["year"]:
         year_match = re.search(r'\b(19[89]\d|20\d{2})\b', query)
         if year_match:
             # Check if it's likely a year and not part of a price
             num = int(year_match.group(1))
             # Avoid capturing year if it looks like a price component (e.g., '2000k')
             preceding_char = query[year_match.start() - 1] if year_match.start() > 0 else ' '
             following_char = query[year_match.end()] if year_match.end() < len(query) else ' '
             if not (preceding_char.isdigit() or following_char.lower() in ['k', 'l', 'm']):
                 entities["year"] = num


    # Price (using the more robust function)
    if entities["min_price"] is None and entities["max_price"] is None:
        min_p, max_p = extract_price(query)
        entities["min_price"] = min_p
        entities["max_price"] = max_p

    # Fuel Type
    if not entities["fuel_type"]:
        fuel_types = ["petrol", "diesel", "hybrid", "electric", "gas"]
        for fuel in fuel_types:
            if f' {fuel} ' in f' {query.lower()} ' or query.lower().startswith(f'{fuel} ') or query.lower().endswith(f' {fuel}') or query.lower() == fuel:
                entities["fuel_type"] = fuel.capitalize()
                break

    # Location (if NER missed it, simple check)
    if not entities["location"]:
         lk_locations_rules = ["colombo", "kandy", "galle", "negombo", "kurunegala", "matara", "jaffna", "gampaha", "kalutara", "ratnapura"]
         for loc in lk_locations_rules:
             if f' {loc} ' in f' {query.lower()} ' or query.lower().startswith(f'{loc} ') or query.lower().endswith(f' {loc}') or query.lower() == loc:
                 entities["location"] = loc.capitalize()
                 break

    print(f"Final extracted entities: {entities}") # Log final results
    return jsonify(entities)

if __name__ == '__main__':
    print("Starting Flask NLP service on http://localhost:5000")
    app.run(port=5000, debug=True) # Run on port 5000