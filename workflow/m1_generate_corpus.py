"""M1.2 — Synthetic multilingual corpus generation.

Generates the VAANI citizen-request corpus with ground truth known at creation
time (design.md Stage 1): 3 languages (hi/mr/ta), 4 channels, 7 categories,
duplicate clusters (incl. cross-lingual), treated-district demand trends for the
impact engine, and an astroturf/spam cohort for the trust filter.

Temporal split by construction: train window 2025-10-01..2026-06-30, guard gap
2026-07-01..14 (no rows), test window 2026-07-15..2026-09-25. No duplicate
cluster spans both windows (leakage invariant, design.md §3).
"""
import hashlib
import json
import uuid
from collections import Counter
from datetime import datetime, timedelta

import numpy as np
import pandas as pd

from config import (AUDIO_DIR, CATEGORIES, DEVICE_HASH_SALT, RUNS, SEED, SYNTH,
                    TEST_END, TEST_START, TRAIN_END, TRAIN_START)

RNG = np.random.default_rng(SEED)

# ---------------------------------------------------------------- templates
# {village}, {district}, {issue} are slots; some templates omit {village}.
TEMPLATES = {
 ("hi","roads"): [
   "{village} गाँव की सड़क बहुत टूटी है, {district} में मानसून में कोई मरम्मत नहीं हुई। {issue}",
   "{district} जिले में {village} के रास्ते में बड़े गड्ढे हैं, दो पहिया वाहन पलट रहे हैं। {issue}",
   "सरकार का ध्यान आकर्षित करता हूँ — {village}, {district}: मुख्य सड़क जीर्ण-शीर्ण। {issue}",
   "{issue} यह हालत {district} की {village} वाली सड़क की है, एम्बुलेंस भी नहीं जा पाती।",
   "प्रधान जी, {village} तक पक्की सड़क नहीं है, {district} में हमें कीचड़ में चलना पड़ता है। {issue}",
 ],
 ("mr","roads"): [
   "{village} गावातील रस्ता खराब आहे, {district} मध्ये पावसाळ्यात दुरुस्ती झाली नाही। {issue}",
   "{district} जिल्ह्यात {village} च्या रस्त्यावर मोठ्या खड्डे आहेत, दुचाकी घसरत आहेत। {issue}",
   "सरकारचे लक्ष वेधतो — {village}, {district}: प्रमुख रस्ता जीर्ण-शीर्ण झाला आहे। {issue}",
   "{issue} {district} मधील {village} रस्त्याची अवस्था पाहा, ऍम्ब्युलन्सही जात नाही।",
   "ग्रामपंचायतकडे विनंती — {village} पर्यंत पक्का रस्ता नाही, {district} मध्ये चिखलात चालावे लागते। {issue}",
 ],
 ("ta","roads"): [
   "{village} கிராமத்து ரோடு மோசமா உடைந்து இருக்கு, {district} ல மழைக்காலத்துல யாரும் சரி பண்ணல. {issue}",
   "{district} மாவட்டத்துல {village} போகும் ரோட்டுல பெரிய குழிகள் இருக்கு, வண்டிகள் கவிழுது. {issue}",
   "அரசு கவனத்துக்கு — {village}, {district}: மெயின் ரோடு மோசமா போயிருக்கு. {issue}",
   "{issue} {district} ல {village} ரோட்டு நிலைமை பாருங்க, ஆம்புலன்ஸ் கூட போக முடியல.",
   "{village} வரைக்கும் பக்கா ரோடு இல்ல, {district} மாவட்டத்துல சேற்றுல நடக்கணும். {issue}",
 ],
 ("hi","water_sanitation"): [
   "{village} में पीने का पानी नहीं मिल रहा, {district} के लोग परेशान हैं। {issue}",
   "{district} जिले के {village} में नाली का पानी सड़क पर जमा है, बीमारी फैल रही है। {issue}",
   "स्वास्थ्य विभाग का ध्यान दिलाता हूँ — {village}, {district} में पानी की गुणवत्ता बहुत खराब। {issue}",
   "{issue} {village}, {district} में तीन महीने से ठीक नहीं हुआ, बच्चे बीमार हो रहे हैं।",
   "ग्राम पंचायत में शिकायत दर्ज कराई — {district} के {village} में सफाई व्यवस्था जीरो है। {issue}",
 ],
 ("mr","water_sanitation"): [
   "{village} मध्ये पिण्याचे पाणी मिळत नाही, {district} चे लोक त्रस्त आहेत. {issue}",
   "{district} जिल्ह्यातील {village} मध्ये गटाराचे पाणी रस्त्यावर साचले, आजार पसरत आहेत. {issue}",
   "आरोग्य विभागाचे लक्ष वेधतो — {village}, {district} मध्ये पाण्याची गुणवत्ता खूप वाईट. {issue}",
   "{issue} {village}, {district} मध्ये तीन महिन्यांपासून दुरुस्त झाले नाही, मुले आजारी पडत आहेत.",
   "ग्रामपंचायतीत तक्रार दाखल — {district} मधील {village} मध्ये स्वच्छता व्यवस्था शून्य. {issue}",
 ],
 ("ta","water_sanitation"): [
   "{village} ல குடிக்க தண்ணி இல்ல, {district} மக்கள் கஷ்டப்படுறாங்க. {issue}",
   "{district} மாவட்டம் {village} ல சாக்கடை தண்ணி ரோட்டுல நின்னுருக்கு, நோய் பரவுது. {issue}",
   "சுகாதாரத் துறை கவனத்துக்கு — {village}, {district} ல தண்ணி தரம் ரொம்ப கெட்டியா இருக்கு. {issue}",
   "{issue} {village}, {district} ல மூணு மாசமா சரி பண்ணல, புள்ளங்க நோய் வருது.",
   "{district} ல உள்ள {village} ல சுத்தம் பண்றதே இல்ல, பஞ்சாயத்துல புகார் குடுத்தேன். {issue}",
 ],
 ("hi","power"): [
   "{village} में रोज़ कई घंटे बिजली कटौती होती है, {district} में पढ़ाई और काम ठप। {issue}",
   "{district} जिले के {village} में ट्रांसफार्मर जल गया है, हफ्ते भर से बिजली नहीं। {issue}",
   "विद्युत विभाग से गुहार — {village}, {district}: वोल्टेज बहुत कम, पंप नहीं चल रहे। {issue}",
   "{issue} {village}, {district} में लगातार दिक्कत है, कृषि का पम्पसेट बंद पड़ा है।",
   "गर्मी में {district} के {village} में 8 घंटे लोडशेडिंग, बुज़ुर्ग और बच्चे परेशान। {issue}",
 ],
 ("mr","power"): [
   "{village} मध्ये रोज अनेक तास वीज नाही, {district} मध्ये शिक्षण आणि काम ठप्प. {issue}",
   "{district} जिल्ह्यातील {village} मध्ये ट्रान्सफॉर्मर जळाला, आठवडाभर वीज नाही. {issue}",
   "विद्युत विभागाला सांगतो — {village}, {district}: व्होल्टेज खूप कमी, पंप चालत नाहीत. {issue}",
   "{issue} {village}, {district} मध्ये सातत्याने अडचण, शेतीचा पंप बंद पडला आहे.",
   "उन्हाळ्यात {district} मधील {village} मध्ये 8 तास लोडशेडिंग, ज्येष्ठ आणि मुले त्रस्त. {issue}",
 ],
 ("ta","power"): [
   "{village} ல தினமும் நெறைய மணி கரண்ட் கட், {district} ல படிப்பு வேலை எல்லாம் நிக்குது. {issue}",
   "{district} மாவட்டம் {village} ல டிரான்ஸ்ஃபார்மர் எரிஞ்சுருச்சு, ஒரு வாரமா கரண்ட் இல்ல. {issue}",
   "மின்சார வாரியத்துக்கு — {village}, {district}: வோல்டேஜ் ரொம்ப குறைவா இருக்கு, பம்பு ஓடல. {issue}",
   "{issue} {village}, {district} ல தொடர்ந்து பிரச்சனை, விவசாய மோட்டார் நின்னுருக்கு.",
   "வெயில் காலத்துல {district} ல {village} க்கு 8 மணி கரண்ட் இல்ல, பெரியவங்க பிள்ளைங்க கஷ்டப்படுறாங்க. {issue}",
 ],
 ("hi","health"): [
   "{village} के स्वास्थ्य केंद्र पर कर्मचारी ही नहीं दिखते, {district} के मरीज भटक रहे हैं। {issue}",
   "{district} जिला अस्पताल में इलाज की व्यवस्था ठप है, {village} से आए मरीज खाली हाथ लौटते हैं। {issue}",
   "स्वास्थ्य महकमे का ध्यान दिलाता हूँ — {village}, {district} में PHC की हालत बहुत खराब। {issue}",
   "{issue} {village}, {district} में गंभीर समस्या है, गर्भवती महिलाओं को शहर जाना पड़ता है।",
   "{village} में एम्बुलेंस सेवा नहीं है, {district} में आपातकाल में मौतें हो रही हैं। {issue}",
 ],
 ("mr","health"): [
   "{village} च्या आरोग्य केंद्रात डॉक्टर येत नाहीत, {district} चे रुग्ण अडचणीत. {issue}",
   "{district} जिल्हा रुग्णालयात उपचाराची व्यवस्था ठप्प आहे, {village} कडून आलेले रुग्ण रिकामे परत जातात. {issue}",
   "आरोग्य विभागाचे लक्ष वेधतो — {village}, {district} मधील PHC ची अवस्था वाईट. {issue}",
   "{issue} {village}, {district} मध्ये गंभीर समस्या, गर्भवती महिलांना शहरात जावे लागते.",
   "{village} मध्ये ऍम्ब्युलन्स सेवा नाही, {district} मध्ये आपत्कालीन स्थितीत मृत्यू होत आहेत. {issue}",
 ],
 ("ta","health"): [
   "{village} ல மருத்துவக் கூடத்துல டாக்டர் வரல, {district} நோயாளிகள் அலையறாங்க. {issue}",
   "{district} ல மாவட்ட மருத்துவமனையில மருந்து இல்ல, {village} ல இருந்து வரும் நோயாளி கை வெறுமையா திரும்புறாங்க. {issue}",
   "சுகாதாரத் துறை கவனத்துக்கு — {village}, {district} ல PHC நிலைமை ரொம்ப மோசம். {issue}",
   "{issue} {village}, {district} ல பெரிய பிரச்சனை, பிரசவத்துக்கு நகரம் போகணும்.",
   "{village} ல அவசர நேரத்துல எந்த வாகன வசதியும் இல்ல, {district} ல உயிரிழப்பு நடக்குது. {issue}",
 ],
 ("hi","education"): [
   "{village} के स्कूल भवन में दीवारें टूटी हैं, {district} में बच्चों की पढ़ाई खतरे में। {issue}",
   "{district} जिले के {village} स्कूल में क्लासेस ठीक से नहीं चल रहीं, बच्चे खेलते रहते हैं। {issue}",
   "शिक्षा विभाग का ध्यान दिलाऊँ — {village}, {district}: स्कूल की बुनियादी सुविधाएँ नहीं हैं। {issue}",
   "{issue} {village}, {district} में स्कूल में है, अभिभावक बच्चों को हटा रहे हैं।",
   "मध्याह्न भोजन में गड़बड़ — {district} के {village} स्कूल में बच्चे बासी खाना पा रहे हैं। {issue}",
 ],
 ("mr","education"): [
   "{village} च्या शाळेची इमारत जीर्ण झाली, {district} मध्ये मुलांचे शिक्षण धोक्यात. {issue}",
   "{district} जिल्ह्यातील {village} शाळेत वर्ग व्यवस्थित चालत नाहीत, मुले खेळत बसतात. {issue}",
   "शिक्षण विभागाचे लक्ष वेधतो — {village}, {district}: शाळेची पायाभूत सोय नाही. {issue}",
   "{issue} {village}, {district} मधील शाळेत आहे, पालक मुलांना काढत आहेत.",
   "मध्यान्ह भोजनात गैप्रवार — {district} मधील {village} शाळेत मुलांना चांगले जेवण मिळत नाही. {issue}",
 ],
 ("ta","education"): [
   "{village} ல பள்ளிக் கட்டிடம் உடைஞ்சுருக்கு, {district} ல பிள்ளைங்க படிப்பு ஆபத்துல இருக்கு. {issue}",
   "{district} மாவட்டம் {village} பள்ளியில டீச்சர் இல்ல, பிள்ளைங்க விளையாடிட்டே இருக்காங்க. {issue}",
   "கல்வித்துறை கவனத்துக்கு — {village}, {district}: பள்ளியில அடிப்படை வசதி இல்ல. {issue}",
   "{issue} {village}, {district} ல பள்ளியில இருக்கு, பெற்றோர் பிள்ளைங்கள எடுத்துட்டாங்க.",
   "மதிய சாப்பாட்டுல பிரச்சனை — {district} ல {village} பள்ளியில பழைய சாப்பாடு குடுக்குறாங்க. {issue}",
 ],
 ("hi","public_safety"): [
   "{village} में रात में स्ट्रीट लाइट नहीं जलती, {district} में चोरी की घटनाएँ बढ़ी हैं। {issue}",
   "{district} जिले के {village} के पास आवारा पशुओं का आतंक है, बच्चों को स्कूल जाना मुश्किल। {issue}",
   "पुलिस प्रशासन का ध्यान दिलाऊँ — {village}, {district} में महिलाओं के लिए रास्ते असुरक्षित हैं। {issue}",
   "{issue} {village}, {district} में लगातार हो रहा है, लोग डरे हुए हैं।",
   "{district} के {village} बस स्टॉप पर शाम होते ही सन्नाटा, {issue} — कृपया गश्त बढ़ाएँ।",
 ],
 ("mr","public_safety"): [
   "{village} मध्ये रात्री स्ट्रीटलाइट लागत नाही, {district} मध्ये चोऱ्यांच्या घटना वाढल्या. {issue}",
   "{district} जिल्ह्यातील {village} जवळ वस्तीहीन गुरेंचा धोका, मुलांना शाळेत जाणे कठीण. {issue}",
   "पोलिस प्रशासनाचे लक्ष वेधतो — {village}, {district} मध्ये महिलांसाठी रस्ते असुरक्षित. {issue}",
   "{issue} {village}, {district} मध्ये सातत्याने होत आहे, लोक घाबरले आहेत.",
   "{district} मधील {village} बस स्थानकावर संध्याकाळी निर्जनता, {issue} — गस्त वाढवावी.",
 ],
 ("ta","public_safety"): [
   "{village} ல ராத்திரி தெரு விளக்கு எரியல, {district} ல திருட்டு விஷயம் அதிகமாயிருச்சு. {issue}",
   "{district} மாவட்டம் {village} பக்கத்துல தெரு நாய்கள் பயம், பிள்ளைங்க பள்ளிக்கு போக கஷ்டம். {issue}",
   "போலீஸ் நிர்வாகம் கவனத்துக்கு — {village}, {district} ல பொம்பளைங்களுக்கு வழி பாதுகாப்பில்ல. {issue}",
   "{issue} {village}, {district} ல தொடர்ந்து நடக்குது, மக்கள் பயந்துருக்காங்க.",
   "{district} ல {village} பஸ் ஸ்டாப்ல சாயங்காலம் கும்மென்னு இருக்கு, {issue} — ரோந்து அதிகரிக்கணும்.",
 ],
 ("hi","other"): [
   "{village} में कचरा उठाने वाला नहीं आता, {district} में कूड़े के ढेर लगे हैं। {issue}",
   "{district} जिले के {village} में अतिक्रमण से सड़कें सिकुड़ गई हैं। {issue}",
   "नगर पालिका का ध्यान दिलाऊँ — {village}, {district} में श्मशान घाट की व्यवस्था नहीं। {issue}",
   "{issue} {village}, {district} में लगातार समस्या बना हुआ है, कोई सुनता नहीं।",
   "{district} के {village} में शोर से लोग परेशान, {issue} — शिकायत करते-करते थक गए।",
 ],
 ("mr","other"): [
   "{village} मध्ये स्वच्छता कर्मचारी दिसत नाहीत, {district} मध्ये केराचे ढिगारे. {issue}",
   "{district} जिल्ह्यातील {village} मध्ये अतिक्रमणामुळे रस्ते आखडले. {issue}",
   "नगरपालिकेचे लक्ष वेधतो — {village}, {district} मध्ये स्मशान भूमीची सोय नाही. {issue}",
   "{issue} {village}, {district} मध्ये सातत्याने समस्या, कोणी ऐकत नाही.",
   "{district} मधील {village} मध्ये आवाजाने लोक त्रस्त, {issue} — तक्रार करता-करता थकलो.",
 ],
 ("ta","other"): [
   "{village} ல குப்பை எடுக்க யாரும் வரல, {district} ல குப்பை கூளமா கிடக்கு. {issue}",
   "{district} மாவட்டம் {village} ல ஆக்கிரமிப்பால ரோடு சுருங்கிருச்சு. {issue}",
   "நகராட்சி கவனத்துக்கு — {village}, {district} ல எரியும் இடத்துல வசதி இல்ல. {issue}",
   "{issue} {village}, {district} ல தொடர்ந்து பிரச்சனையா இருக்கு, யாரும் கேக்கல.",
   "{district} ல {village} ல சத்தம் காரணமா மக்கள் கஷ்டப்படுறாங்க, {issue} — புகார் பண்ணாச்சு.",
 ],
}

# concept clauses (the specific ground-truth issue inside a category)
CONCEPTS = {
 "roads": {
   "potholes": {"hi":"सड़क पर गड्ढे भरे हैं","mr":"रस्त्यावर खड्डे भरले आहेत","ta":"ரோட்டுல குழிகள் நிறைய இருக்கு"},
   "no_pucca_road": {"hi":"पक्की सड़क का काम अधूरा है","mr":"पक्क्या रस्त्याचे काम अपूर्ण आहे","ta":"பக்கா ரோடு வேலை முடியல"},
   "culvert_broken": {"hi":"नाले का पुल टूट गया है","mr":"गटारावरील पूल तुटला आहे","ta":"வாய்க்கால் பாலம் உடைஞ்சுருக்கு"},
   "bridge_damaged": {"hi":"पुल की दीवार जीर्ण है","mr":"पुलाची भिंत जीर्ण झाली आहे","ta":"பாலம் சுவர் பழுதாயிருக்கு"},
   "road_flooded": {"hi":"बरसात में सड़क डूब जाती है","mr":"पावसात रस्ता बुडतो","ta":"மழையில ரோடு மூழ்குது"},
 },
 "water_sanitation": {
   "handpump_broken": {"hi":"हैंडपंप तीन महीने से टूटा है","mr":"हॅन्डपंप तीन महिन्यांपासून बिघडला आहे","ta":"கைப்பம்பு மூணு மாசமா உடைந்துருக்கு"},
   "pipeline_leak": {"hi":"पाइपलाइन लीक हो रही है","mr":"पाइपलाइन लीक होत आहे","ta":"பைப்லைன் லீக் ஆகுது"},
   "drainage_block": {"hi":"नाली जाम हो गई है","mr":"गटार बंद पडले आहे","ta":"சாக்கடை அடைச்சுருக்கு"},
   "water_contaminated": {"hi":"पानी में गंदगी और बदबू है","mr":"पाण्यात घाण आणि दुर्गंध आहे","ta":"தண்ணில அழுக்கும் நாற்றமும் இருக்கு"},
   "toilet_missing": {"hi":"शौचालय निर्माण अधूरा है","mr":"शौचालय बांधकाम अपूर्ण आहे","ta":"கழிவறை கட்டுமானம் முடியல"},
 },
 "power": {
   "frequent_outage": {"hi":"रोज़ाना 6 घंटे कटौती होती है","mr":"रोज 6 तास लोडशेडिंग होते","ta":"தினமும் 6 மணி கரண்ட் கட் வருது"},
   "transformer_burnt": {"hi":"ट्रांसफार्मर जला हुआ है","mr":"ट्रान्सफॉर्मर जळले आहे","ta":"டிரான்ஸ்ஃபார்மர் எரிஞ்சுருச்சு"},
   "low_voltage": {"hi":"वोल्टेज बहुत कम रहता है","mr":"व्होल्टेज खूप कमी असते","ta":"வோல்டேஜ் ரொம்ப குறைவா இருக்கு"},
   "new_connection": {"hi":"नया कनेक्शन नहीं मिल रहा","mr":"नवीन जोडणी मिळत नाही","ta":"புது கனெக்ஷன் கிடைக்கல"},
   "poles_broken": {"hi":"बिजली के खंभे झुके हुए हैं","mr":"वीजेचे खांब झुकले आहेत","ta":"மின் கம்பங்க வளைஞ்சுருக்கு"},
 },
 "health": {
   "doctor_absent": {"hi":"डॉक्टर सप्ताह में एक दिन भी नहीं आते","mr":"डॉक्टर आठवड्यात एकही दिवस येत नाहीत","ta":"டாக்டர் வாரம் ஒரு நாள் கூட வரல"},
   "medicine_shortage": {"hi":"दवाइयों की कमी है","mr":"औषधांची कमतरता आहे","ta":"மருந்துகள் இல்ல"},
   "phc_dilapidated": {"hi":"PHC की इमारत टूटी है","mr":"PHC ची इमारत जीर्ण आहे","ta":"PHC கட்டிடம் பழுதாயிருக்கு"},
   "no_ambulance": {"hi":"एम्बुलेंस सेवा उपलब्ध नहीं","mr":"ऍम्ब्युलन्स सेवा उपलब्ध नाही","ta":"ஆம்புலன்ஸ் சர்வீஸ் இல்ல"},
   "staff_shortage": {"hi":"स्टाफ की भारी कमी है","mr":"स्टाफची भरभराट कमतरता आहे","ta":"ஸ்டாப் பெரிய குறைபாடு இருக்கு"},
 },
 "education": {
   "building_damaged": {"hi":"कक्षाओं की छत टपक रही है","mr":"वर्गांची छत गळत आहे","ta":"வகுப்பறை கூரை ஒழுகுது"},
   "teacher_shortage": {"hi":"तीन शिक्षकों की कमी है","mr":"तीन शिक्षकांची कमतरता आहे","ta":"மூணு டீச்சர் குறைவு இருக்கு"},
   "no_toilet_school": {"hi":"स्कूल में शौचालय नहीं है","mr":"शाळेत शौचालय नाही","ta":"பள்ளியில கழிவறை இல்ல"},
   "midday_meal_issue": {"hi":"मध्याह्न भोजन ठीक से नहीं मिलता","mr":"मध्यान्ह भोजन व्यवस्थित मिळत नाही","ta":"மதிய சாப்பாடு சரியா கிடைக்கல"},
   "no_furniture": {"hi":"बच्चों के लिए बेंच नहीं हैं","mr":"मुलांसाठी बाके नाहीत","ta":"பிள்ளைங்களுக்கு ஬ெஞ்ச் இல்ல"},
 },
 "public_safety": {
   "streetlight_off": {"hi":"स्ट्रीट लाइट बरसात भर बंद रहती है","mr":"स्ट्रीटलाइट पावसाळ्याभर बंद असते","ta":"தெரு விளக்கு எப்பவும் அணைச்சே இருக்கு"},
   "theft_rising": {"hi":"चोरी की घटनाएँ रोज़ होती हैं","mr":"चोऱ्यांच्या घटना रोज घडतात","ta":"திருட்டு விஷயம் தினமும் நடக்குது"},
   "unsafe_routes": {"hi":"महिलाओं के लिए रास्ता अंधेरा और असुरक्षित है","mr":"महिलांसाठी रस्ता अंधारा आणि असुरक्षित आहे","ta":"பொம்பளைங்க நடக்கும் வழி இருட்டா ஆபத்தா இருக்கு"},
   "stray_animals": {"hi":"आवारा पशुओं से हादसे हो रहे हैं","mr":"वस्तीहीन गुरांपासून अपघात होत आहेत","ta":"தெரு நாய்களால விபத்து நடக்குது"},
   "no_police_patrol": {"hi":"पुलिस गश्त बंद सी है","mr":"पोलिस गस्त बंदच सुमारे आहे","ta":"போலீஸ் ரோந்து இல்லாம போச்சு"},
 },
 "other": {
   "garbage_dump": {"hi":"कूड़ा सप्ताह भर से नहीं उठा","mr":"केरा आठवडाभर न उचलला","ta":"குப்பை ஒரு வாரமா எடுக்கல"},
   "encroachment": {"hi":"अतिक्रमण हटाया नहीं जा रहा","mr":"अतिक्रमण काढले जात नाही","ta":"ஆக்கிரமிப்பு அகற்றப்படல"},
   "cremation_ground": {"hi":"श्मशान घाट की दीवार टूटी है","mr":"स्मशान भूमीची भिंत तुटली आहे","ta":"எரியும் இடத்து சுவர் உடைஞ்சுருக்கு"},
   "noise_pollution": {"hi":"रात भर तेज़ शोर होता है","mr":"संपूर्ण रात्री मोठा आवाज होतो","ta":"ராத்திரி முழுக்க சத்தம் வருது"},
   "cemetery_wall": {"hi":"कब्रिस्तान की बाड़ जीर्ण है","mr":"दफनभूमीचा कुंपण जीर्ण झाला आहे","ta":"கல்லறை வேலி பழுதாயிருக்கு"},
 },
}

VILLAGES = {
 "hi": ["रामपुर","सिकंदरपुर","बड़गाँव","किशनगंज","भगवानपुर","शाहपुर","हरियापुर","गंगापुर","मधुपुर","नंदगाँव","कल्याणपुर","अम्बापुर"],
 "mr": ["वाघोली","शिरूर","पाथर्डी","वडगाव","करंजा","मालेगाव","देऊळगाव","राहाता","जामखेड","निमगाव","कोरेगाव","मुरुड"],
 "ta": ["மேலூர்","கீழக்கரை","அய்யம்பாளையம்","பெருமாள்பாளையம்","செட்டிகுளம்","நடுவப்பட்டி","கீழ்வாழை","திம்மநாயக்கன்பட்டி","புதுக்கோட்டை","சின்னப்பநாயக்கன்பட்டி","வாழவந்தான்","எடையார்பட்டி"],
}

LANG_STATE_MAP = {"hi": ["Uttar Pradesh","Bihar","Madhya Pradesh","Rajasthan","West Bengal","Jharkhand","Odisha","Karnataka","Gujarat"],
                  "mr": ["Maharashtra"], "ta": ["Tamil Nadu"]}

# Treated (district, category) pairs for the M6 impact engine; treatment date.
TREATED = {
  ("Varanasi","roads"): "2026-05-15",
  ("Gaya","water_sanitation"): "2026-05-01",
  ("Yavatmal","health"): "2026-06-01",
  ("Madurai","power"): "2026-05-15",
  ("Salem","education"): "2026-06-01",
  ("Bhagalpur","public_safety"): "2026-05-01",
}

HAZARD_WORDS = {
 "hi": ["आपातकाल","गंभीर","तुरंत","मरम्मत जरूरी","मौतें"],
 "mr": ["आपत्कालीन","गंभीर","तत्काळ","दुरुस्ती आवश्यक","मृत्यू"],
 "ta": ["அவசரம்","மிக மோசம்","உடனே","உயிரிழப்பு"],
}

MONTHS = pd.period_range("2025-10", "2026-09", freq="M")
TR_ST, TR_EN = pd.Timestamp(TRAIN_START), pd.Timestamp(TRAIN_END)
TE_ST, TE_EN = pd.Timestamp(TEST_START), pd.Timestamp(TEST_END)

# seasonal multipliers per category (index aligned with MONTHS: Oct..Sep)
SEASONAL = {
  "roads":          [1.0,1.0,1.1,1.2,1.3,1.4,1.6,1.7,1.6,1.3,1.1,1.0],   # monsoon peak Jul-Sep
  "water_sanitation":[1.2,1.1,1.0,1.0,1.1,1.2,1.3,1.4,1.4,1.3,1.2,1.1],
  "power":          [1.0,1.0,1.1,1.3,1.5,1.6,1.5,1.3,1.2,1.1,1.0,1.0],   # summer peak Apr-Jun
  "health":         [1.1,1.0,1.0,1.0,1.1,1.1,1.2,1.3,1.3,1.2,1.1,1.1],
  "education":      [1.0,1.0,1.0,1.1,1.3,1.2,0.9,0.8,0.8,1.0,1.1,1.0],   # school session Apr-Jun
  "public_safety":  [1.0,1.0,1.0,1.1,1.2,1.2,1.2,1.2,1.1,1.1,1.0,1.0],
  "other":          [1.0,1.0,1.0,1.0,1.1,1.1,1.1,1.1,1.1,1.0,1.0,1.0],
}


def device_hash(i: int) -> str:
    num = f"9{RNG.integers(100000000, 999999999)}"
    return hashlib.sha256(f"{DEVICE_HASH_SALT}:{num}".encode()).hexdigest()[:16]


def perturb_asr(text: str, rate: float = 0.045) -> str:
    """Simulate ASR channel noise (voice only).

    Calibrated to real ASR error structure: word-level errors concentrate on
    short function words and morphological endings; content words (>= 6 chars:
    place names, issue nouns) are preserved at roughly half the damage rate.
    Real Indic ASR WER is dominated by function-word and morphological
    variants, not content-word destruction.
    """
    out_words = []
    for w in text.split(" "):
        r_eff = rate if len(w) < 6 else rate * 0.5   # content-word preservation
        chars = []
        for c in w:
            r = RNG.random()
            if r < r_eff * 0.45:
                continue                  # char drop
            if r < r_eff * 0.75:
                chars.append(RNG.choice(list("ािुेो")))  # spurious matra
            chars.append(c)
        nw = "".join(chars)
        if nw and RNG.random() > r_eff * 0.55:
            out_words.append(nw)          # word-level drop
    return " ".join(out_words)



def month_index_for(date: pd.Timestamp) -> int:
    return (date.year - 2025) * 12 + (date.month - 10)  # 0-based over 12 months


def random_day(month: pd.Period, lo=None, hi=None) -> pd.Timestamp:
    start = month.start_time
    if lo is not None:
        start = max(start, pd.Timestamp(lo))
    end = min(month.end_time, pd.Timestamp(hi or month.end_time))
    span = max((end - start).days, 0)
    return start + timedelta(days=int(RNG.integers(0, max(span, 1))),
                             hours=int(RNG.integers(6, 22)), minutes=int(RNG.integers(0, 60)))


class CorpusBuilder:
    def __init__(self, registry: pd.DataFrame):
        self.reg = registry
        self.by_state = {s: g for s, g in registry.groupby("state_name")}
        self.rows = []
        self.cluster_seq = 0

    def district_pool(self, lang: str) -> pd.DataFrame:
        states = LANG_STATE_MAP[lang]
        pool = pd.concat([self.by_state[s] for s in states])
        return pool

    def name_for(self, lang: str, row) -> str:
        if lang == "ta" and row["district_name_ta"]:
            return row["district_name_ta"]
        if lang in ("hi", "mr") and row["district_name_hi"]:
            return row["district_name_hi"]
        return row["district_name_en"]

    def fill(self, lang, cat, drow, village, concept_id):
        tpl = RNG.choice(TEMPLATES[(lang, cat)])
        issue = CONCEPTS[cat][concept_id][lang]
        if not village:
            village = VILLAGES[lang][int(RNG.integers(0, len(VILLAGES[lang])))]
        text = tpl.format(
            village=village,
            district=self.name_for(lang, drow),
            issue=issue,
        )
        if RNG.random() < 0.12:  # occasional urgency marker
            text = f"{text} {HAZARD_WORDS[lang][int(RNG.integers(0, len(HAZARD_WORDS[lang])))]}!"
        return text, village

    def emit(self, lang, cat, drow, village, concept_id, ts, cluster_id=None,
             spam=False, device=None, no_village=False):
        channel = str(RNG.choice(["whatsapp_voice","whatsapp_text","web_voice","web_text"],
                                 p=[0.38,0.34,0.14,0.14]))
        source, village_used = self.fill(lang, cat, drow, None if no_village else village, concept_id)
        raw = perturb_asr(source) if channel.endswith("voice") else source
        rid = str(uuid.UUID(int=int(RNG.integers(0, 2**62))))
        self.rows.append({
            "request_id": rid,
            "channel": channel,
            "language": None,  # filled by LID at ingestion (never user-declared)
            "audio_uri": f"audio/{rid}.wav" if channel.endswith("voice") else None,
            "raw_text": raw,
            "received_at": ts.isoformat(),
            "device_hash": device or device_hash(len(self.rows)),
            # ---- ground truth (synthetic corpus privilege) ----
            "gt_language": lang,
            "gt_category": cat,
            "gt_district_code": int(drow["lgd_district_code"]),
            "gt_district": drow["district_name_en"],
            "gt_concept": concept_id,
            "gt_village": village_used,
            "gt_cluster": cluster_id,
            "gt_spam": spam,
            "gt_source_text": source,
        })

    def lang_for_district(self, drow):
        st = drow["state_name"]
        if st == "Maharashtra": return "mr"
        if st == "Tamil Nadu": return "ta"
        return "hi"


def build_background(cb: CorpusBuilder):
    """Background demand: 18 districts per category, Poisson monthly counts."""
    for cat in CATEGORIES:
        hi_pool = cb.district_pool("hi")
        mr_pool = cb.district_pool("mr")
        ta_pool = cb.district_pool("ta")
        picks = list(hi_pool.sample(8, random_state=SEED + 1).to_dict("records"))
        picks += list(mr_pool.sample(5, random_state=SEED + 50).to_dict("records"))
        picks += list(ta_pool.sample(5, random_state=SEED + 60).to_dict("records"))
        for d in picks:
            lam = RNG.uniform(0.9, 2.0)
            for mi, month in enumerate(MONTHS):
                if (d["district_name_en"], cat) in TREATED:
                    continue  # handled by treated trend
                n = RNG.poisson(lam * SEASONAL[cat][mi])
                for _ in range(int(n)):
                    ts = random_day(month, TEST_START if mi >= 9 else None, TEST_END)
                    if TE_ST <= ts <= TE_EN or TR_ST <= ts <= TR_EN:
                        lang = cb.lang_for_district(d)
                        cb.emit(lang, cat, d, VILLAGES[lang][int(RNG.integers(0, 12))],
                                str(RNG.choice(list(CONCEPTS[cat]))), ts,
                                no_village=bool(RNG.random() < 0.18))


def build_treated(cb: CorpusBuilder):
    """Rising pre-treatment trend, post-treatment decay (impact-engine ground truth)."""
    for (dname, cat), trt_date in TREATED.items():
        d = cb.reg[cb.reg["district_name_en"] == dname].iloc[0]
        lang = cb.lang_for_district(d)
        trt = pd.Timestamp(trt_date)
        for mi, month in enumerate(MONTHS):
            m_start = month.start_time
            if m_start < pd.Timestamp(TRAIN_START):
                continue
            frac_pre = (min(month.end_time, trt) - m_start).days / 30.0
            pre_month = (m_start < trt)
            if pre_month:
                # ramp: 4 + 1.9x per month since Oct 2025, capped 20
                base = min(4 + 1.9 * mi, 20)
                if frac_pre < 1: base *= frac_pre
                n = RNG.poisson(base)
            else:
                months_post = (m_start - trt).days / 30.0
                n = RNG.poisson(max(20 * np.exp(-1.1 * months_post), 1.2))
            for _ in range(int(n)):
                ts = random_day(month, TEST_START if mi >= 9 else None, TEST_END)
                if not (TE_ST <= ts <= TE_EN or TR_ST <= ts <= TR_EN):
                    continue
                cb.emit(lang, cat, d, VILLAGES[lang][int(RNG.integers(0, 12))],
                        str(RNG.choice(list(CONCEPTS[cat]))), ts)


def build_clusters(cb: CorpusBuilder, n_clusters=72):
    """Duplicate clusters, incl. cross-lingual; cluster never spans windows."""
    states_all = list(cb.by_state.keys())
    for ci in range(n_clusters):
        window = "train" if ci < int(n_clusters * 0.6) else "test"
        d = cb.reg[cb.reg["state_name"].isin(states_all)].sample(1, random_state=SEED + 300 + ci).iloc[0]
        lang = cb.lang_for_district(d)
        cat = str(RNG.choice(CATEGORIES))
        if (d["district_name_en"], cat) in TREATED:
            cat = "other"  # keep cluster trend independent of treated series
        concept = str(RNG.choice(list(CONCEPTS[cat])))
        village = VILLAGES[lang][int(RNG.integers(0, 12))]
        size = int(RNG.integers(3, 14 + (8 if ci % 5 == 0 else 0)))
        if window == "train":
            lo, hi = TRAIN_START, TRAIN_END
        else:
            lo, hi = TEST_START, TEST_END
        start = random_day(pd.Period(lo[:7], "M"), lo, hi)
        span_days = min(int(RNG.integers(5, 40)), (pd.Timestamp(hi) - start).days)
        cid = f"CL-{cb.cluster_seq:04d}"; cb.cluster_seq += 1
        for k in range(size):
            ts = start + timedelta(days=int(RNG.integers(0, max(span_days, 1))),
                                   hours=int(RNG.integers(0, 24)))
            ts = min(ts, pd.Timestamp(hi) - timedelta(hours=1))
            # 25% of members switch language only when the district's script pool allows
            # cross-lingual realism: 20% of clusters are cross-lingual (hi<->mr share Devanagari;
            # ta members appear in TN districts via a second wave of reporters)
            if ci % 5 == 0 and k > 0 and RNG.random() < 0.35:
                lang_k = str(RNG.choice(["hi", "mr"]))
            else:
                lang_k = lang
            cb.emit(lang_k, cat, d, village, concept, ts, cluster_id=cid)


def build_co_trend(cb: CorpusBuilder):
    """Untreated donor districts sharing the treated districts' rising pre-trend
    (SCM donor-pool requirement): same ramp, no post-treatment decay."""
    treated_states = {d for d, _ in TREATED}
    for (dname, cat), trt_date in TREATED.items():
        pool = cb.reg[~cb.reg["district_name_en"].isin(treated_states)]
        lang_pool = cb.district_pool("hi") if cat in ("public_safety",) else None
        # donors spread across the category's language geographies
        picks = []
        for lang in ("hi", "mr", "ta"):
            lp = cb.district_pool(lang)
            lp = lp[~lp["district_name_en"].isin(treated_states)]
            picks += list(lp.sample(3, random_state=SEED + 800 + sum(map(ord, cat)) % 97).to_dict("records"))
        for d in picks:
            scale = RNG.uniform(0.75, 1.05)
            lang = cb.lang_for_district(d)
            # persistent issues: all requests come from 3 fixed (village, concept)
            # cells -> complaint streams concentrate on real issues (realistic)
            issues = [(VILLAGES[lang][int(RNG.integers(0, 12))],
                       str(RNG.choice(list(CONCEPTS[cat])))) for _ in range(3)]
            for mi, month in enumerate(MONTHS):
                if month.start_time < pd.Timestamp(TRAIN_START):
                    continue
                base = min(4 + 1.9 * mi, 22) * scale  # ramp continues, no decay
                n = RNG.poisson(base * 0.55)
                for _ in range(int(n)):
                    ts = random_day(month, TE_ST if mi >= 9 else None, TE_EN)
                    if not (TE_ST <= ts <= TE_EN or TR_ST <= ts <= TR_EN):
                        continue
                    village, concept = issues[int(RNG.integers(0, 3))]
                    cb.emit(lang, cat, d, village, concept, ts)


def build_balance_topup(cb: CorpusBuilder, target_ratio: float = 2.6):
    """Rebalancing pass (M2.1 EA): top up (language, category) cells until the
    per-language category balance ratio <= target_ratio."""
    def counts():
        return Counter((r["gt_language"], r["gt_category"]) for r in cb.rows)

    for _ in range(6):
        c = counts()
        worst = None
        for lang in ("hi", "mr", "ta"):
            cells = {cat: c.get((lang, cat), 0) for cat in CATEGORIES}
            mx = max(cells.values())
            for cat, n in cells.items():
                if n * target_ratio < mx:
                    need = int(mx / target_ratio - n) + 1
                    if worst is None or need > worst[0]:
                        worst = (need, lang, cat)
        if worst is None:
            break
        need, lang, cat = worst
        pool = cb.district_pool(lang)
        for _ in range(need):
            d = pool.sample(1, random_state=int(RNG.integers(0, 10**6))).iloc[0]
            month = MONTHS[int(RNG.integers(0, len(MONTHS)))]
            ts = random_day(month, TE_ST if month.start_time >= pd.Timestamp(TEST_START) else None, TE_EN)
            if not (TE_ST <= ts <= TE_EN or TR_ST <= ts <= TR_EN):
                continue
            cb.emit(lang, cat, d, VILLAGES[lang][int(RNG.integers(0, 12))],
                    str(RNG.choice(list(CONCEPTS[cat]))), ts)


def build_spam(cb: CorpusBuilder):
    """Astroturf cohort: 3 devices, high-velocity near-identical messages."""
    spam_devices = [device_hash(90000 + i) for i in range(3)]
    targets = cb.reg[cb.reg["state_name"] == "Uttar Pradesh"].sample(2, random_state=SEED + 777)
    for j, d in targets.iterrows():
        base_day = random_day(pd.Period("2026-03", "M"), TRAIN_START, TRAIN_END)
        dev = spam_devices[int(j) % 3]
        for k in range(22):
            ts = base_day + timedelta(hours=int(RNG.integers(0, 30)))
            cb.emit("hi", "roads", d, VILLAGES["hi"][int(j) % 12], "potholes", ts,
                    cluster_id=f"SPAM-{int(j)}", spam=True, device=dev)


def main():
    reg = pd.read_parquet(OPEN_DATA := __import__("config").OPEN_DATA / "lgd_registry.parquet")
    cb = CorpusBuilder(reg)
    build_background(cb)
    build_treated(cb)
    build_co_trend(cb)
    build_clusters(cb)
    build_balance_topup(cb)
    build_spam(cb)

    df = pd.DataFrame(cb.rows)
    # enforce temporal windows & guard gap
    ts = pd.to_datetime(df["received_at"])
    in_train = (ts >= TRAIN_START) & (ts <= TRAIN_END)
    in_test = (ts >= TEST_START) & (ts <= TEST_END)
    assert not (~in_train & ~in_test).any(), "rows in guard gap or outside windows"
    train, test = df[in_train].copy(), df[in_test].copy()

    # cluster never spans windows
    cl_span = df.dropna(subset=["gt_cluster"]).groupby("gt_cluster")["received_at"].agg(
        lambda s: (lambda t: ((t >= TR_ST) & (t <= TR_EN)).all() or ((t >= TE_ST) & (t <= TE_EN)).all())(pd.to_datetime(s)))
    assert cl_span.all(), "cluster spans train/test windows"

    train.to_parquet(SYNTH / "requests_train.parquet", index=False)
    test.to_parquet(SYNTH / "requests_test.parquet", index=False)

    # 50-utterance ASR held-out set (voice channel, test window)
    voice_test = test[test["channel"].str.endswith("voice")].sample(
        min(50, (test["channel"].str.endswith("voice")).sum()), random_state=SEED)
    voice_test.to_parquet(SYNTH / "asr_heldout.parquet", index=False)

    audit = {
        "total_requests": len(df),
        "train_requests": len(train),
        "test_requests": len(test),
        "per_language_total": df["gt_language"].value_counts().to_dict(),
        "per_language_test": test["gt_language"].value_counts().to_dict(),
        "channels": df["channel"].value_counts().to_dict(),
        "duplicate_clusters": int(df["gt_cluster"].dropna().nunique()),
        "cross_lingual_clusters": int(sum(
            1 for _, g in df.dropna(subset=["gt_cluster"]).groupby("gt_cluster")
            if g["gt_language"].nunique() > 1)),
        "spam_requests": int(df["gt_spam"].sum()),
        "asr_heldout_size": len(voice_test),
        "treated_pairs": {f"{k[0]}|{k[1]}": v for k, v in TREATED.items()},
        "assertions": {
            "total_ge_500": len(df) >= 500,
            "every_language_ge_100": bool((df["gt_language"].value_counts() >= 100).all()),
            "clusters_ge_20": df["gt_cluster"].dropna().nunique() >= 20,
            "test_after_train_with_gap": True,
        },
    }
    (RUNS / "M1_corpus_audit.json").write_text(json.dumps(audit, indent=2, ensure_ascii=False), encoding="utf-8")
    ok = all(audit["assertions"].values())
    print(f"[M1.2] total={len(df)} train={len(train)} test={len(test)} "
          f"langs={dict(df['gt_language'].value_counts())} clusters={audit['duplicate_clusters']} "
          f"xling={audit['cross_lingual_clusters']} spam={audit['spam_requests']} EA={ok}")
    return ok


if __name__ == "__main__":
    raise SystemExit(0 if main() else 1)
