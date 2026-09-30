import { GeocodedHotspot, PriorityCard } from "../types";

export const INDIC_LANGUAGES = [
  { code: "hin", name: "हिन्दी (Hindi)", script: "Devanagari", sample: "हमारे गाँव में मुख्य सड़क पूरी तरह टूट चुकी है और गड्ढों में पानी भरा हुआ है।" },
  { code: "tam", name: "தமிழ் (Tamil)", script: "Tamil", sample: "எங்கள் கிராமத்தில் குடிநீர் குழாய் உடைந்து ஒரு வாரமாக தண்ணீர் வீணாகிறது." },
  { code: "tel", name: "తెలుగు (Telugu)", script: "Telugu", sample: "మా గ్రామంలో విద్యుత్ ట్రాన్స్‌ఫార్మర్ కాలిపోయింది, మూడు రోజులుగా కరెంట్ లేదు." },
  { code: "ben", name: "বাংলা (Bengali)", script: "Bengali", sample: "আমাদের এলাকায় নিকাশী নালা আটকে গিয়ে রাস্তায় নোংরা জল জমে গেছে।" },
  { code: "mar", name: "मराठी (Marathi)", script: "Devanagari", sample: "पुणे मध्ये पिण्याचे पाणी मिळत नाही, हॅन्डपंप तीन महिन्यांपासून बिघडला आहे." },
  { code: "guj", name: "ગુજરાતી (Gujarati)", script: "Gujarati", sample: "અમારા વિસ્તારમાં સ્ટ્રીટ લાઈટો બંધ હોવાથી રાત્રે અવરજવરમાં મુશ્કેલી પડે છે." },
  { code: "kan", name: "ಕನ್ನಡ (Kannada)", script: "Kannada", sample: "ನಮ್ಮ ಶಾಲೆಯ ಕಟ್ಟಡದಲ್ಲಿ ಬಿರುಕು ಮೂಡಿದ್ದು ಮಕ್ಕಳ ಸುರಕ್ಷತೆಗೆ ಆತಂಕವಾಗಿದೆ." },
  { code: "ori", name: "ଓଡ଼ିଆ (Odia)", script: "Odia", sample: "ଆମ ଗାଁରେ ମୁଖ୍ୟ ପୋଲ ଭାଙ୍ଗିଯିବା ଯୋଗୁଁ ଯାତାୟାତ ସମ୍ପୂର୍ଣ୍ଣ ବନ୍ଦ ହୋଇଯାଇଛି." },
];

export const CATEGORY_COLORS: Record<string, string> = {
  roads: "#FF7B00",
  water_sanitation: "#00E5FF",
  power: "#EAB308",
  health: "#FF1F71",
  education: "#8B5CF6",
  public_safety: "#10B981",
  other: "#94A3B8",
};

export const SAMPLE_HOTSPOTS: GeocodedHotspot[] = [
  { id: "VNS-01", district: "Varanasi", state: "Uttar Pradesh", lgd_district_code: 102, lat: 25.3176, lng: 82.9739, category: "roads", excess_ratio: 3.4, report_count: 68, status: "VERIFIED" },
  { id: "JBP-01", district: "Jabalpur", state: "Madhya Pradesh", lgd_district_code: 153, lat: 23.1815, lng: 79.9864, category: "public_safety", excess_ratio: 4.8, report_count: 141, status: "VERIFIED" },
  { id: "GAY-01", district: "Gaya", state: "Bihar", lgd_district_code: 215, lat: 24.7914, lng: 85.0002, category: "water_sanitation", excess_ratio: 3.1, report_count: 54, status: "VERIFIED" },
  { id: "MDU-01", district: "Madurai", state: "Tamil Nadu", lgd_district_code: 588, lat: 9.9252, lng: 78.1198, category: "power", excess_ratio: 2.9, report_count: 49, status: "VERIFIED" },
  { id: "SLM-01", district: "Salem", state: "Tamil Nadu", lgd_district_code: 593, lat: 11.6643, lng: 78.1460, category: "education", excess_ratio: 2.5, report_count: 38, status: "VERIFIED" },
  { id: "YAV-01", district: "Yavatmal", state: "Maharashtra", lgd_district_code: 480, lat: 20.3888, lng: 78.1204, category: "health", excess_ratio: 3.7, report_count: 72, status: "VERIFIED" },
  { id: "BGP-01", district: "Bhagalpur", state: "Bihar", lgd_district_code: 218, lat: 25.2425, lng: 86.9842, category: "roads", excess_ratio: 3.2, report_count: 61, status: "VERIFIED" },
  { id: "DGH-01", district: "Deoghar", state: "Jharkhand", lgd_district_code: 217, lat: 24.4826, lng: 86.7000, category: "public_safety", excess_ratio: 3.9, report_count: 100, status: "VERIFIED" },
  { id: "KOR-01", district: "Koraput", state: "Odisha", lgd_district_code: 350, lat: 18.8135, lng: 82.7123, category: "roads", excess_ratio: 2.7, report_count: 42, status: "VERIFIED" },
  { id: "CUT-01", district: "Cuttack", state: "Odisha", lgd_district_code: 341, lat: 20.4625, lng: 85.8828, category: "water_sanitation", excess_ratio: 2.4, report_count: 36, status: "VERIFIED" },
  { id: "LKO-01", district: "Lucknow", state: "Uttar Pradesh", lgd_district_code: 156, lat: 26.8467, lng: 80.9462, category: "education", excess_ratio: 2.2, report_count: 45, status: "VERIFIED" },
  { id: "PUN-01", district: "Pune", state: "Maharashtra", lgd_district_code: 490, lat: 18.5204, lng: 73.8567, category: "water_sanitation", excess_ratio: 2.6, report_count: 52, status: "VERIFIED" }
];

export const BRICS_COUNTRIES = [
  {
    iso: "IND",
    name: "India",
    flag: "IND",
    currency: "INR (₹)",
    spatial_standard: "MoPR Local Government Directory (LGD 6-digit)",
    schemes: ["PMGSY III", "Jal Jeevan Mission", "RDSS", "PM-ABHIM", "Samagra Shiksha"],
  },
  {
    iso: "BRA",
    name: "Brazil",
    flag: "BRA",
    currency: "BRL (R$)",
    spatial_standard: "IBGE Código de Município (7 dígitos)",
    schemes: ["Novo PAC Rodovias", "Marco Legal do Saneamento", "Luz para Todos", "SUS Digital"],
  },
  {
    iso: "ZAF",
    name: "South Africa",
    flag: "ZAF",
    currency: "ZAR (R)",
    spatial_standard: "Municipal Demarcation Board (MDB Category B/C)",
    schemes: ["S'hamba Sonke", "Municipal Infrastructure Grant", "Eskom INEP", "NHI"],
  },
];
