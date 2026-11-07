"""Maharashtra administrative districts and blocks statewide dataset.

NOTE ON DATASET SCOPE & PRECISION:
- Coverage: Full statewide baseline covering all 36 Maharashtra districts across
  Konkan, Western Maharashtra, Khandesh, Marathwada, and Vidarbha divisions.
- Coordinates: Taluka and district centroids are approximate geographic reference points
  suitable for agro-climatic downscaling, NOT survey-grade cadastral boundaries.
- Dynamic Resolution: Arbitrary villages, towns, PIN codes, and GPS map clicks are
  dynamically resolved via the Geocoder Service and registered on-the-fly.
"""

from typing import Dict, List, Optional
from app.schemas.location import (
    BlockDetail,
    BlockSummary,
    CoordinatesPrecision,
    CoverageMetadata,
    CoverageStatus,
    DistrictDetail,
    DistrictSummary,
)

RAW_DISTRICTS: List[Dict] = [
    # ------------------ PUNE DIVISION ------------------
    {
        "id": "pune",
        "name": "Pune",
        "name_mr": "पुणे",
        "state_id": "mh",
        "latitude": 18.5204,
        "longitude": 73.8567,
        "blocks": [
            {"id": "baramati", "name": "Baramati", "name_mr": "बारामती", "latitude": 18.15, "longitude": 74.58},
            {"id": "maval", "name": "Maval", "name_mr": "मावळ", "latitude": 18.60, "longitude": 73.45},
            {"id": "daund", "name": "Daund", "name_mr": "दौंड", "latitude": 18.46, "longitude": 74.58},
            {"id": "junnar", "name": "Junnar", "name_mr": "जुन्नर", "latitude": 19.20, "longitude": 73.87},
            {"id": "shirur", "name": "Shirur", "name_mr": "शिरूर", "latitude": 18.82, "longitude": 74.37},
            {"id": "haveli", "name": "Haveli", "name_mr": "हवेली", "latitude": 18.50, "longitude": 73.85},
            {"id": "ambegaon", "name": "Ambegaon", "name_mr": "आंबेगाव", "latitude": 19.03, "longitude": 73.96},
            {"id": "khed_pune", "name": "Khed (Rajgurunagar)", "name_mr": "खेड", "latitude": 18.85, "longitude": 73.90},
            {"id": "indapur", "name": "Indapur", "name_mr": "इंदापूर", "latitude": 18.11, "longitude": 75.03},
        ],
    },
    {
        "id": "satara",
        "name": "Satara",
        "name_mr": "सातारा",
        "state_id": "mh",
        "latitude": 17.68,
        "longitude": 74.00,
        "blocks": [
            {"id": "phaltan", "name": "Phaltan", "name_mr": "फलटण", "latitude": 17.99, "longitude": 74.43},
            {"id": "koregaon", "name": "Koregaon", "name_mr": "कोरेगाव", "latitude": 17.70, "longitude": 74.17},
            {"id": "karad", "name": "Karad", "name_mr": "कराड", "latitude": 17.28, "longitude": 74.20},
            {"id": "wai", "name": "Wai", "name_mr": "वाई", "latitude": 17.95, "longitude": 73.90},
            {"id": "khatav", "name": "Khatav", "name_mr": "खटाव", "latitude": 17.64, "longitude": 74.34},
            {"id": "man", "name": "Man", "name_mr": "माण", "latitude": 17.71, "longitude": 74.72},
        ],
    },
    {
        "id": "solapur",
        "name": "Solapur",
        "name_mr": "सोलापूर",
        "state_id": "mh",
        "latitude": 17.66,
        "longitude": 75.90,
        "blocks": [
            {"id": "barshi", "name": "Barshi", "name_mr": "बार्शी", "latitude": 18.23, "longitude": 75.69},
            {"id": "pandharpur", "name": "Pandharpur", "name_mr": "पंढरपूर", "latitude": 17.67, "longitude": 75.32},
            {"id": "madha", "name": "Madha", "name_mr": "माढा", "latitude": 18.03, "longitude": 75.52},
            {"id": "karmala", "name": "Karmala", "name_mr": "करमाळा", "latitude": 18.41, "longitude": 75.19},
            {"id": "mohol", "name": "Mohol", "name_mr": "मोहोळ", "latitude": 17.81, "longitude": 75.65},
            {"id": "malshiras", "name": "Malshiras", "name_mr": "माळशिरस", "latitude": 17.84, "longitude": 74.96},
            {"id": "akkalkot", "name": "Akkalkot", "name_mr": "अक्कलकोट", "latitude": 17.52, "longitude": 76.20},
        ],
    },
    {
        "id": "kolhapur",
        "name": "Kolhapur",
        "name_mr": "कोल्हापूर",
        "state_id": "mh",
        "latitude": 16.70,
        "longitude": 74.24,
        "blocks": [
            {"id": "karveer", "name": "Karveer", "name_mr": "करवीर", "latitude": 16.68, "longitude": 74.28},
            {"id": "shirol", "name": "Shirol", "name_mr": "शिरोळ", "latitude": 16.81, "longitude": 74.60},
            {"id": "hatkanangle", "name": "Hatkanangle", "name_mr": "हातकणंगले", "latitude": 16.74, "longitude": 74.45},
            {"id": "panhala", "name": "Panhala", "name_mr": "पन्हाळा", "latitude": 16.81, "longitude": 74.11},
            {"id": "radhanagari", "name": "Radhanagari", "name_mr": "राधानगरी", "latitude": 16.42, "longitude": 74.00},
            {"id": "gadhinglaj", "name": "Gadhinglaj", "name_mr": "गडहिंग्लज", "latitude": 16.23, "longitude": 74.35},
        ],
    },
    {
        "id": "sangli",
        "name": "Sangli",
        "name_mr": "सांगली",
        "state_id": "mh",
        "latitude": 16.85,
        "longitude": 74.58,
        "blocks": [
            {"id": "miraj", "name": "Miraj", "name_mr": "मिरज", "latitude": 16.83, "longitude": 74.65},
            {"id": "walwa", "name": "Walwa (Islampur)", "name_mr": "वाळवा (इस्लामपूर)", "latitude": 17.05, "longitude": 74.26},
            {"id": "tasgaon", "name": "Tasgaon", "name_mr": "तासगाव", "latitude": 17.03, "longitude": 74.60},
            {"id": "shirala", "name": "Shirala", "name_mr": "शिराळा", "latitude": 16.98, "longitude": 74.13},
            {"id": "khanapur_vita", "name": "Khanapur (Vita)", "name_mr": "खानापूर (विटा)", "latitude": 17.27, "longitude": 74.53},
            {"id": "jat", "name": "Jat", "name_mr": "जत", "latitude": 17.04, "longitude": 75.33},
        ],
    },

    # ------------------ KONKAN DIVISION ------------------
    {
        "id": "raigad",
        "name": "Raigad",
        "name_mr": "रायगड",
        "state_id": "mh",
        "latitude": 18.51,
        "longitude": 73.18,
        "blocks": [
            {"id": "alibaug", "name": "Alibaug", "name_mr": "अलिबाग", "latitude": 18.65, "longitude": 72.88},
            {"id": "panvel", "name": "Panvel", "name_mr": "पनवेल", "latitude": 18.99, "longitude": 73.11},
            {"id": "karjat_raigad", "name": "Karjat", "name_mr": "कर्जत", "latitude": 18.91, "longitude": 73.33},
            {"id": "mahad", "name": "Mahad", "name_mr": "महाड", "latitude": 18.08, "longitude": 73.42},
            {"id": "pen", "name": "Pen", "name_mr": "पेण", "latitude": 18.73, "longitude": 73.09},
            {"id": "roha", "name": "Roha", "name_mr": "रोहा", "latitude": 18.44, "longitude": 73.12},
            {"id": "mangaon", "name": "Mangaon", "name_mr": "माणगाव", "latitude": 18.25, "longitude": 73.28},
        ],
    },
    {
        "id": "ratnagiri",
        "name": "Ratnagiri",
        "name_mr": "रत्नागिरी",
        "state_id": "mh",
        "latitude": 16.99,
        "longitude": 73.30,
        "blocks": [
            {"id": "ratnagiri_city", "name": "Ratnagiri", "name_mr": "रत्नागिरी", "latitude": 16.99, "longitude": 73.31},
            {"id": "chiplun", "name": "Chiplun", "name_mr": "चिपळूण", "latitude": 17.53, "longitude": 73.52},
            {"id": "dapoli", "name": "Dapoli", "name_mr": "दापोली", "latitude": 17.76, "longitude": 73.18},
            {"id": "guhagar", "name": "Guhagar", "name_mr": "गुहागर", "latitude": 17.48, "longitude": 73.20},
            {"id": "sangameshwar", "name": "Sangameshwar", "name_mr": "संगमेश्वर", "latitude": 17.18, "longitude": 73.55},
            {"id": "rajapur", "name": "Rajapur", "name_mr": "राजापूर", "latitude": 16.66, "longitude": 73.52},
        ],
    },
    {
        "id": "sindhudurg",
        "name": "Sindhudurg",
        "name_mr": "सिंधुदुर्ग",
        "state_id": "mh",
        "latitude": 16.12,
        "longitude": 73.70,
        "blocks": [
            {"id": "sawantwadi", "name": "Sawantwadi", "name_mr": "सावंतवाडी", "latitude": 15.91, "longitude": 73.82},
            {"id": "kudal", "name": "Kudal", "name_mr": "कुडाळ", "latitude": 16.01, "longitude": 73.69},
            {"id": "kankavli", "name": "Kankavli", "name_mr": "कणकवली", "latitude": 16.27, "longitude": 73.71},
            {"id": "malvan", "name": "Malvan", "name_mr": "मालवण", "latitude": 16.06, "longitude": 73.47},
            {"id": "devgad", "name": "Devgad", "name_mr": "देवगड", "latitude": 16.37, "longitude": 73.38},
        ],
    },
    {
        "id": "thane",
        "name": "Thane",
        "name_mr": "ठाणे",
        "state_id": "mh",
        "latitude": 19.21,
        "longitude": 72.97,
        "blocks": [
            {"id": "thane_city", "name": "Thane", "name_mr": "ठाणे", "latitude": 19.20, "longitude": 72.97},
            {"id": "kalyan", "name": "Kalyan", "name_mr": "कल्याण", "latitude": 19.24, "longitude": 73.13},
            {"id": "bhiwandi", "name": "Bhiwandi", "name_mr": "भिवंडी", "latitude": 19.30, "longitude": 73.06},
            {"id": "murbad", "name": "Murbad", "name_mr": "मुरबाड", "latitude": 19.25, "longitude": 73.40},
            {"id": "shahapur", "name": "Shahapur", "name_mr": "शहापूर", "latitude": 19.45, "longitude": 73.33},
        ],
    },
    {
        "id": "palghar",
        "name": "Palghar",
        "name_mr": "पालघर",
        "state_id": "mh",
        "latitude": 19.69,
        "longitude": 72.76,
        "blocks": [
            {"id": "palghar_town", "name": "Palghar", "name_mr": "पालघर", "latitude": 19.70, "longitude": 72.77},
            {"id": "dahanu", "name": "Dahanu", "name_mr": "डहाणू", "latitude": 19.97, "longitude": 72.73},
            {"id": "vasai", "name": "Vasai", "name_mr": "वसई", "latitude": 19.38, "longitude": 72.83},
            {"id": "jawhar", "name": "Jawhar", "name_mr": "जव्हार", "latitude": 19.92, "longitude": 73.23},
            {"id": "wada", "name": "Wada", "name_mr": "वाडा", "latitude": 19.65, "longitude": 73.13},
        ],
    },
    {
        "id": "mumbai_city",
        "name": "Mumbai City",
        "name_mr": "मुंबई शहर",
        "state_id": "mh",
        "latitude": 18.93,
        "longitude": 72.83,
        "blocks": [
            {"id": "mumbai_island", "name": "Mumbai South", "name_mr": "दक्षिण मुंबई", "latitude": 18.94, "longitude": 72.83},
        ],
    },
    {
        "id": "mumbai_suburban",
        "name": "Mumbai Suburban",
        "name_mr": "मुंबई उपनगर",
        "state_id": "mh",
        "latitude": 19.12,
        "longitude": 72.85,
        "blocks": [
            {"id": "kurla", "name": "Kurla", "name_mr": "कुर्ला", "latitude": 19.07, "longitude": 72.88},
            {"id": "andheri", "name": "Andheri", "name_mr": "अंधेरी", "latitude": 19.12, "longitude": 72.84},
            {"id": "borivali", "name": "Borivali", "name_mr": "बोरिवली", "latitude": 19.23, "longitude": 72.86},
        ],
    },

    # ------------------ NASHIK DIVISION (KHANDESH) ------------------
    {
        "id": "nashik",
        "name": "Nashik",
        "name_mr": "नाशिक",
        "state_id": "mh",
        "latitude": 20.00,
        "longitude": 73.79,
        "blocks": [
            {"id": "igatpuri", "name": "Igatpuri", "name_mr": "इगतपुरी", "latitude": 19.69, "longitude": 73.56},
            {"id": "nashik_taluka", "name": "Nashik", "name_mr": "नाशिक", "latitude": 20.00, "longitude": 73.79},
            {"id": "trimbakeshwar", "name": "Trimbakeshwar", "name_mr": "त्र्यंबकेश्वर", "latitude": 19.93, "longitude": 73.53},
            {"id": "niphad", "name": "Niphad", "name_mr": "निफाड", "latitude": 20.08, "longitude": 74.11},
            {"id": "sinnar", "name": "Sinnar", "name_mr": "सिन्नर", "latitude": 19.85, "longitude": 73.99},
            {"id": "dindori", "name": "Dindori", "name_mr": "दिंडोरी", "latitude": 20.20, "longitude": 73.83},
            {"id": "yeola", "name": "Yeola", "name_mr": "येवला", "latitude": 20.04, "longitude": 74.49},
            {"id": "malegaon", "name": "Malegaon", "name_mr": "मालेगाव", "latitude": 20.55, "longitude": 74.53},
            {"id": "chandwad", "name": "Chandwad", "name_mr": "चांदवड", "latitude": 20.32, "longitude": 74.24},
            {"id": "kalwan", "name": "Kalwan", "name_mr": "कळवण", "latitude": 20.48, "longitude": 74.03},
            {"id": "baglan", "name": "Baglan (Satana)", "name_mr": "बागलाण (सटाणा)", "latitude": 20.59, "longitude": 74.20},
            {"id": "deola", "name": "Deola", "name_mr": "देवळा", "latitude": 20.45, "longitude": 74.19},
            {"id": "nandgaon", "name": "Nandgaon", "name_mr": "नांदगाव", "latitude": 20.31, "longitude": 74.65},
            {"id": "surgana", "name": "Surgana", "name_mr": "सुरगाणा", "latitude": 20.57, "longitude": 73.62},
            {"id": "peth", "name": "Peth", "name_mr": "पेठ", "latitude": 20.25, "longitude": 73.50},
        ],
    },
    {
        "id": "ahilyanagar",
        "name": "Ahilyanagar",
        "name_mr": "अहिल्यानगर",
        "state_id": "mh",
        "latitude": 19.09,
        "longitude": 74.74,
        "blocks": [
            {"id": "shrirampur", "name": "Shrirampur", "name_mr": "श्रीरामपूर", "latitude": 19.62, "longitude": 74.66},
            {"id": "shevgaon", "name": "Shevgaon", "name_mr": "शेवगाव", "latitude": 19.39, "longitude": 74.65},
            {"id": "sangamner", "name": "Sangamner", "name_mr": "संगमनेर", "latitude": 19.57, "longitude": 74.21},
            {"id": "rahata", "name": "Rahata (Shirdi)", "name_mr": "राहाता", "latitude": 19.71, "longitude": 74.48},
            {"id": "kopargaon", "name": "Kopargaon", "name_mr": "कोपरगाव", "latitude": 19.89, "longitude": 74.48},
            {"id": "akole", "name": "Akole", "name_mr": "अकोले", "latitude": 19.54, "longitude": 73.93},
            {"id": "nagar_taluka", "name": "Ahilyanagar Haveli", "name_mr": "नगर", "latitude": 19.10, "longitude": 74.73},
        ],
    },
    {
        "id": "dhule",
        "name": "Dhule",
        "name_mr": "धुळे",
        "state_id": "mh",
        "latitude": 20.90,
        "longitude": 74.77,
        "blocks": [
            {"id": "dhule_city", "name": "Dhule", "name_mr": "धुळे", "latitude": 20.90, "longitude": 74.78},
            {"id": "sakri", "name": "Sakri", "name_mr": "साक्री", "latitude": 20.99, "longitude": 74.32},
            {"id": "shirpur", "name": "Shirpur", "name_mr": "शिरपूर", "latitude": 21.35, "longitude": 74.88},
            {"id": "sindkheda", "name": "Sindkheda", "name_mr": "शिंदखेडा", "latitude": 21.28, "longitude": 74.75},
        ],
    },
    {
        "id": "nandurbar",
        "name": "Nandurbar",
        "name_mr": "नंदुरबार",
        "state_id": "mh",
        "latitude": 21.37,
        "longitude": 74.24,
        "blocks": [
            {"id": "shahada", "name": "Shahada", "name_mr": "शहादा", "latitude": 21.55, "longitude": 74.47},
            {"id": "nawapur", "name": "Nawapur", "name_mr": "नवापूर", "latitude": 21.16, "longitude": 73.79},
            {"id": "nandurbar_city", "name": "Nandurbar", "name_mr": "नंदुरबार", "latitude": 21.37, "longitude": 74.25},
            {"id": "taloda", "name": "Taloda", "name_mr": "तळोदा", "latitude": 21.56, "longitude": 74.21},
            {"id": "akkalkuwa", "name": "Akkalkuwa", "name_mr": "अक्कलकुवा", "latitude": 21.55, "longitude": 74.02},
        ],
    },
    {
        "id": "jalgaon",
        "name": "Jalgaon",
        "name_mr": "जळगाव",
        "state_id": "mh",
        "latitude": 21.00,
        "longitude": 75.56,
        "blocks": [
            {"id": "jalgaon_city", "name": "Jalgaon", "name_mr": "जळगाव", "latitude": 21.00, "longitude": 75.57},
            {"id": "bhusawal", "name": "Bhusawal", "name_mr": "भुसावळ", "latitude": 21.04, "longitude": 75.79},
            {"id": "chalisgaon", "name": "Chalisgaon", "name_mr": "चाळीसगाव", "latitude": 20.46, "longitude": 75.01},
            {"id": "chopda", "name": "Chopda", "name_mr": "चोपडा", "latitude": 21.25, "longitude": 75.30},
            {"id": "raver", "name": "Raver", "name_mr": "रावेर", "latitude": 21.25, "longitude": 75.98},
            {"id": "jamner", "name": "Jamner", "name_mr": "जामनेर", "latitude": 20.81, "longitude": 75.78},
        ],
    },

    # ------------------ CHHATRAPATI SAMBHAJINAGAR (MARATHWADA) ------------------
    {
        "id": "chhatrapati_sambhajinagar",
        "name": "Chhatrapati Sambhajinagar",
        "name_mr": "छत्रपती संभाजीनगर",
        "state_id": "mh",
        "latitude": 19.87,
        "longitude": 75.34,
        "blocks": [
            {"id": "aurangabad_city", "name": "Sambhajinagar", "name_mr": "संभाजीनगर", "latitude": 19.88, "longitude": 75.34},
            {"id": "paithan", "name": "Paithan", "name_mr": "पैठण", "latitude": 19.48, "longitude": 75.38},
            {"id": "gangapur", "name": "Gangapur", "name_mr": "गंगापूर", "latitude": 19.70, "longitude": 75.01},
            {"id": "vaijapur", "name": "Vaijapur", "name_mr": "वैजापूर", "latitude": 19.93, "longitude": 74.73},
            {"id": "kannad", "name": "Kannad", "name_mr": "कन्नड", "latitude": 20.27, "longitude": 75.14},
        ],
    },
    {
        "id": "jalna",
        "name": "Jalna",
        "name_mr": "जालना",
        "state_id": "mh",
        "latitude": 19.84,
        "longitude": 75.88,
        "blocks": [
            {"id": "jalna_city", "name": "Jalna", "name_mr": "जालना", "latitude": 19.84, "longitude": 75.89},
            {"id": "ambad", "name": "Ambad", "name_mr": "अंबड", "latitude": 19.61, "longitude": 75.79},
            {"id": "partur", "name": "Partur", "name_mr": "परतूर", "latitude": 19.60, "longitude": 76.22},
            {"id": "bhokardan", "name": "Bhokardan", "name_mr": "भोकरदन", "latitude": 20.26, "longitude": 75.77},
        ],
    },
    {
        "id": "beed",
        "name": "Beed",
        "name_mr": "बीड",
        "state_id": "mh",
        "latitude": 18.98,
        "longitude": 75.76,
        "blocks": [
            {"id": "beed_city", "name": "Beed", "name_mr": "बीड", "latitude": 18.99, "longitude": 75.76},
            {"id": "georai", "name": "Georai", "name_mr": "गेवराई", "latitude": 19.26, "longitude": 75.75},
            {"id": "majalgaon", "name": "Majalgaon", "name_mr": "माजलगाव", "latitude": 19.15, "longitude": 76.22},
            {"id": "ambajogai", "name": "Ambajogai", "name_mr": "अंबाजोगाई", "latitude": 18.73, "longitude": 76.38},
            {"id": "kaij", "name": "Kaij", "name_mr": "केज", "latitude": 18.84, "longitude": 76.12},
        ],
    },
    {
        "id": "latur",
        "name": "Latur",
        "name_mr": "लातूर",
        "state_id": "mh",
        "latitude": 18.40,
        "longitude": 76.58,
        "blocks": [
            {"id": "latur_city", "name": "Latur", "name_mr": "लातूर", "latitude": 18.40, "longitude": 76.59},
            {"id": "udgir", "name": "Udgir", "name_mr": "उदगीर", "latitude": 18.39, "longitude": 77.12},
            {"id": "nilanga", "name": "Nilanga", "name_mr": "निलंगा", "latitude": 18.12, "longitude": 76.75},
            {"id": "ausa", "name": "Ausa", "name_mr": "औसा", "latitude": 18.25, "longitude": 76.50},
            {"id": "ahmadpur", "name": "Ahmadpur", "name_mr": "अहमदपूर", "latitude": 18.70, "longitude": 76.93},
        ],
    },
    {
        "id": "dharashiv",
        "name": "Dharashiv (Osmanabad)",
        "name_mr": "धाराशिव",
        "state_id": "mh",
        "latitude": 18.18,
        "longitude": 76.04,
        "blocks": [
            {"id": "dharashiv_city", "name": "Dharashiv", "name_mr": "धाराशिव", "latitude": 18.18, "longitude": 76.05},
            {"id": "tuljapur", "name": "Tuljapur", "name_mr": "तुळजापूर", "latitude": 18.01, "longitude": 76.08},
            {"id": "omerga", "name": "Omerga", "name_mr": "उमरगा", "latitude": 17.84, "longitude": 76.62},
            {"id": "kalamb_osmanabad", "name": "Kalamb", "name_mr": "कळंब", "latitude": 18.48, "longitude": 76.04},
        ],
    },
    {
        "id": "nanded",
        "name": "Nanded",
        "name_mr": "नांदेड",
        "state_id": "mh",
        "latitude": 19.15,
        "longitude": 77.31,
        "blocks": [
            {"id": "nanded_city", "name": "Nanded", "name_mr": "नांदेड", "latitude": 19.16, "longitude": 77.32},
            {"id": "biloli", "name": "Biloli", "name_mr": "बिलोली", "latitude": 18.77, "longitude": 77.73},
            {"id": "deglur", "name": "Deglur", "name_mr": "देगलूर", "latitude": 18.55, "longitude": 77.58},
            {"id": "kinwat", "name": "Kinwat", "name_mr": "किनवट", "latitude": 19.63, "longitude": 78.20},
            {"id": "mudkhed", "name": "Mudkhed", "name_mr": "मुदखेड", "latitude": 19.16, "longitude": 77.52},
        ],
    },
    {
        "id": "parbhani",
        "name": "Parbhani",
        "name_mr": "परभणी",
        "state_id": "mh",
        "latitude": 19.26,
        "longitude": 76.77,
        "blocks": [
            {"id": "parbhani_city", "name": "Parbhani", "name_mr": "परभणी", "latitude": 19.27, "longitude": 76.78},
            {"id": "gangakhed", "name": "Gangakhed", "name_mr": "गंगाखेड", "latitude": 18.96, "longitude": 76.75},
            {"id": "jintur", "name": "Jintur", "name_mr": "जिंतूर", "latitude": 19.61, "longitude": 76.69},
            {"id": "selu", "name": "Selu", "name_mr": "सेलू", "latitude": 19.46, "longitude": 76.44},
        ],
    },
    {
        "id": "hingoli",
        "name": "Hingoli",
        "name_mr": "हिंगोली",
        "state_id": "mh",
        "latitude": 19.72,
        "longitude": 77.15,
        "blocks": [
            {"id": "hingoli_city", "name": "Hingoli", "name_mr": "हिंगोली", "latitude": 19.72, "longitude": 77.15},
            {"id": "basmath", "name": "Basmath", "name_mr": "वसमत", "latitude": 19.32, "longitude": 77.16},
            {"id": "kalamnuri", "name": "Kalamnuri", "name_mr": "कलमनुरी", "latitude": 19.67, "longitude": 77.32},
        ],
    },

    # ------------------ AMRAVATI DIVISION (VIDARBHA) ------------------
    {
        "id": "amravati",
        "name": "Amravati",
        "name_mr": "अमरावती",
        "state_id": "mh",
        "latitude": 20.93,
        "longitude": 77.75,
        "blocks": [
            {"id": "amravati_city", "name": "Amravati", "name_mr": "अमरावती", "latitude": 20.94, "longitude": 77.76},
            {"id": "achalpur", "name": "Achalpur", "name_mr": "अचलपूर", "latitude": 21.26, "longitude": 77.51},
            {"id": "morshi", "name": "Morshi", "name_mr": "मोर्शी", "latitude": 21.32, "longitude": 78.01},
            {"id": "warud", "name": "Warud", "name_mr": "वरुड", "latitude": 21.46, "longitude": 78.26},
            {"id": "chandur_bazar", "name": "Chandur Bazar", "name_mr": "चांदूर बाजार", "latitude": 21.24, "longitude": 77.75},
        ],
    },
    {
        "id": "akola",
        "name": "Akola",
        "name_mr": "अकोला",
        "state_id": "mh",
        "latitude": 20.70,
        "longitude": 77.00,
        "blocks": [
            {"id": "akola_city", "name": "Akola", "name_mr": "अकोला", "latitude": 20.71, "longitude": 77.01},
            {"id": "balapur", "name": "Balapur", "name_mr": "बाळापूर", "latitude": 20.67, "longitude": 76.77},
            {"id": "akot", "name": "Akot", "name_mr": "आकोट", "latitude": 21.10, "longitude": 77.06},
            {"id": "telhara", "name": "Telhara", "name_mr": "तेल्हारा", "latitude": 21.03, "longitude": 76.84},
            {"id": "murtizapur", "name": "Murtizapur", "name_mr": "मूर्तिजापूर", "latitude": 20.73, "longitude": 77.36},
        ],
    },
    {
        "id": "yavatmal",
        "name": "Yavatmal",
        "name_mr": "यवतमाळ",
        "state_id": "mh",
        "latitude": 20.40,
        "longitude": 78.13,
        "blocks": [
            {"id": "yavatmal_city", "name": "Yavatmal", "name_mr": "यवतमाळ", "latitude": 20.40, "longitude": 78.14},
            {"id": "pusad", "name": "Pusad", "name_mr": "पुसद", "latitude": 19.91, "longitude": 77.58},
            {"id": "umarkhed", "name": "Umarkhed", "name_mr": "उमरखेड", "latitude": 19.60, "longitude": 77.70},
            {"id": "digras", "name": "Digras", "name_mr": "दिग्रस", "latitude": 20.11, "longitude": 77.72},
            {"id": "wani", "name": "Wani", "name_mr": "वणी", "latitude": 20.06, "longitude": 78.95},
        ],
    },
    {
        "id": "buldhana",
        "name": "Buldhana",
        "name_mr": "बुलढाणा",
        "state_id": "mh",
        "latitude": 20.53,
        "longitude": 76.18,
        "blocks": [
            {"id": "buldhana_city", "name": "Buldhana", "name_mr": "बुलढाणा", "latitude": 20.53, "longitude": 76.19},
            {"id": "khamgaon", "name": "Khamgaon", "name_mr": "खामगाव", "latitude": 20.68, "longitude": 76.57},
            {"id": "malkapur", "name": "Malkapur", "name_mr": "मलकापूर", "latitude": 20.88, "longitude": 76.20},
            {"id": "shegaon", "name": "Shegaon", "name_mr": "शेगाव", "latitude": 20.79, "longitude": 76.69},
            {"id": "chikhli", "name": "Chikhli", "name_mr": "चिखली", "latitude": 20.35, "longitude": 76.26},
        ],
    },
    {
        "id": "washim",
        "name": "Washim",
        "name_mr": "वाशिम",
        "state_id": "mh",
        "latitude": 20.10,
        "longitude": 77.13,
        "blocks": [
            {"id": "washim_city", "name": "Washim", "name_mr": "वाशिम", "latitude": 20.11, "longitude": 77.14},
            {"id": "karanja", "name": "Karanja Lad", "name_mr": "कारंजा लाड", "latitude": 20.48, "longitude": 77.49},
            {"id": "risod", "name": "Risod", "name_mr": "रिसोड", "latitude": 19.97, "longitude": 76.78},
            {"id": "mangrulpir", "name": "Mangrulpir", "name_mr": "मंगरुळपीर", "latitude": 20.32, "longitude": 77.34},
        ],
    },

    # ------------------ NAGPUR DIVISION (VIDARBHA) ------------------
    {
        "id": "nagpur",
        "name": "Nagpur",
        "name_mr": "नागपूर",
        "state_id": "mh",
        "latitude": 21.1458,
        "longitude": 79.0882,
        "blocks": [
            {"id": "nagpur_city", "name": "Nagpur City", "name_mr": "नागपूर शहर", "latitude": 21.15, "longitude": 79.09},
            {"id": "katol", "name": "Katol", "name_mr": "काटोल", "latitude": 21.28, "longitude": 78.58},
            {"id": "saoner", "name": "Saoner", "name_mr": "सावनेर", "latitude": 21.39, "longitude": 78.92},
            {"id": "umred", "name": "Umred", "name_mr": "उमरेड", "latitude": 20.85, "longitude": 79.33},
            {"id": "ramtek", "name": "Ramtek", "name_mr": "रामटेक", "latitude": 21.39, "longitude": 79.33},
            {"id": "hingna", "name": "Hingna", "name_mr": "हिंगणा", "latitude": 21.07, "longitude": 78.96},
        ],
    },
    {
        "id": "wardha",
        "name": "Wardha",
        "name_mr": "वर्धा",
        "state_id": "mh",
        "latitude": 20.74,
        "longitude": 78.60,
        "blocks": [
            {"id": "wardha_city", "name": "Wardha", "name_mr": "वर्धा", "latitude": 20.74, "longitude": 78.61},
            {"id": "hinganghat", "name": "Hinganghat", "name_mr": "हिंगणघाट", "latitude": 20.56, "longitude": 78.84},
            {"id": "arvi", "name": "Arvi", "name_mr": "आर्वी", "latitude": 20.98, "longitude": 78.23},
            {"id": "deoli", "name": "Deoli", "name_mr": "देवळी", "latitude": 20.66, "longitude": 78.48},
        ],
    },
    {
        "id": "bhandara",
        "name": "Bhandara",
        "name_mr": "भंडारा",
        "state_id": "mh",
        "latitude": 21.17,
        "longitude": 79.65,
        "blocks": [
            {"id": "bhandara_city", "name": "Bhandara", "name_mr": "भंडारा", "latitude": 21.17, "longitude": 79.66},
            {"id": "tumsar", "name": "Tumsar", "name_mr": "तुमसर", "latitude": 21.38, "longitude": 79.74},
            {"id": "sakoli", "name": "Sakoli", "name_mr": "साकोली", "latitude": 21.08, "longitude": 79.98},
            {"id": "pauni", "name": "Pauni", "name_mr": "पवनी", "latitude": 20.79, "longitude": 79.63},
        ],
    },
    {
        "id": "gondia",
        "name": "Gondia",
        "name_mr": "गोंदिया",
        "state_id": "mh",
        "latitude": 21.45,
        "longitude": 80.20,
        "blocks": [
            {"id": "gondia_city", "name": "Gondia", "name_mr": "गोंदिया", "latitude": 21.46, "longitude": 80.20},
            {"id": "tirora", "name": "Tirora", "name_mr": "तिरोडा", "latitude": 21.41, "longitude": 79.93},
            {"id": "amgaon", "name": "Amgaon", "name_mr": "आमगाव", "latitude": 21.36, "longitude": 80.38},
            {"id": "goregaon_gondia", "name": "Goregaon", "name_mr": "गोरेगाव", "latitude": 21.34, "longitude": 80.19},
        ],
    },
    {
        "id": "chandrapur",
        "name": "Chandrapur",
        "name_mr": "चंद्रपूर",
        "state_id": "mh",
        "latitude": 19.95,
        "longitude": 79.30,
        "blocks": [
            {"id": "chandrapur_city", "name": "Chandrapur", "name_mr": "चंद्रपूर", "latitude": 19.96, "longitude": 79.30},
            {"id": "warora", "name": "Warora", "name_mr": "वरोरा", "latitude": 20.23, "longitude": 79.00},
            {"id": "ballarpur", "name": "Ballarpur", "name_mr": "बल्लारपूर", "latitude": 19.85, "longitude": 79.35},
            {"id": "bramhapuri", "name": "Bramhapuri", "name_mr": "ब्रह्मपुरी", "latitude": 20.61, "longitude": 79.86},
            {"id": "rajura", "name": "Rajura", "name_mr": "राजूरा", "latitude": 19.78, "longitude": 79.37},
        ],
    },
    {
        "id": "gadchiroli",
        "name": "Gadchiroli",
        "name_mr": "गडचिरोली",
        "state_id": "mh",
        "latitude": 20.18,
        "longitude": 80.00,
        "blocks": [
            {"id": "gadchiroli_city", "name": "Gadchiroli", "name_mr": "गडचिरोली", "latitude": 20.18, "longitude": 80.01},
            {"id": "armori", "name": "Armori", "name_mr": "आरमोरी", "latitude": 20.46, "longitude": 79.98},
            {"id": "chamorshi", "name": "Chamorshi", "name_mr": "चामोर्शी", "latitude": 19.93, "longitude": 79.94},
            {"id": "aheri", "name": "Aheri", "name_mr": "अहेरी", "latitude": 19.42, "longitude": 80.01},
            {"id": "sironcha", "name": "Sironcha", "name_mr": "सिरोंचा", "latitude": 18.83, "longitude": 79.96},
        ],
    },
]

# Build in-memory lookup maps
DISTRICTS_MAP: Dict[str, DistrictDetail] = {}
BLOCKS_MAP: Dict[str, BlockDetail] = {}

# Keep track of original 15 focus blocks for curated analytics
ORIGINAL_CURATED_BLOCK_IDS = {
    "baramati", "maval", "daund", "niphad", "sinnar", "shrirampur",
    "shevgaon", "karveer", "shirol", "phaltan", "koregaon", "barshi",
    "pandharpur", "shahada", "nawapur",
}

for d in RAW_DISTRICTS:
    block_objs: List[BlockSummary] = []
    for b in d["blocks"]:
        is_curated = b["id"] in ORIGINAL_CURATED_BLOCK_IDS
        status = CoverageStatus.CURATED_FOCUS_SUBSET if is_curated else CoverageStatus.STATEWIDE_GAZETTEER
        block_model = BlockDetail(
            id=b["id"],
            name=b["name"],
            name_mr=b["name_mr"],
            district_id=d["id"],
            district_name=d["name"],
            state_id=d["state_id"],
            state_name="Maharashtra",
            state_name_mr="महाराष्ट्र",
            latitude=b["latitude"],
            longitude=b["longitude"],
            coordinates_precision=CoordinatesPrecision.APPROXIMATE_CENTROID,
            coverage_status=status,
        )
        BLOCKS_MAP[b["id"]] = block_model
        block_objs.append(
            BlockSummary(
                id=b["id"],
                name=b["name"],
                name_mr=b["name_mr"],
                district_id=d["id"],
                district_name=d["name"],
                latitude=b["latitude"],
                longitude=b["longitude"],
                coordinates_precision=CoordinatesPrecision.APPROXIMATE_CENTROID,
                coverage_status=status,
            )
        )

    dist_model = DistrictDetail(
        id=d["id"],
        name=d["name"],
        name_mr=d["name_mr"],
        state_id=d["state_id"],
        latitude=d["latitude"],
        longitude=d["longitude"],
        block_count=len(block_objs),
        coverage_status=CoverageStatus.STATEWIDE_GAZETTEER,
        blocks=block_objs,
    )
    DISTRICTS_MAP[d["id"]] = dist_model


def get_coverage_metadata() -> CoverageMetadata:
    """Return explicit metadata detailing statewide coverage across all 36 districts."""
    total_districts = 36
    available_districts = len(DISTRICTS_MAP)
    total_blocks = len(BLOCKS_MAP)
    pct = round((available_districts / total_districts) * 100, 1)

    return CoverageMetadata(
        total_state_districts=total_districts,
        curated_districts_count=available_districts,
        curated_blocks_count=total_blocks,
        statewide_coverage_pct=pct,
        coordinates_precision=CoordinatesPrecision.APPROXIMATE_CENTROID,
        coverage_limitation_statement=(
            "Statewide Maharashtra operational coverage encompassing all 36 districts and 160+ taluka "
            "centroids. Arbitrary villages, towns, PIN codes, and farm GPS points are resolved dynamically "
            "via OpenStreetMap Nominatim and registered on-the-fly. Centroids represent approximate taluka reference "
            "points, not survey-grade cadastral boundaries."
        ),
        gazetteer_source="Maharashtra LGD gazetteer + OpenStreetMap Nominatim live geocoding engine",
    )
