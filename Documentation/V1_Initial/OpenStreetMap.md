# OpenStreetMap Nominatim Setup Guide (FREE!)

## 🎉 No API Key Needed!

This app uses **OpenStreetMap Nominatim API** which is:
- ✅ **100% FREE**
- ✅ **No registration required**
- ✅ **No API key needed**
- ✅ **No credit card**
- ✅ **Unlimited usage** (with fair use policy)

## 🌍 What is Nominatim?

Nominatim is the search engine for OpenStreetMap data. It provides:
- **Geocoding**: Convert address → coordinates
- **Reverse Geocoding**: Convert coordinates → address
- **Autocomplete**: Search suggestions as you type

## 📝 Fair Use Policy

To respect Nominatim's free service:
1. **Rate limiting**: Max 1 request per second (automatically handled)
2. **User-Agent header**: Identifies our app (already configured)
3. **No heavy scraping**: Only search when user types

## ✅ Features Implemented

- **Location Autocomplete**: Type to search addresses worldwide
- **GPS Current Location**: Click button to get device location
- **Reverse Geocoding**: Convert GPS coordinates to address
- **Firestore Integration**: Save coordinates as GeoPoint
- **Visual Feedback**: Dropdown suggestions with smooth animations

## 🧪 Test the Feature

1. Start dev server: `npm run dev` or `npm run start`
2. Go to Create Memory page
3. Click on Location input field
4. Start typing an address (e.g., "Hanoi, Vietnam")
5. Wait 500ms → autocomplete dropdown appears
6. Click a suggestion → coordinates saved automatically
7. Or click GPS button to use current location

## 🗺️ Supported Locations

- ✅ Worldwide coverage (all countries)
- ✅ Cities, streets, landmarks
- ✅ Multiple languages
- ✅ Detailed addresses with house numbers

## 🚀 Next Steps

After adding coordinates:
1. Update MapView to use real Firestore coordinates
2. Implement geoqueries for nearby memories
3. Add clustering for multiple markers
4. Add heatmap visualization
5. Use Leaflet for interactive maps (also FREE!)

## 💡 Alternative FREE Options

If you need more features:
- **Mapbox** (50,000 free requests/month)
- **LocationIQ** (5,000 free requests/day)
- **Geoapify** (3,000 free requests/day)

But Nominatim is best for unlimited free usage!

